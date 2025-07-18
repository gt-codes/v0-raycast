import { List, Icon, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { ensureApiKey } from "../lib/ensureApiKey";

interface ScopeSummary {
  id: string;
  object: "scope";
  name?: string;
}

interface FindScopesResponse {
  object: "list";
  data: ScopeSummary[];
}

interface ScopeDropdownProps {
  selectedScope: string | null;
  onScopeChange: (newScope: string | null) => void;
}

export function ScopeDropdown({ selectedScope, onScopeChange }: ScopeDropdownProps) {
  const apiKey = ensureApiKey();
  const {
    isLoading: isLoadingScopes,
    data: scopesData,
    error: scopesError,
  } = useFetch<FindScopesResponse>("https://api.v0.dev/v1/user/scopes", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    parseResponse: (response) => response.json(),
  });

  if (scopesError) {
    showToast(Toast.Style.Failure, "Failed to load scopes", scopesError.message);
    return null;
  }

  if (isLoadingScopes) {
    return (
      <List.Dropdown
        id="scopeFilter"
        tooltip="Filter by Scope"
        value={selectedScope || "all"}
        onChange={() => {}}
        storeValue
      >
        <List.Dropdown.Item value="all" title="Loading Scopes..." icon={Icon.Hourglass} />
      </List.Dropdown>
    );
  }

  return (
    <List.Dropdown
      id="scopeFilter"
      tooltip="Filter by Scope"
      value={selectedScope || "all"}
      onChange={(newValue) => onScopeChange(newValue === "all" ? null : newValue)}
      storeValue
    >
      <List.Dropdown.Item value="all" title="All Scopes" icon={Icon.Globe} />
      {scopesData?.data.map((scope: ScopeSummary) => (
        <List.Dropdown.Item key={scope.id} value={scope.id} title={scope.name || "Untitled Scope"} />
      ))}
    </List.Dropdown>
  );
}
