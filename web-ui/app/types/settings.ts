/**
 * Display settings
 * @see app/src/main/java/me/rerere/rikkahub/data/datastore/PreferencesStore.kt - DisplaySetting
 */
export interface DisplaySetting {
  userNickname: string;
  userAvatar?: AssistantAvatar;
  useAppIconStyleLoadingIndicator: boolean;
  showUserAvatar: boolean;
  showAssistantBubble: boolean;
  bubbleOpacity: number;
  showModelIcon: boolean;
  showModelName: boolean;
  showDateTimeInMessage: boolean;
  showTokenUsage: boolean;
  showThinkingContent: boolean;
  autoCloseThinking: boolean;
  showUpdates: boolean;
  showMessageJumper: boolean;
  messageJumperOnLeft: boolean;
  fontSizeRatio: number;
  enableMessageGenerationHapticEffect: boolean;
  skipCropImage: boolean;
  enableNotificationOnMessageGeneration: boolean;
  enableLiveUpdateNotification: boolean;
  codeBlockAutoWrap: boolean;
  codeBlockAutoCollapse: boolean;
  showLineNumbers: boolean;
  ttsOnlyReadQuoted: boolean;
  autoPlayTTSAfterGeneration: boolean;
  pasteLongTextAsFile: boolean;
  pasteLongTextThreshold: number;
  sendOnEnter: boolean;
  enableAutoScroll: boolean;
  enableLatexRendering: boolean;
  enableBlurEffect: boolean;
  chatFontFamily: string;
  chatCustomFontPath: string;
  chatCustomFontName: string;
  enableVolumeKeyScroll: boolean;
  volumeKeyScrollRatio: number;
  [key: string]: unknown;
}

export interface AssistantTag {
  id: string;
  name: string;
}

export interface AssistantAvatar {
  type?: string;
  content?: string;
  url?: string;
  [key: string]: unknown;
}

export interface AssistantQuickMessage {
  title: string;
  content: string;
}

export interface QuickMessage {
  id: string;
  title: string;
  content: string;
}

