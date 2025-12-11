// src/Dashboard.jsx
import React, { useEffect, useState } from "react";
import "./styles.css";

/*-------------------------------------------------------------
  BACKEND BASE URL  
  Change this when deploying (Netlify → Spring backend hosting)
--------------------------------------------------------------*/
const API_BASE = "http://localhost:8080/api/links";

// increment click count for a given id on backend
// eslint-disable-next-line no-unused-vars
async function incrementClick(id) {
  if (!id) return null;
  try {
    const res = await fetch(`${API_BASE}/${id}/click`, {
      method: "POST",               // your backend used POST /{id}/click in Postman
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      console.warn("incrementClick: backend returned", res.status);
      return null;
    }
    const json = await res.json();
    return json;
  } catch (err) {
    console.error("incrementClick error:", err);
    return null;
  }
}


/* Format date safely */
function fmt(dt) {
  try { return new Date(dt).toLocaleString(); }
  catch { return "-"; }
}

export default function Dashboard() {
  // Admin login secret (only to show/hide admin panel)
  const ADMIN_SECRET = "DileepNiki@2026";

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [message, setMessage] = useState("");

  // Search
  const [filter, setFilter] = useState("");

  // Admin state
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("all_links_admin") === "1"
  );

  const [toast, setToast] = useState("");

  /*---------------------------------------------------------
    LOAD ALL LINKS FROM BACKEND
  ----------------------------------------------------------*/
  async function loadFromBackend() {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setLinks(data);
    } catch (err) {
      console.error("Error loading:", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFromBackend();
  }, []);

  /*---------------------------------------------------------
    ADMIN LOGIN HANDLING
  ----------------------------------------------------------*/
  function signInFrontEnd() {
    const attempt = prompt("Enter admin secret:");
    if (!attempt) return;
    if (attempt === ADMIN_SECRET) {
      localStorage.setItem("all_links_admin", "1");
      setIsAdmin(true);
      setToast("Admin logged in");
    } else {
      alert("Wrong secret");
    }
  }

  function signOutFrontEnd() {
    localStorage.removeItem("all_links_admin");
    setIsAdmin(false);
    setToast("Signed out");
  }

  /*---------------------------------------------------------
     CREATE NEW LINK (POST → BACKEND)
  ----------------------------------------------------------*/
  async function handleCreate(e) {
    e.preventDefault();
    setMessage("");

    if (!title.trim()) return setMessage("Enter title");
    if (!targetUrl.trim()) return setMessage("Enter URL");

    try {
      new URL(targetUrl);
    } catch {
      return setMessage("Invalid URL");
    }

    const payload = { title, targetUrl };

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage("Created successfully!");
        setToast("Created!");
        setTitle("");
        setTargetUrl("");
        loadFromBackend();
      }
    } catch (err) {
      console.error("Create error:", err);
    }
  }

  /*---------------------------------------------------------
     DELETE A LINK (DELETE → BACKEND)
  ----------------------------------------------------------*/
  async function handleDelete(id) {
    if (!confirm("Delete this link?")) return;

    await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    setToast("Deleted");
    loadFromBackend();
  }

