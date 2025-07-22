import { List, Icon, Color, Detail, ActionPanel, Action } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import type { ChatDetailResponse, ChatMetadataResponse } from "../types";
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

  const {
    isLoading: isLoadingMetadata,
    data: metadata,
    error: metadataError,
  } = useFetch<ChatMetadataResponse>(activeProfileApiKey ? `https://api.v0.dev/v1/chats/${chatId}/metadata` : "", {
    headers: {
      Authorization: `Bearer ${activeProfileApiKey}`,
    },
    parseResponse: (response) => response.json(),
    execute: !!activeProfileApiKey && !isLoadingProfileDetails,
  });

  if (error || metadataError) {
    return <Detail markdown={`# Error\n\n${error?.message || metadataError?.message}`} />;
  }

  if (isLoading || isLoadingProfileDetails || isLoadingMetadata) {
    return (
      <List navigationTitle="Chat Detail">
        <List.EmptyView title="Loading..." description="Fetching chat messages and metadata..." />
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
    // Remove <Thinking>...</Thinking>, <CodeProject>...</CodeProject> and <Actions>...</Actions> tags
    let formattedContent = content.replace(/<Thinking>[\s\S]*?<\/Thinking>/g, "");
    formattedContent = formattedContent.replace(/<CodeProject[^>]*>[\s\S]*?<\/CodeProject>/g, "");
    formattedContent = formattedContent.replace(/<Actions>[\s\S]*?<\/Actions>/g, "");
    return formattedContent.trim();
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
                      markdown={formatMessageContent(message.content)}
                      metadata={
                        <Detail.Metadata>
                          <Detail.Metadata.Label title="Sent at" text={new Date(message.createdAt).toLocaleString()} />
                          <Detail.Metadata.Label title="From" text={`${message.role === "user" ? "You" : "v0"}`} />
                          <Detail.Metadata.Label title="Type" text={message.type} />
                          {metadata?.project?.name && (
                            <Detail.Metadata.Link
                              title="Project"
                              text={metadata.project.name}
                              target={metadata.project.url || ""}
                            />
                          )}
                          {metadata?.git?.branch && (
                            <Detail.Metadata.Label title="Git Branch" text={metadata.git.branch} />
                          )}
                          {metadata?.git?.commit && (
                            <Detail.Metadata.Label title="Git Commit" text={metadata.git.commit} />
                          )}
                          {metadata?.deployment?.id && (
                            <Detail.Metadata.Label title="Deployment ID" text={metadata.deployment.id} />
                          )}
                        </Detail.Metadata>
                      }
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
