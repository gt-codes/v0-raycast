import { ActionPanel, Action, showToast, Toast, Form, useNavigation } from "@raycast/api";
import { useForm } from "@raycast/utils";
import type { CreateMessageRequest } from "../types";
import ChatDetail from "./ChatDetail";
import { useActiveProfile } from "../hooks/useActiveProfile";

interface FormValues {
  message: string;
  modelId?: "v0-1.5-sm" | "v0-1.5-md" | "v0-1.5-lg";
  imageGenerations?: boolean;
  thinking?: boolean;
}

interface AddMessageProps {
  chatId: string;
  chatTitle?: string;
  revalidateChats: () => void;
}

export default function AddMessage({ chatId, chatTitle, revalidateChats }: AddMessageProps) {
  const { push } = useNavigation();
  const { activeProfileApiKey, isLoadingProfileDetails } = useActiveProfile();

  const { handleSubmit, itemProps } = useForm<FormValues>({
    onSubmit: async (values) => {
      if (!activeProfileApiKey) {
        showToast(Toast.Style.Failure, "API Key not available. Please set it in Preferences or manage profiles.");
        return;
      }

      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Sending message...",
      });

      try {
        const requestBody: CreateMessageRequest = {
          message: values.message,
          modelConfiguration: {
            ...(values.modelId && { modelId: values.modelId }),
            ...(typeof values.imageGenerations === "boolean" && { imageGenerations: values.imageGenerations }),
            ...(typeof values.thinking === "boolean" && { thinking: values.thinking }),
          },
        };

        // Remove modelConfiguration if it's empty
        if (requestBody.modelConfiguration && Object.keys(requestBody.modelConfiguration).length === 0) {
          delete requestBody.modelConfiguration;
        }

        const response = await fetch(`https://api.v0.dev/v1/chats/${chatId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeProfileApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.statusText}`);
        }

        await response.json();

        toast.style = Toast.Style.Success;
        toast.title = "Message Sent";
        toast.message = "Your message has been sent successfully!";

        // Push back to the chat detail to show the new message
        push(<ChatDetail chatId={chatId} />);

        revalidateChats();

        return;
      } catch (error) {
        toast.style = Toast.Style.Failure;
        toast.title = "Send Failed";
        toast.message = error instanceof Error ? error.message : "Failed to send message";
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

  const displayTitle = chatTitle || "Untitled Chat"; // Use chatTitle prop

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Send Message" onSubmit={handleSubmit} />
        </ActionPanel>
      }
      isLoading={isLoadingProfileDetails}
    >
      <Form.TextArea
        {...itemProps.message}
        title="Message"
        placeholder="Describe what you want to build or ask a question..."
        info="Your message to v0. This will continue the conversation."
      />
      <Form.Dropdown
        id="modelId"
        title="Model"
        value={itemProps.modelId.value || ""}
        onChange={(newValue) =>
          itemProps.modelId.onChange?.(newValue as "v0-1.5-sm" | "v0-1.5-md" | "v0-1.5-lg" | undefined)
        }
      >
        <Form.Dropdown.Item value="v0-1.5-sm" title="v0-1.5-sm" />
        <Form.Dropdown.Item value="v0-1.5-md" title="v0-1.5-md" />
        <Form.Dropdown.Item value="v0-1.5-lg" title="v0-1.5-lg" />
      </Form.Dropdown>
      <Form.Dropdown id="chat" defaultValue={displayTitle} title="Chat" info="Your message will be sent to this chat.">
        <Form.Dropdown.Item value={displayTitle} title={displayTitle} />
      </Form.Dropdown>
      {/* <Form.Checkbox label="Image Generations" {...itemProps.imageGenerations} />
      <Form.Checkbox label="Thinking" {...itemProps.thinking} /> */}
    </Form>
  );
}
