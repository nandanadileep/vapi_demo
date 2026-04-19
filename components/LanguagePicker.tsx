"use client";

const LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "ml-IN", label: "മലയാളം" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
] as const;

export type LanguagePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Preferred language"
      className="grid grid-cols-2 gap-2 sm:gap-3"
    >
      {LANGUAGES.map((lang) => {
        const selected = value === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(lang.code)}
            className={`language-picker-pill-script rounded-full border px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-primary focus-visible:ring-offset-2 ${
              selected
                ? "border-teal-primary bg-teal-primary text-white"
                : "border-teal-primary bg-white text-teal-primary hover:bg-teal-primary/5"
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
