export interface FindChatsResponse {
  object: "list";
  data: ChatSummary[];
}

export interface ChatSummary {
  id: string;
  object: "chat";
  title?: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  shareable: boolean;
  privacy: string;
  authorId: string;
  latestVersion?: {
    id: string;
    object: "chat_version";
    status: "pending" | "completed" | "failed";
  };
  projectId?: string;
}

export interface ChatDetailResponse {
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
  }[];
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
  object: "project";
  id: string;
  assigned: true;
}

export interface ProjectDetail {
  id: string;
  object: "project";
  name: string;
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
