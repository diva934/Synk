import { FormEvent, useState } from "react";
import { PROFILE_COUNTRIES, PROFILE_GENDERS } from "../lib/matching";
import type { MatchProfile } from "../types";

type DraftProfile = {
  gender: "" | MatchProfile["gender"];
  country: "" | MatchProfile["country"];
};

export default function ProfileSetupPage({
  onComplete,
}: {
  onComplete: (profile: MatchProfile) => void;
}) {
  const [profile, setProfile] = useState<DraftProfile>({ gender: "", country: "" });
  const [error, setError] = useState<string | null>(null);

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile.gender || !profile.country) {
      setError("Choisis ton sexe et ton pays pour continuer.");
      return;
    }

    onComplete(profile as MatchProfile);
  };

  return (
    <div className="app-screen relative flex items-center justify-center overflow-hidden bg-[#050505] px-5 text-white">
      <div className="absolute inset-0 opacity-55 [background:radial-gradient(circle_at_20%_10%,rgba(45,106,222,0.32),transparent_26%),radial-gradient(circle_at_85%_20%,rgba(0,209,255,0.18),transparent_24%),linear-gradient(135deg,#050505,#151515_48%,#050505)]" />

      <div className="relative w-full max-w-[400px] rounded-3xl border border-white/10 bg-[#222]/95 px-6 py-7 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-[#2d6ade] shadow-lg shadow-[#2d6ade]/25">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </div>
          <h1 className="text-3xl font-black leading-tight">Complete ton profil</h1>
          <p className="mx-auto mt-2 max-w-[280px] text-sm font-semibold leading-relaxed text-white/45">
            Derniere etape avant d'entrer sur Random Chat.
          </p>
        </div>

        <form className="space-y-4" onSubmit={submitProfile}>
          <SelectField
            label="Je suis"
            value={profile.gender}
            placeholder="Choisir"
            onChange={(value) => setProfile((current) => ({ ...current, gender: value as DraftProfile["gender"] }))}
            options={PROFILE_GENDERS}
          />
          <SelectField
            label="Mon pays"
            value={profile.country}
            placeholder="Choisir"
            onChange={(value) => setProfile((current) => ({ ...current, country: value as DraftProfile["country"] }))}
            options={PROFILE_COUNTRIES}
          />

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-[#2d6ade] px-4 py-3.5 font-black text-white transition hover:opacity-90 active:scale-[0.98]"
          >
            Continuer
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
        className="w-full rounded-2xl border border-white/10 bg-[#161616] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#2d6ade]"
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
