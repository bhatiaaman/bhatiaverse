# Bhatiaverse — Agent User Guide

> **Purpose:** This guide explains every intelligence agent on the Orders page — what it checks, why each rule exists, how scores are calculated, and what the verdicts mean. Use this as a reference when the agent flags your trade.

---

## How Agents Work — The Core Model

When you fill in an order form and click **Run Analysis**, the system:

1. Collects live data (positions, orders, market sentiment, sector performance, VIX, candles)
2. Passes that data through a set of **check functions** (one per rule)
3. Each check either **passes** (green tick) or **fires** (adds a risk score)
4. All fired scores are summed → **verdict**

### Direction Mapping

Every check compares the trade's direction against something else. The direction is derived from instrument type + transaction type:

| Instrument | Transaction | Trade Direction |
|---|---|---|
| CE (Call) | BUY | Bullish |
| CE (Call) | SELL | Bearish |
| PE (Put) | BUY | Bearish |
| PE (Put) | SELL | Bullish |
| EQ / FUT | BUY | Bullish |
| EQ / FUT | SELL | Bearish |

### Verdict Scale

| Cumulative Risk Score | Verdict | Meaning |
|---|---|---|
| 0 | **Clear** | No issues found |
| 1 – 19 | **Caution** | Minor concerns, trade with awareness |
| 20 – 44 | **Warning** | Meaningful risks, review before placing |
| ≥ 45 | **Danger** | Multiple strong risks — reconsider |

### Severity Labels

Each individual check has a severity:
- **caution** — minor, informational
- **warning** — meaningful risk, pay attention

---

## Agent 1 — Behavioral

> *"Am I trading a habit rather than a setup?"*

Checks personal trading patterns and portfolio state. Runs on **every** order. No extra data needed — uses live positions, open orders, and market data.

---

### B1: Adding to a Losing Position

**Fires when:** You already hold the same symbol in the same direction (long adding long, or short adding short) and that existing position is at a loss.

| Exchange | Loss threshold |
|---|---|
| NFO (Options/Futures) | ₹500 or more |
| NSE/BSE (Equity) | ₹200 or more |

**Risk score:** 25 (Warning)

**Why it matters:** Averaging into losing trades is one of the most common ways retail traders blow accounts. You are increasing size on a trade that the market is already telling you is wrong.

---

### B2: Going Against the Trend

**Fires when:** Your trade direction conflicts with the overall market bias and/or the sector bias.

- Market bias = intraday bias from sentiment API (falls back to daily if intraday unavailable)
- Sector bias = today's % change for the stock's sector (>+0.3% = bullish, <-0.3% = bearish, neutral otherwise)

| Conflict | Risk score | Severity |
|---|---|---|
| Market only, OR sector only | 10 | caution |
| Both market AND sector | 20 | warning |

**Why it matters:** Counter-trend trades have lower hit rates. When both the broad market and the sector are moving against you, the odds drop further.

---

### B3: Too Many Open Positions

**Fires when:** You have 4 or more open positions before placing a new order.

| Open positions | Risk score | Severity |
|---|---|---|
| 4 or 5 | 8 | caution |
| 6+ | 15 | warning |

**Why it matters:** Overtrading spreads attention and capital thin. Each additional position adds correlation risk and makes it harder to manage stops.

---

### B4: High VIX

**Fires when:** India VIX (market volatility index) is elevated.

| VIX | Risk score | Severity |
|---|---|---|
| 18 – 25 | 8 | caution |
| > 25 | 18 | warning |

**Why it matters:** High VIX = expensive premiums + wider swings. Options buyers lose more to theta decay; stop-losses get hit more often. Position sizing should be reduced.

---

### B5: Duplicate Open Order

**Fires when:** There is already an open or pending order for the same symbol.

**Risk score:** 12 (caution)

**Why it matters:** Placing a second order for the same symbol doubles your exposure and may create unintended position sizes if both orders fill.

---

### B6: Sector Overexposure

