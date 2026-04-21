"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Crown, History, LayoutGrid, TrendingUp, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const strategyCatalog = [
  {
    name: "Volume Surge",
    score: 84,
    report: "Strong when volume expands with clean directional follow-through.",
    when: "Use when volume spikes above recent baseline with strong candle close.",
    weakness: "Can be trapped by fake spikes.",
    improve: "Add higher timeframe trend filter.",
  },
  {
    name: "RSI Reversal",
    score: 74,
    report: "Useful for snapback entries after overstretched moves.",
    when: "Use when price stretches too far and RSI hits extremes.",
    weakness: "Gets punished in hard trends.",
    improve: "Pair with support and resistance.",
  },
  {
    name: "Momentum Break",
    score: 81,
    report: "Best for fast breakout continuation when range compression breaks.",
    when: "Use when price breaks a tight range with conviction.",
    weakness: "False breakouts are common.",
    improve: "Require retest confirmation.",
  },
  {
    name: "Trend Ride",
    score: 72,
    report: "Good when the market is already trending cleanly.",
    when: "Use when the market is moving in one direction with structure.",
    weakness: "Late entries can be punished.",
    improve: "Use trailing stops and pullback entries.",
  },
  {
    name: "VWAP Reclaim",
    score: 78,
    report: "Reliable intraday structure setup around fair value.",
    when: "Use when price reclaims VWAP with supporting volume.",
    weakness: "Weak in flat sessions.",
    improve: "Filter low participation periods.",
  },
  {
    name: "Range Fade",
    score: 69,
    report: "Solid in sideways conditions, weak in expansion.",
    when: "Use when price repeatedly rejects the same boundaries.",
    weakness: "Breakouts kill it.",
    improve: "Disable in volatility expansion.",
  },
  {
    name: "Trend Pullback",
    score: 76,
    report: "Cleaner entries inside healthy trends.",
    when: "Use when price pulls back into a strong trend.",
    weakness: "Fails when trend is exhausted.",
    improve: "Use moving average and structure alignment.",
  },
  {
    name: "Liquidity Sweep Reversal",
    score: 71,
    report: "Can catch high RR reversals after stop hunts.",
    when: "Use when price sweeps highs or lows then snaps back.",
    weakness: "Hard to time cleanly.",
    improve: "Wait for reclaim confirmation.",
  },
]

type Agent = {
  id: string
  name: string
  initials: string
  color: string
  won: number
  loss: number
  winRate: number
  bankroll: number
  startingBankroll: number
  totalPnl: number
  dailyPnl: number
  maxDrawdown: number
  timeframe?: string
  promoted?: boolean
  strategyCards?: string[]
}

type Round = {
  $id: string
  roundId: string
  asset: string
  timeframe?: string
  startTime: string
  endTime: string
  entryPrice?: number
  exitPrice?: number
  status: "active" | "closed"
}

type Trade = {
  id: string
  agentId: string
  roundId: string
  strategyName: string
  signal: "UP" | "DOWN" | "HOLD"
  stake: number
  pnl: number
  strategyScore?: number
  confidence?: number
  holdReason?: string
  entryPrice?: number
  exitPrice?: number | null
  createdAt: string
  result: "pending" | "won" | "loss"
}

function formatCountdown(endTime?: string): string {
  if (!endTime) return "--:--"
  const diff = new Date(endTime).getTime() - Date.now()
  if (Number.isNaN(diff)) return "--:--"
  if (diff <= 0) return "00:00"
  const mins = Math.floor(diff / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function formatEtWindow(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) return "--:-- to --:-- ET"
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }
  return `${new Date(startTime).toLocaleTimeString("en-US", options)} - ${new Date(endTime).toLocaleTimeString("en-US", options)} ET`
}

function formatTimeframe(value?: string): string {
  return value || "15m"
}

