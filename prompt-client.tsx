"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppTheme } from "@/lib/theme-store";
import { DEFAULT_THEME } from "@/lib/theme-store";

const OPENAI_MODELS = [
  { label: "GPT-5.4 Mini", value: "gpt-5.4-mini" },
  { label: "GPT-4.5", value: "gpt-4.5" },
  { label: "GPT-4.5 Mini", value: "gpt-4.5-mini" },
  { label: "GPT-4.1", value: "gpt-4.1" },
  { label: "GPT-4.1 Mini", value: "gpt-4.1-mini" },
  { label: "GPT-4.1 Nano", value: "gpt-4.1-nano" },
  { label: "GPT-4o", value: "gpt-4o" },
  { label: "GPT-4o Mini", value: "gpt-4o-mini" },
  { label: "o4 Mini", value: "o4-mini" },
  { label: "o3", value: "o3" },
  { label: "o3 Mini", value: "o3-mini" },
  { label: "o1", value: "o1" },
  { label: "o1 Mini", value: "o1-mini" },
];

const COLOR_PRESETS = [
  { label: "Orange", hue: 25 },
  { label: "Red", hue: 0 },
  { label: "Rose", hue: 340 },
  { label: "Purple", hue: 270 },
  { label: "Blue", hue: 210 },
  { label: "Teal", hue: 170 },
  { label: "Green", hue: 130 },
  { label: "Lime", hue: 85 },
  { label: "Gold", hue: 45 },
];

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid hsla(var(--hue), 63%, 41%, 0.35)" as string,
  background: "hsla(var(--hue), 100%, 91%, 0.5)" as string,
  fontSize: 14,
  fontFamily: "inherit",
  color: "inherit",
  outline: "none",
  width: "100%",
};