**Fires when:** 2 or more of your existing positions are already in the same sector as the trade you are placing.

| Sector positions | Risk score | Severity |
|---|---|---|
| 2 | 10 | caution |
| 3+ | 18 | warning |

**Why it matters:** Sector correlation means all those positions will move together when the sector moves. This is concentrated risk, not diversification.

---

**Behavioral max possible score:** 106 (all 6 fires simultaneously — rare)

---

## Agent 2 — Structure

> *"Is the market set up structurally to support this trade?"*

Checks indicators (EMA, VWAP, ADX, RSI, volume, opening range, daily structure). Requires 15m candle data from Kite.

**MIS (intraday):** 8 checks
**NRML / CNC (swing):** 8 + 4 additional = 12 checks

---

### S1: EMA Alignment on 15m

Checks whether price and the 9/21 EMA stack are aligned with the trade direction.

| Condition | Risk score | Severity |
|---|---|---|
| Full mismatch: price, EMA9, EMA21 all bearish → you're buying | 15 | warning |
| Full mismatch: all bullish → you're selling | 15 | warning |
| Partial: price on wrong side of EMA9 only | 8 | caution |

**Pass label:** "EMA aligned on 15m"

---

### S2: VWAP Alignment

VWAP (Volume Weighted Average Price) is the institutional reference price for the day. Intraday participants treat price above/below VWAP as bullish/bearish bias.

| Condition | Risk score | Severity |
|---|---|---|
| Buying below VWAP or selling above VWAP | 10 | caution |

**Pass label:** "Price above/below VWAP ₹X — aligned with trade"

---

### S3: ADX Market Regime (15m)

ADX measures trend strength (not direction). Below 20 = choppy, range-bound, directionless.

| Condition | Risk score | Severity |
|---|---|---|
| ADX < 20 on 15m | 8 | caution |

**Why it matters:** Breakout and momentum trades have poor hit rates in low-ADX environments. The market lacks direction to sustain a move.

---

### S4: RSI Extremes (15m)

| Condition | Risk score | Severity |
|---|---|---|
| RSI > 70, buying | 15 | warning |
| RSI < 30, selling | 15 | warning |

**Why it matters:** Buying overbought or selling oversold means entering an extended move with mean-reversion risk.

**Pass label:** "RSI X on 15m — not overbought/oversold"

---

### S5: Volume Confirmation (15m)

Compares last candle's volume to the 20-candle average.

| Condition | Risk score | Severity |
|---|---|---|
| Last candle < 50% of 20-bar average | 8 | caution |

**Pass labels:**
- "Volume confirms upmove" (bullish trade)
- "Volume confirms downmove" (bearish trade)

---

### S6: Opening Range (Intraday Only)

The opening range is the high/low of the first two 15m candles (09:15 and 09:30). Trading before a breakout of this range is a no-confirmation entry.

| Condition | Risk score | Severity |
|---|---|---|
| Price still inside opening range | 8 | caution |

**Pass labels:**
- "Opening range breakout above ₹X"
- "Opening range breakdown below ₹X"

---

### S7: Daily HH/HL Structure

Looks at the last 5 daily closes to detect a downtrend (lower closes) or uptrend (higher closes).

| Condition | Risk score | Severity |
|---|---|---|
| 3+ of 4 days closed lower → buying | 18 | warning |
| 3+ of 4 days closed higher → selling | 18 | warning |
| 2 of 4 days against (mild) | 10 | caution |

---

### S8: Market Breadth

Compares advances vs declines across the market.

| Condition | Risk score | Severity |
|---|---|---|
| <35% advances (most stocks falling), buying | 8 | caution |
| >65% advances (most stocks rising), selling | 8 | caution |

---

### S9: Daily EMA Alignment *(Swing only — NRML/CNC)*

Checks price vs EMA50 and EMA200 on the daily chart.

| Condition | Risk score | Severity |
|---|---|---|
| Below both EMA50 & EMA200, buying | 18 | warning |
| Above both EMA50 & EMA200, selling | 18 | warning |
| Below EMA50 only, buying | 10 | caution |
| Above EMA50 only, selling | 10 | caution |

