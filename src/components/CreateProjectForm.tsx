import { ActionPanel, Form, Action, showToast, Toast, Icon } from "@raycast/api";
import { useNavigation } from "@raycast/api";
import type { CreateProjectResponse } from "../types";
import { useActiveProfile } from "../hooks/useActiveProfile";
import { useForm, FormValidation } from "@raycast/utils"; // Import useForm and FormValidation

interface CreateProjectFormProps {
  onProjectCreated: (projectId: string) => void;
}

interface CreateProjectFormValues {
  name: string;
  description?: string;
}

export default function CreateProjectForm({ onProjectCreated }: CreateProjectFormProps) {
  const { pop } = useNavigation();
  const { activeProfileApiKey, isLoadingProfileDetails } = useActiveProfile();

  const { handleSubmit, itemProps } = useForm<CreateProjectFormValues>({
    onSubmit: async (values) => {
      if (!activeProfileApiKey) {
        showToast(Toast.Style.Failure, "API Key not available. Please set it in Preferences or manage profiles.");
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
    },
    validation: {
      name: FormValidation.Required,
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
      <Form.TextField title="Project Name" placeholder="Enter project name" {...itemProps.name} />
      <Form.TextArea
        title="Project Description (Optional)"
        placeholder="Enter project description"
        {...itemProps.description}
      />
    </Form>
  );
}
