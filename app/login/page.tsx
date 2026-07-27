"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { TasamaWordmark } from "@/components/TopBar";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "signup" ? { name, email, password } : { email, password }
      ),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const json = await res.json().catch(() => null);
      setError(json?.error ?? "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-lavender flex flex-col">
      <header className="h-[52px] shrink-0 bg-primary-deep px-5 flex items-center">
        <TasamaWordmark />
      </header>
      <main className="flex-1 grid place-items-center px-6">
        <div className="w-full max-w-[400px] anim-rise">
          <div className="bg-white rounded-2xl border border-line shadow-xl shadow-primary/5 p-8">
            <h1 className="font-display font-bold text-[24px] text-center">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted text-center mt-1">
              {mode === "login"
                ? "Sign in to your AI workspace."
                : "Your personal AI workspace is created automatically."}
            </p>
            <form onSubmit={submit} className="mt-6 space-y-3">
              {mode === "signup" && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary/60"
                />
              )}
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                autoComplete="email"
                className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary/60"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary/60"
              />
              {error && (
                <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-deep transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy && <Loader2 size={15} className="animate-spin" />}
                {mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="w-full text-center text-sm text-muted hover:text-primary mt-4"
            >
              {mode === "login"
                ? "New here? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </div>
          <div className="text-center text-xs text-muted mt-6 flex items-center justify-center gap-1.5">
            Powered by{" "}
            <span className="font-display font-bold tracking-[0.14em] text-ink">
              TASAMA
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
