import "server-only";
import type { AssistantProvider } from "./types";
import { rulesProvider } from "./rules-provider";
import { createAnthropicProvider } from "./anthropic-provider";

let cached: AssistantProvider | null = null;

/** Picks the configured provider. With no API key, the rule-based provider is used — nothing pretends to be AI. */
export function getAssistant(): AssistantProvider {
  if (cached) return cached;
  const key = process.env.ANTHROPIC_API_KEY;
  cached = key ? createAnthropicProvider(key) : rulesProvider;
  return cached;
}

export function assistantMode(): "ai" | "rules" {
  return process.env.ANTHROPIC_API_KEY ? "ai" : "rules";
}
