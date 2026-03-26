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
              <svg viewBox="0 0 100 92" width="100" height="92" aria-hidden="true">
                {/* Beard — single continuous zigzag, THE defining beardie feature */}
                <path d="M 10,65 L 90,65 L 93,71 L 88,92 L 82,72 L 76,92 L 70,72 L 64,92 L 58,72 L 52,92 L 46,72 L 40,92 L 34,72 L 28,92 L 22,72 L 16,92 L 7,71 Z" fill="#c97a3f"/>
                {/* Left cheek spines */}
                <polygon points="0,30 16,35 1,43" fill="#c97a3f"/>
                <polygon points="0,45 16,50 1,58" fill="#bf7030"/>
                {/* Right cheek spines */}
                <polygon points="100,30 84,35 99,43" fill="#c97a3f"/>
                <polygon points="100,45 84,50 99,58" fill="#bf7030"/>
                {/* Head — smooth bezier path, wide beardie silhouette */}
                <path d="M 50,5 Q 75,8 92,25 Q 96,40 86,56 L 68,65 Q 50,70 32,65 L 14,56 Q 4,40 8,25 Q 25,8 50,5 Z" fill="#e8953a"/>
                {/* Top spines */}
                <polygon points="40,5 44,0 48,5" fill="#d4852e"/>
                <polygon points="52,5 56,0 60,5" fill="#d4852e"/>
                {/* Brow ridges */}
                <path d="M 17,30 Q 28,22 40,29" stroke="#c97a3f" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                <path d="M 60,29 Q 72,22 83,30" stroke="#c97a3f" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                {/* Eye sockets */}
                <circle cx="28" cy="37" r="12" fill="#d4852e" opacity="0.4"/>
                <circle cx="72" cy="37" r="12" fill="#d4852e" opacity="0.4"/>
                {/* Eyes */}
                <circle cx="28" cy="37" r="9.5" fill="#fffef0"/>
                <circle cx="72" cy="37" r="9.5" fill="#fffef0"/>
                {/* Iris — golden amber */}
                <circle cx="28" cy="38" r="6" fill="#cc7800"/>
                <circle cx="72" cy="38" r="6" fill="#cc7800"/>
                {/* Pupils — slightly oval */}
                <ellipse cx="28" cy="38" rx="2.8" ry="3.8" fill="#0d0500"/>
                <ellipse cx="72" cy="38" rx="2.8" ry="3.8" fill="#0d0500"/>
                {/* Eye shine */}
                <circle cx="30" cy="35" r="2" fill="white"/>
                <circle cx="74" cy="35" r="2" fill="white"/>
                {/* Snout */}
                <ellipse cx="50" cy="53" rx="15" ry="10" fill="#d4852e" opacity="0.55"/>
                {/* Nostrils */}
                <circle cx="44" cy="49" r="2.5" fill="#7b4b24"/>
                <circle cx="56" cy="49" r="2.5" fill="#7b4b24"/>
                {/* Mouth — beardies naturally look like they're smiling */}
                <path d="M 35,61 Q 50,69 65,61" stroke="#7b4b24" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                {/* Scale dots */}
                <circle cx="50" cy="22" r="2.5" fill="#d4852e" opacity="0.5"/>
                <circle cx="42" cy="26" r="2" fill="#d4852e" opacity="0.4"/>
                <circle cx="58" cy="26" r="2" fill="#d4852e" opacity="0.4"/>
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
