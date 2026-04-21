export interface BotConfig {
  intervalMinutes: number;
  symbol: string;
  asset: string;
  candleLookback: number;
  liveTrading: boolean;
  dryRun: boolean;
  once: boolean;
  useLlmDecider: boolean;
  anthropicApiKey?: string;
  anthropicModel: string;
  appwriteEndpoint?: string;
  appwriteProjectId?: string;
  appwriteApiKey?: string;
  appwriteDatabaseId: string;
  bullpenMarketSlug?: string;
  defaultBankrollUsd: number;
  maxRiskPerTradePct: number;
  kellyFraction: number;
  skipPromotionUpdates: boolean;
}

function getBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function getNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadBotConfig(argv: string[]): BotConfig {
  const once = argv.includes("--once");
  const liveTrading = argv.includes("--live") || getBoolean(process.env.BOT_LIVE_TRADING, false);

  return {
    intervalMinutes: getNumber(process.env.BOT_INTERVAL_MINUTES, 15),
    symbol: process.env.BOT_SYMBOL ?? "BTCUSDT",
    asset: process.env.BOT_ASSET ?? "BTC-15M",
    candleLookback: getNumber(process.env.BOT_CANDLE_LOOKBACK, 60),
    liveTrading,
    dryRun: !liveTrading,
    once,
    useLlmDecider: getBoolean(process.env.BOT_USE_LLM_DECIDER, false),
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
    appwriteEndpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    appwriteProjectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    appwriteApiKey: process.env.APPWRITE_API_KEY,
    appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID ?? "arena",
    bullpenMarketSlug: process.env.BULLPEN_MARKET_SLUG,
    defaultBankrollUsd: getNumber(process.env.BOT_DEFAULT_BANKROLL_USD, 100),
    maxRiskPerTradePct: getNumber(process.env.BOT_MAX_RISK_PER_TRADE_PCT, 0.05),
    kellyFraction: getNumber(process.env.BOT_KELLY_FRACTION, 0.4),
    skipPromotionUpdates: getBoolean(process.env.BOT_SKIP_PROMOTION_UPDATES, true),
  };
}
