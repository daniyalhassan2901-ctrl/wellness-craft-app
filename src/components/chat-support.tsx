import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatSupport() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Ask me about calories, protein, water, BMI, or weight loss." },
  ]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, history: msgs.slice(-6) }),
      });
      if (!r.ok) throw new Error(await r.text());
      const { reply } = (await r.json()) as { reply: string };
      setMsgs([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: "Sorry, something went wrong. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full glass rounded-full py-3 text-sm font-medium flex items-center justify-center gap-2"
      >
        <MessageCircle className="h-4 w-4" /> Chat Support
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full sm:max-w-md bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col h-[80vh] sm:h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" /> Fitness Assistant
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1 rounded-full hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-muted"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {busy && <div className="mr-auto bg-muted rounded-2xl px-3 py-2 text-sm opacity-70">…</div>}
            </div>

            <div className="p-2 border-t border-border flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about calories, protein…"
                className="flex-1 rounded-full bg-input/60 border border-border px-4 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="rounded-full gradient-hero text-primary-foreground p-2 disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
