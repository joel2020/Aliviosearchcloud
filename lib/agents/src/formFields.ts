/**
 * UI form-field metadata for each agent. Mirrors the agent's Zod input schema
 * but in a transport-friendly shape that can be sent over the wire and used
 * to render a dynamic input form on the customer dashboard.
 *
 * Kept in lockstep with `lib/agents/src/agents/*.ts`. When you change an
 * agent's input schema, update the matching entry here.
 */

export type FormFieldType =
  | "string"
  | "textarea"
  | "number"
  | "integer"
  | "enum"
  | "string-array";

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  description?: string;
  placeholder?: string;
  /** For `enum`. */
  options?: readonly string[];
  defaultValue?: string | number | readonly string[];
  min?: number;
  max?: number;
  step?: number;
}

const FIELDS: Record<string, readonly FormField[]> = {
  "revenue-leak": [
    { name: "monthlyLeads", label: "Monthly leads", type: "integer", required: false, min: 0, placeholder: "120" },
    { name: "averageDealValue", label: "Average deal value (USD)", type: "number", required: false, min: 0, placeholder: "1500" },
    { name: "closeRate", label: "Close rate (0–1)", type: "number", required: false, min: 0, max: 1, step: 0.01, placeholder: "0.18" },
    { name: "knownIssues", label: "Known issues", type: "string-array", required: false, description: "Add one issue per line." },
    { name: "notes", label: "Notes", type: "textarea", required: false, max: 2000 },
  ],
  "missed-call": [
    { name: "callerName", label: "Caller name", type: "string", required: false },
    { name: "callerNumber", label: "Caller phone number", type: "string", required: true, placeholder: "+15551234567" },
    { name: "callTimeIso", label: "Call time (ISO)", type: "string", required: false, placeholder: "2026-05-03T14:22:00Z" },
    { name: "bookingUrl", label: "Booking link", type: "string", required: false, placeholder: "https://cal.com/your-link" },
  ],
  "instant-response": [
    { name: "channel", label: "Channel", type: "enum", required: true, options: ["webform", "email", "sms", "whatsapp", "chat"] as const, defaultValue: "webform" },
    { name: "leadName", label: "Lead name", type: "string", required: false },
    { name: "leadMessage", label: "Lead message", type: "textarea", required: true },
    { name: "leadEmail", label: "Lead email", type: "string", required: false },
    { name: "bookingUrl", label: "Booking link", type: "string", required: false },
  ],
  "follow-up": [
    { name: "leadName", label: "Lead name", type: "string", required: false },
    { name: "daysSinceLastTouch", label: "Days since last touch", type: "integer", required: true, min: 0, defaultValue: 3 },
    { name: "lastChannel", label: "Last channel used", type: "enum", required: false, options: ["email", "sms", "call", "whatsapp"] as const },
    { name: "leadStage", label: "Lead stage", type: "enum", required: false, options: ["new", "contacted", "qualified", "proposal_sent", "negotiation"] as const, defaultValue: "contacted" },
    { name: "notes", label: "Notes", type: "textarea", required: false },
  ],
  reactivation: [
    { name: "leadName", label: "Lead name", type: "string", required: false },
    { name: "monthsCold", label: "Months cold", type: "integer", required: true, min: 0, defaultValue: 6 },
    { name: "pastInterest", label: "Past interest", type: "textarea", required: false },
    { name: "newOfferSummary", label: "New offer summary", type: "textarea", required: false },
  ],
  "outbound-sales": [
    { name: "icpDescription", label: "Ideal customer profile", type: "textarea", required: true, placeholder: "20–100 employee dental practices in Texas" },
    { name: "valueProp", label: "Value proposition", type: "textarea", required: true },
    { name: "desiredOutcome", label: "Desired outcome", type: "string", required: false, defaultValue: "book a discovery call" },
  ],
  "linkedin-outreach": [
    { name: "prospectName", label: "Prospect name", type: "string", required: true },
    { name: "prospectTitle", label: "Prospect title", type: "string", required: false },
    { name: "prospectCompany", label: "Prospect company", type: "string", required: false },
    { name: "hook", label: "Personal hook", type: "textarea", required: false, description: "Recent post, mutual interest, etc." },
    { name: "valueProp", label: "Value proposition", type: "textarea", required: true },
  ],
  "cold-email": [
    { name: "prospectName", label: "Prospect name", type: "string", required: false },
    { name: "prospectCompany", label: "Prospect company", type: "string", required: false },
    { name: "painPoint", label: "Pain point", type: "textarea", required: true, min: 5 },
    { name: "valueProp", label: "Value proposition", type: "textarea", required: true, min: 10 },
    { name: "cta", label: "Call to action", type: "string", required: false, defaultValue: "15-minute call this week" },
  ],
  "lead-research": [
    { name: "name", label: "Lead name", type: "string", required: true },
    { name: "company", label: "Company", type: "string", required: false },
    { name: "title", label: "Title", type: "string", required: false },
    { name: "publicNotes", label: "Public notes", type: "textarea", required: false },
    { name: "knownNeeds", label: "Known needs", type: "string-array", required: false, description: "One per line." },
  ],
  proposal: [
    { name: "clientName", label: "Client name", type: "string", required: true },
    { name: "objective", label: "Objective", type: "textarea", required: true },
    { name: "deliverables", label: "Deliverables", type: "string-array", required: true, description: "One deliverable per line." },
    { name: "timelineWeeks", label: "Timeline (weeks)", type: "integer", required: true, min: 1, max: 52, defaultValue: 6 },
    { name: "investmentUsd", label: "Investment (USD)", type: "number", required: true, min: 1, defaultValue: 5000 },
  ],
  "seo-content": [
    { name: "primaryKeyword", label: "Primary keyword", type: "string", required: true },
    { name: "audience", label: "Audience", type: "string", required: false },
    { name: "intent", label: "Search intent", type: "enum", required: false, options: ["informational", "commercial", "transactional"] as const, defaultValue: "informational" },
    { name: "desiredWordCount", label: "Desired word count", type: "integer", required: false, min: 300, max: 3500, defaultValue: 1200 },
  ],
  "business-assistant": [
    { name: "message", label: "Your question", type: "textarea", required: true, placeholder: "What's the highest-leverage thing I can do today?" },
    { name: "mode", label: "Assistant mode", type: "enum", required: false, options: ["general", "revenue_recovery", "outbound_sales", "follow_up", "proposal", "seo_content"] as const, defaultValue: "general" },
  ],
};

export function getAgentFormFields(id: string): readonly FormField[] {
  return FIELDS[id] ?? [];
}

export function allAgentFormFields(): Record<string, readonly FormField[]> {
  return FIELDS;
}
