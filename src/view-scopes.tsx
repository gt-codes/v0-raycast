import { List, Detail, Icon, ActionPanel, Action } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { ensureApiKey } from "./lib/ensureApiKey";

interface ScopeSummary {
  id: string;
  object: "scope";
  name?: string;
}

interface FindScopesResponse {
  object: "list";
  data: ScopeSummary[];
}

export default function ViewScopesCommand() {
  const apiKey = ensureApiKey();

  const { isLoading, data, error } = useFetch<FindScopesResponse>("https://api.v0.dev/v1/user/scopes", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    parseResponse: (response) => response.json(),
  });

  if (error) {
    return <Detail markdown={`Error: ${error.message}`} />;
  }

  if (isLoading) {
    return (
      <List navigationTitle="v0 User Scopes">
        <List.EmptyView title="Loading..." description="Fetching your user scopes..." />
      </List>
    );
  }

  return (
    <List navigationTitle="v0 User Scopes" searchBarPlaceholder="Search scopes...">
      {data?.data.map((scope: ScopeSummary) => (
        <List.Item
          key={scope.id}
          icon={Icon.Tag}
          title={scope.name || "Untitled Scope"}
          accessories={[{ text: `ID: ${scope.id}` }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy ID" content={scope.id} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