export interface ModeInjectionProfile {
  id: string;
  name: string;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface LorebookProfile {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface AssistantProfile {
  id: string;
  chatModelId?: string | null;
  reasoningLevel?: string | null;
  mcpServers?: string[];
  modeInjectionIds?: string[];
  lorebookIds?: string[];
  quickMessageIds?: string[];
  allowConversationPromptInjection?: boolean;
  allowConversationSystemPrompt?: boolean;
  name: string;
  avatar?: AssistantAvatar;
  useAssistantAvatar?: boolean;
  tags: string[];
  temperature?: number;
  topP?: number;
  contextMessageSize?: number;
  streamOutput?: boolean;
  enableMemory?: boolean;
  useGlobalMemory?: boolean;
  enableRecentChatsReference?: boolean;
  systemPrompt?: string;
  messageTemplate?: string;
  presetMessages?: string[];
  maxTokens?: number;
  enableTimeReminder?: boolean;
  enabledSkills?: string[];
  workspaceId?: string | null;
  customHeaders?: Record<string, string>;
  customBodies?: Record<string, string>;
  localTools?: string[];
  background?: string;
  backgroundOpacity?: number;
  useGradientBackground?: boolean;
  [key: string]: unknown;
}

export interface McpToolOption {
  enable: boolean;
  name: string;
  description?: string | null;
  needsApproval?: boolean;
  [key: string]: unknown;
}

export interface McpCommonOptions {
  enable: boolean;
  name: string;
  headers: Array<[string, string]>;
  tools: McpToolOption[];
  [key: string]: unknown;
}

export interface McpServerConfig {
  id: string;
  type: "sse" | "streamable_http";
  url: string;
  commonOptions: McpCommonOptions;
  [key: string]: unknown;
}

export type ModelType = "CHAT" | "IMAGE" | "EMBEDDING";
export type ModelModality = "TEXT" | "IMAGE";
export type ModelAbility = "TOOL" | "REASONING";

export interface BuiltInTool {
  type?: string;
  [key: string]: unknown;
}

export interface ProviderModel {
  id: string;
  modelId: string;
  displayName: string;
  type: ModelType;
  inputModalities?: ModelModality[];
  outputModalities?: ModelModality[];
  abilities?: ModelAbility[];
  tools?: BuiltInTool[];
  [key: string]: unknown;
}

export interface ProviderProfile {
  id: string;
  type: string;
  enabled: boolean;
  name: string;
  models: ProviderModel[];
  apiKey?: string;
  baseUrl?: string;
  chatCompletionsPath?: string;
  useResponseApi?: boolean;
  includeHistoryReasoning?: boolean;
  vertexAI?: boolean;
  useServiceAccount?: boolean;
  privateKey?: string;
  serviceAccountEmail?: string;
  location?: string;
  projectId?: string;
  promptCaching?: boolean;
  promptCacheTtl?: "5m" | "1h";
  balanceOption?: { enabled: boolean; apiPath: string; resultPath: string };
  [key: string]: unknown;
}

export interface SearchServiceOption {
  id: string;
  type?: string;
  apiKey?: string;
  baseUrl?: string;
  [key: string]: unknown;
}

export interface SearchCommonOptions {
  resultSize: number;
}

export interface TTSProviderProfile {
  id: string;
  type: string;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  voice?: string;
  voiceId?: string;
  [key: string]: unknown;
}

export interface ASRProviderProfile {
  id: string;
  type: string;
  name: string;
  apiKey?: string;
  websocketUrl?: string;
  model?: string;
  language?: string;
  sampleRate?: number;
  [key: string]: unknown;
}

export interface WebDavConfig {
  url: string;
  username: string;
  password: string;
  path: string;
  items: string[];
}

export interface S3Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  pathStyle: boolean;
  items: string[];
}

export interface BackupReminderConfig {
  enabled: boolean;
  intervalDays: number;
  lastBackupTime: number;
}

export interface CustomTheme {
  id: string;
  name: string;
  primaryColorArgb: number;
  secondaryColorArgb?: number | null;
  tertiaryColorArgb?: number | null;
}

/**
 * App settings (streamed via SSE)
 * @see app/src/main/java/me/rerere/rikkahub/data/datastore/PreferencesStore.kt - Settings
 */
export interface Settings {
  dynamicColor: boolean;
  themeId: string;
  customThemes: CustomTheme[];
  developerMode: boolean;
  displaySetting: DisplaySetting;
  enableWebSearch: boolean;
  favoriteModels: string[];
  chatModelId: string;
  fastModelId: string;
  titleModelId: string | null;
  imageGenerationModelId: string;
  translateModeId: string;
  translateThinkingBudget: number;
  enableSuggestion: boolean;
  suggestionModelId: string | null;
  titlePrompt: string;
  translatePrompt: string;
  suggestionPrompt: string;
  ocrModelId: string;
  ocrPrompt: string;
  compressModelId: string;
  compressPrompt: string;
  assistantId: string;
  providers: ProviderProfile[];
  assistants: AssistantProfile[];
  assistantTags: AssistantTag[];
  modeInjections?: ModeInjectionProfile[];
  lorebooks?: LorebookProfile[];
  mcpServers: McpServerConfig[];
  searchServices: SearchServiceOption[];
  searchCommonOptions: SearchCommonOptions;
  searchServiceSelected: number;
  quickMessages?: QuickMessage[];
  ttsProviders: TTSProviderProfile[];
  selectedTTSProviderId: string;
  asrProviders: ASRProviderProfile[];
  selectedASRProviderId: string | null;
  webServerEnabled: boolean;
  webServerPort: number;
  webServerJwtEnabled: boolean;
  webServerAccessPassword: string;
  webServerLocalhostOnly: boolean;
  webDavConfig: WebDavConfig;
  s3Config: S3Config;
  backupReminderConfig: BackupReminderConfig;
  launchCount: number;
  [key: string]: unknown;
}
