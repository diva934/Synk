import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const pendingEmailKey = "randomchat:pending-email";
const signupSuccessKey = "randomchat:signup-success-pending";

function getRedirectUrl() {
  return `${window.location.origin}/`;
}

function formatAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("unsupported provider") || lower.includes("provider is not enabled")) {
    return "Connexion Google pas encore activee dans Supabase. Active le provider Google dans Authentication > Providers.";
  }

  if (lower.includes("unable to exchange code") || lower.includes("unexpected_failure")) {
    return "Google est active, mais Supabase n'arrive pas a valider le code Google. Verifie le Client Secret complet dans Supabase et l'URL de redirection Google.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }

  return message;
}

export default function AuthPage() {
  const [email, setEmail] = useState(() => localStorage.getItem(pendingEmailKey) || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);

  const redirectUrl = useMemo(() => getRedirectUrl(), []);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const search = new URLSearchParams(window.location.search);
    const errorDescription = hash.get("error_description") || search.get("error_description");
    const errorCode = hash.get("error_code") || search.get("error_code");

    if (errorDescription) {
      setEmailExpanded(false);
      const decodedError = decodeURIComponent(errorDescription.replace(/\+/g, " "));
      setError(formatAuthError(`${decodedError}${errorCode ? ` (${errorCode})` : ""}`));
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("Supabase n'est pas encore configure.");
      return;
    }

    setLoading(true);
    localStorage.setItem(pendingEmailKey, email);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (!signInError) {
      setLoading(false);
      return;
    }

    if (!signInError.message.toLowerCase().includes("invalid login credentials")) {
      setLoading(false);
      setError(formatAuthError(signInError.message));
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(formatAuthError(signUpError.message));
      return;
    }

    localStorage.setItem(signupSuccessKey, "true");
    setMessage("Compte cree. Verifiez votre email, puis revenez vous connecter ici.");
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("Supabase n'est pas encore configure.");
      return;
    }

    localStorage.removeItem(signupSuccessKey);
    setOauthLoading(true);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        scopes: "openid email profile https://www.googleapis.com/auth/userinfo.email",
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    setOauthLoading(false);

    if (authError) {
      setError(formatAuthError(authError.message));
    }
  };

  return (
    <div className="app-screen relative flex items-center justify-center overflow-hidden bg-[#050505] px-5 text-white">
      <div className="absolute inset-0 opacity-55 [background:radial-gradient(circle_at_20%_10%,rgba(45,106,222,0.32),transparent_26%),radial-gradient(circle_at_85%_20%,rgba(0,209,255,0.18),transparent_24%),linear-gradient(135deg,#050505,#151515_48%,#050505)]" />

      <div className="relative w-full max-w-[400px] rounded-3xl border border-white/10 bg-[#222]/95 px-6 py-5 shadow-2xl shadow-black/60 backdrop-blur-xl sm:py-7">
        <span aria-hidden="true" className="absolute right-6 top-5 text-4xl leading-none text-white">
          &times;
        </span>

        <div className="mb-5 pt-5 text-center sm:mb-8 sm:pt-8">
          <h1 className="text-4xl font-black leading-none tracking-normal text-white sm:text-5xl">Random Chat</h1>
          <div className="mt-5 text-3xl font-black leading-none sm:mt-8 sm:text-4xl">195,594</div>
          <p className="mx-auto mt-2 max-w-[260px] text-sm font-bold leading-tight text-white sm:text-base">
            personnes sont en ligne et font des correspondances maintenant !
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour activer la connexion.
          </div>
        )}

        <p className="mx-auto mb-5 max-w-[280px] text-center text-xs font-semibold leading-tight text-white/45">
          Connecte-toi ou cree ton compte en quelques secondes.
        </p>

        <div className="mb-5 space-y-2.5">
          <OAuthButton
            label="Continue with Google"
            disabled={loading || oauthLoading || !isSupabaseConfigured}
            loading={oauthLoading}
            onClick={() => void handleGoogleAuth()}
            icon={<GoogleIcon />}
          />
          <OAuthButton
            label="Continue with Email"
            disabled={loading || oauthLoading || !isSupabaseConfigured}
            onClick={() => setEmailExpanded((current) => !current)}
            icon={<EmailIcon />}
            dark
          />
        </div>

        {emailExpanded && (
          <form className="space-y-4" onSubmit={handleEmailAuth}>
            <label className="block">
              <span className="mb-2 block text-sm text-white/60">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-[#171717] px-4 py-3 text-white outline-none transition focus:border-[#2d6ade]"
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
                className="w-full rounded-2xl border border-white/10 bg-[#171717] px-4 py-3 text-white outline-none transition focus:border-[#2d6ade]"
                placeholder="6 caracteres minimum"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full rounded-full bg-[#2d6ade] px-4 py-3.5 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Continuer"}
            </button>
          </form>
        )}

        {!emailExpanded && error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function OAuthButton({
  label,
  icon,
  disabled,
  onClick,
  loading = false,
  dark = false,
}: {
  label: string;
  icon: ReactNode;
  disabled: boolean;
  onClick: () => void;
  loading?: boolean;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`grid w-full grid-cols-[28px_1fr_28px] items-center rounded-full border px-5 py-3.5 text-base font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
        dark
          ? "border-white/45 bg-transparent text-white hover:bg-white/10"
          : "border-white bg-white text-[#202020] hover:bg-white/90"
      }`}
    >
      <span className="flex items-center justify-center">
        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current" /> : icon}
      </span>
      <span className="text-center">{loading ? "Connexion..." : label}</span>
      <span />
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

function EmailIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="m5 7 7 6 7-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