export default function ArenaPage() {
  const [activeTab, setActiveTab] = useState("arena")
  const [agents, setAgents] = useState<Agent[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [timeLeft, setTimeLeft] = useState("--:--")
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [agentFilter, setAgentFilter] = useState("all")
  const [resultFilter, setResultFilter] = useState("all")
  const [lastUpdated, setLastUpdated] = useState("")

  const fetchData = async () => {
    try {
      const response = await fetch("/api/arena", { cache: "no-store" })
      const payload = (await response.json()) as { agents: Agent[]; rounds: Round[]; trades: Trade[] }
      setAgents(payload.agents)
      setRounds(payload.rounds)
      setTrades(payload.trades)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")
        const payload = (await response.json()) as { price?: string }
        if (payload.price) setBtcPrice(Number(payload.price))
      } catch (error) {
        console.error("Failed to fetch BTC price:", error)
      }
    }

    fetchPrice()
    const timer = setInterval(fetchPrice, 15000)
    return () => clearInterval(timer)
  }, [])

  const activeRounds = useMemo(
    () => [...rounds.filter((round) => round.status === "active")].sort((left, right) => new Date(right.startTime).getTime() - new Date(left.startTime).getTime()),
    [rounds],
  )
  const primaryRound = activeRounds[0]

  useEffect(() => {
    setTimeLeft(formatCountdown(primaryRound?.endTime))
    const timer = setInterval(() => {
      setTimeLeft(formatCountdown(primaryRound?.endTime))
    }, 1000)
    return () => clearInterval(timer)
  }, [primaryRound?.endTime])

  const leaderboardData = useMemo(() => {
    return agents
      .map((agent) => {
        const agentTrades = trades.filter((trade) => trade.agentId === agent.id).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        const latestTrade = agentTrades[0]
        const strategyMeta = strategyCatalog.find((strategy) => strategy.name === latestTrade?.strategyName)
        return {
          ...agent,
          currentTrade: latestTrade,
          strategyScore: latestTrade?.strategyScore ?? strategyMeta?.score,
          strategyReport: latestTrade?.holdReason ?? strategyMeta?.report ?? "No strategy report yet.",
          roi: agent.startingBankroll ? ((Number(agent.totalPnl ?? 0) / Number(agent.startingBankroll)) * 100) : 0,
          consistencyScore: Math.max(0, Number(agent.winRate ?? 0) - Number(agent.maxDrawdown ?? 0) * 0.35),
        }
      })
      .sort((a, b) => Number(b.totalPnl ?? 0) - Number(a.totalPnl ?? 0) || Number(b.consistencyScore ?? 0) - Number(a.consistencyScore ?? 0) || Number(b.winRate) - Number(a.winRate) || Number((b.strategyScore ?? 0)) - Number((a.strategyScore ?? 0)))
  }, [agents, trades])

  const promotedAgents = leaderboardData.filter((agent) => agent.promoted)
  const totalWins = agents.reduce((sum, agent) => sum + Number(agent.won ?? 0), 0)

  const filteredRounds = [...rounds]
    .sort((left, right) => new Date(right.startTime).getTime() - new Date(left.startTime).getTime())
    .filter((round) => {
      const text = `${round.roundId} ${round.asset}`.toLowerCase()
      return text.includes(search.toLowerCase())
    })

  const filteredTrades = [...trades]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .filter((trade) => {
      const agent = agents.find((candidate) => candidate.id === trade.agentId)
      const text = `${agent?.name ?? ""} ${trade.strategyName}`.toLowerCase()
      const matchesSearch = text.includes(search.toLowerCase())
      const matchesAgent = agentFilter === "all" || agent?.name === agentFilter
      const matchesResult = resultFilter === "all" || trade.result === resultFilter
      return matchesSearch && matchesAgent && matchesResult
    })

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Dextrip Arena</h1>
            <p className="text-sm text-zinc-500">BTC 15m paper battle. Agents compete with strategy discipline before earning real execution rights.</p>
          </div>
          <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/50 text-red-500 px-3 py-1.5 rounded-full text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {primaryRound ? `BTC 15m Live • Updated ${lastUpdated || "--"}` : "Waiting For Bot"}
          </div>
        </div>

        <div className="bg-[#121212] border border-[#222222] rounded-xl p-5 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Current BTC round</span>
              <h2 className="text-lg font-medium">{formatEtWindow(primaryRound?.startTime, primaryRound?.endTime)}</h2>
              <div className="flex flex-wrap gap-4 pt-1 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500/50" />
                  BTC price <span className="text-zinc-100 font-mono font-bold">{btcPrice ? `$${btcPrice.toLocaleString()}` : "--"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500/50" />
                  Entry <span className="text-zinc-100 font-mono font-bold">{primaryRound?.entryPrice ? `$${primaryRound.entryPrice.toLocaleString()}` : "--"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500/50" />
                  Timeframe <span className="text-zinc-100 font-mono font-bold">{formatTimeframe(primaryRound?.timeframe)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end justify-center gap-3">
            <div>
              <div className="text-3xl font-mono font-medium tracking-tighter">{timeLeft}</div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold text-right">remaining in round</div>
            </div>
          </div>
        </div>

        <div className="bg-[#121212] border border-[#222222] rounded-xl p-5 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Promoted for live execution</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {promotedAgents.length ? promotedAgents.map((agent) => (
                  <div key={agent.id} className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs">
                    <Crown className="h-3.5 w-3.5 text-amber-400" />
                    <span>{agent.name}</span>
                    <span className="text-zinc-400">{Math.round(agent.winRate ?? 0)}%</span>
                  </div>
                )) : <span className="text-sm text-zinc-500">No promoted agents yet</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Active Agents", value: agents.length, icon: LayoutGrid },
            // { label: "BTC Price", value: btcPrice ? `$${Math.round(btcPrice).toLocaleString()}` : "--", icon: TrendingUp },
            { label: "Total Rounds", value: rounds.length, icon: History },
            { label: "Total Wins", value: totalWins, color: "text-amber-500", icon: Zap },
            { label: "Total PnL", value: `$${agents.reduce((sum, agent) => sum + Number(agent.totalPnl ?? 0), 0).toFixed(2)}`, color: "text-cyan-400", icon: TrendingUp },
            { label: "Avg ROI", value: `${(agents.length ? agents.reduce((sum, agent) => sum + ((Number(agent.totalPnl ?? 0) / Math.max(1, Number(agent.startingBankroll ?? 100))) * 100), 0) / agents.length : 0).toFixed(1)}%`, color: "text-violet-400", icon: TrendingUp },
          ].map((stat, i) => (
            <div key={i} className="bg-[#121212] p-4 rounded-xl space-y-2 border border-[#222222]">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[10px] uppercase tracking-wider font-bold">{stat.label}</span>
                <stat.icon className="w-3 h-3 opacity-50" />
              </div>
              <div className={cn("text-xl font-medium", stat.color)}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-lg border border-[#222222] w-fit shadow-inner">
            {[
              { id: "arena", label: "Arena Leaderboard" },
              { id: "strategy", label: "Strategy" },
              { id: "round", label: "Round History" },
              { id: "trade", label: "Trade History" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                  activeTab === tab.id ? "bg-[#1a1a1a] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search agent or strategy"
              className="bg-[#121212] border border-[#222222] rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
            <select
              value={agentFilter}
              onChange={(event) => setAgentFilter(event.target.value)}
              className="bg-[#121212] border border-[#222222] rounded-lg px-3 py-2 text-xs text-white outline-none"
            >
              <option value="all">All agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.name}>{agent.name}</option>
              ))}
            </select>
            <select
              value={resultFilter}
              onChange={(event) => setResultFilter(event.target.value)}
              className="bg-[#121212] border border-[#222222] rounded-lg px-3 py-2 text-xs text-white outline-none"
            >
              <option value="all">All results</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="loss">Loss</option>
            </select>
          </div>
        </div>

        <div className="bg-[#121212] border border-[#222222] rounded-xl overflow-hidden shadow-sm">
          {activeTab === "arena" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a1a1a] border-b border-[#222222]">
                  <tr>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">#</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Agent</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Strategy</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Score</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Signal</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Bankroll</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Loss</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Won</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">PnL</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">ROI</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">DD</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Win Rate</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {leaderboardData.map((agent, i) => (
                    <tr key={agent.id} className="group transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-4 whitespace-nowrap text-zinc-500 font-mono">{i + 1}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg" style={{ backgroundColor: `${agent.color}20`, color: agent.color, border: `1px solid ${agent.color}30` }}>
                            {agent.initials}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-100">{agent.name}</span>
                            {agent.promoted && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-zinc-400 italic">{agent.currentTrade?.strategyName || "--"}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {agent.currentTrade?.strategyName && agent.strategyScore ? (
                          <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", agent.strategyScore >= 80 ? "bg-green-500/10 text-green-400 border border-green-500/20" : agent.strategyScore >= 70 ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20")}>
                            {agent.strategyScore}/100
                          </span>
                        ) : (
                          <span className="text-zinc-600">--</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold tracking-tighter uppercase border",
                          agent.currentTrade?.signal === "UP" ? "bg-green-500/10 text-green-500 border-green-500/20" : agent.currentTrade?.signal === "DOWN" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700",
                        )}>
                          {agent.currentTrade?.signal === "UP" && "▲"}
                          {agent.currentTrade?.signal === "DOWN" && "▼"}
                          {agent.currentTrade?.signal || "WAITING"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-mono text-zinc-200">${Number(agent.bankroll ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap font-mono text-red-500/70">{agent.loss}</td>
                      <td className="px-4 py-4 whitespace-nowrap font-mono text-green-500/70">{agent.won}</td>
                      <td className={cn("px-4 py-4 whitespace-nowrap font-mono", Number(agent.totalPnl ?? 0) >= 0 ? "text-green-400" : "text-red-400")}>${Number(agent.totalPnl ?? 0).toFixed(2)}</td>
                      <td className={cn("px-4 py-4 whitespace-nowrap font-mono", Number(agent.roi ?? 0) >= 0 ? "text-violet-300" : "text-red-300")}>{Number(agent.roi ?? 0).toFixed(1)}%</td>
                      <td className="px-4 py-4 whitespace-nowrap font-mono text-orange-300">${Number(agent.maxDrawdown ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3 min-w-[100px]">
                          <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#222222]">
                            <div className="h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ width: `${agent.winRate ?? 0}%`, backgroundColor: agent.color }} />
                          </div>
                          <span className="font-mono text-zinc-400 font-bold">{Math.round(agent.winRate ?? 0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <Link href={`/strategy/${agent.id}`} className="inline-flex items-center gap-1 bg-transparent border border-[#333333] hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-md transition-all duration-200 text-[10px] font-bold uppercase tracking-wider">
                          Details <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "strategy" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a1a1a] border-b border-[#222222]">
                  <tr>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Strategy</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Score</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Report</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">When to Use</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Weakness</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Improve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {strategyCatalog.map((strategy) => (
                    <tr key={strategy.name} className="hover:bg-white/[0.01] align-top">
                      <td className="px-4 py-4 text-zinc-100 font-semibold">{strategy.name}</td>
                      <td className="px-4 py-4">
                        <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", strategy.score >= 80 ? "bg-green-500/10 text-green-400 border border-green-500/20" : strategy.score >= 70 ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20")}>
                          {strategy.score}/100
                        </span>
                      </td>
                      <td className="px-4 py-4 text-zinc-300">{strategy.report}</td>
                      <td className="px-4 py-4 text-zinc-400">{strategy.when}</td>
                      <td className="px-4 py-4 text-zinc-400">{strategy.weakness}</td>
                      <td className="px-4 py-4 text-zinc-500">{strategy.improve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "round" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a1a1a] border-b border-[#222222]">
                  <tr>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Round ID</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Timeframe</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Asset</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">ET Window</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Entry</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Exit</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {filteredRounds.map((round) => (
                    <tr key={round.roundId} className="hover:bg-white/[0.01]">
                      <td className="px-4 py-4 font-mono text-zinc-400">{round.roundId}</td>
                      <td className="px-4 py-4 text-zinc-300">15m</td>
                      <td className="px-4 py-4 text-zinc-100 font-bold">{round.asset}</td>
                      <td className="px-4 py-4 text-zinc-300">{formatEtWindow(round.startTime, round.endTime)}</td>
                      <td className="px-4 py-4 font-mono text-zinc-300">${round.entryPrice?.toLocaleString() || "---"}</td>
                      <td className="px-4 py-4 font-mono text-zinc-300">${round.exitPrice?.toLocaleString() || "---"}</td>
                      <td className="px-4 py-4">
                        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest", round.status === "active" ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-zinc-800 text-zinc-500")}>
                          {round.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "trade" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a1a1a] border-b border-[#222222]">
                  <tr>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Time</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Agent</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Timeframe</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Strategy</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Signal</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Result</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Stake</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">PnL</th>
                    <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Why / HOLD reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {filteredTrades.map((trade) => {
                    const agent = agents.find((candidate) => candidate.id === trade.agentId)
                    return (
                      <tr key={trade.id} className="hover:bg-white/[0.01]">
                        <td className="px-4 py-4 text-zinc-500 font-mono">{trade.createdAt ? new Date(trade.createdAt).toLocaleString() : "--"}</td>
                        <td className="px-4 py-4 font-bold text-zinc-100">{agent?.name}</td>
                        <td className="px-4 py-4 text-zinc-400">15m</td>
                        <td className="px-4 py-4 text-zinc-400 italic">{trade.strategyName}</td>
                        <td className="px-4 py-4">
                          <span className={cn("font-bold", trade.signal === "UP" ? "text-green-500" : "text-red-500")}>{trade.signal}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", trade.result === "won" ? "bg-green-500/20 text-green-500 border border-green-500/20" : trade.result === "loss" ? "bg-red-500/20 text-red-500 border border-red-500/20" : "bg-zinc-800 text-zinc-400")}>
                            {trade.result}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono text-zinc-300">${Number(trade.stake ?? 0).toFixed(2)}</td>
                        <td className={cn("px-4 py-4 font-mono", Number(trade.pnl ?? 0) >= 0 ? "text-green-400" : "text-red-400")}>${Number(trade.pnl ?? 0).toFixed(2)}</td>
                        <td className="px-4 py-4 text-zinc-400 max-w-[320px] truncate">{trade.holdReason || "--"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
