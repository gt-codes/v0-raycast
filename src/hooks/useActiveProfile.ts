import { useState, useEffect } from "react";
import { getActiveProfileDetails } from "../lib/profile-utils";

interface ActiveProfileHookResult {
  activeProfileApiKey: string | undefined;
  activeProfileDefaultScope: string | null;
  isLoadingProfileDetails: boolean;
}

export function useActiveProfile(): ActiveProfileHookResult {
  const [activeProfileApiKey, setActiveProfileApiKey] = useState<string | undefined>(undefined);
  const [activeProfileDefaultScope, setActiveProfileDefaultScope] = useState<string | null>(null);
  const [isLoadingProfileDetails, setIsLoadingProfileDetails] = useState(true);

  useEffect(() => {
    async function fetchProfileDetails() {
      const { apiKey, defaultScope } = await getActiveProfileDetails();
      setActiveProfileApiKey(apiKey);
      setActiveProfileDefaultScope(defaultScope);
      setIsLoadingProfileDetails(false);
    }
    fetchProfileDetails();
  }, []);

  return { activeProfileApiKey, activeProfileDefaultScope, isLoadingProfileDetails };
}
