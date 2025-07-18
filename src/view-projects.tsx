import { List, Detail, Icon } from "@raycast/api";
import { useProjects } from "./lib/projects";
import { useState } from "react";
import { ScopeDropdown } from "./components/ScopeDropdown";
import { ensureDefaultScope } from "./lib/ensureDefaultScope";

export default function ViewProjectsCommand() {
  const defaultScope = ensureDefaultScope();
  const [selectedScope, setSelectedScope] = useState<string | null>(defaultScope);

  const { projects, isLoadingProjects, projectError } = useProjects(selectedScope);

  if (projectError) {
    return <Detail markdown={`Error: ${projectError.message}`} />;
  }

  if (isLoadingProjects) {
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
      searchBarAccessory={<ScopeDropdown selectedScope={selectedScope} onScopeChange={setSelectedScope} />}
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
