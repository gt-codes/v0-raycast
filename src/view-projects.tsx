import { List, Detail, Icon } from "@raycast/api";
import { useProjects } from "./hooks/useProjects";
import { useState, useEffect } from "react";
import { ScopeDropdown } from "./components/ScopeDropdown";
import { useActiveProfile } from "./hooks/useActiveProfile";
import { useFetch } from "@raycast/utils";
import type { FindScopesResponse } from "./types";

export default function ViewProjectsCommand() {
  const { activeProfileApiKey, activeProfileDefaultScope, isLoadingProfileDetails } = useActiveProfile();

  const [selectedScope, setSelectedScope] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedScope && activeProfileDefaultScope !== null && !isLoadingProfileDetails) {
      setSelectedScope(activeProfileDefaultScope);
    }
  }, [activeProfileDefaultScope, selectedScope, isLoadingProfileDetails]);

  const { projects, isLoadingProjects, projectError } = useProjects(selectedScope);

  const { isLoading: isLoadingScopes, data: scopesData } = useFetch<FindScopesResponse>(
    activeProfileApiKey ? "https://api.v0.dev/v1/user/scopes" : "",
    {
      headers: {
        Authorization: `Bearer ${activeProfileApiKey}`,
        "Content-Type": "application/json",
      },
      parseResponse: (response) => response.json(),
      execute: !!activeProfileApiKey, // Only execute if apiKey is available
    },
  );

  if (projectError) {
    return <Detail markdown={`Error: ${projectError.message}`} />;
  }

  if (isLoadingProjects || isLoadingProfileDetails || isLoadingScopes) {
    return (
      <List navigationTitle="v0 Projects">
        <List.EmptyView title="Loading..." description="Fetching your projects..." />
      </List>
    );
  }

  return (
    <List
      navigationTitle="v0 Projects"
      searchBarPlaceholder="Search projects..."
      searchBarAccessory={
        <ScopeDropdown
          selectedScope={selectedScope}
          onScopeChange={setSelectedScope}
          availableScopes={scopesData?.data || []}
          isLoadingScopes={isLoadingScopes}
        />
      }
    >
      {projects.map((project) => (
        <List.Item
          key={project.id}
          icon={Icon.Tag}
          title={project.name}
          accessories={[{ text: `ID: ${project.id}` }]}
        />
      ))}
    </List>
  );
}
