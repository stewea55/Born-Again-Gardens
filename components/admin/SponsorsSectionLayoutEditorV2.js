"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CANVAS = { width: 1000, height: 500 };
const DEFAULT_LOGO = { width: 240, height: 150 };
const DEFAULT_NAME = { width: 220, height: 78, fontSize: 28 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function objectIdOf(sponsorId, kind) {
  return `${sponsorId}:${kind}`;
}

function parseObjectId(objectId) {
  const separator = String(objectId || "").lastIndexOf(":");
  if (separator < 0) return { sponsorId: "", kind: "" };
  return {
    sponsorId: objectId.slice(0, separator),
    kind: objectId.slice(separator + 1)
  };
}

function clampObjectInCanvas(item, canvas) {
  const width = clamp(Number(item?.width || 0), 60, canvas.width);
  const height = clamp(Number(item?.height || 0), 40, canvas.height);
  const centerX = clamp(Number(item?.centerX || 0), width / 2, canvas.width - width / 2);
  const centerY = clamp(Number(item?.centerY || 0), height / 2, canvas.height - height / 2);
  const next = { ...item, width, height, centerX, centerY };
  if (item?.kind === "name") {
    const fontSize = Number(item?.fontSize);
    next.fontSize = Number.isFinite(fontSize) ? clamp(fontSize, 12, 60) : DEFAULT_NAME.fontSize;
  }
  return next;
}

function normalizeLegacyLayout(layout) {
  if (!layout || typeof layout !== "object") return null;
  if (!Object.prototype.hasOwnProperty.call(layout, "centerX")) return null;
  const centerX = Number(layout.centerX);
  const centerY = Number(layout.centerY);
  const width = Number(layout.width);
  const height = Number(layout.height);
  if (![centerX, centerY, width, height].every(Number.isFinite)) return null;
  if (width <= 0 || height <= 0) return null;
  return {
    logo: { centerX, centerY, width, height },
    name: {
      centerX,
      centerY,
      width,
      height,
      fontSize: Number.isFinite(Number(layout.nameFontSize))
        ? Number(layout.nameFontSize)
        : DEFAULT_NAME.fontSize
    }
  };
}

function normalizeNestedLayout(layout) {
  if (!layout || typeof layout !== "object") return null;
  if (Object.prototype.hasOwnProperty.call(layout, "centerX")) return normalizeLegacyLayout(layout);
  return {
    logo: layout.logo && typeof layout.logo === "object" ? layout.logo : null,
    name: layout.name && typeof layout.name === "object" ? layout.name : null
  };
}

function buildCanvasObjects(sponsors, canvas) {
  const byId = {};
  const order = [];
  const sortedSponsors = [...sponsors].sort((a, b) => {
    const leftOrder = Number.isFinite(Number(a?.display_order)) ? Number(a.display_order) : 999999;
    const rightOrder = Number.isFinite(Number(b?.display_order)) ? Number(b.display_order) : 999999;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return String(a?.created_at || "").localeCompare(String(b?.created_at || ""));
  });

  sortedSponsors.forEach((sponsor) => {
    const sponsorId = String(sponsor?.id || "");
    if (!sponsorId) return;
    const normalizedLayout = normalizeNestedLayout(sponsor?.layout);
    if (!normalizedLayout) return;

    if (normalizedLayout.logo) {
      const logoId = objectIdOf(sponsorId, "logo");
      byId[logoId] = clampObjectInCanvas(
        {
          objectId: logoId,
          sponsorId,
          kind: "logo",
          ...DEFAULT_LOGO,
          ...normalizedLayout.logo
        },
        canvas
      );
      order.push(logoId);
    }

    if (normalizedLayout.name) {
      const nameId = objectIdOf(sponsorId, "name");
      byId[nameId] = clampObjectInCanvas(
        {
          objectId: nameId,
          sponsorId,
          kind: "name",
          ...DEFAULT_NAME,
          ...normalizedLayout.name
        },
        canvas
      );
      order.push(nameId);
    }
  });

  return { byId, order };
}

function buildSaveItems(sponsors, objectsById, orderIds) {
  const sponsorLastObjectOrder = {};
  orderIds.forEach((objectId, index) => {
    const { sponsorId } = parseObjectId(objectId);
    if (!sponsorId) return;
    sponsorLastObjectOrder[sponsorId] = index;
  });

  return sponsors.map((sponsor) => {
    const sponsorId = String(sponsor?.id || "");
    const logoObject = objectsById[objectIdOf(sponsorId, "logo")] || null;
    const nameObject = objectsById[objectIdOf(sponsorId, "name")] || null;
    const layout = logoObject || nameObject
      ? {
          logo: logoObject
            ? {
                centerX: logoObject.centerX,
                centerY: logoObject.centerY,
                width: logoObject.width,
                height: logoObject.height
              }
            : null,
          name: nameObject
            ? {
                centerX: nameObject.centerX,
                centerY: nameObject.centerY,
                width: nameObject.width,
                height: nameObject.height,
                fontSize: nameObject.fontSize
              }
            : null
        }
      : null;

    return {
      id: sponsorId,
      layout,
      display_order: layout ? sponsorLastObjectOrder[sponsorId] ?? null : null
    };
  });
}

function defaultObjectFor(kind, sponsorId, canvas) {
  if (kind === "logo") {
    return {
      objectId: objectIdOf(sponsorId, "logo"),
      sponsorId,
      kind: "logo",
      width: DEFAULT_LOGO.width,
      height: DEFAULT_LOGO.height,
      centerX: canvas.width / 2,
      centerY: canvas.height / 2
    };
  }
  return {
    objectId: objectIdOf(sponsorId, "name"),
    sponsorId,
    kind: "name",
    width: DEFAULT_NAME.width,
    height: DEFAULT_NAME.height,
    centerX: canvas.width / 2,
    centerY: canvas.height / 2,
    fontSize: DEFAULT_NAME.fontSize
  };
}

export default function SponsorsSectionLayoutEditorV2({ session }) {
  const canvasRef = useRef(null);
  const baselineRef = useRef("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [sponsors, setSponsors] = useState([]);
  const [canvas, setCanvas] = useState(DEFAULT_CANVAS);
  const [objectsById, setObjectsById] = useState({});
  const [orderIds, setOrderIds] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState("");
  const [interaction, setInteraction] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadLayoutEditor() {
      setLoading(true);
      setError("");
      setStatus("");
      try {
        const response = await fetch("/api/admin/sponsors-layout", {
          headers: {
            Authorization: `Bearer ${session?.access_token || ""}`
          }
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Could not load sponsors layout.");

        if (!active) return;
        const nextSponsors = Array.isArray(payload?.data?.sponsors) ? payload.data.sponsors : [];
        const nextCanvas = {
          width: Number(payload?.data?.canvas?.width) || DEFAULT_CANVAS.width,
          height: Number(payload?.data?.canvas?.height) || DEFAULT_CANVAS.height
        };

        const { byId, order } = buildCanvasObjects(nextSponsors, nextCanvas);
        const initialSelected = order[order.length - 1] || "";

        setSponsors(nextSponsors);
        setCanvas(nextCanvas);
        setObjectsById(byId);
        setOrderIds(order);
        setSelectedObjectId(initialSelected);

        baselineRef.current = JSON.stringify({
          canvas: nextCanvas,
          items: buildSaveItems(nextSponsors, byId, order)
        });
      } catch (nextError) {
        if (active) setError(nextError.message || "Could not load sponsors layout.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadLayoutEditor();
    return () => {
      active = false;
    };
  }, [session?.access_token]);

  useEffect(() => {
    if (!interaction) return undefined;

    const handleMouseMove = (event) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;

      const pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const pointerY = ((event.clientY - rect.top) / rect.height) * canvas.height;

      setObjectsById((prev) => {
        const current = prev[interaction.objectId];
        if (!current) return prev;

        if (interaction.mode === "move") {
          const moved = clampObjectInCanvas(
            {
              ...current,
              centerX: pointerX - interaction.offsetX,
              centerY: pointerY - interaction.offsetY
            },
            canvas
          );
          return { ...prev, [interaction.objectId]: moved };
        }

        const start = interaction.startObject;
        const deltaX = pointerX - interaction.startPointerX;
        const deltaY = pointerY - interaction.startPointerY;
        const nextWidth = clamp(start.width + deltaX * 2, 60, canvas.width);
        const nextHeight = clamp(start.height + deltaY * 2, 40, canvas.height);
        const resized = clampObjectInCanvas(
          {
            ...current,
            width: nextWidth,
            height: nextHeight,
            fontSize:
              current.kind === "name"
                ? clamp((start.fontSize || DEFAULT_NAME.fontSize) * (nextHeight / start.height), 12, 60)
                : current.fontSize
          },
          canvas
        );
        return { ...prev, [interaction.objectId]: resized };
      });
    };

    const handleMouseUp = () => {
      setInteraction(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [canvas, interaction]);

  const sponsorById = useMemo(
    () =>
      sponsors.reduce((acc, sponsor) => {
        const id = String(sponsor?.id || "");
        if (id) acc[id] = sponsor;
        return acc;
      }, {}),
    [sponsors]
  );

  const dirty = useMemo(() => {
    const current = JSON.stringify({
      canvas,
      items: buildSaveItems(sponsors, objectsById, orderIds)
    });
    return current !== baselineRef.current;
  }, [canvas, objectsById, orderIds, sponsors]);

  const selectedObject = selectedObjectId ? objectsById[selectedObjectId] || null : null;

  const catalogRows = useMemo(
    () =>
      [...sponsors].sort((a, b) =>
        String(a?.company_name || "").localeCompare(String(b?.company_name || ""))
      ),
    [sponsors]
  );

  const beginInteraction = (event, objectId, mode) => {
    if (event.button !== 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const item = objectsById[objectId];
    if (!item) return;

    const pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const pointerY = ((event.clientY - rect.top) / rect.height) * canvas.height;

    setSelectedObjectId(objectId);
    setInteraction(
      mode === "move"
        ? {
            mode,
            objectId,
            offsetX: pointerX - item.centerX,
            offsetY: pointerY - item.centerY
          }
        : {
            mode,
            objectId,
            startPointerX: pointerX,
            startPointerY: pointerY,
            startObject: { ...item }
          }
    );
    event.preventDefault();
  };

  const placeObject = (sponsorId, kind) => {
    const normalizedSponsorId = String(sponsorId || "");
    if (!normalizedSponsorId) return;
    const objectId = objectIdOf(normalizedSponsorId, kind);

    setStatus("");
    setError("");
    setObjectsById((prev) => {
      const existing = prev[objectId];
      const nextObject = existing
        ? clampObjectInCanvas(
            { ...existing, centerX: canvas.width / 2, centerY: canvas.height / 2 },
            canvas
          )
        : clampObjectInCanvas(defaultObjectFor(kind, normalizedSponsorId, canvas), canvas);
      return { ...prev, [objectId]: nextObject };
    });
    setOrderIds((prev) => [...prev.filter((id) => id !== objectId), objectId]);
    setSelectedObjectId(objectId);
  };

  const removeObject = (objectId) => {
    setObjectsById((prev) => {
      const next = { ...prev };
      delete next[objectId];
      return next;
    });
    setOrderIds((prev) => prev.filter((id) => id !== objectId));
    if (selectedObjectId === objectId) setSelectedObjectId("");
  };

  const moveLayer = (direction) => {
    if (!selectedObjectId) return;
    setOrderIds((prev) => {
      const currentIndex = prev.indexOf(selectedObjectId);
      if (currentIndex === -1) return prev;
      const targetIndex = direction === "up" ? currentIndex + 1 : currentIndex - 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [picked] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, picked);
      return next;
    });
  };

  const updateSelectedObject = (key, value) => {
    if (!selectedObjectId || !objectsById[selectedObjectId]) return;
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return;

    setObjectsById((prev) => {
      const current = prev[selectedObjectId];
      if (!current) return prev;
      const next = clampObjectInCanvas(
        {
          ...current,
          [key]: key === "fontSize" ? clamp(numberValue, 12, 60) : numberValue
        },
        canvas
      );
      return { ...prev, [selectedObjectId]: next };
    });
  };

  const updateCanvasDimension = (key, value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue <= 100) return;
    const rounded = Math.round(numberValue);

    setCanvas((prev) => {
      const nextCanvas = key === "width" ? { ...prev, width: rounded } : { ...prev, height: rounded };
      setObjectsById((current) => {
        const next = { ...current };
        Object.keys(next).forEach((id) => {
          next[id] = clampObjectInCanvas(next[id], nextCanvas);
        });
        return next;
      });
      return nextCanvas;
    });
  };

  const saveLayout = async () => {
    setError("");
    setStatus("");
    try {
      const payload = {
        canvas,
        items: buildSaveItems(sponsors, objectsById, orderIds)
      };
      const response = await fetch("/api/admin/sponsors-layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify(payload)
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Could not save sponsors layout.");
      baselineRef.current = JSON.stringify(payload);
      setStatus("Saved layout. Home page now uses this version.");
    } catch (nextError) {
      setError(nextError.message || "Could not save sponsors layout.");
    }
  };

  if (loading) {
    return (
      <section className="section card admin-card">
        <h2 className="subheading">Sponsors Layout Editor</h2>
        <p className="paragraph">Loading layout editor...</p>
      </section>
    );
  }

  return (
    <section className="section card admin-card">
      <h2 className="subheading">Sponsors Layout Editor</h2>
      <p className="paragraph">
        Admin-only editor: add logo and name objects separately, drag to position, use corner
        handles to resize, then Save. Home page shows the final saved version only.
      </p>

      {error ? <p className="paragraph">{error}</p> : null}
      {status ? <p className="paragraph">{status}</p> : null}

      <div className="sponsors-layout-shell">
        <aside className="sponsors-layout-catalog">
          <h3 className="subtitle">Catalog</h3>
          <p className="paragraph admin-hint">
            Add logo and name independently. X removes only that object from canvas.
          </p>
          <div className="sponsors-layout-catalog-list">
            {catalogRows.map((sponsor) => {
              const sponsorId = String(sponsor?.id || "");
              const logoPlaced = !!objectsById[objectIdOf(sponsorId, "logo")];
              const namePlaced = !!objectsById[objectIdOf(sponsorId, "name")];
              return (
                <div key={sponsorId} className="sponsors-layout-catalog-card">
                  <p className="paragraph sponsors-layout-catalog-name">
                    <strong>{sponsor?.company_name || "Sponsor"}</strong>
                  </p>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className={logoPlaced ? "button" : "menu-button"}
                      onClick={() => placeObject(sponsorId, "logo")}
                    >
                      {logoPlaced ? "Recenter Logo" : "Add Logo"}
                    </button>
                    <button
                      type="button"
                      className={namePlaced ? "button" : "menu-button"}
                      onClick={() => placeObject(sponsorId, "name")}
                    >
                      {namePlaced ? "Recenter Name" : "Add Name"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="sponsors-layout-main">
          <div className="sponsors-layout-toolbar">
            <label className="paragraph admin-field-label">
              <strong>Canvas width</strong>
              <input
                type="number"
                min={200}
                value={canvas.width}
                onChange={(event) => updateCanvasDimension("width", event.target.value)}
              />
            </label>
            <label className="paragraph admin-field-label">
              <strong>Canvas height</strong>
              <input
                type="number"
                min={200}
                value={canvas.height}
                onChange={(event) => updateCanvasDimension("height", event.target.value)}
              />
            </label>
            <button type="button" className="button" onClick={saveLayout} disabled={!dirty}>
              Save
            </button>
          </div>

          <div
            ref={canvasRef}
            className="sponsors-layout-canvas"
            style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}
          >
            {orderIds.map((objectId, index) => {
              const item = objectsById[objectId];
              if (!item) return null;
              const sponsor = sponsorById[item.sponsorId];
              const title = sponsor?.company_name || "Sponsor";

              return (
                <article
                  key={objectId}
                  className={
                    selectedObjectId === objectId
                      ? `sponsors-layout-object selected ${item.kind === "name" ? "name-object" : "logo-object"}`
                      : `sponsors-layout-object ${item.kind === "name" ? "name-object" : "logo-object"}`
                  }
                  style={{
                    left: `${(item.centerX / canvas.width) * 100}%`,
                    top: `${(item.centerY / canvas.height) * 100}%`,
                    width: `${(item.width / canvas.width) * 100}%`,
                    height: `${(item.height / canvas.height) * 100}%`,
                    zIndex: index + 1
                  }}
                  onMouseDown={(event) => {
                    if (event.target.closest("button")) return;
                    beginInteraction(event, objectId, "move");
                  }}
                  onClick={() => setSelectedObjectId(objectId)}
                >
                  <button
                    type="button"
                    className="sponsors-layout-remove"
                    aria-label={`Remove ${item.kind} for ${title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeObject(objectId);
                    }}
                  >
                    X
                  </button>

                  {item.kind === "logo" ? (
                    sponsor?.logo ? (
                      <img src={sponsor.logo} alt={title} className="sponsors-layout-object-logo" />
                    ) : (
                      <div className="image-placeholder">No logo yet</div>
                    )
                  ) : (
                    <h4 className="subtitle sponsors-layout-object-name" style={{ fontSize: `${item.fontSize}px` }}>
                      {title}
                    </h4>
                  )}

                  <button
                    type="button"
                    className="sponsors-layout-resize-handle"
                    aria-label={`Resize ${item.kind} for ${title}`}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      beginInteraction(event, objectId, "resize");
                    }}
                  />
                </article>
              );
            })}
          </div>
        </div>

        <aside className="sponsors-layout-inspector">
          <h3 className="subtitle">Inspector</h3>
          {!selectedObject ? (
            <p className="paragraph">Select a logo or name object to fine-tune it.</p>
          ) : (
            <>
              <p className="paragraph">
                <strong>{sponsorById[selectedObject.sponsorId]?.company_name || "Sponsor"}</strong>
                {" - "}
                {selectedObject.kind === "logo" ? "Logo" : "Name"}
              </p>
              <label className="paragraph admin-field-label">
                <strong>Width</strong>
                <input
                  type="number"
                  min={60}
                  value={Math.round(selectedObject.width)}
                  onChange={(event) => updateSelectedObject("width", event.target.value)}
                />
              </label>
              <label className="paragraph admin-field-label">
                <strong>Height</strong>
                <input
                  type="number"
                  min={40}
                  value={Math.round(selectedObject.height)}
                  onChange={(event) => updateSelectedObject("height", event.target.value)}
                />
              </label>
              {selectedObject.kind === "name" ? (
                <label className="paragraph admin-field-label">
                  <strong>Font size</strong>
                  <input
                    type="number"
                    min={12}
                    max={60}
                    value={Math.round(selectedObject.fontSize || DEFAULT_NAME.fontSize)}
                    onChange={(event) => updateSelectedObject("fontSize", event.target.value)}
                  />
                </label>
              ) : null}
              <div className="admin-row-actions">
                <button type="button" className="menu-button" onClick={() => moveLayer("down")}>
                  Send Back
                </button>
                <button type="button" className="menu-button" onClick={() => moveLayer("up")}>
                  Bring Front
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
