import { NextResponse } from "next/server";
import { isAuthedFromCookies } from "@/lib/auth";
import { getSystemPrompt } from "@/lib/prompt-store";
import { EMERGENCY_NOTICE, needsEmergencyNotice } from "@/lib/guardrails";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
};

function extractOutputText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const anyData = data as { output_text?: string; output?: unknown[] };
  if (typeof anyData.output_text === "string" && anyData.output_text.trim().length > 0) {
    return anyData.output_text;
  }
  if (Array.isArray(anyData.output)) {
    const parts: string[] = [];
    for (const item of anyData.output) {
      if (!item || typeof item !== "object") continue;
      const msg = item as { type?: string; role?: string; content?: unknown[] };
      if (msg.type === "message" && msg.role === "assistant" && Array.isArray(msg.content)) {
        for (const c of msg.content) {
          if (!c || typeof c !== "object") continue;
          const chunk = c as { type?: string; text?: string };
          if (chunk.type === "output_text" && typeof chunk.text === "string") {
            parts.push(chunk.text);
          }
        }
      }
    }
    return parts.join("").trim();
  }
  return "";
}

function extractFileCitations(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const anyData = data as { output?: unknown[] };
  const filenames = new Set<string>();
  if (Array.isArray(anyData.output)) {
    for (const item of anyData.output) {
      if (!item || typeof item !== "object") continue;
      const msg = item as { type?: string; role?: string; content?: unknown[] };
      if (msg.type === "message" && msg.role === "assistant" && Array.isArray(msg.content)) {
        for (const c of msg.content) {
          if (!c || typeof c !== "object") continue;
          const chunk = c as { type?: string; annotations?: unknown[] };
          if (chunk.type === "output_text" && Array.isArray(chunk.annotations)) {
            for (const ann of chunk.annotations) {
              if (!ann || typeof ann !== "object") continue;
              const citation = ann as { type?: string; filename?: string };
              if (citation.type === "file_citation" && citation.filename) {
                filenames.add(citation.filename);
              }
            }
          }
        }
      }
    }
  }
  return Array.from(filenames);
}

export async function POST(req: Request) {
  if (!isAuthedFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = await req.json().catch(() => ({ messages: [] }));
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const sanitized = messages
    .filter((m: ChatMessage) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
    .map((m: ChatMessage) => ({
      role: m.role,
      content: m.content,
      imageDataUrl: typeof m.imageDataUrl === "string" ? m.imageDataUrl : undefined
    }));

  const latestUser = [...sanitized].reverse().find((m) => m.role === "user");
  const emergency = latestUser ? needsEmergencyNotice(latestUser.content) : false;

  const systemPrompt = await getSystemPrompt();
  const guardrailAddendum = emergency
    ? `\n\nIf the user mentions emergency signs, begin your reply with: "${EMERGENCY_NOTICE}"`
    : "";

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set" }, { status: 500 });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.5-mini";
  const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

  const temperature = process.env.OPENAI_TEMPERATURE;
  const tempValue = temperature ? Number(temperature) : undefined;
  const supportsTemperature = !model.startsWith("gpt-5");

  const input = sanitized.map((m) => {
    if (m.role === "user") {
      if (m.imageDataUrl && m.imageDataUrl.startsWith("data:image/")) {
        return {
          role: "user",
          content: [
            { type: "input_text", text: m.content },
            { type: "input_image", image_url: m.imageDataUrl, detail: "auto" }
          ]
        };
      }
      return { role: "user", content: [{ type: "input_text", text: m.content }] };
    }
    return { role: "assistant", content: [{ type: "output_text", text: m.content }] };
  });

  const payload: Record<string, unknown> = {
    model,
    instructions: systemPrompt + guardrailAddendum,
    input,
    include: ["file_search_call.results"]
  };

  if (vectorStoreId) {
    payload.tools = [{ type: "file_search", vector_store_ids: [vectorStoreId] }];
  }

  if (supportsTemperature && Number.isFinite(tempValue)) {
    payload.temperature = tempValue;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return NextResponse.json({ error: err.error?.message || "Model request failed" }, { status: 500 });
  }

  const data = await response.json();
  let reply = extractOutputText(data);
  const citations = extractFileCitations(data);

  if (emergency && !reply.includes(EMERGENCY_NOTICE)) {
    reply = `${EMERGENCY_NOTICE}\n\n${reply}`.trim();
  }

  if (citations.length > 0) {
    reply = `${reply}\n\nSources: Dragon Smart Care Standards`.trim();
  } else {
    reply = `${reply}\n\nSources: No sources cited`.trim();
  }

  return NextResponse.json({ reply });
}
