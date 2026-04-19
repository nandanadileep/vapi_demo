import OPENINGS from "./openings";
import { CORE_PROMPT } from "./core";

function applyOpeningTemplate(
  template: string,
  name: string,
  clinicName: string,
): string {
  return template
    .replaceAll("{{name}}", name)
    .replaceAll("{{clinic_name}}", clinicName);
}

function applyCoreTemplate(
  template: string,
  params: {
    clinicName: string;
    clinicCity: string;
    clinicPhone: string;
    languagePreference: string;
  },
): string {
  return template
    .replaceAll("{{clinic_name}}", params.clinicName)
    .replaceAll("{{clinic_city}}", params.clinicCity)
    .replaceAll("{{clinic_phone}}", params.clinicPhone)
    .replaceAll("{{language_preference}}", params.languagePreference);
}

/**
 * Builds the full system prompt: localized opening plus shared {@link CORE_PROMPT} with clinic and patient context.
 *
 * @throws Never throws; missing language falls back to Hindi opening.
 */
export function assemblePrompt(params: {
  name: string;
  concern: string | null;
  languagePreference: string;
  clinicName: string;
  clinicCity: string;
  clinicPhone: string;
}): string {
  const openingTemplate =
    OPENINGS[params.languagePreference] ?? OPENINGS["hi-IN"];
  const opening = applyOpeningTemplate(
    openingTemplate,
    params.name,
    params.clinicName,
  );

  let core = applyCoreTemplate(CORE_PROMPT, {
    clinicName: params.clinicName,
    clinicCity: params.clinicCity,
    clinicPhone: params.clinicPhone,
    languagePreference: params.languagePreference,
  });

  if (params.concern) {
    core += `\n# PATIENT CONTEXT\nThis patient reached out about: ${params.concern}\nReference this naturally in conversation — do not repeat it back verbatim.`;
  }

  return `${opening.trim()}\n\n${core.trim()}`;
}
