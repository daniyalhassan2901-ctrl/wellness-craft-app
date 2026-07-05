import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Dumbbell, Loader2, Mail, Lock, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Daniyal Fitness" },
      { name: "description", content: "Sign in or create your Daniyal Fitness account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, profile, isAdmin, loading, configured, signIn, signUp, signInGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user && isAdmin) navigate({ to: "/admin", replace: true });
    else if (user && profile) navigate({ to: "/dashboard", replace: true });
    else if (user && !profile) navigate({ to: "/onboarding", replace: true });
  }, [user, profile, isAdmin, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") await signIn(email, password);
      else if (mode === "signup") await signUp(email, password);
      else {
        await resetPassword(email);
        setInfo("Password reset email sent. Check your inbox.");
      }
    } catch (err) {
      setError((err as Error).message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInGoogle();
    } catch (err) {
      setError((err as Error).message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="h-10 w-10 rounded-xl gradient-hero grid place-items-center shadow-glow">
          <Dumbbell className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-xl">Daniyal Fitness</span>
      </Link>

      <div className="glass-strong rounded-3xl p-6 w-full max-w-sm shadow-card">
        <h1 className="text-2xl font-bold mb-1">
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signin"
            ? "Sign in to continue tracking."
            : mode === "signup"
              ? "Start your journey in 30 seconds."
              : "We'll email you a reset link."}
        </p>

        {!configured && (
          <div className="mb-4 flex gap-2 rounded-2xl bg-warning/15 border border-warning/30 p-3 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
            <div>
              <strong>Firebase not configured.</strong> Copy <code>.env.example</code> to <code>.env</code> and add your Firebase web config, then reload.
            </div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-2xl bg-input/60 border border-border pl-10 pr-4 py-3 text-sm outline-none focus:border-primary transition"
              />
            </div>
          </label>
          {mode !== "reset" && (
            <label className="block">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-2xl bg-input/60 border border-border pl-10 pr-4 py-3 text-sm outline-none focus:border-primary transition"
                />
              </div>
            </label>
          )}

          {error && <div className="text-xs text-destructive">{error}</div>}
          {info && <div className="text-xs text-success">{info}</div>}

          <button
            type="submit"
            disabled={busy || !configured}
            className="w-full rounded-2xl gradient-hero text-primary-foreground py-3 font-semibold shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
        </form>

        {mode !== "reset" && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              or
              <div className="flex-1 h-px bg-border" />
            </div>
            <button
              onClick={google}
              disabled={busy || !configured}
              className="w-full glass rounded-2xl py-3 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        <div className="mt-6 text-center text-xs text-muted-foreground space-y-2">
          {mode === "signin" && (
            <>
              <button onClick={() => setMode("reset")} className="hover:text-foreground">Forgot password?</button>
              <div>
                No account?{" "}
                <button onClick={() => setMode("signup")} className="font-medium text-primary">Sign up</button>
              </div>
            </>
          )}
          {mode === "signup" && (
            <div>
              Have an account?{" "}
              <button onClick={() => setMode("signin")} className="font-medium text-primary">Sign in</button>
            </div>
          )}
          {mode === "reset" && (
            <button onClick={() => setMode("signin")} className="font-medium text-primary">Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}
