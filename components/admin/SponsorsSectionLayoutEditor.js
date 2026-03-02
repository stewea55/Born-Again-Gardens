"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CANVAS = { width: 1000, height: 500 };
const DEFAULT_ITEM = { width: 240, height: 150, nameFontSize: 24 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeLayout(layout, canvas) {
  if (!layout || typeof layout !== "object") return null;
  const width = Number(layout.width);
  const height = Number(layout.height);
  const centerX = Number(layout.centerX);
  const centerY = Number(layout.centerY);
  const nameFontSize = Number(layout.nameFontSize);
  if (![width, height, centerX, centerY].every(Number.isFinite)) return null;
  if (width <= 0 || height <= 0) return null;
  const normalizedWidth = clamp(width, 80, canvas.width);
  const normalizedHeight = clamp(height, 80, canvas.height);
  return {
    width: normalizedWidth,
    height: normalizedHeight,
    centerX: clamp(centerX, normalizedWidth / 2, canvas.width - normalizedWidth / 2),
    centerY: clamp(centerY, normalizedHeight / 2, canvas.height - normalizedHeight / 2),
    nameFontSize: Number.isFinite(nameFontSize) ? clamp(nameFontSize, 12, 52) : DEFAULT_ITEM.nameFontSize
  };
}

function layoutPayloadForSave(sponsors, itemsById, orderIds) {
  const orderMap = orderIds.reduce((acc, id, index) => {
    acc[id] = index;
    return acc;
  }, {});
  return sponsors.map((sponsor) => {
    const id = String(sponsor.id || "");
    const layout = itemsById[id] || null;
    return {
      id,
      layout,
      display_order: layout ? orderMap[id] ?? null : null
    };
  });
}

export default function SponsorsSectionLayoutEditor({ session }) {
  const canvasRef = useRef(null);
  const baselineRef = useRef("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [sponsors, setSponsors] = useState([]);
  const [canvas, setCanvas] = useState(DEFAULT_CANVAS);
  const [itemsById, setItemsById] = useState({});
  const [orderIds, setOrderIds] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [dragState, setDragState] = useState(null);

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

        const nextItemsById = {};
        const nextOrder = [];
        const sortedPlaced = [...nextSponsors]
          .filter((row) => row?.layout)
          .sort((a, b) => {
            const leftOrder = Number.isFinite(Number(a?.display_order)) ? Number(a.display_order) : 999999;
            const rightOrder = Number.isFinite(Number(b?.display_order)) ? Number(b.display_order) : 999999;
            if (leftOrder !== rightOrder) return leftOrder - rightOrder;
            const leftCreated = String(a?.created_at || "");
            const rightCreated = String(b?.created_at || "");
            return leftCreated.localeCompare(rightCreated);
          });

        sortedPlaced.forEach((row) => {
          const id = String(row?.id || "");
          const normalized = normalizeLayout(row?.layout, nextCanvas);
          if (!id || !normalized) return;
          nextItemsById[id] = normalized;
          nextOrder.push(id);
        });

        setSponsors(nextSponsors);
        setCanvas(nextCanvas);
        setItemsById(nextItemsById);
        setOrderIds(nextOrder);
        setSelectedId(nextOrder[0] || "");

        baselineRef.current = JSON.stringify({
          canvas: nextCanvas,
          items: layoutPayloadForSave(nextSponsors, nextItemsById, nextOrder)
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
    if (!dragState) return undefined;
    const handleMouseMove = (event) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;

      const pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const pointerY = ((event.clientY - rect.top) / rect.height) * canvas.height;

      setItemsById((prev) => {
        const current = prev[dragState.id];
        if (!current) return prev;
        const nextCenterX = clamp(
          pointerX - dragState.offsetX,
          current.width / 2,
          canvas.width - current.width / 2
        );
        const nextCenterY = clamp(
          pointerY - dragState.offsetY,
          current.height / 2,
          canvas.height - current.height / 2
        );
        return {
          ...prev,
          [dragState.id]: {
            ...current,
            centerX: nextCenterX,
            centerY: nextCenterY
          }
        };
      });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [canvas.height, canvas.width, dragState]);

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
      items: layoutPayloadForSave(sponsors, itemsById, orderIds)
    });
    return current !== baselineRef.current;
  }, [canvas, itemsById, orderIds, sponsors]);

  const selectedLayout = selectedId ? itemsById[selectedId] || null : null;
  const catalogRows = useMemo(
    () =>
      [...sponsors].sort((a, b) =>
        String(a?.company_name || "").localeCompare(String(b?.company_name || ""))
      ),
    [sponsors]
  );

  const startDrag = (event, id) => {
    if (event.button !== 0) return;
    if (event.target.closest("button")) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const layout = itemsById[id];
    if (!layout) return;

    const pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const pointerY = ((event.clientY - rect.top) / rect.height) * canvas.height;

    setSelectedId(id);
    setDragState({
      id,
      offsetX: pointerX - layout.centerX,
      offsetY: pointerY - layout.centerY
    });
    event.preventDefault();
  };

  const addFromCatalog = (id) => {
    const normalizedId = String(id || "");
    if (!normalizedId) return;
    setStatus("");
    setError("");

    setItemsById((prev) => {
      const current = prev[normalizedId];
      if (current) {
        return {
          ...prev,
          [normalizedId]: {
            ...current,
            centerX: canvas.width / 2,
            centerY: canvas.height / 2
          }
        };
      }
      return {
        ...prev,
        [normalizedId]: {
          ...DEFAULT_ITEM,
          centerX: canvas.width / 2,
          centerY: canvas.height / 2
        }
      };
    });

    setOrderIds((prev) => [...prev.filter((value) => value !== normalizedId), normalizedId]);
    setSelectedId(normalizedId);
  };

  const removeFromCanvas = (id) => {
    const normalizedId = String(id || "");
    if (!normalizedId) return;
    setItemsById((prev) => {
      const next = { ...prev };
      delete next[normalizedId];
      return next;
    });
    setOrderIds((prev) => prev.filter((value) => value !== normalizedId));
    if (selectedId === normalizedId) {
      setSelectedId("");
    }
  };

  const moveLayer = (id, direction) => {
    setOrderIds((prev) => {
      const currentIndex = prev.indexOf(id);
      if (currentIndex === -1) return prev;
      const nextIndex = direction === "up" ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [picked] = next.splice(currentIndex, 1);
      next.splice(nextIndex, 0, picked);
      return next;
    });
  };

  const updateSelectedLayout = (key, value) => {
    if (!selectedId || !itemsById[selectedId]) return;
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return;

    setItemsById((prev) => {
      const current = prev[selectedId];
      if (!current) return prev;

      let next = { ...current };
      if (key === "width") {
        next.width = clamp(numberValue, 80, canvas.width);
        next.centerX = clamp(next.centerX, next.width / 2, canvas.width - next.width / 2);
      } else if (key === "height") {
        next.height = clamp(numberValue, 80, canvas.height);
        next.centerY = clamp(next.centerY, next.height / 2, canvas.height - next.height / 2);
      } else if (key === "nameFontSize") {
        next.nameFontSize = clamp(numberValue, 12, 52);
      }

      return {
        ...prev,
        [selectedId]: next
      };
    });
  };

  const updateCanvasDimension = (key, value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue <= 100) return;
    const rounded = Math.round(numberValue);

    setCanvas((prev) => {
      const nextCanvas =
        key === "width"
          ? { ...prev, width: rounded }
          : { ...prev, height: rounded };

      setItemsById((currentItems) => {
        const nextItems = { ...currentItems };
        Object.keys(nextItems).forEach((id) => {
          const item = nextItems[id];
          nextItems[id] = normalizeLayout(item, nextCanvas);
        });
        return nextItems;
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
        items: layoutPayloadForSave(sponsors, itemsById, orderIds)
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
        Admin-only editor: click a sponsor in the catalog to add it to the canvas, drag and resize,
        then Save. Home page shows only the final saved layout.
      </p>

      {error ? <p className="paragraph">{error}</p> : null}
      {status ? <p className="paragraph">{status}</p> : null}

      <div className="sponsors-layout-shell">
        <aside className="sponsors-layout-catalog">
          <h3 className="subtitle">Catalog</h3>
          <p className="paragraph admin-hint">
            Click any sponsor to place it in the center of the canvas.
          </p>
          <div className="sponsors-layout-catalog-list">
            {catalogRows.map((sponsor) => {
              const id = String(sponsor?.id || "");
              const isPlaced = !!itemsById[id];
              return (
                <button
                  key={id}
                  type="button"
                  className={isPlaced ? "button" : "menu-button"}
                  onClick={() => addFromCatalog(id)}
                >
                  {sponsor?.company_name || "Sponsor"} {isPlaced ? "(on canvas)" : ""}
                </button>
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
            {orderIds.map((id, index) => {
              const sponsor = sponsorById[id];
              const layout = itemsById[id];
              if (!layout || !sponsor) return null;

              return (
                <article
                  key={id}
                  className={selectedId === id ? "sponsors-layout-item selected" : "sponsors-layout-item"}
                  style={{
                    left: `${(layout.centerX / canvas.width) * 100}%`,
                    top: `${(layout.centerY / canvas.height) * 100}%`,
                    width: `${(layout.width / canvas.width) * 100}%`,
                    height: `${(layout.height / canvas.height) * 100}%`,
                    zIndex: index + 1
                  }}
                  onMouseDown={(event) => startDrag(event, id)}
                  onClick={() => setSelectedId(id)}
                >
                  <button
                    type="button"
                    className="sponsors-layout-remove"
                    aria-label={`Remove ${sponsor?.company_name || "sponsor"} from canvas`}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeFromCanvas(id);
                    }}
                  >
                    X
                  </button>
                  {sponsor?.logo ? (
                    <img
                      src={sponsor.logo}
                      alt={sponsor?.company_name || "Sponsor logo"}
                      className="sponsors-layout-item-logo"
                    />
                  ) : (
                    <div className="image-placeholder">No logo yet</div>
                  )}
                  <h4
                    className="subtitle sponsors-layout-item-name"
                    style={{ fontSize: `${layout.nameFontSize}px` }}
                  >
                    {sponsor?.company_name || "Sponsor"}
                  </h4>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="sponsors-layout-inspector">
          <h3 className="subtitle">Inspector</h3>
          {!selectedLayout ? (
            <p className="paragraph">Select an item on the canvas to edit size and layering.</p>
          ) : (
            <>
              <p className="paragraph">
                <strong>{sponsorById[selectedId]?.company_name || "Sponsor"}</strong>
              </p>
              <label className="paragraph admin-field-label">
                <strong>Width</strong>
                <input
                  type="number"
                  min={80}
                  value={Math.round(selectedLayout.width)}
                  onChange={(event) => updateSelectedLayout("width", event.target.value)}
                />
              </label>
              <label className="paragraph admin-field-label">
                <strong>Height</strong>
                <input
                  type="number"
                  min={80}
                  value={Math.round(selectedLayout.height)}
                  onChange={(event) => updateSelectedLayout("height", event.target.value)}
                />
              </label>
              <label className="paragraph admin-field-label">
                <strong>Name font size</strong>
                <input
                  type="number"
                  min={12}
                  max={52}
                  value={Math.round(selectedLayout.nameFontSize)}
                  onChange={(event) => updateSelectedLayout("nameFontSize", event.target.value)}
                />
              </label>
              <div className="admin-row-actions">
                <button type="button" className="menu-button" onClick={() => moveLayer(selectedId, "down")}>
                  Send Back
                </button>
                <button type="button" className="menu-button" onClick={() => moveLayer(selectedId, "up")}>
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
