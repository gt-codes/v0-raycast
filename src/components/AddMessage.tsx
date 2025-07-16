import { ActionPanel, Action, showToast, Toast, Form, useNavigation } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { ensureApiKey } from "../lib/ensureApiKey";
import type { CreateMessageRequest } from "../types";
import ChatDetail from "./ChatDetail";

interface FormValues {
  message: string;
}

interface AddMessageProps {
  chatId: string;
  chatTitle?: string; // Added chatTitle prop
}

export default function AddMessage({ chatId, chatTitle }: AddMessageProps) {
  const apiKey = ensureApiKey();
  const { push } = useNavigation();

  const { handleSubmit, itemProps } = useForm<FormValues>({
    onSubmit: async (values) => {
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Sending message...",
      });

      try {
        const requestBody: CreateMessageRequest = {
          message: values.message,
        };

        const response = await fetch(`https://api.v0.dev/v1/chats/${chatId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
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
    >
      <Form.TextArea
        {...itemProps.message}
        title="Message"
        placeholder="Describe what you want to build or ask a question..."
        info="Your message to v0. This will continue the conversation."
      />
      <Form.Dropdown id="chat" value={displayTitle} title="Chat" info="Your message will be sent to this chat.">
        <Form.Dropdown.Item value={displayTitle} title={displayTitle} />
      </Form.Dropdown>
    </Form>
  );
}
