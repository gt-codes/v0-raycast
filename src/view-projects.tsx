import { List, Detail, Icon } from "@raycast/api";
import { useProjects } from "./lib/projects";

export default function ViewProjectsCommand() {
  const { projects, isLoadingProjects, projectError } = useProjects();

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
    <List navigationTitle="v0 Projects" searchBarPlaceholder="Search projects...">
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
