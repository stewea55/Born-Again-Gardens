"use client";

import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

function normalizeForSearch(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function toInputValue(value, type) {
  if (value === null || value === undefined) return "";
  if (type === "json") return JSON.stringify(value);
  if (type === "date") {
    const s = String(value).trim();
    if (!s) return "";
    return s.slice(0, 10);
  }
  if (type === "time") {
    const s = String(value).trim();
    if (!s) return "";
    return s.slice(0, 5);
  }
  return String(value);
}

function coerceValue(value, type) {
  if (type === "number") {
    if (value === "") return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }
  if (type === "boolean") {
    return value === true || value === "true";
  }
  if (type === "json") {
    if (value === "") return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  if (type === "date" || type === "time") {
    if (value === null || value === undefined || value === "") return null;
    const s = String(value).trim();
    return s || null;
  }
  return value;
}

function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function looksLikeImageField(columnKey) {
  const normalized = String(columnKey || "").toLowerCase();
  return normalized.includes("image") || normalized.includes("logo");
}

export default function AdminTableEditor({
  resource,
  title,
  description,
  session,
  idField = "id",
  columns,
  defaultNewRow = {}
}) {
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [newRow, setNewRow] = useState(defaultNewRow);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setNewRow(defaultNewRow);
  }, [defaultNewRow]);

  useEffect(() => {
    let active = true;
    async function loadRows() {
      setLoading(true);
      setError("");
      setStatus("");
      try {
        const response = await fetch(`/api/admin/${resource}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token || ""}`
          }
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Could not load table.");
        }
        if (!active) return;
        const nextRows = Array.isArray(payload?.data) ? payload.data : [];
        setRows(nextRows);
        setDrafts(
          nextRows.reduce((acc, row) => {
            const key = String(row?.[idField] ?? "");
            if (key) acc[key] = { ...row };
            return acc;
          }, {})
        );
      } catch (nextError) {
        if (active) setError(nextError.message || "Could not load table.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRows();
    return () => {
      active = false;
    };
  }, [resource, session?.access_token, idField]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) =>
      columns.some((column) => normalizeForSearch(row?.[column.key]).toLowerCase().includes(normalized))
    );
  }, [rows, query, columns]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Columns that are editable (exclude ID; ID is auto-generated and read-only)
  const editableColumns = useMemo(
    () => columns.filter((col) => col.key !== idField),
    [columns, idField]
  );

  const setDraftField = (rowId, key, value, type) => {
    const parsed = coerceValue(value, type);
    setDrafts((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [key]: parsed
      }
    }));
  };

  const setNewRowField = (key, value, type) => {
    setNewRow((prev) => ({
      ...prev,
      [key]: coerceValue(value, type)
    }));
  };

  const saveRow = async (row) => {
    const rowId = String(row?.[idField]);
    const draft = drafts[rowId] || row;

    setStatus("");
    setError("");
    try {
      const response = await fetch(`/api/admin/${resource}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify(draft)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Could not save row.");
      const nextRow = payload?.data || draft;
      setRows((prev) =>
        prev.map((item) => (String(item?.[idField]) === rowId ? nextRow : item))
      );
      setDrafts((prev) => ({ ...prev, [rowId]: { ...nextRow } }));
      setStatus("Saved.");
    } catch (nextError) {
      setError(nextError.message || "Could not save row.");
    }
  };

  const resetRow = (row) => {
    const rowId = String(row?.[idField]);
    setDrafts((prev) => ({ ...prev, [rowId]: { ...row } }));
  };

  const deleteRow = async (row) => {
    const rowId = String(row?.[idField]);
    setStatus("");
    setError("");
    try {
      const response = await fetch(`/api/admin/${resource}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({ id: row?.[idField] })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Could not delete row.");
      setRows((prev) => prev.filter((item) => String(item?.[idField]) !== rowId));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
      setStatus("Deleted.");
    } catch (nextError) {
      setError(nextError.message || "Could not delete row.");
    }
  };

  const createRow = async () => {
    setStatus("");
    setError("");
    try {
      const response = await fetch(`/api/admin/${resource}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify(newRow)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Could not create row.");
      const created = payload?.data;
      const rowId = String(created?.[idField] ?? "");
      setRows((prev) => [created, ...prev]);
      if (rowId) {
        setDrafts((prev) => ({ ...prev, [rowId]: { ...created } }));
      }
      setNewRow(defaultNewRow);
      setStatus("Created.");
    } catch (nextError) {
      setError(nextError.message || "Could not create row.");
    }
  };

  const uploadImage = async (rowId, columnKey, file) => {
    if (!file) return;
    setStatus("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `${resource}/${columnKey}`);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`
        },
        body: formData
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Could not upload image.");
      const publicUrl = payload?.data?.publicUrl || "";
      setDraftField(rowId, columnKey, publicUrl, "text");
      setStatus("Image uploaded. Save row to set it in stone.");
    } catch (nextError) {
      setError(nextError.message || "Could not upload image.");
    }
  };

  return (
    <section className="section card admin-card">
      <h2 className="subheading">{title}</h2>
      {description ? <p className="paragraph">{description}</p> : null}
      <div className="admin-controls">
        <input
          type="text"
          placeholder="Search rows"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={`Search ${title}`}
        />
      </div>

      {loading ? <p className="paragraph">Loading...</p> : null}
      {error ? <p className="paragraph">{error}</p> : null}
      {status ? <p className="paragraph">{status}</p> : null}

      {!loading && (
        <>
          <div className="admin-grid">
            {pagedRows.map((row) => {
              const rowId = String(row?.[idField] ?? "");
              const draft = drafts[rowId] || row;
              const dirty = !valuesEqual(draft, row);
              return (
                <div key={rowId || JSON.stringify(row)} className="admin-row-card">
                  <div className="admin-row-header">
                    <p className="paragraph">
                      <strong>{idField}:</strong> {rowId || "new"}
                    </p>
                    {dirty ? <span className="admin-draft-pill">Draft changes not saved</span> : null}
                  </div>

                  {columns.map((column) => (
                    <label key={`${rowId}-${column.key}`} className="paragraph admin-field-label">
                      <strong>{column.label}</strong>
                      {column.key === idField ? (
                        <span className="admin-readonly-id">{toInputValue(draft?.[column.key], column.type)}</span>
                      ) : column.type === "boolean" ? (
                        <select
                          value={draft?.[column.key] ? "true" : "false"}
                          onChange={(event) => setDraftField(rowId, column.key, event.target.value, column.type)}
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : column.type === "json" ? (
                        <textarea
                          value={toInputValue(draft?.[column.key], column.type)}
                          onChange={(event) => setDraftField(rowId, column.key, event.target.value, column.type)}
                          rows={4}
                        />
                      ) : column.type === "date" ? (
                        <input
                          type="date"
                          value={toInputValue(draft?.[column.key], column.type)}
                          onChange={(event) => setDraftField(rowId, column.key, event.target.value, column.type)}
                        />
                      ) : column.type === "time" ? (
                        <input
                          type="time"
                          value={toInputValue(draft?.[column.key], column.type)}
                          onChange={(event) => setDraftField(rowId, column.key, event.target.value, column.type)}
                        />
                      ) : (
                        <input
                          type={column.type === "number" ? "number" : "text"}
                          value={toInputValue(draft?.[column.key], column.type)}
                          onChange={(event) => setDraftField(rowId, column.key, event.target.value, column.type)}
                        />
                      )}
                      {column.key !== idField && looksLikeImageField(column.key) && draft?.[column.key] ? (
                        <img
                          src={draft[column.key]}
                          alt={`${column.label} preview`}
                          className="admin-image-preview"
                        />
                      ) : null}
                      {column.key !== idField && looksLikeImageField(column.key) ? (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => uploadImage(rowId, column.key, event.target.files?.[0])}
                        />
                      ) : null}
                    </label>
                  ))}

                  <div className="admin-row-actions">
                    <button type="button" className="button" onClick={() => saveRow(row)}>
                      Save
                    </button>
                    <button type="button" className="menu-button" onClick={() => resetRow(row)}>
                      Cancel
                    </button>
                    <button type="button" className="menu-button" onClick={() => deleteRow(row)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="admin-pagination">
            <button
              type="button"
              className="menu-button"
              disabled={page <= 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              Previous
            </button>
            <p className="paragraph">Page {page + 1} / {pageCount}</p>
            <button
              type="button"
              className="menu-button"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
            >
              Next
            </button>
          </div>

          <div className="admin-new-row">
            <h3 className="subtitle">Add new row</h3>
            <p className="paragraph admin-hint">ID is generated automatically. Fill in the fields below and click Create row.</p>
            {editableColumns.map((column) => (
              <label key={`new-${column.key}`} className="paragraph admin-field-label">
                <strong>{column.label}</strong>
                {column.type === "boolean" ? (
                  <select
                    value={newRow?.[column.key] ? "true" : "false"}
                    onChange={(event) => setNewRowField(column.key, event.target.value, column.type)}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : column.type === "json" ? (
                  <textarea
                    value={toInputValue(newRow?.[column.key], column.type)}
                    onChange={(event) => setNewRowField(column.key, event.target.value, column.type)}
                    rows={3}
                  />
                ) : column.type === "date" ? (
                  <input
                    type="date"
                    value={toInputValue(newRow?.[column.key], column.type)}
                    onChange={(event) => setNewRowField(column.key, event.target.value, column.type)}
                  />
                ) : column.type === "time" ? (
                  <input
                    type="time"
                    value={toInputValue(newRow?.[column.key], column.type)}
                    onChange={(event) => setNewRowField(column.key, event.target.value, column.type)}
                  />
                ) : (
                  <input
                    type={column.type === "number" ? "number" : "text"}
                    value={toInputValue(newRow?.[column.key], column.type)}
                    onChange={(event) => setNewRowField(column.key, event.target.value, column.type)}
                  />
                )}
              </label>
            ))}
            <button type="button" className="button" onClick={createRow}>
              Create row
            </button>
          </div>
        </>
      )}
    </section>
  );
}
