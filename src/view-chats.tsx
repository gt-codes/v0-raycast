import { ActionPanel, Detail, List, Action, Icon, Color, showToast, Toast } from "@raycast/api";
import { ensureApiKey } from "./lib/ensureApiKey";
import { useFetch } from "@raycast/utils";
import type { ChatSummary, FindChatsResponse } from "./types";
import ChatDetail from "./components/ChatDetail";
import AddMessage from "./components/AddMessage";

export default function Command() {
  const apiKey = ensureApiKey();
  const { isLoading, data, error, mutate } = useFetch<FindChatsResponse>("https://api.v0.dev/v1/chats", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    parseResponse: (response) => response.json(),
  });

  const deleteChat = async (chatId: string, chatTitle: string) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Deleting chat...",
    });

    try {
      await mutate(
        // API call to delete the chat
        fetch(`https://api.v0.dev/v1/chats/${chatId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }),
        {
          // Optimistically remove the chat from the list immediately
          optimisticUpdate(data) {
            if (!data) return data;
            return {
              ...data,
              data: data.data.filter((chat) => chat.id !== chatId),
            };
          },
          // If the API call fails, the data will be automatically rolled back
          rollbackOnError: true,
        },
      );

      // Success - the chat has been deleted
      toast.style = Toast.Style.Success;
      toast.title = "Chat Deleted";
      toast.message = `"${chatTitle}" has been deleted successfully.`;
    } catch (error) {
      // Failure - the data will be automatically rolled back
      toast.style = Toast.Style.Failure;
      toast.title = "Delete Failed";
      toast.message = error instanceof Error ? error.message : "Failed to delete chat";
    }
  };

  if (error) {
    return <Detail markdown={`Error: ${error.message}`} />;
  }

  if (isLoading) {
    return (
      <List navigationTitle="v0 Chats">
        <List.EmptyView title="Loading..." description="Fetching your chats..." />
      </List>
    );
  }

  const getChatIcon = (chat: ChatSummary) => {
    if (chat.favorite) {
      return { source: Icon.Star, tintColor: Color.Yellow };
    }
    if (chat.latestVersion?.status === "completed") {
      return { source: Icon.CheckCircle, tintColor: Color.Green };
    }
    if (chat.latestVersion?.status === "pending") {
      return { source: Icon.Clock, tintColor: Color.Orange };
    }
    if (chat.latestVersion?.status === "failed") {
      return { source: Icon.XMarkCircle, tintColor: Color.Red };
    }
    return { source: Icon.Message, tintColor: Color.Blue };
  };

  const getChatSubtitle = (chat: ChatSummary) => {
    if (chat.latestVersion?.status) {
      return `Status: ${chat.latestVersion.status}`;
    }
    return "No recent activity";
  };

  return (
    <List navigationTitle="v0 Chats" searchBarPlaceholder="Search your chats...">
      {data?.data.map((chat: ChatSummary) => (
        <List.Item
          key={chat.id}
          icon={getChatIcon(chat)}
          title={chat.title || "Untitled Chat"}
          subtitle={getChatSubtitle(chat)}
          accessories={[
            {
              text: new Date(chat.updatedAt).toLocaleDateString(),
              tooltip: "Last updated",
            },
            ...(chat.favorite ? [{ icon: Icon.Star, tooltip: "Favorite" }] : []),
          ]}
          actions={
            <ActionPanel>
              <Action.Push title="Show Details" target={<ChatDetail chatId={chat.id} />} icon={Icon.Eye} />
              <Action.Push
                title="Add Message"
                target={<AddMessage chatId={chat.id} chatTitle={chat.title} />}
                icon={Icon.Plus}
                shortcut={{ modifiers: ["cmd"], key: "n" }}
              />
              <Action.OpenInBrowser url={`https://v0.dev/chat/${chat.id}`} title="View in Browser" icon={Icon.Globe} />
              <Action.CopyToClipboard content={chat.id} title="Copy Chat ID" icon={Icon.CopyClipboard} />
              <ActionPanel.Section>
                <Action
                  title="Delete Chat"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={() => deleteChat(chat.id, chat.title || "Untitled Chat")}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
