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
  const [kbOffset, setKbOffset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs, open]);

  // Track mobile keyboard via visualViewport so input stays above it
  useEffect(() => {
    if (!open || typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbOffset(offset);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setKbOffset(0);
    };
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);


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
        <div
          className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/60 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-background border border-border sm:rounded-2xl shadow-xl flex flex-col"
            style={{ height: "100dvh", maxHeight: "100dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
              <div className="text-sm font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" /> Fitness Assistant
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-2 rounded-full hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2">
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

            <div
              className="p-2 border-t border-border flex items-center gap-2 shrink-0 bg-background"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 200)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about calories, protein…"
                className="flex-1 min-w-0 rounded-full bg-input/60 border border-border px-4 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="rounded-full gradient-hero text-primary-foreground p-2 disabled:opacity-50 shrink-0"
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
