"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import SetupNotice from "@/components/SetupNotice";

export default function LoginPage() {
  const { configured, signInWithPassword, signUpWithPassword } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div className="mx-auto max-w-md pt-10">
        <SetupNotice />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signInWithPassword(email, password);
        if (error) {
          setError(error);
        } else {
          router.replace("/learn");
        }
      } else {
        const { error } = await signUpWithPassword(email, password);
        if (error) {
          setError(error);
        } else {
          setInfo(
            "Cuenta creada. Si tu proyecto de Supabase requiere confirmación por email, revisa tu bandeja de entrada."
          );
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-10">
      <h1 className="mb-1 text-2xl font-bold">🇩🇪 Deutschlernen</h1>
      <p className="mb-8 text-sm text-stone-400">
        Tu alemán real, todos los días.
      </p>

      <form
        onSubmit={handleSubmit}
        className="w-full space-y-4 rounded-2xl border border-stone-800 bg-stone-900/50 p-6"
      >
        <div className="flex gap-1 rounded-lg bg-stone-950 p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-md py-1.5 text-sm ${
              mode === "signin" ? "bg-amber-500 text-stone-950" : "text-stone-400"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md py-1.5 text-sm ${
              mode === "signup" ? "bg-amber-500 text-stone-950" : "text-stone-400"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs text-stone-400">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-400">Contraseña</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}
        {info && <p className="text-sm text-emerald-400">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-stone-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {busy ? "Un momento..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
