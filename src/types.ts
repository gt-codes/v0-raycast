export interface FindChatsResponse {
  object: "list";
  data: ChatSummary[];
}

export interface ChatSummary {
  id: string;
  object: "chat";
  shareable: boolean;
  privacy: "public" | "private" | "team" | "team-edit" | "unlisted";
  name?: string;
  /**
   * @deprecated
   */
  title?: string;
  updatedAt?: string;
  favorite: boolean;
  authorId: string;
  projectId?: string;
  latestVersion?: {
    id: string;
    object: "version";
    demoUrl?: string;
    status: "pending" | "completed" | "failed";
  };
}

export interface VersionDetail {
  id: string;
  object: "version";
  status: "pending" | "completed" | "failed";
  demoUrl?: string;
  files: {
    object: "file";
    name: string;
    content: string;
  }[];
}

export interface MessageSummary {
  id: string;
  object: "message";
  content: string;
  createdAt: string;
  type:
    | "message"
    | "forked-block"
    | "forked-chat"
    | "open-in-v0"
    | "refinement"
    | "added-environment-variables"
    | "added-integration"
    | "deleted-file"
    | "moved-file"
    | "renamed-file"
    | "edited-file"
    | "replace-src"
    | "reverted-block"
    | "fix-with-v0"
    | "auto-fix-with-v0"
    | "sync-git";
  role: "user" | "assistant";
}

export interface ChatDetailResponse {
  id: string;
  object: "chat";
  shareable: boolean;
  privacy: "public" | "private" | "team" | "team-edit" | "unlisted";
  name?: string;
  /**
   * @deprecated
   */
  title?: string;
  updatedAt?: string;
  favorite: boolean;
  authorId: string;
  projectId?: string;
  latestVersion?: VersionDetail;
  url: string;
  messages: MessageSummary[];
  files?: {
    lang: string;
    meta: {
      [k: string]: string;
    };
    source: string;
  }[];
  /**
   * @deprecated
   */
  demo?: string;
  text: string;
}

export interface ChatMetadataResponse {
  git?: {
    branch?: string;
    commit?: string;
  };
  deployment?: {
    id?: string;
  };
  project?: {
    id?: string;
    name?: string;
    url?: string;
  };
}

export interface DeleteChatResponse {
  id: string;
  object: "chat";
  deleted: true;
}

export interface ForkChatResponse {
  id: string;
  object: "chat";
  url: string;
  demo?: string;
  shareable: boolean;
  privacy?: "public" | "private" | "team" | "team-edit" | "unlisted";
  title?: string;
  updatedAt?: string;
  favorite: boolean;
  authorId: string;
  latestVersion?: {
    id: string;
    status: "pending" | "completed" | "failed";
  };
  messages: {
    id: string;
    object: "message";
    content: string;
    createdAt: string;
    type:
      | "message"
      | "forked-block"
      | "forked-chat"
      | "open-in-v0"
      | "refinement"
      | "added-environment-variables"
      | "added-integration"
      | "deleted-file"
      | "moved-file"
      | "renamed-file"
      | "edited-file"
      | "replace-src"
      | "reverted-block"
      | "fix-with-v0"
      | "sync-git";
    role: "user" | "assistant";
  }[];
}

export interface CreateChatRequest {
  message: string;
  attachments?: Array<{
    type: string;
    url: string;
    description?: string;
  }>;
  system?: string;
  chatPrivacy?: "public" | "private" | "team-edit" | "team" | "unlisted";
  projectId?: string;
  modelConfiguration?: {
    modelId?: string;
    imageGenerations?: boolean;
    thinking?: boolean;
  };
}

export interface CreateChatResponse {
  id: string;
  object: "chat";
  url: string;
  files?: {
    lang: string;
    meta: {
      [k: string]: string;
    };
    source: string;
  }[];
  demo?: string;
  text: string;
  modelConfiguration: {
    modelId: "v0-1.5-sm" | "v0-1.5-md" | "v0-1.5-lg";
    imageGenerations?: boolean;
    thinking?: boolean;
  };
}

export interface CreateProjectResponse {
  id: string;
  object: "project";
  name: string;
  vercelProjectId?: string;
}

export interface CreateMessageRequest {
  message: string;
  attachments?: Array<{
    type: string;
    url: string;
    description?: string;
  }>;
  modelConfiguration?: {
    modelId?: string;
    imageGenerations?: boolean;
    thinking?: boolean;
  };
}

export interface CreateMessageResponse {
  id: string;
  object: "message";
  chatId: string;
  url: string;
  files?: {
    lang: string;
    meta: {
      [k: string]: string;
    };
    source: string;
  }[];
  demo?: string;
  text: string;
  modelConfiguration: {
    modelId: "v0-1.5-sm" | "v0-1.5-md" | "v0-1.5-lg";
    imageGenerations?: boolean;
    thinking?: boolean;
  };
}

export interface Response {
  id: string;
  object: "project";
  assigned: true;
}

export interface InitializeChatResponse {
  id: string;
  object: "chat";
  shareable: boolean;
  privacy: "public" | "private" | "team" | "team-edit" | "unlisted";
  name?: string;
  title?: string;
  updatedAt?: string;
  favorite: boolean;
  authorId: string;
  projectId?: string;
  latestVersion?: VersionDetail;
  url: string;
  messages: MessageSummary[];
  files?: {
    lang: string;
    meta: {
      [k: string]: string;
    };
    source: string;
  }[];
  demo?: string;
  text: string;
}

export interface ProjectDetail {
  id: string;
  object: "project";
  name: string;
  chats: ChatSummary[];
  vercelProjectId?: string;
}

export interface FindProjectsResponse {
  object: "list";
  data: ProjectDetail[];
}

export interface Project {
  id: string;
  object: "project";
  name: string;
  vercelProjectId?: string;
}

export interface Profile {
  id: string;
  name: string;
  apiKey: string;
  defaultScope?: string;
  defaultScopeName?: string;
}

export interface ActiveProfileId {
  id: string;
}

export interface ScopeSummary {
  id: string;
  object: "scope";
  name?: string;
}

export interface FindScopesResponse {
  object: "list";
  data: ScopeSummary[];
}

export interface ProjectChatsResponse {
  object: "project";
  id: string;
  name: string;
  description?: string;
  chats: ChatSummary[];
}
