"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminClient() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<Array<{ id: string }>>([]);
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
        <small>Uploaded files: {files.map((f) => f.id).join(", ")}</small>
      )}
    </div>
  );
}
