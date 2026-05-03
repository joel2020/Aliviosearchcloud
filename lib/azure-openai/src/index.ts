import { AzureOpenAI } from "openai";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";

export class AzureOpenAINotConfiguredError extends Error {
  public readonly missing: readonly string[];
  constructor(missing: readonly string[]) {
    super(
      `Azure OpenAI is not configured. Missing environment variables: ${missing.join(
        ", ",
      )}. Set them via Replit Secrets.`,
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

const REQUIRED_ENV_VARS = [
  "AZURE_OPENAI_ENDPOINT",
  "AZURE_OPENAI_API_KEY",
  "AZURE_OPENAI_DEPLOYMENT",
  "AZURE_OPENAI_API_VERSION",
] as const;

/**
 * Reads strict Azure OpenAI configuration from the environment.
 * All four variables are required — no silent defaults.
 *
 * Pass an explicit `env` object for tests; defaults to `process.env`.
 */
export function getAzureOpenAIConfig(
  env: NodeJS.ProcessEnv = process.env,
): AzureOpenAIConfig {
  const missing: string[] = [];
  for (const k of REQUIRED_ENV_VARS) {
    if (!env[k] || !String(env[k]).trim()) missing.push(k);
  }
  if (missing.length > 0) {
    throw new AzureOpenAINotConfiguredError(missing);
  }
  return {
    endpoint: env["AZURE_OPENAI_ENDPOINT"]!,
    apiKey: env["AZURE_OPENAI_API_KEY"]!,
    deployment: env["AZURE_OPENAI_DEPLOYMENT"]!,
    apiVersion: env["AZURE_OPENAI_API_VERSION"]!,
  };
}

export interface AzureOpenAIClient {
  /** Underlying SDK client. */
  raw: AzureOpenAI;
  /** Default deployment from configuration. */
  defaultDeployment: string;
  chat: (opts: ChatOptions) => Promise<ChatCompletion>;
  chatText: (opts: ChatOptions) => Promise<string>;
  chatJson: <T = unknown>(opts: ChatOptions) => Promise<T>;
}

/**
 * Factory that constructs an Azure OpenAI client. Takes either a config object
 * or `process.env`. Designed for dependency injection in tests — never reads
 * env directly so callers control the configuration shape.
 */
export function createAzureOpenAIClient(
  configOrEnv?: AzureOpenAIConfig | NodeJS.ProcessEnv,
): AzureOpenAIClient {
  const cfg: AzureOpenAIConfig =
    configOrEnv && "endpoint" in configOrEnv && "apiKey" in configOrEnv
      ? (configOrEnv as AzureOpenAIConfig)
      : getAzureOpenAIConfig(configOrEnv as NodeJS.ProcessEnv | undefined);

  const raw = new AzureOpenAI({
    endpoint: cfg.endpoint,
    apiKey: cfg.apiKey,
    apiVersion: cfg.apiVersion,
    deployment: cfg.deployment,
  });

  async function chat(opts: ChatOptions): Promise<ChatCompletion> {
    const model = opts.model ?? cfg.deployment;
    const params: ChatCompletionCreateParamsNonStreaming = {
      model,
      messages: opts.messages,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(opts.maxTokens !== undefined ? { max_tokens: opts.maxTokens } : {}),
      ...(opts.jsonMode
        ? { response_format: { type: "json_object" } }
        : opts.responseFormat
          ? { response_format: opts.responseFormat }
          : {}),
      ...(opts.tools ? { tools: opts.tools } : {}),
      ...(opts.toolChoice ? { tool_choice: opts.toolChoice } : {}),
      ...(opts.user ? { user: opts.user } : {}),
      ...(opts.seed !== undefined ? { seed: opts.seed } : {}),
    };
    return raw.chat.completions.create(params);
  }

  async function chatText(opts: ChatOptions): Promise<string> {
    const completion = await chat(opts);
    return completion.choices[0]?.message?.content ?? "";
  }

  async function chatJson<T = unknown>(opts: ChatOptions): Promise<T> {
    const completion = await chat({ ...opts, jsonMode: true });
    const content = completion.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content) as T;
  }

  return { raw, defaultDeployment: cfg.deployment, chat, chatText, chatJson };
}

export interface ChatOptions {
  messages: ChatCompletionMessageParam[];
  /** Override the configured deployment for this call. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Convenience flag — equivalent to setting responseFormat={ type: "json_object" }. */
  jsonMode?: boolean;
  responseFormat?: ChatCompletionCreateParamsNonStreaming["response_format"];
  tools?: ChatCompletionCreateParamsNonStreaming["tools"];
  toolChoice?: ChatCompletionCreateParamsNonStreaming["tool_choice"];
  user?: string;
  seed?: number;
}

let cached: AzureOpenAIClient | null = null;

/** Returns a process-wide singleton client built from process.env. */
export function getAzureOpenAIClient(): AzureOpenAIClient {
  if (!cached) cached = createAzureOpenAIClient();
  return cached;
}

/** Convenience wrapper around the singleton client. */
export async function chat(opts: ChatOptions): Promise<ChatCompletion> {
  return getAzureOpenAIClient().chat(opts);
}

/** Convenience wrapper around the singleton client. */
export async function chatText(opts: ChatOptions): Promise<string> {
  return getAzureOpenAIClient().chatText(opts);
}

/** Convenience wrapper around the singleton client. */
export async function chatJson<T = unknown>(opts: ChatOptions): Promise<T> {
  return getAzureOpenAIClient().chatJson<T>(opts);
}

export type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
