"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

export default function StrategyPage() {
  const [surge, setSurge] = useState(1.8)
  const [winPct, setWinPct] = useState(60)

  // Simulation Logic
  const fire = surge >= 1.8 && winPct >= 50
  const entry = fire ? 0.50 : 0.55
  const stake = parseFloat(Math.min(10, Math.max(1, (winPct / 100) * 10)).toFixed(2))
  const exit = fire ? parseFloat((entry + (surge - 1) * 0.25).toFixed(2)) : parseFloat((entry - 0.05).toFixed(2))
  const pl = parseFloat(((exit - entry) * 10).toFixed(2))
  const ev = parseFloat(((winPct / 100) * pl - (1 - winPct / 100) * stake).toFixed(2))

  return (
    <div className="min-h-screen bg-stone-900 text-white p-6 font-sans">
      <div className="max-w-[800px] mx-auto pb-12">

        <Link href="/" className="text-[13px] text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-6">
          <span className="text-lg">←</span> Back to Arena
        </Link>

        {/* Profile */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#EEEDFE] flex items-center justify-center text-[16px] font-medium text-[#3C3489] shrink-0">
            LI
          </div>
          <div>
            <h2 className="text-[17px] font-medium text-slate-900">Lisa — Volume Surge agent</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="bg-[#EAF3DE] text-[#27500A] border-transparent font-medium hover:bg-[#EAF3DE]">▲ Signal: UP</Badge>
              <Badge variant="outline" className="bg-[#EEEDFE] text-[#3C3489] border-transparent font-medium hover:bg-[#EEEDFE]">BTC-15M</Badge>
              <Badge variant="outline" className="bg-[#FAEEDA] text-[#633806] border-transparent font-medium hover:bg-[#FAEEDA]">Win rate: 60%</Badge>
              <Badge variant="outline" className="bg-[#F1EFE8] text-[#444441] border-transparent font-medium hover:bg-[#F1EFE8]">Balance: $104.00</Badge>
            </div>
          </div>
        </div>

        {/* How it works */}
        <Card className="p-5 border-slate-200/80 shadow-sm rounded-xl mb-6">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">How the strategy works</div>

          <div className="space-y-4">
            {[
              { num: 1, title: 'Scan 15-min volume baseline', sub: 'Claude reads the rolling average volume for the past 3 candles as the baseline' },
              { num: 2, title: 'Detect surge threshold (>1.8× avg)', sub: 'If current candle volume exceeds 1.8× baseline, a surge is confirmed' },
              { num: 3, title: 'Check price direction alignment', sub: 'Volume surge must align with an upward price move — no surge on a down candle' },
              { num: 4, title: 'Emit UP signal → place Polymarket bet', sub: 'Calls bullpen.fi CLI to place the bet at current ask price on the UP outcome' },
              { num: 5, title: 'Monitor and exit at round close', sub: 'Polymarket positions auto-settle at 10:30 AM ET; Lisa books P/L at expiry' }
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#EEEDFE] text-[#3C3489] text-[10px] font-medium flex items-center justify-center shrink-0 mt-0.5">
                  {step.num}
                </div>
                <div>
                  <div className="text-[13.5px] font-medium text-slate-900">{step.title}</div>
                  <div className="text-[13px] text-slate-500 mt-0.5">{step.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Two Columns Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-5 border-slate-200/80 shadow-sm rounded-xl">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Entry logic</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-slate-600 w-28 shrink-0">Volume ratio</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#7F77DD] rounded-full" style={{ width: '90%' }} />
                </div>
                <span className="text-[13px] font-medium text-slate-900 w-10 text-right">1.8×</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-slate-600 w-28 shrink-0">Price momentum</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#7F77DD] rounded-full" style={{ width: '70%' }} />
                </div>
                <span className="text-[13px] font-medium text-slate-900 w-10 text-right">+0.3%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-slate-600 w-28 shrink-0">Confidence floor</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#7F77DD] rounded-full" style={{ width: '60%' }} />
                </div>
                <span className="text-[13px] font-medium text-slate-900 w-10 text-right">60%</span>
              </div>
            </div>
            <div className="mt-4 text-[12px] text-slate-500">Entry fires only when all three bars are satisfied simultaneously</div>
          </Card>

          <Card className="p-5 border-slate-200/80 shadow-sm rounded-xl">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Position sizing</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-slate-600 w-28 shrink-0">Base stake</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1D9E75] rounded-full" style={{ width: '50%' }} />
                </div>
                <span className="text-[13px] font-medium text-slate-900 w-10 text-right">$5.00</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-slate-600 w-28 shrink-0">Max risk/round</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1D9E75] rounded-full" style={{ width: '50%' }} />
                </div>
                <span className="text-[13px] font-medium text-slate-900 w-10 text-right">5%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-slate-600 w-28 shrink-0">Kelly fraction</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1D9E75] rounded-full" style={{ width: '40%' }} />
                </div>
                <span className="text-[13px] font-medium text-slate-900 w-10 text-right">0.4×</span>
              </div>
            </div>
            <div className="mt-4 text-[12px] text-slate-500">Kelly criterion applied at 40% fraction to limit ruin probability</div>
          </Card>
        </div>

        {/* Sim Tool */}
        <Card className="p-6 border-slate-200/80 shadow-sm rounded-xl mb-6">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-6">
            Live trade simulator — adjust the surge multiplier
          </div>

          <div className="space-y-5 mb-8">
            <div className="flex items-center gap-4">
              <span className="text-[13px] text-slate-600 w-[110px]">Volume surge</span>
              <Slider
                value={[surge]}
                onValueChange={(v) => setSurge(v[0])}
                min={1.0} max={3.5} step={0.1}
                className="flex-1"
              />
              <span className="w-12 text-right text-[14px] font-medium text-slate-900">{surge.toFixed(1)}×</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[13px] text-slate-600 w-[110px]">Win probability</span>
              <Slider
                value={[winPct]}
                onValueChange={(v) => setWinPct(v[0])}
                min={40} max={80} step={1}
                className="flex-1"
              />
              <span className="w-12 text-right text-[14px] font-medium text-slate-900">{winPct}%</span>
            </div>
          </div>

          <div className="flex pt-2 mb-6">
            <div className="flex-1 text-center py-3 border border-slate-200 rounded-l-lg bg-white">
              <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-1 font-semibold">Signal</div>
              <div className={`text-[15px] font-medium ${fire ? 'text-[#27500A]' : 'text-[#633806]'}`}>
                {fire ? '▲ UP' : '— NO TRADE'}
              </div>
            </div>
            <div className="flex-1 text-center py-3 border-y border-r border-slate-200 bg-white">
              <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-1 font-semibold">Entry</div>
              <div className="text-[15px] font-medium text-slate-900">${entry.toFixed(2)}</div>
            </div>
            <div className="flex-1 text-center py-3 border-y border-r border-slate-200 bg-white">
              <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-1 font-semibold">Stake</div>
              <div className="text-[15px] font-medium text-slate-900">${stake.toFixed(2)}</div>
            </div>
            <div className="flex-1 text-center py-3 border-y border-r border-slate-200 bg-white">
              <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-1 font-semibold">Exit</div>
              <div className="text-[15px] font-medium text-slate-900">${exit.toFixed(2)}</div>
            </div>
            <div className="flex-1 text-center py-3 border-y border-r border-slate-200 rounded-r-lg bg-white">
              <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-1 font-semibold">P/L</div>
              <div className={`text-[15px] font-medium ${pl >= 0 ? 'text-[#3B6D11]' : 'text-[#A32D2D]'}`}>
                {pl >= 0 ? '+' : ''}${Math.abs(pl).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
            <div className="font-mono text-[13px] text-slate-700">
              {fire ? (
                <>
                  Surge {surge.toFixed(1)}× detected — confidence {winPct}% — Kelly stake ${stake.toFixed(2)} → expected value
                  <span className={`ml-1 font-medium ${ev >= 0 ? 'text-[#3B6D11]' : 'text-[#A32D2D]'}`}>
                    {ev >= 0 ? '+' : ''}${Math.abs(ev).toFixed(2)}/round
                  </span>
                </>
              ) : (
                <>
                  Surge {surge.toFixed(1)}× below threshold — <span className="text-[#633806] font-medium">no trade fired</span> — waiting for 1.8× confirmation
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Prompt Buttons */}
        <div className="space-y-3">
          <button className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 transition-colors flex justify-between items-center group">
            How does Lisa compare to other agents like Marcus RSI Reversal and Nova Momentum Break for BTC-15M trading? Which strategy has the best edge on short timeframes?
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
          <button className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 transition-colors flex justify-between items-center group">
            Build a Claude AI agent brain for the Volume Surge strategy that calls the Anthropic API to make real-time BTC trading decisions on Bullpen Polymarket
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
        </div>

      </div>
    </div>
  )
}
