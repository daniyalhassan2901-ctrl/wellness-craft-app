import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { listAllUsers } from "@/lib/admin";
import type { UserProfile } from "@/lib/types";
import { Search, Loader2, ShieldOff, Ban, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 50;

export const Route = createFileRoute("/_admin/admin/users")({
  head: () => ({ meta: [{ title: "Users · Admin" }] }),
  component: UsersList,
});

function UsersList() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    listAllUsers().then((u) => {
      setUsers(u);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!q) return users;
    const s = q.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.uid.toLowerCase().includes(s),
    );
  }, [users, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl">Users</h1>
        <span className="text-xs text-muted-foreground">{users.length} total</span>
      </div>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email or uid"
          className="w-full rounded-full bg-input/60 border border-border pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <GlassCard>
          <ul className="divide-y divide-border/50">
            {filtered.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No users</li>}
            {filtered.map((u) => {
              const anyU = u as UserProfile & { banned?: boolean; disabled?: boolean };
              return (
                <li key={u.uid}>
                  <Link
                    to="/admin/users/$uid"
                    params={{ uid: u.uid }}
                    className="py-3 flex items-center justify-between gap-2 hover:bg-muted/30 rounded-lg px-2 -mx-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-2">
                        {u.fullName || "(no name)"}
                        {anyU.banned && <Ban className="h-3 w-3 text-destructive" />}
                        {anyU.disabled && <ShieldOff className="h-3 w-3 text-warning" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground shrink-0">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ""}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
