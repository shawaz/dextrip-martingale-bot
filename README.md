# Dextrip Client

This repo contains the arena UI plus an agentic BTC trading bot that can:

- pull live BTC market data from Binance
- score multiple strategies each cycle
- ask Claude to choose the best action
- record rounds and trades in Appwrite
- optionally place live Polymarket trades through Bullpen

## Bot Commands

```bash
npm run bot
npm run bot:once
```

`npm run bot` runs a continuous 60-second loop.

`npm run bot:once` runs a single evaluation cycle, which is the safest way to test setup.

## Environment

Create `.env.local` with:

```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-server-api-key
APPWRITE_DATABASE_ID=arena

ANTHROPIC_API_KEY=your-anthropic-key
ANTHROPIC_MODEL=claude-3-5-sonnet-latest

BULLPEN_MARKET_SLUG=your-polymarket-market-slug
BOT_LIVE_TRADING=false
BOT_INTERVAL_MINUTES=15
BOT_SYMBOL=BTCUSDT
BOT_ASSET=BTC-15M
BOT_CANDLE_LOOKBACK=60
BOT_DEFAULT_BANKROLL_USD=100
BOT_MAX_RISK_PER_TRADE_PCT=0.05
BOT_KELLY_FRACTION=0.4
```

## Modes

- Dry run is the default. The bot still creates rounds and trades in Appwrite, but Bullpen orders are simulated.
- Live mode is enabled with `BOT_LIVE_TRADING=true` or `npm run bot -- --live`.

## Strategy Engine

The bot currently evaluates:

- `Volume Surge`
- `RSI Reversal`
- `Momentum Break`

Each active Appwrite agent gets a preferred strategy based on its name, then Claude arbitrates the final action from the candidate set. If Anthropic is not configured, the engine falls back to deterministic strategy selection so the bot remains usable.
