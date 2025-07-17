import { ActionPanel, Detail, List, Action, Icon, Color, showToast, Toast, confirmAlert } from "@raycast/api";
import { ensureApiKey } from "./lib/ensureApiKey";
import { useFetch } from "@raycast/utils";
import type { ChatSummary, FindChatsResponse } from "./types";
import ChatDetail from "./components/ChatDetail";
import AddMessage from "./components/AddMessage";
import { useNavigation } from "@raycast/api";
import type { ForkChatResponse } from "./types";
import AssignProjectForm from "./components/AssignProjectForm";
import { useProjects } from "./lib/projects";
import { useState, useMemo } from "react";
import UpdateChatPrivacyForm from "./components/UpdateChatPrivacyForm";
import { ensureDefaultScope } from "./lib/ensureDefaultScope";

interface ScopeSummary {
  id: string;
  object: "scope";
  name?: string;
}

interface FindScopesResponse {
  object: "list";
  data: ScopeSummary[];
}

export default function Command() {
  const apiKey = ensureApiKey();
  const { push } = useNavigation();
  const defaultScope = ensureDefaultScope();

  const [selectedScopeFilter, setSelectedScopeFilter] = useState<string | null>(defaultScope);

  const { isLoading, data, error, mutate } = useFetch<FindChatsResponse>("https://api.v0.dev/v1/chats", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "x-scope": selectedScopeFilter || "",
    },
    parseResponse: (response) => response.json(),
    keepPreviousData: true, // Keep displaying previous data while new data is being fetched
    cache: "force-cache", // Use cache aggressively
  });

  const {
    isLoading: isLoadingScopes,
    data: scopesData,
    error: scopesError,
  } = useFetch<FindScopesResponse>("https://api.v0.dev/v1/user/scopes", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    parseResponse: (response) => response.json(),
  });

  const { projects } = useProjects();

  // Filter chats based on the selectedProjectIdFilter
  const filteredChats = useMemo(() => {
    if (!data?.data) return [];
    // if (!selectedProjectIdFilter) return data.data; // Show all chats if no filter is selected
    // return data.data.filter((chat) => chat.projectId === selectedProjectIdFilter);
    return data.data;
  }, [data?.data]);

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

  const favoriteChat = async (chatId: string, isFavorite: boolean) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: isFavorite ? "Favoriting chat..." : "Unfavoriting chat...",
    });

    try {
      await mutate(
        fetch(`https://api.v0.dev/v1/chats/${chatId}/favorite`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isFavorite }),
        }),
        {
          optimisticUpdate(data) {
            if (!data) return data;
            return {
              ...data,
              data: data.data.map((chat) => (chat.id === chatId ? { ...chat, favorite: isFavorite } : chat)),
            };
          },
          rollbackOnError: true,
        },
      );
      toast.style = Toast.Style.Success;
      toast.title = isFavorite ? "Chat Favorited" : "Chat Unfavorited";
      toast.message = `Chat has been ${isFavorite ? "favorited" : "unfavorited"} successfully.`;
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Favorite Failed";
      toast.message = error instanceof Error ? error.message : "Failed to favorite chat";
    }
  };

  const forkChat = async (chat: ChatSummary) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Forking chat...",
    });

    try {
      const requestBody = chat.latestVersion?.id ? { versionId: chat.latestVersion.id } : {};
      const response = await fetch(`https://api.v0.dev/v1/chats/${chat.id}/fork`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fork chat: ${errorData.error?.message || response.statusText}`);
      }

      const newChatResponse: ForkChatResponse = await response.json();

      // Navigate to the new chat detail
      push(<ChatDetail chatId={newChatResponse.id} />);

      toast.style = Toast.Style.Success;
      toast.title = "Chat Forked";
      toast.message = `"${chat.title}" has been forked successfully!`;

      // Navigate to the new chat detail if useNavigation push is available
      // For now, if 'push' is not defined (as per previous context), we won't navigate directly
      // If you intend to navigate, please ensure 'push' from useNavigation() is imported and used correctly.
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Fork Failed";
      toast.message = error instanceof Error ? error.message : "Failed to fork chat";
    }
  };

  if (error || scopesError) {
    return <Detail markdown={`Error: ${error?.message || scopesError?.message}`} />;
  }

  if (isLoading || isLoadingScopes) {
    return (
      <List navigationTitle="v0 Chats">
        <List.EmptyView title="Fetching your chats..." />
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
    if (chat.projectId) {
      const assignedProject = projects.find((project) => project.id === chat.projectId);
      if (assignedProject) {
        return `Project: ${assignedProject.name}`;
      }
    }
    if (chat.latestVersion?.status) {
      return `Status: ${chat.latestVersion.status}`;
    }
    return "No recent activity";
  };

  return (
    <List
      navigationTitle="v0 Chats"
      searchBarPlaceholder="Search your chats..."
      searchBarAccessory={
        <List.Dropdown
          id="scopeFilter"
          tooltip="Filter Chats by Scope"
          value={selectedScopeFilter || "all"}
          onChange={(newValue) => setSelectedScopeFilter(newValue === "all" ? null : newValue)}
          storeValue
        >
          <List.Dropdown.Item value="all" title="All Scopes" icon={Icon.Globe} />
          {scopesData?.data.map((scope: ScopeSummary) => (
            <List.Dropdown.Item key={scope.id} value={scope.id} title={scope.name || "Untitled Scope"} />
          ))}
        </List.Dropdown>
      }
    >
      {filteredChats
        .sort((a, b) => {
          // Sort favorited chats to the top
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          // Maintain original order for non-favorited chats, or sort by updatedAt for favorited chats
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })
        .map((chat: ChatSummary) => (
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
                  target={<AddMessage chatId={chat.id} chatTitle={chat.title} revalidateChats={mutate} />}
                  icon={Icon.Plus}
                  shortcut={{ modifiers: ["cmd"], key: "n" }}
                />
                {chat.latestVersion?.id && (
                  <Action
                    title="Fork Chat"
                    icon={Icon.Duplicate}
                    onAction={() => forkChat(chat)}
                    shortcut={{ modifiers: ["opt"], key: "f" }}
                  />
                )}
                <Action
                  title={chat.favorite ? "Unfavorite Chat" : "Favorite Chat"}
                  icon={chat.favorite ? Icon.StarDisabled : Icon.Star}
                  onAction={() => favoriteChat(chat.id, !chat.favorite)}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "f" }}
                />
                <Action.Push
                  title="Assign Project"
                  icon={Icon.Tag}
                  target={<AssignProjectForm chat={chat} revalidateChats={mutate} />}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
                />
                <Action.Push
                  title="Update Chat Privacy"
                  icon={Icon.Lock}
                  target={
                    <UpdateChatPrivacyForm
                      chatId={chat.id}
                      currentPrivacy={chat.privacy as "public" | "private" | "team" | "team-edit" | "unlisted"}
                      revalidateChats={mutate}
                    />
                  }
                  shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
                />
                <ActionPanel.Section>
                  <Action.OpenInBrowser
                    url={`https://v0.dev/chat/${chat.id}`}
                    title="View in Browser"
                    icon={Icon.Globe}
                    shortcut={{ modifiers: ["cmd"], key: "b" }}
                  />
                  <Action.CopyToClipboard
                    content={chat.id}
                    title="Copy Chat ID"
                    icon={Icon.CopyClipboard}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                  />
                  <Action
                    title="Delete Chat"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    onAction={async () => {
                      if (
                        await confirmAlert({
                          title: `Delete "${chat.title || "Untitled Chat"}"?`,
                          message:
                            "The chat will be deleted and removed from your chat history. This action cannot be undone.",
                        })
                      ) {
                        deleteChat(chat.id, chat.title || "Untitled Chat");
                      }
                    }}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
    </List>
  );
}