---

### S10: Weekly Trend *(Swing only)*

Checks price vs EMA20 on the weekly chart.

| Condition | Risk score | Severity |
|---|---|---|
| Below weekly EMA20, buying | 10 | caution |
| Above weekly EMA20, selling | 10 | caution |

---

### S11: Daily Momentum *(Swing only)*

Looks at the last 10 trading days — counts up vs down closes.

| Condition | Risk score | Severity |
|---|---|---|
| 7+ of 9 days closed down, buying | 8 | caution |
| 7+ of 9 days closed up, selling | 8 | caution |

---

### S12: Relative Strength vs NIFTY *(Swing only)*

Compares the stock's 20-day return against NIFTY's 20-day return.

| Condition | Risk score | Severity |
|---|---|---|
| Stock underperformed NIFTY by >5%, buying | 8 | caution |
| Stock outperformed NIFTY by >5%, selling | 8 | caution |

---

**Structure max possible scores:**
- MIS: 90 (all 8 fires)
- Swing: 138 (all 12 fires)

---

## Agent 3 — Pattern

> *"What is price action saying in the last 1–5 candles?"*

Detects candlestick patterns, volume signals, and momentum on 15m (and daily for swing trades).

**MIS:** 8 checks on 15m
**NRML/CNC:** 8 + 4 additional = 12 checks

---

### Candlestick Patterns Detected

| Pattern | Candles | Direction | Strength |
|---|---|---|---|
| Doji | 1 | Neutral | Weak |
| Hammer | 1 | Bullish | Moderate |
| Hanging Man | 1 | Bearish | Moderate |
| Shooting Star | 1 | Bearish | Moderate |
| Inverted Hammer | 1 | Neutral | Moderate |
| Bullish Engulfing | 2 | Bullish | Strong |
| Bearish Engulfing | 2 | Bearish | Strong |
| Bullish Harami | 2 | Bullish | Moderate |
| Bearish Harami | 2 | Bearish | Moderate |
| Morning Star | 3 | Bullish | Strong |
| Evening Star | 3 | Bearish | Strong |
| Three White Soldiers | 3 | Bullish | Strong |
| Three Black Crows | 3 | Bearish | Strong |

**Scores by conflict severity:**

| Pattern strength | Risk score | Severity |
|---|---|---|
| Strong | 18 | warning |
| Moderate | 10 | caution |
| Weak | 5 | caution |

---

### P1: Candlestick Patterns on 15m

Checks the last 3 candles for conflicting patterns.

**Pass:** No conflicting pattern, or pattern confirms trade direction.

---

### P2: Volume Alignment on 15m

Detects volume signals:

| Signal | Fires | Risk score | Severity |
|---|---|---|---|
| Climax | Always (any direction) | 12 | warning |
| Divergence | Price-volume disagree | 8 | caution |
| Fakeout | Breakout on low volume | 10 | caution |
| Weak bullish on SELL | Weakly bullish against sell | 5 | caution |
| Weak bearish on BUY | Weakly bearish against buy | 5 | caution |

---

### P3: Big Candle on 15m

**Fires when:** Last candle body > 2× ATR(14). Entering after an extended candle = higher mean-reversion risk.

**Risk score:** 15 (warning)

---

### P4: Inside Bar on 15m

**Fires when:** Current candle is fully contained within previous candle's high/low range. This means the breakout has not been confirmed yet.

**Risk score:** 8 (caution)

---

### P5: Wick Rejection on 15m

**Fires when:** The last candle has a long wick pointing in the trade direction — sellers rejected the highs (for a buy) or buyers rejected the lows (for a sell). Wick > 60% of candle range.

**Risk score:** 10 (caution)

---

### P6: Consecutive Candles Against Trade (15m)

**Fires when:** 3 or more consecutive candles just closed against the trade direction.

**Risk score:** 8 (caution)

---

