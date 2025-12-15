/* eslint-disable no-unused-vars */
// src/Dashboard.jsx
import React, { useEffect, useState } from "react";
import "./styles.css";

/*-------------------------------------------------------------
  BACKEND BASE URL
--------------------------------------------------------------*/
const API_BASE = "https://tinylink-alllinks-netfier-backend.onrender.com/api/links";

/* Format date safely */
function fmt(dt) {
  try { return new Date(dt).toLocaleString(); }
  catch { return "-"; }
}

export default function Dashboard() {

  /* ---------------- LOADER STATES (NEW) ---------------- */
  const [backendReady, setBackendReady] = useState(false);
  const [seconds, setSeconds] = useState(0);

  /* ---------------- EXISTING STATES ---------------- */
  const ADMIN_SECRET = "DileepNiki@2026";

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");

  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("all_links_admin") === "1"
  );

  const [toast, setToast] = useState("");

  /*---------------------------------------------------------
    BACKEND WAKE-UP CHECK (IMPORTANT)
  ----------------------------------------------------------*/
  useEffect(() => {
    let timer = setInterval(() => {
      setSeconds((s) => (s < 20 ? s + 1 : s));
    }, 1000);

    async function wakeBackend() {
      try {
        const res = await fetch(API_BASE, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setLinks(data);
          setBackendReady(true);
          setLoading(false);
          clearInterval(timer);
        }
      } catch {
        // backend still sleeping → keep loader
      }
    }

    wakeBackend();
    const retry = setInterval(wakeBackend, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(retry);
    };
  }, []);

  /*---------------------------------------------------------
    ADMIN LOGIN
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
     CREATE LINK
  ----------------------------------------------------------*/
  async function handleCreate(e) {
    e.preventDefault();
    setMessage("");

    if (!title.trim()) return setMessage("Enter title");
    if (!targetUrl.trim()) return setMessage("Enter URL");

    try { new URL(targetUrl); }
    catch { return setMessage("Invalid URL"); }

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, targetUrl }),
      });

      if (res.ok) {
        setTitle("");
        setTargetUrl("");
        setToast("Created");
        const data = await fetch(API_BASE).then(r => r.json());
        setLinks(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  /*---------------------------------------------------------
     APPLY BUTTON
  ----------------------------------------------------------*/
  async function handleApply(item) {
    window.open(item.targetUrl, "_blank");
  }

  /*---------------------------------------------------------
    COPY SHORT LINK
  ----------------------------------------------------------*/
  function handleCopy(id) {
    const link = window.location.origin + "/" + id;
    navigator.clipboard.writeText(link);
    setToast("Copied");
  }

  function matchesFilter(item) {
    if (!filter) return true;
    return item.title.toLowerCase().includes(filter.toLowerCase());
  }

  /*---------------------------------------------------------
     🔥 LOADER SCREEN (ONLY WHEN BACKEND SLEEPING)
  ----------------------------------------------------------*/
  if (!backendReady) {
    return (
      <div className="backend-loader">
        <div className="loader-bar">
          <div
            className="loader-progress"
            style={{ width: `${seconds * 5}%` }}
          />
        </div>
        <div className="loader-text">
          Waking server… {seconds}s / 20s
        </div>
      </div>
    );
  }

  /*---------------------------------------------------------
     UI STARTS HERE (UNCHANGED)
  ----------------------------------------------------------*/
  return (
    <div className="app-page">

      {toast && <div className="toast">{toast}</div>}

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

        <div className="card-list">
          {links.filter(matchesFilter).map((item) => (
            <div className="card" key={item.id}>
              <div className="card-left">
                <div className="card-icon">🔗</div>
                <div className="card-info">
                  <a href="#" className="link-name"
                     onClick={(e) => { e.preventDefault(); handleApply(item); }}>
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
      </section>

      <footer className="app-footer">Made with ❤️ — All_Links_NetFier</footer>
    </div>
  );
}
