// src/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { loadLinks, saveLinks, generateCode } from "./storage";
import "./styles.css";

function fmt(dt) {
  try { return new Date(dt).toLocaleString(); } catch { return "-"; }
}

export default function Dashboard() {
  // Admin secret (frontend-only). Change this to your preferred secret.
  const ADMIN_SECRET = "DileepNiki@2026";

  // App state
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // create form
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [message, setMessage] = useState("");

  // public filter
  const [filter, setFilter] = useState("");

  // admin UI
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("all_links_admin") === "1");
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await loadLinks();
      setLinks(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    load();
  }, []);

  function persist(next) {
    setLinks(next);
    saveLinks(next);
  }


  function matchesFilter(item) {
    if (!filter) return true;
    return item.title.toLowerCase().includes(filter.toLowerCase());
  }

  // Admin front-end sign in (prompt). This is NOT secure for production.
  function signInFrontEnd() {
    const attempt = prompt("Enter admin secret:");
    if (!attempt) return;
    if (attempt === ADMIN_SECRET) {
      localStorage.setItem("all_links_admin", "1");
      setIsAdmin(true);
      setToast("Signed in as admin (frontend)");
    } else {
      alert("Wrong secret");
    }
  }

  function signOutFrontEnd() {
    localStorage.removeItem("all_links_admin");
    setIsAdmin(false);
    setToast("Signed out");
  }

  // Create new short link (admin)
  function handleCreate(e) {
    e && e.preventDefault();
    setMessage("");
    const t = (title || "").trim();
    const url = (targetUrl || "").trim();
    if (!t) { setMessage("Enter title"); return; }
    if (!url) { setMessage("Enter target URL"); return; }
    try { new URL(url); } catch { setMessage("Invalid URL (include http:// or https://)"); return; }

    let code = (customCode || "").trim() || generateCode(6);
    // ensure unique
    let attempts = 0;
    while (links.some(l => l.code === code) && attempts < 10) {
      code = generateCode(6);
      attempts++;
    }
    if (links.some(l => l.code === code)) { setMessage("Could not generate unique code"); return; }

    const newItem = {
      code,
      title: t,
      thumbnail: "",
      target_url: url,
      posted_at: new Date().toISOString(),
      total_clicks: 0
    };
    const next = [newItem, ...links];
    persist(next);
    setTitle(""); setTargetUrl(""); setCustomCode("");
    setMessage("Created: " + code);
    setToast("Created: " + code);
  }

  // Delete
  function handleDelete(code) {
    if (!confirm("Delete this link?")) return;
    const next = links.filter(l => l.code !== code);
    persist(next);
    setToast("Deleted");
  }

  // Apply: increment locally and open target
  function handleApply(code) {
    const idx = links.findIndex(l => l.code === code);
    if (idx === -1) return;
    const item = { ...links[idx] };
    item.total_clicks = (item.total_clicks || 0) + 1;
    item.last_clicked = new Date().toISOString();
    const next = links.slice();
    next[idx] = item;
    persist(next);
    window.open(item.target_url, "_blank");
  }

  // Copy short link
  function handleCopy(code) {
    const short = window.location.origin + "/" + code;
    try {
      navigator.clipboard.writeText(short);
      setToast("Copied: " + short);
    } catch {
      prompt("Copy this short link", short);
    }
  }

  // Refresh seed (clear local copy and re-load from public/links.json)
  async function refreshFromSeed() {
    localStorage.removeItem("all_links_netfier_links_v1");
    const data = await loadLinks();
    setLinks(Array.isArray(data) ? data : []);
    setToast("Refreshed from seed");
  }

  return (
    <div className="app-page">
      {/* toast */}
      {toast && <div className="toast">{toast}</div>}

      <header className="app-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <h1 className="app-title">TinyLink_All_Links_NetFier❤️‍🔥</h1>
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

      {/* Click & Use (public) */}
      <section className="panel top-panel">
        <h2 className="panel-title">Click & Use This Links</h2>

        <div className="search-row">
          <input className="input input-search" placeholder="Search by title..." value={filter} onChange={e=>setFilter(e.target.value)} />
          <button className="btn btn-small" onClick={()=>setFilter('')}>Clear</button>
        </div>

        {loading ? <div className="loader">Loading…</div> : (
          links.filter(matchesFilter).length === 0 ? (
            <div className="empty">No links available</div>
          ) : (
            <div className="card-list">
              {links.filter(matchesFilter).map(item => (
                <div className="card" key={item.code}>
                  <div className="card-left">
                    <div className="card-icon">🔗</div>
                    <div className="card-info">
                      <a className="link-name" href={item.target_url} onClick={(e)=>{ e.preventDefault(); handleApply(item.code); }} title={item.title}>
                        {item.title}
                      </a>
                      <div className="card-meta">Created: {fmt(item.posted_at)}</div>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button className="btn btn-primary" onClick={()=>handleApply(item.code)}>Apply</button>
                
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </section>

      {/* Admin-only: All Links + Create */}
      {isAdmin && (
        <>
          <section className="panel">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 className="panel-title">All Links</h2>
              <div>
                <button className="btn btn-small" onClick={refreshFromSeed}>Refresh Seed</button>
              </div>
            </div>

            <div className="table-wrap">
              <table className="links-table">
                <thead>
                  <tr><th>Title</th><th>Clicks</th><th>Created</th><th>Last Clicked</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {links.map(item=>(
                    <tr key={item.code}>
                      <td>
                        <a className="table-link" href={item.target_url} onClick={(e)=>{ e.preventDefault(); handleApply(item.code); }}>{item.title}</a>
                        <div className="table-sub">Code: {item.code}</div>
                      </td>
                      <td>{item.total_clicks||0}</td>
                      <td>{fmt(item.posted_at)}</td>
                      <td>{fmt(item.last_clicked)}</td>
                      <td>
                        <button className="btn btn-small" onClick={()=>handleCopy(item.code)}>Copy</button>
                        <button className="btn btn-danger btn-small" onClick={()=>handleDelete(item.code)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <h2 className="panel-title">Create New Short Name</h2>
            <form className="form-create" onSubmit={handleCreate}>
              <div className="form-row">
                <label className="form-label">Title</label>
                <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. SBI SO 2025" />
              </div>
              <div className="form-row">
                <label className="form-label">Target URL</label>
                <input className="input" value={targetUrl} onChange={e=>setTargetUrl(e.target.value)} placeholder="https://example.com/..." />
              </div>
               

              <div className="form-actions">
                <button className="btn btn-primary" type="submit">Create</button>
                <button type="button" className="btn" onClick={()=>{ setTitle(''); setTargetUrl(''); setCustomCode(''); setMessage(''); }}>Clear</button>
              </div>
              <div className="form-message">{message}</div>
            </form>
          </section>
        </>
      )}

      <footer className="app-footer">Made with ❤️ — All_Links_Netfier</footer>
    </div>
  );
}
