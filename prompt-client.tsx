"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function AdminClient() {
  const router = useRouter();
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

  async function loadPrompt() {
    setLoading(true);
    const res = await fetch("/api/admin/prompt");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setPrompt(data.prompt || "");
    if (typeof data.kvAvailable === "boolean") setKvAvailable(data.kvAvailable);
    setLoading(false);
  }

  async function loadFiles() {
    const res = await fetch("/api/admin/files");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFilesMessage(data.error || "Unable to load knowledge files.");
      return;
    }
    const data = await res.json();
    setFiles(data.files || []);
    setFilesMessage(null);
  }

  async function loadModel() {
    const res = await fetch("/api/admin/model");
    if (!res.ok) return;
    const data = await res.json();
    if (data.model) {
      setModel(data.model);
      setActiveModel(data.model);
    }
    if (typeof data.kvAvailable === "boolean") setKvAvailable(data.kvAvailable);
  }

  useEffect(() => {
    loadPrompt();
    loadFiles();
    loadModel();
  }, []);

  async function savePrompt() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Save failed");
      setSaving(false);
      return;
    }

    const data = await res.json();
    if (typeof data.kvAvailable === "boolean") setKvAvailable(data.kvAvailable);
    setMessage(data.kvAvailable ? "Saved." : "Saved for this session only — connect Vercel KV to persist permanently.");
    setSaving(false);
  }

  async function saveModel() {
    setSavingModel(true);
    setModelMessage(null);
    const res = await fetch("/api/admin/model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setModelMessage(data.error || "Save failed");
    } else {
      const data = await res.json();
      if (typeof data.kvAvailable === "boolean") setKvAvailable(data.kvAvailable);
      setActiveModel(model);
      setModelMessage(data.kvAvailable ? "Saved." : "Saved for this session only — connect Vercel KV to persist permanently.");
    }
    setSavingModel(false);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  async function uploadFile(event: React.FormEvent) {
    event.preventDefault();
    if (!fileInput) return;
    setUploading(true);
    setFilesMessage(null);
    const formData = new FormData();
    formData.append("file", fileInput);
    const res = await fetch("/api/admin/files", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFilesMessage(data.error || "Upload failed.");
      setUploading(false);
      return;
    }
    setFileInput(null);
    await loadFiles();
    setFilesMessage("Uploaded.");
    setUploading(false);
  }

  async function viewFile(file: { id: string; filename?: string }) {
    setViewingFile(file);
    setFileContent(null);
    setContentLoading(true);
    const res = await fetch(`/api/admin/files?id=${encodeURIComponent(file.id)}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFileContent(`[Error: ${data.error || "Could not load file"}]`);
    } else {
      const data = await res.json();
      setFileContent(data.content ?? "[No content returned]");
    }
    setContentLoading(false);
  }

  async function deleteFile(fileId: string) {
    setDeleting(fileId);
    setFilesMessage(null);
    const res = await fetch("/api/admin/files", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFilesMessage(data.error || "Delete failed.");
      setDeleting(null);
      return;
    }
    await loadFiles();
    setFilesMessage("Deleted.");
    setDeleting(null);
  }

  return (
    <div className="form-card">
      <div className="top-actions">
        <small>Changes apply to new chats immediately.</small>
        <button className="link-button" onClick={logout} type="button">
          Log out
        </button>
      </div>

      {kvAvailable === false && (
        <div style={{
          background: "rgba(255, 107, 107, 0.12)",
          border: "1px solid rgba(192, 57, 43, 0.35)",
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 13,
          color: "#7b2020",
          lineHeight: 1.6
        }}>
          <strong>Vercel KV not connected.</strong> Prompt and model changes will reset on each server restart.
          To make changes permanent: go to your <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" style={{ color: "#c0392b", textDecoration: "underline" }}>Vercel dashboard</a> → Storage → Create KV Store → connect it to this project → redeploy.
        </div>
      )}

      <div className="header">
        <div className="title" style={{ fontSize: 18 }}>System Prompt</div>
      </div>

      {loading ? (
        <small>Loading prompt...</small>
      ) : (
        <textarea
          className="admin-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      )}
      <button onClick={savePrompt} disabled={saving || loading}>
        {saving ? "Saving..." : "Save Prompt"}
      </button>
      {message && <small>{message}</small>}

      <hr style={{ borderColor: "rgba(105, 181, 255, 0.2)", width: "100%" }} />

      <div className="header">
        <div className="title" style={{ fontSize: 18 }}>AI Model</div>
        {activeModel && (
          <div className="subtitle">Currently active: <strong>{activeModel}</strong></div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(170, 96, 38, 0.35)",
            background: "rgba(255, 240, 210, 0.5)",
            fontSize: 15,
            fontFamily: "inherit",
            color: "var(--night-900)",
            outline: "none",
            cursor: "pointer"
          }}
        >
          {OPENAI_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
          {!OPENAI_MODELS.find((m) => m.value === model) && (
            <option value={model}>{model}</option>
          )}
        </select>
        <button onClick={saveModel} disabled={savingModel} style={{ flexShrink: 0 }}>
          {savingModel ? "Saving..." : "Save Model"}
        </button>
      </div>
      {modelMessage && <small>{modelMessage}</small>}

      <hr style={{ borderColor: "rgba(105, 181, 255, 0.2)", width: "100%" }} />

      <div className="header">
        <div className="title" style={{ fontSize: 18 }}>Knowledge Files</div>
        <div className="subtitle">Upload care standards, charts, or SOPs (PDF, TXT, DOCX, CSV).</div>
      </div>

      <form className="form-card" onSubmit={uploadFile}>
        <input
          type="file"
          accept=".pdf,.txt,.md,.csv,.json,.docx"
          onChange={(e) => setFileInput(e.target.files?.[0] || null)}
        />
        <button type="submit" disabled={uploading || !fileInput}>
          {uploading ? "Uploading..." : "Upload File"}
        </button>
        {filesMessage && <small>{filesMessage}</small>}
      </form>

      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {files.map((f) => (
            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,240,210,0.5)", borderRadius: 10, padding: "8px 12px", border: "1px solid rgba(170,96,38,0.2)" }}>
              <button
                type="button"
                onClick={() => viewFile(f)}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontSize: 12, color: "var(--clay-700)", textDecoration: "underline", wordBreak: "break-all", flex: 1 }}
              >
                {f.filename || f.id}
              </button>
              <button
                className="link-button"
                type="button"
                onClick={() => deleteFile(f.id)}
                disabled={deleting === f.id}
                style={{ marginLeft: 12, flexShrink: 0, color: "#c0392b", borderColor: "rgba(192,57,43,0.4)" }}
              >
                {deleting === f.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}

      {viewingFile && (
        <div className="file-modal-overlay" onClick={() => setViewingFile(null)}>
          <div className="file-modal" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <strong style={{ fontSize: 14 }}>{viewingFile.filename || viewingFile.id}</strong>
              <button className="link-button" type="button" onClick={() => setViewingFile(null)}>Close</button>
            </div>
            <div className="file-modal-body">
              {contentLoading ? (
                <small>Loading...</small>
              ) : (
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
