import { ActionPanel, Detail, List, Action, Icon, Color, showToast, Toast, confirmAlert } from "@raycast/api";
import type { ChatSummary, FindChatsResponse, ForkChatResponse } from "./types";
import ChatDetail from "./components/ChatDetail";
import AddMessage from "./components/AddMessage";
import { useNavigation } from "@raycast/api";
import AssignProjectForm from "./components/AssignProjectForm";
import { useProjects } from "./hooks/useProjects";
import { useState, useEffect } from "react";
import UpdateChatPrivacyForm from "./components/UpdateChatPrivacyForm";
import { useActiveProfile } from "./hooks/useActiveProfile";
import { useScopes } from "./hooks/useScopes";
import { ScopeDropdown } from "./components/ScopeDropdown";
import ChatMessagesDetail from "./components/ChatMessagesDetail";
import { useV0Api } from "./hooks/useV0Api";
import { v0ApiFetcher, V0ApiError } from "./lib/v0-api-utils";

export default function Command(props: { scopeId?: string }) {
  const { push } = useNavigation();
  const { projects } = useProjects();
  const { activeProfileApiKey, activeProfileDefaultScope, isLoadingProfileDetails } = useActiveProfile();

  const [selectedScopeFilter, setSelectedScopeFilter] = useState<string | null>(props.scopeId || null);

  useEffect(() => {
    // Update selectedScopeFilter when defaultScope becomes available or props.scopeId changes
    if (activeProfileDefaultScope !== null && !isLoadingProfileDetails && !props.scopeId) {
      setSelectedScopeFilter(activeProfileDefaultScope);
    }
  }, [activeProfileDefaultScope, isLoadingProfileDetails, props.scopeId]);

  const { isLoading, data, error, mutate } = useV0Api<FindChatsResponse>(
    activeProfileApiKey && !isLoadingProfileDetails ? "https://api.v0.dev/v1/chats" : "",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${activeProfileApiKey}`,
        "x-scope": selectedScopeFilter || "",
      },
      keepPreviousData: true,
      execute: !!activeProfileApiKey && !isLoadingProfileDetails,
    },
  );

  const { scopes: scopesData, isLoadingScopes } = useScopes(activeProfileApiKey); // Use useScopes hook

  const deleteChat = async (chatId: string, chatTitle: string) => {
    if (!activeProfileApiKey) {
      showToast(Toast.Style.Failure, "API Key not available.");
      return;
    }
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Deleting chat...",
    });

    try {
      await mutate(
        v0ApiFetcher(`https://api.v0.dev/v1/chats/${chatId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${activeProfileApiKey}`,
          },
        }),
        {
          optimisticUpdate(data) {
            return {
              ...data,
              data: data.data.filter((chat) => chat.id !== chatId),
            };
          },
          rollbackOnError: true,
        },
      );

      toast.style = Toast.Style.Success;
      toast.title = "Chat Deleted";
      toast.message = `"${chatTitle}" has been deleted successfully.`;
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Delete Failed";
      toast.message = error instanceof V0ApiError ? error.response.error.message : "Failed to delete chat";
    }
  };

  const favoriteChat = async (chatId: string, isFavorite: boolean) => {
    if (!activeProfileApiKey) {
      showToast(Toast.Style.Failure, "API Key not available.");
      return;
    }
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: isFavorite ? "Favoriting chat..." : "Unfavoriting chat...",
    });

    try {
      await mutate(
        v0ApiFetcher(`https://api.v0.dev/v1/chats/${chatId}/favorite`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${activeProfileApiKey}`,
          },
          body: { isFavorite },
        }),
        {
          optimisticUpdate(data: FindChatsResponse): FindChatsResponse {
            return {
              ...data,
              data: data.data.map((chat: ChatSummary) =>
                chat.id === chatId ? { ...chat, favorite: isFavorite } : chat,
              ),
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
      toast.message = error instanceof V0ApiError ? error.response.error.message : "Failed to favorite chat";
    }
  };

  const forkChat = async (chat: ChatSummary) => {
    if (!activeProfileApiKey) {
      showToast(Toast.Style.Failure, "API Key not available.");
      return;
    }
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Forking chat...",
    });

    try {
      const requestBody = chat.latestVersion?.id ? { versionId: chat.latestVersion.id } : {};
      const newChatResponse = await v0ApiFetcher<ForkChatResponse>(`https://api.v0.dev/v1/chats/${chat.id}/fork`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${activeProfileApiKey}`,
        },
        body: requestBody,
      });

      // Navigate to the new chat detail
      push(<ChatDetail chatId={newChatResponse.id} />);

      toast.style = Toast.Style.Success;
      toast.title = "Chat Forked";
      toast.message = `"${chat.title}" has been forked successfully!`;
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Fork Failed";
      toast.message = error instanceof V0ApiError ? error.response.error.message : "Failed to fork chat";
    }
  };

  if (error) {
    return <Detail markdown={`Error: ${error?.message}`} />;
  }

  if (isLoading || isLoadingProfileDetails || isLoadingScopes) {
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
      isShowingDetail={true}
      searchBarAccessory={
        <ScopeDropdown
          selectedScope={selectedScopeFilter}
          onScopeChange={setSelectedScopeFilter}
          availableScopes={scopesData || []}
          isLoadingScopes={isLoadingScopes}
        />
      }
    >
      {(data?.data || [])
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
                {chat.projectId && (
                  <Action.CopyToClipboard title="Copy Project ID" content={chat.projectId} icon={Icon.Clipboard} />
                )}
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
            detail={<ChatMessagesDetail chat={chat} />}
          />
        ))}
    </List>
  );
}
