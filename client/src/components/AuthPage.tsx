import { FormEvent, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type Mode = "sign-in" | "sign-up";

const pendingEmailKey = "randomchat:pending-email";

function getRedirectUrl() {
  return `${window.location.origin}/`;
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("sign-up");
  const [email, setEmail] = useState(() => localStorage.getItem(pendingEmailKey) || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "sign-up";
  const redirectUrl = useMemo(() => getRedirectUrl(), []);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errorDescription = hash.get("error_description");

    if (errorDescription) {
      setMode("sign-in");
      setError(errorDescription.replace(/\+/g, " "));
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("Supabase n'est pas encore configuré.");
      return;
    }

    setLoading(true);
    localStorage.setItem(pendingEmailKey, email);

    const credentials = {
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    };

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp(credentials)
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (isSignUp) {
      setMode("sign-in");
      setMessage("Compte créé. Vérifiez votre email, puis revenez vous connecter ici.");
    }
  };

  return (
    <div className="app-screen flex items-center justify-center bg-[#111] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161616] p-6 shadow-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d6ade]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.553-2.069A1 1 0 0121 9.382v5.236a1 1 0 01-1.447.894L15.75 13.5M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">RandomChat</h1>
            <p className="text-sm text-white/45">Compte obligatoire</p>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` pour activer l'inscription.
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 rounded-xl bg-black/30 p-1">
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              isSignUp ? "bg-[#2d6ade] text-white" : "text-white/45 hover:text-white"
            }`}
          >
            Créer un compte
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              !isSignUp ? "bg-[#2d6ade] text-white" : "text-white/45 hover:text-white"
            }`}
          >
            Connexion
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm text-white/60">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-[#1e1e1e] px-4 py-3 text-white outline-none transition focus:border-[#2d6ade]"
              placeholder="vous@email.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-white/60">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-white/10 bg-[#1e1e1e] px-4 py-3 text-white outline-none transition focus:border-[#2d6ade]"
              placeholder="6 caractères minimum"
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="w-full rounded-xl bg-[#2d6ade] px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Chargement..." : isSignUp ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
