export type MatchMode = "all" | "any";
export type ActionStatus = "success" | "failed" | "skipped";
export type EventStatus = "success" | "failed" | "no_match" | "ignored";

export interface Env {
  DB: D1Database;
  CONFIG_CACHE?: KVNamespace;
  ATTACHMENTS?: R2Bucket;
  EMAIL?: {
    send(message: unknown): Promise<void>;
  };
  ADMIN_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  OLLAMA_BASE_URL?: string;
}

export interface EmailAttachmentInput {
  filename: string;
  mimeType: string;
  size: number;
  content?: ArrayBuffer;
}

export interface EmailInput {
  messageId: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  subject: string;
  body: string;
  htmlBody?: string;
  bodyPreview: string;
  hasAttachments: boolean;
  attachments?: EmailAttachmentInput[];
  headers: Record<string, string>;
  receivedAt: string;
  rawMessage?: ForwardableEmailMessage;
}

export interface HeaderCondition {
  name: string;
  value: string;
}

export interface RuleConditions {
  recipient_equals?: string;
  recipient_contains?: string;
  sender_equals?: string;
  sender_contains?: string;
  subject_contains?: string;
  body_contains?: string;
  has_attachment?: boolean;
  header_contains?: HeaderCondition;
  keywords?: string[];
  domain_matches?: string;
  regex?: string;
}

export type RuleAction =
  | { type: "forward"; to?: string }
  | { type: "move_to_inbox"; inboxId?: number; inboxName?: string }
  | { type: "create_ticket"; priority?: "low" | "normal" | "high" | "urgent"; assignedUser?: string }
  | { type: "telegram"; template?: string }
  | { type: "slack"; webhookUrl?: string; template?: string }
  | { type: "webhook"; url?: string; method?: "POST" | "PUT" }
  | { type: "api_call"; url?: string; method?: "POST" | "PUT"; bodyTemplate?: string }
  | { type: "store_attachment" }
  | { type: "tag_email"; tags?: string[] }
  | { type: "assign_user"; user?: string }
  | { type: "create_contact" }
  | { type: "update_contact"; tags?: string[] }
  | { type: "mark_spam" }
  | { type: "save" }
  | { type: "auto_reply"; template?: string }
  | { type: "ai_classify"; provider?: string }
  | { type: "ai_summarize"; provider?: string }
  | { type: "ai_extract_fields"; provider?: string }
  | { type: "ignore" };

export interface RuleRecord {
  id: number;
  name: string;
  active: boolean;
  priority: number;
  matchMode: MatchMode;
  conditions: RuleConditions;
  actions: RuleAction[];
  createdAt: string;
  updatedAt: string;
  lastMatchedAt: string | null;
}

export interface ActionResult {
  actionType: RuleAction["type"];
  status: ActionStatus;
  responsePreview?: string;
  error?: string;
}

export interface ActionContext {
  telegramBotToken?: string;
  telegramChatId?: string;
  defaultForwardEmail?: string;
  defaultWebhookUrl?: string;
  autoReplyEnabled?: boolean;
  aiEnabled?: boolean;
  webhookRetriesCount?: number;
  openaiApiKey?: string;
  openrouterApiKey?: string;
  ollamaBaseUrl?: string;
  fetcher?: typeof fetch;
}

export interface EmailEventRecord {
  id: number;
  messageId: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  bodyPreview: string;
  hasAttachments: boolean;
  matchedRules: Array<{ id: number; name: string }>;
  actions: ActionResult[];
  status: EventStatus;
  error: string | null;
  receivedAt: string;
}

export interface SettingRecord {
  key: string;
  value: string;
  encryptedOrSecret: boolean;
  updatedAt: string;
}

export interface ProcessResult {
  event: EmailEventRecord;
  matchedRules: RuleRecord[];
  actionResults: ActionResult[];
}

export interface OutboundEmailTemplateRecord {
  id: number;
  name: string;
  subject: string;
  text_body: string;
  html_body: string;
  variables_json: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OutboundEmailLogRecord {
  id: number;
  from_email: string;
  to_email: string;
  subject: string;
  template_id: number | null;
  status: string;
  provider: string;
  error: string | null;
  metadata_json: string;
  sent_at: string | null;
  created_at: string;
}

export interface OutboundSuppressionRecord {
  id: number;
  email: string;
  reason: string;
  source: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}
