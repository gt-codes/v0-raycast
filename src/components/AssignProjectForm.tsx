import { ActionPanel, Form, Action, showToast, Toast, Icon } from "@raycast/api";
import { useNavigation } from "@raycast/api";
import { ensureApiKey } from "../lib/ensureApiKey";
import { useProjects } from "../lib/projects";
import { useState } from "react";
import type { ChatSummary, Response as AssignProjectResponse } from "../types";
import CreateProjectForm from "./CreateProjectForm";

interface AssignProjectFormProps {
  chat: ChatSummary;
  revalidateChats: () => void;
}

export default function AssignProjectForm({ chat, revalidateChats }: AssignProjectFormProps) {
  const apiKey = ensureApiKey();
  const { pop } = useNavigation();
  const { projects, isLoadingProjects, projectError, revalidateProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  const assignProject = async (projectIdToAssign: string) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Assigning project...",
    });

    try {
      const response = await fetch(`https://api.v0.dev/v1/projects/${projectIdToAssign}/assign`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId: chat.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to assign project: ${errorData.error?.message || response.statusText}`);
      }

      const result: AssignProjectResponse = await response.json();

      if (result.assigned) {
        toast.style = Toast.Style.Success;
        toast.title = "Project Assigned";
        toast.message = `Project successfully assigned to "${chat.title || "Untitled Chat"}".`;
        revalidateChats(); // Revalidate chats to show the assigned project
        pop(); // Go back to the chat list
      } else {
        throw new Error("Project assignment failed.");
      }
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Assignment Failed";
      toast.message = error instanceof Error ? error.message : "Failed to assign project";
    }
  };

  const handleSubmit = () => {
    if (selectedProjectId) {
      assignProject(selectedProjectId);
    } else {
      showToast(Toast.Style.Failure, "Please select a project.");
    }
  };

  const handleNewProjectCreated = (newProjectId: string) => {
    revalidateProjects(); // Refresh the list of projects
    assignProject(newProjectId); // Automatically assign the new project to the chat
  };

  if (projectError) {
    return (
      <Form>
        <Form.Description title="Error" text={`Failed to load projects: ${projectError.message}`} />
      </Form>
    );
  }

  return (
    <Form
      isLoading={isLoadingProjects}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Assign Selected Project" onSubmit={handleSubmit} icon={Icon.Tag} />
          <Action.Push
            title="Create New Project"
            icon={Icon.PlusCircle}
            target={<CreateProjectForm onProjectCreated={handleNewProjectCreated} />}
            shortcut={{ modifiers: ["cmd", "shift"], key: "n" }}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="projectId"
        title="Select Project"
        value={selectedProjectId}
        onChange={setSelectedProjectId}
        isLoading={isLoadingProjects}
      >
        {projects.length === 0 && !isLoadingProjects ? (
          <Form.Dropdown.Item value="no-projects" title="No projects found" />
        ) : (
          projects.map((project) => <Form.Dropdown.Item key={project.id} value={project.id} title={project.name} />)
        )}
      </Form.Dropdown>
    </Form>
  );
}
