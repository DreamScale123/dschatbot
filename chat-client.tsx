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
        <div style={{ position: "relative", overflow: "visible", zIndex: 1 }}>
          {loading && (
            <div className="dragon-wrap">
              <div className="dragon-bubble">
                <span className="dot" style={{ animationDelay: "0s" }} />
                <span className="dot" style={{ animationDelay: "0.3s" }} />
                <span className="dot" style={{ animationDelay: "0.6s" }} />
              </div>
              <svg viewBox="0 0 82 68" width="72" height="60" aria-hidden="true">
                <polygon points="14,68 21,50 28,68" fill="#c97a3f"/>
                <polygon points="26,68 33,50 40,68" fill="#bf7038"/>
                <polygon points="38,68 45,50 52,68" fill="#c97a3f"/>
                <polygon points="50,68 57,50 64,68" fill="#bf7038"/>
                <ellipse cx="41" cy="40" rx="26" ry="22" fill="#e8953a"/>
                <ellipse cx="41" cy="27" rx="17" ry="4" fill="#d4852e" opacity="0.35"/>
                <circle cx="31" cy="36" r="7" fill="white"/>
                <circle cx="51" cy="36" r="7" fill="white"/>
                <circle cx="32" cy="37" r="4.5" fill="#1a1009"/>
                <circle cx="52" cy="37" r="4.5" fill="#1a1009"/>
                <circle cx="33.5" cy="35" r="1.8" fill="white"/>
                <circle cx="53.5" cy="35" r="1.8" fill="white"/>
                <ellipse cx="38" cy="44" rx="2" ry="1.5" fill="#c97a3f"/>
                <ellipse cx="44" cy="44" rx="2" ry="1.5" fill="#c97a3f"/>
                <path d="M 32 50 Q 41 57 50 50" stroke="#7b4b24" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
          )}
          <button onClick={sendMessage} disabled={loading} style={{ position: "relative", zIndex: 2 }}>
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
      <div className="input-row" style={{ alignItems: "center" }}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imageDataUrl && <small>Image attached.</small>}
      </div>
      <small>Tip: Press Cmd/Ctrl + Enter to send.</small>
    </div>
  );
}
