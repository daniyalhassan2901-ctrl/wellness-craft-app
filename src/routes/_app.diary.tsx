import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { addDiaryEntry, deleteDiary, listDiary, todayKey } from "@/lib/firestore";
import type { DiaryEntry } from "@/lib/types";
import { GlassCard } from "@/components/glass-card";
import { Plus, Trash2, X } from "lucide-react";

const MOODS = ["😃", "😊", "😐", "😔", "😩", "💪", "🔥"];

export const Route = createFileRoute("/_app/diary")({
  head: () => ({ meta: [{ title: "Diary · Daniyal Fitness" }] }),
  component: DiaryPage,
});

function DiaryPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    listDiary(user.uid).then(setEntries);
  }, [user, tick]);

  const save = async () => {
    if (!user || !title.trim()) return;
    await addDiaryEntry(user.uid, {
      date: todayKey(),
      title: title.trim(),
      content: content.trim(),
      mood,
      createdAt: Date.now(),
    });
    setTitle("");
    setContent("");
    setMood("");
    setOpen(false);
    setTick((t) => t + 1);
  };

  const del = async (id: string) => {
    if (!user) return;
    await deleteDiary(user.uid, id);
    setTick((t) => t + 1);
  };

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Diary</h1>
          <p className="text-sm text-muted-foreground">Log thoughts, wins and mood.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full gradient-hero text-primary-foreground p-3 shadow-glow"
          aria-label="New entry"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3">
        {entries.length === 0 && (
          <GlassCard className="text-center py-10 text-sm text-muted-foreground">
            No entries yet. Tap + to add your first.
          </GlassCard>
        )}
        {entries.map((e) => (
          <GlassCard key={e.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {e.mood && <span className="text-lg">{e.mood}</span>}
                  <div className="font-semibold text-sm">{e.title}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(e.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </div>
              </div>
              <button onClick={() => del(e.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {e.content && <p className="mt-2 text-sm whitespace-pre-wrap">{e.content}</p>}
          </GlassCard>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md sm:rounded-3xl bg-card border border-border shadow-card rounded-t-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">New entry</div>
              <button onClick={() => setOpen(false)} className="glass rounded-full p-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-2xl bg-input/60 border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="How was today?"
                rows={5}
                className="w-full rounded-2xl bg-input/60 border border-border px-4 py-3 text-sm outline-none focus:border-primary resize-none"
              />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Mood</div>
                <div className="flex gap-1.5">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMood(mood === m ? "" : m)}
                      className={`h-10 w-10 rounded-full text-xl transition ${mood === m ? "bg-primary shadow-glow scale-110" : "glass"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={save} className="w-full rounded-full gradient-hero text-primary-foreground py-3 text-sm font-semibold shadow-glow">
                Save entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
