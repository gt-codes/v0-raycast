import { ActionPanel, Form, Action, showToast, Toast, Icon } from "@raycast/api";
import { useNavigation } from "@raycast/api";
import { ensureApiKey } from "../lib/ensureApiKey";
import { useState } from "react";
import type { CreateProjectResponse } from "../types";

interface CreateProjectFormProps {
  onProjectCreated: (projectId: string) => void;
}

export default function CreateProjectForm({ onProjectCreated }: CreateProjectFormProps) {
  const apiKey = ensureApiKey();
  const { pop } = useNavigation();
  const [projectName, setProjectName] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");

  const createProject = async () => {
    if (!projectName.trim()) {
      showToast(Toast.Style.Failure, "Project name cannot be empty.");
      return;
    }

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Creating project...",
    });

    try {
      const response = await fetch("https://api.v0.dev/v1/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create project: ${errorData.error?.message || response.statusText}`);
      }

      const newProject: CreateProjectResponse = await response.json();
      toast.style = Toast.Style.Success;
      toast.title = "Project Created";
      toast.message = `Project "${newProject.name}" created successfully.`;
      onProjectCreated(newProject.id);
      pop(); // Go back to the previous form (AssignProjectForm)
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Creation Failed";
      toast.message = error instanceof Error ? error.message : "Failed to create project";
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Project" onSubmit={createProject} icon={Icon.PlusCircle} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="projectName"
        title="Project Name"
        placeholder="Enter project name"
        value={projectName}
        onChange={setProjectName}
      />
      <Form.TextArea
        id="projectDescription"
        title="Project Description (Optional)"
        placeholder="Enter project description"
        value={projectDescription}
        onChange={setProjectDescription}
      />
    </Form>
  );
}
