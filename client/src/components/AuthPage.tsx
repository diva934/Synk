import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import LogoMark from "./LogoMark";
import { PROFILE_COUNTRIES, PROFILE_GENDERS } from "../lib/matching";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { MatchProfile } from "../types";

type Mode = "sign-in" | "sign-up";
type SignupProfile = {
  gender: "" | MatchProfile["gender"];
  country: "" | MatchProfile["country"];
};

const pendingEmailKey = "randomchat:pending-email";
const signupSuccessKey = "randomchat:signup-success-pending";

function getRedirectUrl() {
  return `${window.location.origin}/`;
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("sign-up");
  const [email, setEmail] = useState(() => localStorage.getItem(pendingEmailKey) || "");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<SignupProfile>({ gender: "", country: "" });
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

    if (isSignUp && (!profile.gender || !profile.country)) {
      setError("Renseigne ton sexe et ton pays pour créer ton compte.");
      return;
    }

    setLoading(true);
    localStorage.setItem(pendingEmailKey, email);

    const credentials = {
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          gender: profile.gender,
          country: profile.country,
        },
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
      localStorage.setItem(signupSuccessKey, "true");
      setMode("sign-in");
      setMessage("Compte créé. Vérifiez votre email, puis revenez vous connecter ici.");
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("Supabase n'est pas encore configuré.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });

    setLoading(false);

    if (authError) {
      localStorage.removeItem(signupSuccessKey);
      setError(authError.message);
    }
  };

  return (
    <div className="app-screen flex items-center justify-center bg-[#111] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161616] p-6 shadow-2xl">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark className="h-12 w-12 flex-shrink-0" />
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

        {isSignUp ? (
          <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-[#1e1e1e] p-3">
            <SelectField
              label="Je suis"
              value={profile.gender}
              placeholder="Choisir"
              onChange={(value) =>
                setProfile((current) => ({ ...current, gender: value as SignupProfile["gender"] }))
              }
              options={PROFILE_GENDERS}
            />
            <SelectField
              label="Mon pays"
              value={profile.country}
              placeholder="Choisir"
              onChange={(value) =>
                setProfile((current) => ({ ...current, country: value as SignupProfile["country"] }))
              }
              options={PROFILE_COUNTRIES}
            />
          </div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <OAuthButton
                label="Google"
                disabled={loading || !isSupabaseConfigured}
                onClick={() => void handleOAuth("google")}
                icon={<GoogleIcon />}
              />
              <OAuthButton
                label="Apple"
                disabled={loading || !isSupabaseConfigured}
                onClick={() => void handleOAuth("apple")}
                icon={<AppleIcon />}
              />
            </div>

            <div className="mb-5 flex items-center gap-3 text-xs text-white/30">
              <span className="h-px flex-1 bg-white/10" />
              <span>ou</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
          </>
        )}

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

function SelectField<T extends string>({
  label,
  value,
  placeholder,
  onChange,
  options,
}: {
  label: string;
  value: T;
  placeholder?: string;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/60">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        required
        className="w-full rounded-xl border border-white/10 bg-[#161616] px-3 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#2d6ade]"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function OAuthButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-[#111] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.54c-.02-2.28 1.86-3.37 1.94-3.42-1.06-1.55-2.71-1.76-3.29-1.79-1.4-.14-2.73.82-3.44.82-.71 0-1.8-.8-2.96-.78-1.52.02-2.92.88-3.71 2.24-1.58 2.74-.4 6.79 1.14 9.01.75 1.09 1.65 2.31 2.83 2.27 1.13-.05 1.56-.73 2.93-.73s1.76.73 2.96.71c1.22-.02 1.99-1.11 2.74-2.2.86-1.26 1.22-2.48 1.24-2.54-.03-.01-2.36-.9-2.38-3.59z" />
      <path d="M14.79 5.86c.62-.75 1.04-1.8.93-2.86-.9.04-1.99.6-2.64 1.35-.58.67-1.09 1.74-.95 2.76 1 .08 2.03-.51 2.66-1.25z" />
    </svg>
  );
}
