import { useFetch } from "@raycast/utils";
import { ensureApiKey } from "./ensureApiKey";
import type { FindProjectsResponse } from "../types";

export function useProjects() {
  const apiKey = ensureApiKey();
  const { isLoading, data, error, revalidate } = useFetch<FindProjectsResponse>("https://api.v0.dev/v1/projects", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    parseResponse: (response) => response.json(),
  });

  return {
    projects: data?.data || [],
    isLoadingProjects: isLoading,
    projectError: error,
    revalidateProjects: revalidate,
  };
}
