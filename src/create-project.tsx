import { ActionPanel, Form, Action, showToast, Toast, Icon, useNavigation } from "@raycast/api";
import { useForm } from "@raycast/utils";
import type { Project } from "./types";
import { useActiveProfile } from "./hooks/useActiveProfile";

interface CreateProjectFormValues {
  name: string;
  description?: string;
}

interface CreateProjectCommandProps {
  onProjectCreated?: (projectId: string) => void; // Make it optional for the main command
}

export default function CreateProjectCommand(props: CreateProjectCommandProps) {
  const { pop } = useNavigation();
  const { activeProfileApiKey, isLoadingProfileDetails } = useActiveProfile();

  const { handleSubmit, itemProps } = useForm<CreateProjectFormValues>({
    onSubmit: async (values) => {
      if (!activeProfileApiKey) {
        showToast(Toast.Style.Failure, "API Key not available. Please set it in Preferences or manage profiles.");
        return;
      }

      if (!values.name.trim()) {
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
            Authorization: `Bearer ${activeProfileApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to create project: ${errorData.error?.message || response.statusText}`);
        }

        const newProject: Project = await response.json();

        toast.style = Toast.Style.Success;
        toast.title = "Project Created";
        toast.message = `Project \"${newProject.name}\" created successfully!`;

        if (props.onProjectCreated) {
          props.onProjectCreated(newProject.id);
        }
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
      isLoading={isLoadingProfileDetails}
    >
      <Form.TextField title="Project Name" placeholder="e.g., My New Awesome Project" {...itemProps.name} />
      <Form.TextArea
        title="Description (Optional)"
        placeholder="Brief description of the project"
        {...itemProps.description}
      />
    </Form>
  );
}
