export interface ProductionSettings {
  defaultInbox: string;
  defaultTicketStatus: string;
  defaultTicketPriority: "low" | "normal" | "high" | "urgent";
  logRetentionDays: number;
  attachmentRetentionDays: number;
  aiEnabled: boolean;
  autoTicketEnabled: boolean;
  workflowRetriesCount: number;
  maxStoredBodyPreviewLength: number;
  maxRequestBodyBytes: number;
  maxAttachmentBytes: number;
}

export const DEFAULT_PRODUCTION_SETTINGS: ProductionSettings = {
  defaultInbox: "Unassigned",
  defaultTicketStatus: "open",
  defaultTicketPriority: "normal",
  logRetentionDays: 30,
  attachmentRetentionDays: 90,
  aiEnabled: false,
  autoTicketEnabled: true,
  workflowRetriesCount: 2,
  maxStoredBodyPreviewLength: 500,
  maxRequestBodyBytes: 1024 * 1024,
  maxAttachmentBytes: 10 * 1024 * 1024
};

function numberSetting(value: string | null | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function boolSetting(value: string | null | undefined, fallback: boolean): boolean {
  if (value === undefined || value === null || value === "") return fallback;
  return value === "true" || value === "1" || value === "yes";
}

export function productionSettingsFrom(values: Record<string, string | null | undefined>): ProductionSettings {
  return {
    defaultInbox: values.default_inbox || DEFAULT_PRODUCTION_SETTINGS.defaultInbox,
    defaultTicketStatus: values.default_ticket_status || DEFAULT_PRODUCTION_SETTINGS.defaultTicketStatus,
    defaultTicketPriority: (values.default_ticket_priority as ProductionSettings["defaultTicketPriority"]) || DEFAULT_PRODUCTION_SETTINGS.defaultTicketPriority,
    logRetentionDays: numberSetting(values.log_retention_days, DEFAULT_PRODUCTION_SETTINGS.logRetentionDays, 1, 3650),
    attachmentRetentionDays: numberSetting(values.attachment_retention_days, DEFAULT_PRODUCTION_SETTINGS.attachmentRetentionDays, 1, 3650),
    aiEnabled: boolSetting(values.ai_enabled, DEFAULT_PRODUCTION_SETTINGS.aiEnabled),
    autoTicketEnabled: boolSetting(values.auto_ticket_enabled, DEFAULT_PRODUCTION_SETTINGS.autoTicketEnabled),
    workflowRetriesCount: numberSetting(values.workflow_retries_count, DEFAULT_PRODUCTION_SETTINGS.workflowRetriesCount, 0, 10),
    maxStoredBodyPreviewLength: numberSetting(values.max_stored_body_preview_length, DEFAULT_PRODUCTION_SETTINGS.maxStoredBodyPreviewLength, 80, 5000),
    maxRequestBodyBytes: numberSetting(values.max_request_body_bytes, DEFAULT_PRODUCTION_SETTINGS.maxRequestBodyBytes, 1024, 10 * 1024 * 1024),
    maxAttachmentBytes: numberSetting(values.max_attachment_bytes, DEFAULT_PRODUCTION_SETTINGS.maxAttachmentBytes, 1024, 100 * 1024 * 1024)
  };
}