### P7: Pin Bar on 15m

**Fires when:** Last candle has a small body (<30% of range) with a long wick in the trade direction — Shooting Star conflicts with BUY, Hammer conflicts with SELL.

**Risk score:** 15 (warning)

---

### P8: Engulfing on Last 2 Candles (15m)

A stronger version of P1 — checks specifically the most recent 2 candles for a fresh engulfing pattern.

**Risk score:** 15 (warning)

---

### P9: Candlestick Patterns on Daily *(Swing only)*

Same pattern detection as P1 but on daily candles. Daily patterns carry higher weight (score +5 vs 15m equivalent).

---

### P10: Big Daily Candle *(Swing only)*

Body > 2× ATR(14) on daily. Entering the day after a wide-range candle has higher mean-reversion risk.

**Risk score:** 15 (warning)

---

### P11: Consecutive Daily Candles *(Swing only)*

**Fires when:** 4 or more consecutive daily candles just closed against the trade direction.

**Risk score:** 18 (warning)

---

### P12: Volume Alignment on Daily *(Swing only)*

Detects climax or divergence on daily volume.

| Signal | Risk score | Severity |
|---|---|---|
| Climax | 12 | warning |
| Divergence | 8 | caution |

---

## Agent 4 — Station

> *"Am I at the right price level — a zone worth trading from?"*

Detects Support/Resistance zones and evaluates the current price's position relative to them. Requires 15m candle data.

**MIS:** 5 checks
**NRML/CNC:** 5 + 2 additional = 7 checks

---

### Zone Detection

Zones are identified using multiple factors that give them confluence:
- Prior swing highs/lows
- Consolidation clusters
- Volume profile clusters
- S/R flip points
- Liquidity sweeps
- EMA confluence (daily EMA50/200)

**Quality score:** 1–10 based on number of confluencing factors.

---

### Zone States (detected automatically)

| State | Meaning |
|---|---|
| BREAK_RETEST | Price broke through zone, pulled back to it — high-probability continuation |
| REJECTION | Price touched zone with a strong wick — reversal signal |
| AT_ZONE | Price at zone, no clear wick or BOS yet |
| APPROACHING | Price within 2% of zone but not yet at it |
| INSIDE_ZONE | 3+ of last 5 candles straddling zone — choppy, no-trade area |

---

### ST1: Zone Presence

**Pass:** Confirms which zone is nearby, shows its type, price, and key factors (e.g., "Support ₹2609 — Prior swing low, Volume cluster").

No risk score — this is purely informational.

---

### ST2: Zone Alignment

**Fires when:** Trade direction conflicts with the zone type.

| Conflict | Risk score | Severity |
|---|---|---|
| Buying into resistance (without BOS) | 15 | warning |
| Selling into support (without BOS) | 15 | warning |

**Pass:** Buying at support, selling at resistance, or BOS flip (zone changed role).

---

### ST3: Zone Scenario (A/B/C)

Shows which trading scenario is active.

| State | Result |
|---|---|
| BREAK_RETEST | Pass — "high-probability continuation" |
| REJECTION | Pass — "wick confirms reversal" |
| AT_ZONE / APPROACHING | Pass — "watch for setup confirmation" |
| INSIDE_ZONE | Fire — risk score 12, caution |

---

### ST4: Volume Expansion on Break

Only active when state is BREAK_RETEST.

| Break candle volume vs 20-bar avg | Risk score | Severity |
|---|---|---|
| < 1.5× average | 8 | caution |
| ≥ 1.5× average | Pass | — |

**Why it matters:** Fakeouts (false breakouts) typically happen on weak volume. Genuine institutional breakouts expand volume.

---

### ST5: Zone Strength

Evaluates the quality and retest count of the nearby zone.

| Condition | Risk score | Severity |
|---|---|---|
| Quality < 4/10 | 8 | caution |
| Tested 4+ times | 8 | caution |
| Quality ≥ 6 and tests ≤ 3 | Pass "Strong zone" | — |

