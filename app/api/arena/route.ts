import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { agents, agentStrategyCards, rounds, strategies, trades } from "@/db/schema";

export async function GET() {
  const [agentRows, cardRows, roundRows, tradeRows, strategyRows] = await Promise.all([
    db.select().from(agents),
    db.select().from(agentStrategyCards),
    db.select().from(rounds),
    db.select().from(trades),
    db.select().from(strategies),
  ]);

  const serializedAgents = agentRows.map((agent) => ({
    ...agent,
    strategyCards: cardRows
      .filter((card) => card.agentId === agent.id)
      .map((card) => strategyRows.find((strategy) => strategy.id === card.strategyId)?.name)
      .filter(Boolean),
  }));

  const serializedTrades = tradeRows.map((trade) => ({
    ...trade,
    strategyName: strategyRows.find((strategy) => strategy.id === trade.strategyId)?.name ?? "Unknown",
    holdReason: trade.report,
  }));

  return NextResponse.json({
    agents: serializedAgents,
    rounds: roundRows,
    trades: serializedTrades,
    strategies: strategyRows,
  });
}
