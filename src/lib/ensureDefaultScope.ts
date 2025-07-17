import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  defaultScope?: string;
}

export function ensureDefaultScope() {
  const { defaultScope } = getPreferenceValues<Preferences>();

  return defaultScope || null;
}
