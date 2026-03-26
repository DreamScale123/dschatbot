"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminClient() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<Array<{ id: string; filename?: string }>>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filesMessage, setFilesMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState<File | null>(null);

  async function loadPrompt() {
    setLoading(true);
    const res = await fetch("/api/admin/prompt");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setPrompt(data.prompt || "");
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

  useEffect(() => {
    loadPrompt();
    loadFiles();
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

    setMessage("Saved.");
    setSaving(false);
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
        <div className="title" style={{ fontSize: 18 }}>
          Knowledge Files
        </div>
        <div className="subtitle">
          Upload care standards, charts, or SOPs (PDF, TXT, DOCX, CSV).
        </div>
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
              <small style={{ wordBreak: "break-all" }}>{f.filename || f.id}</small>
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
    </div>
  );
}
