import { ActionPanel, Action, showToast, Toast, Form, useNavigation } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { ensureApiKey } from "./lib/ensureApiKey";
import type { CreateChatRequest } from "./types";
import ViewChats from "./view-chats";

interface FormValues {
  message: string;
  system?: string;
  chatPrivacy: string;
}

export default function Command() {
  const apiKey = ensureApiKey();
  const { push } = useNavigation();

  const { handleSubmit, itemProps } = useForm<FormValues>({
    onSubmit: async (values) => {
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Creating chat...",
      });

      try {
        const requestBody: CreateChatRequest = {
          message: values.message,
          chatPrivacy: values.chatPrivacy as "public" | "private" | "team-edit" | "team" | "unlisted",
          ...(values.system && { system: values.system }),
        };

        const response = await fetch("https://api.v0.dev/v1/chats", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to create chat: ${response.statusText}`);
        }

        await response.json();

        toast.style = Toast.Style.Success;
        toast.title = "Chat Created";
        toast.message = "Your new chat has been created successfully!";

        // Push the view-chats component to show the newly created chat
        push(<ViewChats />);

        return;
      } catch (error) {
        toast.style = Toast.Style.Failure;
        toast.title = "Create Failed";
        toast.message = error instanceof Error ? error.message : "Failed to create chat";
        throw error;
      }
    },
    validation: {
      message: (value) => {
        if (!value || value.length === 0) {
          return "Message is required";
        }
        if (value.length > 10000) {
          return "Message is too long (max 10,000 characters)";
        }
      },
    },
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Chat" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Create a new chat with v0. Start by describing what you want to build or ask a question." />

      <Form.TextArea
        {...itemProps.message}
        title="Message"
        placeholder="Describe what you want to build or ask a question..."
        info="Your initial message to v0. This will start the conversation."
      />

      <Form.TextArea
        {...itemProps.system}
        title="System Message (Optional)"
        placeholder="Optional system instructions for v0..."
        info="Additional context or instructions for how v0 should respond."
      />

      <Form.Dropdown title="Privacy" {...itemProps.chatPrivacy}>
        <Form.Dropdown.Item value="private" title="Private" />
        <Form.Dropdown.Item value="public" title="Public" />
        <Form.Dropdown.Item value="team" title="Team" />
        <Form.Dropdown.Item value="team-edit" title="Team (Editable)" />
        <Form.Dropdown.Item value="unlisted" title="Unlisted" />
      </Form.Dropdown>
    </Form>
  );
}
