import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT =
  "You are a concise fitness & nutrition assistant. Only answer questions about calories, weight loss, maintenance calories, protein intake, water intake, and BMI. Keep replies under 80 words. If off-topic, say you only help with fitness & nutrition.";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { message, history } = (await request.json()) as {
            message: string;
            history?: { role: "user" | "assistant"; content: string }[];
          };
          const key = process.env.GROQ_API_KEY;
          if (!key) return new Response("Missing GROQ_API_KEY", { status: 500 });
          if (!message?.trim()) return new Response("Empty", { status: 400 });

          const msgs = [
            { role: "system", content: SYSTEM_PROMPT },
            ...(history ?? []).slice(-6),
            { role: "user", content: message.slice(0, 500) },
          ];

          const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: msgs,
              max_tokens: 180,
              temperature: 0.4,
            }),
          });

          if (!r.ok) {
            const t = await r.text();
            return new Response(t || "Upstream error", { status: r.status });
          }
          const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
          const reply = j.choices?.[0]?.message?.content?.trim() ?? "Sorry, no reply.";
          return Response.json({ reply });
        } catch (e) {
          return new Response((e as Error).message, { status: 500 });
        }
      },
    },
  },
});