export default function AdminClient() {
  const router = useRouter();
  const [tab, setTab] = useState<"settings" | "appearance">("settings");

  // Settings tab state
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [kvAvailable, setKvAvailable] = useState<boolean | null>(null);
  const [files, setFiles] = useState<Array<{ id: string; filename?: string }>>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filesMessage, setFilesMessage] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{ id: string; filename?: string } | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [model, setModel] = useState("gpt-5.4-mini");
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [savingModel, setSavingModel] = useState(false);
  const [modelMessage, setModelMessage] = useState<string | null>(null);
  const [memberPw, setMemberPw] = useState("");
  const [adminPw, setAdminPw] = useState("");
  const [savingPw, setSavingPw] = useState<"member" | "admin" | null>(null);
  const [pwMessage, setPwMessage] = useState<string | null>(null);

  // Appearance tab state
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_THEME);
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeMessage, setThemeMessage] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    const [promptRes, modelRes, themeRes] = await Promise.all([
      fetch("/api/admin/prompt"),
      fetch("/api/admin/model"),
      fetch("/api/admin/theme"),
    ]);

    if (promptRes.status === 401) { router.push("/login"); return; }

    const [pd, md, td] = await Promise.all([
      promptRes.json().catch(() => ({})),
      modelRes.json().catch(() => ({})),
      themeRes.json().catch(() => ({})),
    ]);

    if (pd.prompt) setPrompt(pd.prompt);
    if (typeof pd.kvAvailable === "boolean") setKvAvailable(pd.kvAvailable);
    if (md.model) { setModel(md.model); setActiveModel(md.model); }
    if (td && typeof td.hue === "number") setTheme({ ...DEFAULT_THEME, ...td });

    setLoading(false);
  }

  async function loadFiles() {
    const res = await fetch("/api/admin/files");
    if (!res.ok) { const d = await res.json().catch(() => ({})); setFilesMessage(d.error || "Unable to load files."); return; }
    const data = await res.json();
    setFiles(data.files || []);
    setFilesMessage(null);
  }

  useEffect(() => { loadAll(); loadFiles(); }, []);

  async function savePrompt() {
    setSaving(true); setMessage(null);
    const res = await fetch("/api/admin/prompt", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json().catch(() => ({}));
    if (typeof data.kvAvailable === "boolean") setKvAvailable(data.kvAvailable);
    setMessage(res.ok ? (data.kvAvailable ? "Saved." : "Saved for this session only — connect Vercel KV to persist.") : (data.error || "Save failed"));
    setSaving(false);
  }

  async function saveModel() {
    setSavingModel(true); setModelMessage(null);
    const res = await fetch("/api/admin/model", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model })
    });
    const data = await res.json().catch(() => ({}));
    if (typeof data.kvAvailable === "boolean") setKvAvailable(data.kvAvailable);
    if (res.ok) { setActiveModel(model); setModelMessage(data.kvAvailable ? "Saved." : "Saved for this session only — connect Vercel KV to persist."); }
    else setModelMessage(data.error || "Save failed");
    setSavingModel(false);
  }

  async function savePassword(type: "member" | "admin", password: string) {
    setSavingPw(type); setPwMessage(null);
    const res = await fetch("/api/admin/passwords", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setPwMessage(data.error || "Save failed"); }
    else { setPwMessage(`${type === "member" ? "User" : "Admin"} password updated.`); if (type === "member") setMemberPw(""); else setAdminPw(""); }
    setSavingPw(null);
  }

  async function saveTheme() {
    setSavingTheme(true); setThemeMessage(null);
    const res = await fetch("/api/admin/theme", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(theme)
    });
    if (res.ok) {
      document.documentElement.style.setProperty("--hue", String(theme.hue));
      setThemeMessage("Saved.");
    } else {
      setThemeMessage("Save failed");
    }
    setSavingTheme(false);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  async function uploadFile(event: React.FormEvent) {
    event.preventDefault();
    if (!fileInput) return;
    setUploading(true); setFilesMessage(null);
    const formData = new FormData();
    formData.append("file", fileInput);
    const res = await fetch("/api/admin/files", { method: "POST", body: formData });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setFilesMessage(d.error || "Upload failed."); setUploading(false); return; }
    setFileInput(null);
    await loadFiles();
    setFilesMessage("Uploaded.");
    setUploading(false);
  }

  async function viewFile(file: { id: string; filename?: string }) {
    setViewingFile(file); setFileContent(null); setContentLoading(true);
    const res = await fetch(`/api/admin/files?id=${encodeURIComponent(file.id)}`);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setFileContent(`[Error: ${d.error || "Could not load file"}]`); }
    else { const d = await res.json(); setFileContent(d.content ?? "[No content returned]"); }
    setContentLoading(false);
  }

  async function deleteFile(fileId: string) {
    setDeleting(fileId); setFilesMessage(null);
    const res = await fetch("/api/admin/files", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId }) });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setFilesMessage(d.error || "Delete failed."); setDeleting(null); return; }
    await loadFiles(); setFilesMessage("Deleted."); setDeleting(null);
  }

  const hr = <hr style={{ borderColor: "hsla(var(--hue), 63%, 41%, 0.2)", width: "100%", border: "none", borderTop: "1px solid" }} />;

  return (
    <div className="form-card">
      <div className="top-actions">
        <small>Changes apply to new sessions immediately.</small>
        <button className="link-button" onClick={logout} type="button">Log out</button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab${tab === "settings" ? " active" : ""}`} onClick={() => setTab("settings")}>Settings</button>
        <button className={`admin-tab${tab === "appearance" ? " active" : ""}`} onClick={() => setTab("appearance")}>Appearance</button>
      </div>

      {/* ── SETTINGS TAB ── */}
      {tab === "settings" && (
        <>
          {kvAvailable === false && (
            <div style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(192,57,43,0.35)", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#7b2020", lineHeight: 1.6 }}>
              <strong>Vercel KV not connected.</strong> Changes reset on each server restart. Go to your{" "}
              <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" style={{ color: "#c0392b", textDecoration: "underline" }}>Vercel dashboard</a>
              {" "}→ Storage → Connect <code>DS_KV_URL</code> and <code>DS_KV_TOKEN</code>.
            </div>
          )}

          <div className="header"><div className="title" style={{ fontSize: 18 }}>System Prompt</div></div>
          {loading ? <small>Loading...</small> : (
            <textarea className="admin-textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          )}
          <button onClick={savePrompt} disabled={saving || loading}>{saving ? "Saving..." : "Save Prompt"}</button>
          {message && <small>{message}</small>}

          {hr}

          <div className="header">
            <div className="title" style={{ fontSize: 18 }}>AI Model</div>
            {activeModel && <div className="subtitle">Currently active: <strong>{activeModel}</strong></div>}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select value={model} onChange={(e) => setModel(e.target.value)} style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1px solid hsla(var(--hue),63%,41%,0.35)", background: "hsla(var(--hue),100%,91%,0.5)", fontSize: 15, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
              {OPENAI_MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              {!OPENAI_MODELS.find((m) => m.value === model) && <option value={model}>{model}</option>}
            </select>
            <button onClick={saveModel} disabled={savingModel} style={{ flexShrink: 0 }}>{savingModel ? "Saving..." : "Save Model"}</button>
          </div>
          {modelMessage && <small>{modelMessage}</small>}

          {hr}

          <div className="header"><div className="title" style={{ fontSize: 18 }}>Knowledge Files</div><div className="subtitle">Upload care standards, charts, or SOPs (PDF, TXT, DOCX, CSV).</div></div>
          <form className="form-card" onSubmit={uploadFile}>
            <input type="file" accept=".pdf,.txt,.md,.csv,.json,.docx" onChange={(e) => setFileInput(e.target.files?.[0] || null)} />
            <button type="submit" disabled={uploading || !fileInput}>{uploading ? "Uploading..." : "Upload File"}</button>
            {filesMessage && <small>{filesMessage}</small>}
          </form>
          {files.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {files.map((f) => (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "hsla(var(--hue),100%,91%,0.5)", borderRadius: 10, padding: "8px 12px", border: "1px solid hsla(var(--hue),63%,41%,0.2)" }}>
                  <button type="button" onClick={() => viewFile(f)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontSize: 12, color: "var(--clay-700)", textDecoration: "underline", wordBreak: "break-all", flex: 1 }}>
                    {f.filename || f.id}
                  </button>
                  <button className="link-button" type="button" onClick={() => deleteFile(f.id)} disabled={deleting === f.id} style={{ marginLeft: 12, flexShrink: 0, color: "#c0392b", borderColor: "rgba(192,57,43,0.4)" }}>
                    {deleting === f.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {hr}

          <div className="header"><div className="title" style={{ fontSize: 18 }}>Access Passwords</div><div className="subtitle">Change login passwords for members and admin.</div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input type="password" placeholder="New user password" value={memberPw} onChange={(e) => setMemberPw(e.target.value)} style={{ ...inputStyle }} />
              <button onClick={() => savePassword("member", memberPw)} disabled={savingPw === "member" || memberPw.trim().length < 4} style={{ flexShrink: 0 }}>{savingPw === "member" ? "Saving..." : "Save User Password"}</button>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input type="password" placeholder="New admin password" value={adminPw} onChange={(e) => setAdminPw(e.target.value)} style={{ ...inputStyle }} />
              <button onClick={() => savePassword("admin", adminPw)} disabled={savingPw === "admin" || adminPw.trim().length < 4} style={{ flexShrink: 0 }}>{savingPw === "admin" ? "Saving..." : "Save Admin Password"}</button>
            </div>
          </div>
          {pwMessage && <small>{pwMessage}</small>}
        </>
      )}

      {/* ── APPEARANCE TAB ── */}
      {tab === "appearance" && (
        <>
          <div className="header"><div className="title" style={{ fontSize: 18 }}>Theme Color</div><div className="subtitle">Choose a color that changes the entire UI.</div></div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {COLOR_PRESETS.map((p) => (
              <button
                key={p.hue}
                type="button"
                onClick={() => setTheme((t) => ({ ...t, hue: p.hue }))}
                style={{
                  width: 80,
                  height: 44,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, hsl(${p.hue},85%,65%), hsl(${p.hue},60%,45%))`,
                  border: theme.hue === p.hue ? "3px solid var(--night-800)" : "2px solid transparent",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "none",
                  letterSpacing: 0,
                  padding: 0,
                  cursor: "pointer",
                  textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--clay-700)", whiteSpace: "nowrap" }}>Custom hue</label>
            <input
              type="range"
              min={0}
              max={359}
              value={theme.hue}
              onChange={(e) => setTheme((t) => ({ ...t, hue: Number(e.target.value) }))}
              style={{ flex: 1, accentColor: `hsl(${theme.hue}, 70%, 50%)` }}
            />
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `hsl(${theme.hue}, 70%, 50%)`, flexShrink: 0, border: "2px solid rgba(0,0,0,0.15)" }} />
            <small style={{ width: 32 }}>{theme.hue}°</small>
          </div>

          {hr}

          <div className="header"><div className="title" style={{ fontSize: 18 }}>UI Text</div><div className="subtitle">Customize the text shown in the chat interface.</div></div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {([
              { key: "appName", label: "App Name", placeholder: DEFAULT_THEME.appName },
              { key: "appSubtitle", label: "App Subtitle", placeholder: DEFAULT_THEME.appSubtitle },
              { key: "accessLabel", label: "Access Label (top-left of chat)", placeholder: DEFAULT_THEME.accessLabel },
              { key: "welcomeMessage", label: "Welcome Message", placeholder: DEFAULT_THEME.welcomeMessage },
              { key: "inputPlaceholder", label: "Input Placeholder", placeholder: DEFAULT_THEME.inputPlaceholder },
            ] as { key: keyof AppTheme; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--clay-700)" }}>{label}</label>
                <input
                  type="text"
                  value={String(theme[key])}
                  placeholder={placeholder}
                  onChange={(e) => setTheme((t) => ({ ...t, [key]: e.target.value }))}
                  style={{ ...inputStyle, fontSize: 14 }}
                />
              </div>
            ))}
          </div>

          <button onClick={saveTheme} disabled={savingTheme}>{savingTheme ? "Saving..." : "Save Appearance"}</button>
          {themeMessage && <small>{themeMessage}</small>}
        </>
      )}

      {/* File preview modal */}
      {viewingFile && (
        <div className="file-modal-overlay" onClick={() => setViewingFile(null)}>
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <strong style={{ fontSize: 14 }}>{viewingFile.filename || viewingFile.id}</strong>
              <button className="link-button" type="button" onClick={() => setViewingFile(null)}>Close</button>
            </div>
            <div className="file-modal-body">
              {contentLoading ? <small>Loading...</small> : (
                <>
                  <a
                    href={`/api/admin/files/download?id=${encodeURIComponent(viewingFile.id)}&name=${encodeURIComponent(viewingFile.filename || viewingFile.id)}`}
                    download={viewingFile.filename || viewingFile.id}
                    style={{ fontSize: 13, color: "var(--clay-700)", textDecoration: "underline", marginBottom: 10, display: "inline-block" }}
                  >
                    Download file
                  </a>
                  <pre className="file-modal-pre">{fileContent}</pre>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
