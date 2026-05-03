import { AzureOpenAI } from "openai";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";

export class AzureOpenAINotConfiguredError extends Error {
  public readonly missing: string[];
  constructor(missing: string[]) {
    super(
      `Azure OpenAI is not configured. Missing environment variables: ${missing.join(
        ", ",
      )}. Set them in Replit Secrets.`,
    );
    this.name = "AzureOpenAINotConfiguredError";
    this.missing = missing;
  }
}

export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
}

export function getAzureOpenAIConfig(): AzureOpenAIConfig {
  const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
  const apiKey = process.env["AZURE_OPENAI_API_KEY"];
  const deployment =
    process.env["AZURE_OPENAI_DEPLOYMENT"] ?? "gpt-4o";
  const apiVersion =
    process.env["AZURE_OPENAI_API_VERSION"] ?? "2024-08-01-preview";

  const missing: string[] = [];
  if (!endpoint) missing.push("AZURE_OPENAI_ENDPOINT");
  if (!apiKey) missing.push("AZURE_OPENAI_API_KEY");
  if (missing.length > 0) {
    throw new AzureOpenAINotConfiguredError(missing);
  }

  return {
    endpoint: endpoint!,
    apiKey: apiKey!,
    deployment,
    apiVersion,
  };
}

let cachedClient: { client: AzureOpenAI; deployment: string } | null = null;

export function getAzureOpenAIClient(): {
  client: AzureOpenAI;
  deployment: string;
} {
  if (cachedClient) return cachedClient;
  const cfg = getAzureOpenAIConfig();
  const client = new AzureOpenAI({
    endpoint: cfg.endpoint,
    apiKey: cfg.apiKey,
    apiVersion: cfg.apiVersion,
    deployment: cfg.deployment,
  });
  cachedClient = { client, deployment: cfg.deployment };
  return cachedClient;
}

export interface ChatOptions {
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ChatCompletionCreateParamsNonStreaming["response_format"];
  tools?: ChatCompletionCreateParamsNonStreaming["tools"];
  toolChoice?: ChatCompletionCreateParamsNonStreaming["tool_choice"];
  user?: string;
}

export async function chat(opts: ChatOptions): Promise<ChatCompletion> {
  const { client, deployment } = getAzureOpenAIClient();
  return client.chat.completions.create({
    model: deployment,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1024,
    ...(opts.responseFormat ? { response_format: opts.responseFormat } : {}),
    ...(opts.tools ? { tools: opts.tools } : {}),
    ...(opts.toolChoice ? { tool_choice: opts.toolChoice } : {}),
    ...(opts.user ? { user: opts.user } : {}),
  });
}

export async function chatText(opts: ChatOptions): Promise<string> {
  const completion = await chat(opts);
  return completion.choices[0]?.message?.content ?? "";
}

export type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
