"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
};

type WhoAmI = {
  authed: boolean;
  role?: "member" | "admin";
};

export default function ChatClient() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

  useEffect(() => {
    fetch("/api/whoami")
      .then((res) => res.json())
      .then((data: WhoAmI) => setIsAdmin(Boolean(data.authed && data.role === "admin")))
      .catch(() => setIsAdmin(false));
  }, []);

  async function sendMessage() {
    const trimmed = input.trim();
    if ((!trimmed && !imageDataUrl) || loading) return;

    const newMessage: ChatMessage = {
      role: "user",
      content: trimmed || "Describe this image.",
      imageDataUrl: imageDataUrl || undefined
    };
    const nextMessages = [...messages, newMessage];
    setMessages(nextMessages);
    setInput("");
    setImageDataUrl(null);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages })
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      const data = await res.json();
      const reply = data.reply || "";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      sendMessage();
    }
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image too large. Please use an image under 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setImageDataUrl(result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="chat">
      <div className="top-actions">
        <small>Private members-only access</small>
        <div>
          {isAdmin && (
            <button className="link-button" type="button" onClick={() => router.push("/admin")}>
              Admin
            </button>
          )}
          <button className="link-button" type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
      <div className="chat-history">
        {messages.length === 0 && (
          <div className="message assistant">
            Ask anything about enclosure setup, lighting, feeding, or handling. I’ll keep it educational and safe.
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={`${msg.role}-${idx}`} className={`message ${msg.role}`}>
            {msg.content}
            {msg.imageDataUrl && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={msg.imageDataUrl}
                  alt="User upload"
                  style={{ maxWidth: "100%", borderRadius: 10, border: "1px solid rgba(105, 181, 255, 0.35)" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      {error && <small>Server error: {error}</small>}
      <div className="input-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about lighting, feeding, or health red flags..."
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
      <div className="input-row" style={{ alignItems: "center" }}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imageDataUrl && <small>Image attached.</small>}
      </div>
      <small>Tip: Press Cmd/Ctrl + Enter to send.</small>
    </div>
  );
}
