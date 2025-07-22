import { List, Icon, Color, Detail, ActionPanel, Action } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import type { ChatDetailResponse } from "../types";
import AddMessage from "./AddMessage";
import { useActiveProfile } from "../hooks/useActiveProfile";
import { useState } from "react";

export default function ChatDetail({ chatId }: { chatId: string }) {
  const { activeProfileApiKey, isLoadingProfileDetails } = useActiveProfile();
  const [messageFilter, setMessageFilter] = useState<"all" | "user" | "v0">("all");

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

  const isUserMessage = (messageRole: string) => {
    // Only "message" type is from the user, all other types are v0 responses
    return messageRole === "user";
  };

  const getMessageIcon = (messageRole: string) => {
    if (isUserMessage(messageRole)) {
      return { source: Icon.Person, tintColor: Color.SecondaryText };
    }
    return { source: Icon.Cog, tintColor: Color.SecondaryText };
  };

  const getMessageTitle = (messageRole: string) => {
    if (isUserMessage(messageRole)) {
      return "You";
    }
    return "v0";
  };

  const getMessagePreview = (content: string) => {
    // Truncate long messages for preview
    const maxLength = 100;
    const formattedContent = formatMessageContent(content);
    if (formattedContent.length <= maxLength) {
      return formattedContent;
    }
    return `${formattedContent.substring(0, maxLength)}...`;
  };

  const formatMessageContent = (content: string) => {
    // Remove <Thinking>...</Thinking> tags
    return content.replace(/<Thinking>[\s\S]*?<\/Thinking>/g, "").trim();
  };

  return (
    <List
      navigationTitle={data?.title || "Untitled Chat"}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Message Type"
          onChange={(newValue) => setMessageFilter(newValue as "all" | "user" | "v0")}
          value={messageFilter}
        >
          <List.Dropdown.Item title="All Messages" value="all" icon={Icon.Message} />
          <List.Dropdown.Item title="Your Messages" value="user" icon={Icon.Person} />
          <List.Dropdown.Item title="v0 Messages" value="v0" icon={Icon.Cog} />
        </List.Dropdown>
      }
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
      {data?.messages
        .filter((message) => {
          if (messageFilter === "all") return true;
          return messageFilter === "user" ? isUserMessage(message.role) : !isUserMessage(message.role);
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((message) => (
          <List.Item
            key={message.id}
            // title={getMessageTitle(message.role)}
            title={getMessagePreview(message.content)}
            accessories={[
              { date: new Date(message.createdAt || ""), tooltip: "Message timestamp" },
              {
                icon: getMessageIcon(message.role),
                tooltip: `${message.role === "user" ? "You" : "v0"} sent this message`,
              },
            ]}
            actions={
              <ActionPanel>
                <Action.Push
                  title="View Full Message"
                  target={
                    <Detail
                      markdown={`# ${getMessageTitle(message.role)}

**Sent at:** ${new Date(message.createdAt).toLocaleString()}
**Type:** ${message.type}

---

${formatMessageContent(message.content)}`}
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
