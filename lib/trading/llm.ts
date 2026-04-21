import { AgentProfile, MarketSnapshot, StrategyDecision } from "./types";
import { chooseFallbackDecision } from "./strategies";

interface AnthropicMessageResponse {
  content?: Array<{ type: string; text?: string }>;
}

function extractJson(text: string): string {
  const fenced = text.match(/```json\s*([\s\S]+?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const objectMatch = text.match(/\{[\s\S]+\}/);
  return objectMatch ? objectMatch[0] : text;
}

export async function selectAgentDecision(params: {
  apiKey?: string;
  model: string;
  agent: AgentProfile;
  snapshot: MarketSnapshot;
  strategyDecisions: StrategyDecision[];
}): Promise<StrategyDecision> {
  const fallback = chooseFallbackDecision(params.strategyDecisions, params.agent.preferredStrategy);

  if (!params.apiKey) {
    return {
      ...fallback,
      reasoning: `${fallback.reasoning} Anthropic API key is missing, so the engine used deterministic strategy selection.`,
    };
  }

  const prompt = [
    `You are the trading brain for ${params.agent.name}.`,
    `Current ${params.snapshot.symbol} price: ${params.snapshot.price}.`,
    "Choose exactly one strategy decision from the candidate set.",
    "Only recommend a trade when confidence and setup quality are both strong.",
    "Respond with strict JSON: {\"strategy\":\"...\",\"signal\":\"UP|DOWN|HOLD\",\"confidence\":0.0,\"shouldTrade\":true|false,\"reasoning\":\"...\"}",
    "",
    "Candidate strategies:",
    ...params.strategyDecisions.map((decision) =>
      JSON.stringify({
        strategy: decision.strategy,
        signal: decision.signal,
        confidence: Number(decision.confidence.toFixed(3)),
        shouldTrade: decision.shouldTrade,
        reasoning: decision.reasoning,
        metrics: decision.metrics,
      }),
    ),
  ].join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: 400,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic request failed (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as AnthropicMessageResponse;
  const text = payload.content?.find((item) => item.type === "text")?.text;

  if (!text) {
    throw new Error("Anthropic response did not include text content.");
  }

  const parsed = JSON.parse(extractJson(text)) as Partial<StrategyDecision>;
  const matchingStrategy = params.strategyDecisions.find((decision) => decision.strategy === parsed.strategy);

  if (!matchingStrategy) {
    return fallback;
  }

  return {
    ...matchingStrategy,
    signal: parsed.signal ?? matchingStrategy.signal,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : matchingStrategy.confidence,
    shouldTrade: typeof parsed.shouldTrade === "boolean" ? parsed.shouldTrade : matchingStrategy.shouldTrade,
    reasoning: parsed.reasoning ?? matchingStrategy.reasoning,
  };
}