/*---------------------------------------------------------
  APPLY BUTTON → Update click count + open link (improved)
  Drop-in replacement for the existing handleApply.
----------------------------------------------------------*/
async function handleApply(item) {
  if (!item || !item.id) return;

  try {
    // 1) increment click on backend and wait a short time to ensure backend records it
    //    (we still open the link even if increment fails)
    await incrementClick(item.id);

    // 2) open destination (use same logic you currently prefer)
    const dest = item.targetUrl && item.targetUrl.trim()
      ? item.targetUrl.trim()
      : window.location.origin + "/" + item.id;

    // open in new tab (if you want same-tab change _blank -> _self)
    window.open(dest, "_blank");
  } catch (err) {
    console.error("handleApply error:", err);
    // still open link if error
    const fallback = item.targetUrl || (window.location.origin + "/" + item.id);
    window.open(fallback, "_blank");
  } finally {
    // refresh UI counts (non-blocking)
    // use your existing function name that refreshes list (e.g. loadFromBackend() or fetchAllLinks())
    // Replace fetchAllLinks() below with your actual fetch function if different.
    // eslint-disable-next-line no-undef
    try { fetchAllLinks(); } catch { /* ignore */ }
  }
}


  /*---------------------------------------------------------
    COPY SHORT LINK
  ----------------------------------------------------------*/
  function handleCopy(id) {
    const link = window.location.origin + "/" + id;
    navigator.clipboard.writeText(link);
    setToast("Copied: " + link);
  }

  /* FILTERING */
  function matchesFilter(item) {
    if (!filter) return true;
    return item.title.toLowerCase().includes(filter.toLowerCase());
  }

  /*---------------------------------------------------------
     UI STARTS HERE
  ----------------------------------------------------------*/
  return (
    <div className="app-page">

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* HEADER */}
      <header className="app-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1 className="app-title">All_Links_NetFier🦁</h1>
          <div className="app-sub">Click name to open — Copy gives short link</div>
        </div>

        <div style={{ marginTop: 8 }}>
          {isAdmin ? (
            <button className="btn btn-small" onClick={signOutFrontEnd}>Sign out admin</button>
          ) : (
            <button className="btn btn-small" onClick={signInFrontEnd}>Admin sign in</button>
          )}
        </div>
      </header>

      {/* ---------------- PUBLIC LIST SECTION ---------------- */}
      <section className="panel top-panel">
        <h2 className="panel-title">Click & Use This Links</h2>

        <div className="search-row">
          <input
            className="input input-search"
            placeholder="Search by title..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className="btn btn-small" onClick={() => setFilter("")}>Clear</button>
        </div>

        {loading ? (
          <div className="loader">Loading…</div>
        ) : (
          <div className="card-list">
            {links.filter(matchesFilter).map((item) => (
              <div className="card" key={item.id}>
                <div className="card-left">
                  <div className="card-icon">🔗</div>
                  <div className="card-info">
                    <a
                      className="link-name"
                      href="#"
                      onClick={(e) => { e.preventDefault(); handleApply(item); }}
                    >
                      {item.title}
                    </a>
                    <div className="card-meta">Created: {fmt(item.createdAt)}</div>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="btn btn-primary" onClick={() => handleApply(item)}>Apply</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- ADMIN SECTION ---------------- */}
      {isAdmin && (
        <>
          {/* TABLE VIEW */}
          <section className="panel">
            <h2 className="panel-title">All Links</h2>

            <div className="table-wrap">
              <table className="links-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Clicks</th>
                    <th>Created</th>
                    <th>Last Clicked</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {links.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.title}
                      </td>
                      <td>{item.clicks}</td>
                      <td>{fmt(item.createdAt)}</td>
                      <td>{fmt(item.lastClicked)}</td>

                      <td>
                        <button className="btn btn-small" onClick={() => handleCopy(item.id)}>Copy</button>
                        <button className="btn btn-danger btn-small" onClick={() => handleDelete(item.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </section>

          {/* CREATE FORM */}
          <section className="panel">
            <h2 className="panel-title">Create New Short Name</h2>

            <form className="form-create" onSubmit={handleCreate}>
              <div className="form-row">
                <label className="form-label">Title</label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SBI SO 2025"
                />
              </div>

              <div className="form-row">
                <label className="form-label">Target URL</label>
                <input
                  className="input"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com/..."
                />
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" type="submit">Create</button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setTitle(""); setTargetUrl(""); setMessage(""); }}
                >
                  Clear
                </button>
              </div>

              <div className="form-message">{message}</div>
            </form>
          </section>
        </>
      )}

      <footer className="app-footer">Made with ❤️ — All_Links_NetFier</footer>
    </div>
  );
}
