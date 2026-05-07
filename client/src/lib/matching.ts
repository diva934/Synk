import type { Country, Gender, MatchProfile, MatchingPreferences } from "../types";

export const DEFAULT_MATCH_PROFILE: MatchProfile = {
  gender: "male",
  country: "FR",
};

export const DEFAULT_MATCHING: MatchingPreferences = {
  profile: DEFAULT_MATCH_PROFILE,
  filters: { gender: "any", country: "any" },
};

export const COUNTRIES: Array<{ value: Country; label: string }> = [
  { value: "any", label: "Tous les pays" },
  { value: "FR", label: "France" },
  { value: "BE", label: "Belgique" },
  { value: "CH", label: "Suisse" },
  { value: "CA", label: "Canada" },
  { value: "US", label: "Etats-Unis" },
  { value: "GB", label: "Royaume-Uni" },
  { value: "DE", label: "Allemagne" },
  { value: "ES", label: "Espagne" },
  { value: "IT", label: "Italie" },
  { value: "MA", label: "Maroc" },
  { value: "DZ", label: "Algerie" },
  { value: "TN", label: "Tunisie" },
];

export const PROFILE_COUNTRIES = COUNTRIES.filter(
  (country): country is { value: MatchProfile["country"]; label: string } => country.value !== "any"
);

export const TARGET_GENDERS: Array<{ value: Gender; label: string }> = [
  { value: "any", label: "Tous" },
  { value: "female", label: "Femme" },
  { value: "male", label: "Homme" },
];

export const PROFILE_GENDERS: Array<{ value: MatchProfile["gender"]; label: string }> = [
  { value: "female", label: "Femme" },
  { value: "male", label: "Homme" },
];

export function sanitizeProfile(input: unknown): MatchProfile {
  if (!input || typeof input !== "object") return DEFAULT_MATCH_PROFILE;

  const profile = input as Partial<Record<keyof MatchProfile, unknown>>;
  const gender = PROFILE_GENDERS.some((option) => option.value === profile.gender)
    ? (profile.gender as MatchProfile["gender"])
    : DEFAULT_MATCH_PROFILE.gender;
  const country = PROFILE_COUNTRIES.some((option) => option.value === profile.country)
    ? (profile.country as MatchProfile["country"])
    : DEFAULT_MATCH_PROFILE.country;

  return { gender, country };
}

export function hasCompleteProfile(input: unknown): input is MatchProfile {
  if (!input || typeof input !== "object") return false;

  const profile = input as Partial<Record<keyof MatchProfile, unknown>>;
  return (
    PROFILE_GENDERS.some((option) => option.value === profile.gender) &&
    PROFILE_COUNTRIES.some((option) => option.value === profile.country)
  );
}
