import { getPreferenceValues, openExtensionPreferences } from "@raycast/api";

interface Preferences {
  apiKey: string;
}

export function ensureApiKey() {
  const { apiKey } = getPreferenceValues<Preferences>();

  if (!apiKey) {
    openExtensionPreferences();
    return null;
  }

  return apiKey;
}
