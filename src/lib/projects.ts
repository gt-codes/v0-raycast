import { useFetch } from "@raycast/utils";
import { ensureApiKey } from "./ensureApiKey";
import { ensureDefaultScope } from "./ensureDefaultScope";
import type { FindProjectsResponse } from "../types";

export function useProjects(scope: string | null = null) {
  const apiKey = ensureApiKey();
  const defaultScope = ensureDefaultScope();

  const headers: HeadersInit = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const activeScope = scope || defaultScope;

  if (activeScope) {
    headers["X-Scope"] = activeScope;
  }

  const { isLoading, data, error, revalidate } = useFetch<FindProjectsResponse>("https://api.v0.dev/v1/projects", {
    headers,
    parseResponse: (response) => response.json(),
  });

  return {
    projects: data?.data || [],
    isLoadingProjects: isLoading,
    projectError: error,
    revalidateProjects: revalidate,
  };
}
