import { ActionPanel, Form, Action, showToast, Toast, Icon, useNavigation } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { ensureApiKey } from "./lib/ensureApiKey";
import type { Project } from "./types";

interface CreateProjectFormValues {
  name: string;
  description?: string;
  // Add other fields as per API docs if needed, e.g., framework, icon, environmentVariables, instructions
}

export default function CreateProjectCommand() {
  const apiKey = ensureApiKey();
  const { pop } = useNavigation();

  const { handleSubmit, itemProps } = useForm<CreateProjectFormValues>({
    onSubmit: async (values) => {
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Creating project...",
      });

      try {
        const requestBody = {
          name: values.name,
          description: values.description,
          // Include other fields if added to form
        };

        const response = await fetch("https://api.v0.dev/v1/projects", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to create project: ${errorData.error?.message || response.statusText}`);
        }

        const newProject: Project = await response.json();

        toast.style = Toast.Style.Success;
        toast.title = "Project Created";
        toast.message = `Project "${newProject.name}" created successfully!`;
        pop(); // Go back to the previous view (e.g., project list or chat list)
      } catch (error) {
        toast.style = Toast.Style.Failure;
        toast.title = "Project Creation Failed";
        toast.message = error instanceof Error ? error.message : "Failed to create project";
      }
    },
    validation: {
      name: (value) => {
        if (!value || value.length === 0) {
          return "Project name is required";
        }
      },
    },
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Project" onSubmit={handleSubmit} icon={Icon.PlusCircle} />
        </ActionPanel>
      }
    >
      <Form.TextField {...itemProps.name} title="Project Name" placeholder="e.g., My New Awesome Project" />
      <Form.TextArea
        {...itemProps.description}
        title="Description (Optional)"
        placeholder="Brief description of the project"
      />
      {/* Add other Form fields for framework, icon, etc. if desired */}
    </Form>
  );
}
