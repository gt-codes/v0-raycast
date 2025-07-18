import { List, Icon, Color, Detail, ActionPanel, Action } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import type { ChatDetailResponse } from "../types";
import AddMessage from "./AddMessage";
import { useActiveProfile } from "../hooks/useActiveProfile";

export default function ChatDetail({ chatId }: { chatId: string }) {
  const { activeProfileApiKey, isLoadingProfileDetails } = useActiveProfile();

  const { isLoading, data, error, mutate } = useFetch<ChatDetailResponse>(
    activeProfileApiKey ? `https://api.v0.dev/v1/chats/${chatId}` : "",
    {
      headers: {
        Authorization: `Bearer ${activeProfileApiKey}`,
        "Content-Type": "application/json",
      },
      parseResponse: (response) => response.json(),
      execute: !!activeProfileApiKey && !isLoadingProfileDetails,
    },
  );

  if (error) {
    return <Detail markdown={`# Error\n\n${error.message}`} />;
  }

  if (isLoading || isLoadingProfileDetails) {
    return (
      <List navigationTitle="Chat Detail">
        <List.EmptyView title="Loading..." description="Fetching chat messages..." />
      </List>
    );
  }

  const isUserMessage = (messageType: string) => {
    // Only "message" type is from the user, all other types are v0 responses
    return messageType === "message";
  };

  const getMessageIcon = (messageType: string) => {
    if (isUserMessage(messageType)) {
      return { source: Icon.Person, tintColor: Color.Blue };
    }
    return { source: Icon.Cog, tintColor: Color.Green };
  };

  const getMessageTitle = (messageType: string) => {
    if (isUserMessage(messageType)) {
      return "You";
    }
    return "v0";
  };

  const getMessagePreview = (content: string) => {
    // Truncate long messages for preview
    const maxLength = 100;
    if (content.length <= maxLength) {
      return content;
    }
    return `${content.substring(0, maxLength)}...`;
  };

  return (
    <List
      navigationTitle={data?.title || "Untitled Chat"}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Push
              title="Add Message"
              target={<AddMessage chatId={chatId} revalidateChats={mutate} />}
              icon={Icon.Plus}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    >
      {data?.messages.map((message) => (
        <List.Item
          key={message.id}
          icon={getMessageIcon(message.type)}
          title={getMessageTitle(message.type)}
          subtitle={getMessagePreview(message.content)}
          accessories={[
            {
              text: new Date(message.createdAt).toLocaleTimeString(),
              tooltip: "Message timestamp",
            },
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Full Message"
                target={
                  <Detail
                    markdown={`# ${getMessageTitle(message.type)}

**Sent at:** ${new Date(message.createdAt).toLocaleString()}
**Type:** ${message.type}

---

${message.content}`}
                  />
                }
                icon={Icon.Eye}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
