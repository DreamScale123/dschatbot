"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { AppTheme } from "@/lib/theme-store";
import { DEFAULT_THEME } from "@/lib/theme-store";

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
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_THEME);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

  useEffect(() => {
    fetch("/api/whoami")
      .then((res) => res.json())
      .then((data: WhoAmI) => setIsAdmin(Boolean(data.authed && data.role === "admin")))
      .catch(() => setIsAdmin(false));
    fetch("/api/theme")
      .then((res) => res.json())
      .then((data: AppTheme) => {
        setTheme({ ...DEFAULT_THEME, ...data });
        if (typeof data.hue === "number") {
          document.documentElement.style.setProperty("--hue", String(data.hue));
        }
      })
      .catch(() => {});
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
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError("Image too large. Please use an image under 4MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") { setImageDataUrl(reader.result); setError(null); }
    };
    reader.readAsDataURL(file);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  function renderMessageContent(msg: ChatMessage) {
    if (msg.role !== "assistant") return msg.content;

    const parts: ReactNode[] = [];
    const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(msg.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(msg.content.slice(lastIndex, match.index));
      }

      const label = match[1];
      const markdownHref = match[2];
      const plainHref = match[3];
      const href = markdownHref || plainHref;

      if (href) {
        parts.push(
          <a key={`${href}-${match.index}`} href={href} target="_blank" rel="noopener noreferrer">
            {label || href}
          </a>
        );
      }

      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < msg.content.length) {
      parts.push(msg.content.slice(lastIndex));
    }

    return parts.length === 0
      ? msg.content
      : parts.map((part, index) => <Fragment key={`chunk-${index}`}>{part}</Fragment>);
  }

  return (
    <div className="chat">
      <div className="header" style={{ marginBottom: 4 }}>
        <div className="title">{theme.appName}</div>
        <div className="subtitle">{theme.appSubtitle}</div>
      </div>

      <div className="top-actions">
        <small>{theme.accessLabel}</small>
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
          <div className="message assistant">{theme.welcomeMessage}</div>
        )}
        {messages.map((msg, idx) => (
          <div key={`${msg.role}-${idx}`} className={`message ${msg.role}`}>
            {renderMessageContent(msg)}
            {msg.imageDataUrl && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={msg.imageDataUrl}
                  alt="User upload"
                  style={{ maxWidth: "100%", borderRadius: 10, border: "1px solid rgba(105,181,255,0.35)" }}
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
          placeholder={theme.inputPlaceholder}
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
                <path d="M 10,65 L 90,65 L 93,71 L 88,92 L 82,72 L 76,92 L 70,72 L 64,92 L 58,72 L 52,92 L 46,72 L 40,92 L 34,72 L 28,92 L 22,72 L 16,92 L 7,71 Z" fill="#c97a3f"/>
                <polygon points="0,30 16,35 1,43" fill="#c97a3f"/>
                <polygon points="0,45 16,50 1,58" fill="#bf7030"/>
                <polygon points="100,30 84,35 99,43" fill="#c97a3f"/>
                <polygon points="100,45 84,50 99,58" fill="#bf7030"/>
                <path d="M 50,5 Q 75,8 92,25 Q 96,40 86,56 L 68,65 Q 50,70 32,65 L 14,56 Q 4,40 8,25 Q 25,8 50,5 Z" fill="#e8953a"/>
                <polygon points="40,5 44,0 48,5" fill="#d4852e"/>
                <polygon points="52,5 56,0 60,5" fill="#d4852e"/>
                <path d="M 17,30 Q 28,22 40,29" stroke="#c97a3f" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                <path d="M 60,29 Q 72,22 83,30" stroke="#c97a3f" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                <circle cx="28" cy="37" r="12" fill="#d4852e" opacity="0.4"/>
                <circle cx="72" cy="37" r="12" fill="#d4852e" opacity="0.4"/>
                <circle cx="28" cy="37" r="9.5" fill="#fffef0"/>
                <circle cx="72" cy="37" r="9.5" fill="#fffef0"/>
                <circle cx="28" cy="38" r="6" fill="#cc7800"/>
                <circle cx="72" cy="38" r="6" fill="#cc7800"/>
                <ellipse cx="28" cy="38" rx="2.8" ry="3.8" fill="#0d0500"/>
                <ellipse cx="72" cy="38" rx="2.8" ry="3.8" fill="#0d0500"/>
                <circle cx="30" cy="35" r="2" fill="white"/>
                <circle cx="74" cy="35" r="2" fill="white"/>
                <ellipse cx="50" cy="53" rx="15" ry="10" fill="#d4852e" opacity="0.55"/>
                <circle cx="44" cy="49" r="2.5" fill="#7b4b24"/>
                <circle cx="56" cy="49" r="2.5" fill="#7b4b24"/>
                <path d="M 35,61 Q 50,69 65,61" stroke="#7b4b24" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: "none" }}
        />
        <button
          type="button"
          className="link-button"
          onClick={() => fileInputRef.current?.click()}
          style={{ fontSize: 13 }}
        >
          {imageDataUrl ? "Change image" : "Attach image"}
        </button>
        {imageDataUrl && (
          <>
            <small>Image attached.</small>
            <button
              type="button"
              className="link-button"
              onClick={() => setImageDataUrl(null)}
              style={{ fontSize: 13, color: "#c0392b", borderColor: "rgba(192,57,43,0.4)" }}
            >
              Remove
            </button>
          </>
        )}
      </div>
      <small>Tip: Press Cmd/Ctrl + Enter to send.</small>
    </div>
  );
}
