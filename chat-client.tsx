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
              <svg viewBox="0 0 130 96" width="114" height="84" aria-hidden="true">
                {/* Beard spikes — the defining beardie feature, spread wide */}
                <polygon points="19,96 29,74 39,96" fill="#bf7030"/>
                <polygon points="34,96 44,74 54,96" fill="#c97a3f"/>
                <polygon points="49,96 59,74 69,96" fill="#bf7030"/>
                <polygon points="64,96 74,74 84,96" fill="#c97a3f"/>
                <polygon points="79,96 89,74 99,96" fill="#bf7030"/>
                {/* Chin/gular base connecting beard to head */}
                <ellipse cx="59" cy="74" rx="39" ry="7" fill="#d4892e"/>
                {/* Left cheek spines */}
                <polygon points="8,42 27,48 10,56" fill="#c97a3f"/>
                <polygon points="7,56 27,59 9,66" fill="#bf7030"/>
                {/* Right cheek spines */}
                <polygon points="122,42 103,48 120,56" fill="#c97a3f"/>
                <polygon points="123,56 103,59 121,66" fill="#bf7030"/>
                {/* Main head — wide trapezoid shape, distinctly beardie */}
                <path d="M 21,68 Q 11,53 17,30 Q 24,13 60,11 Q 96,13 103,30 Q 109,53 99,68 Q 81,79 60,80 Q 39,79 21,68 Z" fill="#e8953a"/>
                {/* Top-of-head spines */}
                <polygon points="44,12 48,4 52,12" fill="#d4852e"/>
                <polygon points="56,11 60,3 64,11" fill="#d4852e"/>
                <polygon points="68,12 72,4 76,12" fill="#d4852e"/>
                {/* Brow ridges — very prominent on real beardies */}
                <path d="M 22,33 Q 34,24 47,31" stroke="#c97a3f" strokeWidth="4" fill="none" strokeLinecap="round"/>
                <path d="M 73,31 Q 86,24 98,33" stroke="#c97a3f" strokeWidth="4" fill="none" strokeLinecap="round"/>
                {/* Eye sockets */}
                <circle cx="35" cy="41" r="13" fill="#c97a3f" opacity="0.35"/>
                <circle cx="85" cy="41" r="13" fill="#c97a3f" opacity="0.35"/>
                {/* Eyes — large, cream-white */}
                <circle cx="35" cy="41" r="10.5" fill="#fffef0"/>
                <circle cx="85" cy="41" r="10.5" fill="#fffef0"/>
                {/* Iris — golden amber like a real beardie */}
                <circle cx="35" cy="42" r="7" fill="#d4820a"/>
                <circle cx="85" cy="42" r="7" fill="#d4820a"/>
                {/* Pupils — slightly oval/vertical */}
                <ellipse cx="35" cy="42" rx="3.2" ry="4.5" fill="#0a0503"/>
                <ellipse cx="85" cy="42" rx="3.2" ry="4.5" fill="#0a0503"/>
                {/* Eye shine */}
                <circle cx="37.5" cy="39" r="2.2" fill="white"/>
                <circle cx="87.5" cy="39" r="2.2" fill="white"/>
                {/* Snout — wide and flat */}
                <ellipse cx="60" cy="58" rx="18" ry="12" fill="#d4852e" opacity="0.5"/>
                {/* Nostrils */}
                <ellipse cx="53" cy="53" rx="3" ry="2.5" fill="#7b4b24"/>
                <ellipse cx="67" cy="53" rx="3" ry="2.5" fill="#7b4b24"/>
                {/* Mouth — beardies have a characteristic slight upward curve */}
                <path d="M 43,65 Q 52,70 60,71 Q 68,70 77,65" stroke="#7b4b24" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                {/* Scale texture dots */}
                <circle cx="60" cy="26" r="2.5" fill="#d4852e" opacity="0.5"/>
                <circle cx="50" cy="30" r="1.8" fill="#d4852e" opacity="0.4"/>
                <circle cx="70" cy="30" r="1.8" fill="#d4852e" opacity="0.4"/>
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
