# Bhatiaverse — Things To Do

## Trading
- [ ] Trade journal — log every order with notes, strategy tag, and outcome
- [ ] P&L dashboard — realized + unrealized P&L across positions, daily/weekly/monthly view
- [ ] Price alerts — notify (browser/email) when a symbol crosses a set level
- [ ] Bracket / cover orders — OCO exit legs with auto stop-loss and target

## Options
- [ ] Greeks display — Delta, Gamma, Theta, Vega per strike in option chain
- [ ] PCR trend chart — put/call ratio over time plotted alongside index price
- [ ] OI buildup / unwinding detection — flag strikes with significant OI change (>10%)

## Quality of Life
- [ ] Order history with filters — searchable history by symbol, date, product type
- [ ] Keyboard shortcuts — hotkeys for watchlist navigation, quick order placement
- [ ] Kite auto-login via Vercel cron — scheduled job to refresh access token daily at 08:30 IST

## Security & Reliability (from audit plan)
- [ ] Rate limiting — `@upstash/ratelimit` on place-order and order-intelligence routes
- [ ] Error message sanitization — remove stack traces / internal details from API responses
- [ ] Input validation — quantity NaN guard, tag injection, symbol whitelist for option-chain
- [ ] Redis caching for lot-size CSV — share cache between `/api/ltp` and `/api/lot-size`
- [ ] Candle caching in order-intelligence — 5 min Redis TTL to reduce Kite API calls
- [ ] Fetch timeouts — `AbortSignal.timeout(8000)` on external API calls
- [ ] Option chain parallel batches + off-hours TTL
- [ ] Terminal `useEffect` stale closure fixes (fetchStrikeAnalysis, fetchPositions)
