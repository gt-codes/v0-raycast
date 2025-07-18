import { ActionPanel, List, Action, useNavigation, Form, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import { useCachedState } from "@raycast/utils";
import type { Profile } from "./types";
import { v4 as uuidv4 } from "uuid";
import { useFetch } from "@raycast/utils";
import { Icon } from "@raycast/api";
import { getActiveProfileDetails } from "./lib/profile-utils";

interface Preferences {
  apiKey: string;
}

interface ScopeSummary {
  id: string;
  object: "scope";
  name?: string;
}

interface FindScopesResponse {
  object: "list";
  data: ScopeSummary[];
}

function AddProfileForm(props: { onAdd: (profile: Profile) => void }) {
  const { pop } = useNavigation();

  async function handleSubmit(values: { name: string; apiKey: string }) {
    if (!values.name || !values.apiKey) {
      showToast({
        style: Toast.Style.Failure,
        title: "Name and API Key are required.",
      });
      return;
    }

    props.onAdd({ id: uuidv4(), name: values.name, apiKey: values.apiKey });
    showToast(Toast.Style.Success, "Profile added successfully!");
    pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Profile" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Profile Name" placeholder="e.g., My SSO Team" />
      <Form.PasswordField id="apiKey" title="API Key" placeholder="Enter your v0 API key" />
    </Form>
  );
}

function SetDefaultScopeForm(props: { profile: Profile; onUpdate: (profile: Profile) => void }) {
  const { pop } = useNavigation();
  const [selectedScopeId, setSelectedScopeId] = useState<string>(props.profile.defaultScope || "");

  const { isLoading: isLoadingScopes, data: scopesData } = useFetch<FindScopesResponse>(
    props.profile.apiKey ? "https://api.v0.dev/v1/user/scopes" : "",
    {
      headers: {
        Authorization: `Bearer ${props.profile.apiKey}`,
        "Content-Type": "application/json",
      },
      parseResponse: (response) => response.json(),
      execute: !!props.profile.apiKey,
    },
  );

  async function handleSubmit(values: { scopeId: string }) {
    props.onUpdate({
      ...props.profile,
      defaultScope: values.scopeId || undefined,
    });
    showToast(
      Toast.Style.Success,
      `Default scope ${values.scopeId ? `set to ${values.scopeId}` : "removed"} for ${props.profile.name}`,
    );
    pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Set Default Scope" onSubmit={handleSubmit} />
        </ActionPanel>
      }
      isLoading={isLoadingScopes}
    >
      <Form.Description title="Profile" text={props.profile.name} />
      <Form.Dropdown
        id="scopeId"
        title="Default Scope"
        value={selectedScopeId}
        onChange={setSelectedScopeId}
        isLoading={isLoadingScopes}
      >
        <Form.Dropdown.Item value="" title="No Default Scope" />
        {scopesData?.data.map((scope: ScopeSummary) => (
          <Form.Dropdown.Item key={scope.id} value={scope.id} title={scope.name || "Untitled Scope"} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}

export default function ManageProfiles() {
  const [profiles, setProfiles] = useCachedState<Profile[]>("v0-profiles", []);
  const [activeProfileId, setActiveProfileId] = useCachedState<string | undefined>("v0-active-profile-id", undefined);
  const preferences = getPreferenceValues<Preferences>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeProfiles() {
      if (profiles === undefined || profiles.length === 0) {
        // If no profiles exist, create one from the preference API key
        if (preferences.apiKey) {
          const { defaultScope } = await getActiveProfileDetails();
          const defaultProfile: Profile = {
            id: "default",
            name: "Default Profile",
            apiKey: preferences.apiKey,
            ...(defaultScope && { defaultScope }),
          };
          setProfiles([defaultProfile]);
          setActiveProfileId(defaultProfile.id);
        }
      } else if (activeProfileId === undefined && profiles.length > 0) {
        // If profiles exist but no active one, set the first as active
        setActiveProfileId(profiles[0].id);
      }
      setIsLoading(false);
    }
    initializeProfiles();
  }, [profiles, activeProfileId, preferences.apiKey]);

  const handleAddProfile = (newProfile: Profile) => {
    setProfiles((prev) => [...(prev || []), newProfile]);
    if (!activeProfileId) {
      setActiveProfileId(newProfile.id);
    }
  };

  const handleSetActiveProfile = (id: string) => {
    setActiveProfileId(id);
    showToast(Toast.Style.Success, "Active profile switched!");
  };

  const handleUpdateProfile = (updatedProfile: Profile) => {
    setProfiles((prev) => prev?.map((p) => (p.id === updatedProfile.id ? updatedProfile : p)) || []);
  };

  return (
    <List isLoading={isLoading}>
      <List.Section title="Profiles">
        {profiles?.map((profile) => (
          <List.Item
            key={profile.id}
            title={profile.name}
            subtitle={profile.id === "default" ? "⚙︎ Preferences" : "Custom"}
            accessories={[
              { text: profile.id === activeProfileId ? "Active" : "" },
              ...(profile.defaultScope ? [{ text: `Scope: ${profile.defaultScope}` }] : []),
            ]}
            actions={
              <ActionPanel>
                <Action
                  title="Set as Active"
                  onAction={() => handleSetActiveProfile(profile.id)}
                  icon={Icon.CheckCircle}
                />
                <Action.Push
                  title="Set Default Scope"
                  target={<SetDefaultScopeForm profile={profile} onUpdate={handleUpdateProfile} />}
                  icon={Icon.Star}
                />
                <Action.Push
                  title="Add New Profile"
                  target={<AddProfileForm onAdd={handleAddProfile} />}
                  icon={Icon.Plus}
                  shortcut={{ modifiers: ["cmd"], key: "n" }}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      <List.EmptyView
        title="No Profiles Found"
        description="Add a new profile to get started."
        actions={
          <ActionPanel>
            <Action.Push
              title="Add New Profile"
              target={<AddProfileForm onAdd={handleAddProfile} />}
              icon={Icon.Plus}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
            />
          </ActionPanel>
        }
      />
    </List>
  );
}