---

### ST6: Daily Timeframe Confluence *(Swing only)*

**Fires when:** The zone has no daily timeframe factor (daily EMA or daily swing S/R).

**Risk score:** 10 (caution)

**Why it matters:** For swing trades, zones with multi-timeframe confluence are significantly more reliable than 15m-only zones.

---

### ST7: Daily Approach Angle *(Swing only)*

**Fires when:** 2 of the last 3 daily candles closed more than 1% beyond the zone — meaning price has already moved well past it and the zone may no longer be relevant.

**Risk score:** 8 (caution)

---

## Agent 5 — OI Check

> *"What does Open Interest tell me about this trade?"*

**Index options only: NIFTY and BANKNIFTY.** The OI button is hidden for all other symbols.

Uses data from the live option chain — PCR, OI walls, max pain, and market activity.

**4 checks always.**

---

### OI1: PCR Bias (Put-Call Ratio)

PCR is a contrarian indicator — extreme readings signal crowded positioning that tends to reverse.

| Condition | Risk score | Severity |
|---|---|---|
| PCR < 0.7 AND buying (bullish trade) | 10 | caution |
| PCR > 1.5 AND selling (bearish trade) | 10 | caution |

- PCR < 0.7 = everyone is bullish, excessive call writing → contrarian risk for bulls
- PCR > 1.5 = extreme fear, excessive put buying → shorts often get squeezed

**Pass label:** "PCR X.XX — no crowding extreme"

---

### OI2: OI Wall Alignment

The CE wall (strike with highest Call OI) = resistance/supply overhead.
The PE wall (strike with highest Put OI) = support/demand below.

Proximity band: within 0.75% of current spot price.

| Condition | Risk score | Severity |
|---|---|---|
| Buying into CE wall (spot near resistance) | 15 | warning |
| Selling into PE wall (spot near support) | 15 | warning |

**Pass (aligned):**
- Buying near PE wall → "demand floor supporting trade"
- Selling near CE wall → "supply ceiling supporting trade"
- No wall within 0.75% → "price in open space"

---

### OI3: Max Pain Proximity

Max pain = the strike at which the most options expire worthless (market makers benefit from pinning price here near expiry).

**Only relevant within 3 days of weekly expiry.**

| Condition | Risk score | Severity |
|---|---|---|
| ≤3 days to expiry AND price >1.5% from max pain | 10 | caution |

**Pass:** Price near max pain, or more than 3 days to expiry.

---

### OI4: Market Activity

Classifies what big money is doing based on OI and price change:

| Activity | Bias |
|---|---|
| Long Buildup | Bullish |
| Short Covering | Bullish |
| Long Unwinding | Bearish |
| Short Buildup | Bearish |
| Initializing | Neutral (skipped) |

**Fires when:** Activity bias conflicts with trade direction.

**Risk score:** 12 (caution)

**Pass label:** "X — OI flow aligned with bullish/bearish trade"

---

**OI max possible score:** 47 (all 4 fires → `danger` verdict)

---

## Reading the Agent Panel

Each agent panel shows:

1. **Verdict badge** — Clear / Caution / Warning / Danger
2. **Risk score** — cumulative points from fired checks
3. **Check list** — every check with green tick (pass) or amber/red flag (fired)
4. **Fired check details** — expands to show explanation and what to do

**Green tick** = check passed — the label tells you what was confirmed.
**Amber/Red flag** = check fired — title summarises the issue, detail explains it.

---

## Tip: How to Use Agents Together

The agents are independent — they check different dimensions of the same trade:

| Agent | Answers |
|---|---|
| Behavioral | "Am I making a habit-based mistake?" |
| Structure | "Is the market environment suitable for this trade?" |
| Pattern | "What is recent price action actually saying?" |
| Station | "Am I at a price level worth trading from?" |
| OI Check | "What is options positioning telling me?" |

A trade with **all 5 agents clear** has significantly higher confidence than one with multiple warnings.

---

*Last updated: Feb 2026*
