// Tilt Control game scenarios — test your trading psychology
// Each scenario is a realistic trading situation with a tempting wrong choice.
// answer: the correct action | wrong: the tempting wrong action

export const TILT_SCENARIOS = [
  {
    id: 1,
    title: 'The Revenge Trade',
    difficulty: 'medium',
    setup: `You bought BANKNIFTY 48000 CE at ₹320 before a key RBI policy announcement. The RBI kept rates unchanged — exactly what you expected — but the market sold off hard anyway. Your CE is now worth ₹95. Down ₹22,500 in 20 minutes.`,
    situation: `You're furious. The market "did the wrong thing." You see BANKNIFTY futures at a level that feels oversold. Your gut says double down on PE now to recover the loss quickly.`,
    choices: [
      {
        label: 'Buy BANKNIFTY PE immediately to recover the loss',
        isCorrect: false,
        outcome: `BANKNIFTY bounced 280 points in the next 30 minutes. Your PE halved. You're now down ₹33,000 total. The emotional decision ignored the actual market structure — the bounce was a known possibility at that level.`,
        lesson: `Revenge trading is a trap. The market doesn't owe you a recovery. Entering a new position while emotionally compromised leads to sizing, entry, and direction errors.`,
      },
      {
        label: 'Exit the CE, accept the loss, sit out for 30 minutes',
        isCorrect: true,
        outcome: `You exit at ₹95. Loss of ₹22,500. You watch from the sidelines. BANKNIFTY oscillates ±150 pts. After 30 minutes you're calm, you spot a clean flag breakout setup, and enter with proper sizing. You recover ₹8,000 by EOD.`,
        lesson: `Accepting a loss cleanly and resetting emotionally is a professional skill. Capital preservation > recovery speed. You need a clear head to find the next good trade.`,
      },
    ],
  },
  {
    id: 2,
    title: 'Adding to a Loser',
    difficulty: 'hard',
    setup: `You bought NIFTY 22500 CE at ₹180 based on a breakout setup. NIFTY has since reversed and the CE is now ₹75. Your analysis "still looks valid" — NIFTY is just pulling back to the breakout level.`,
    situation: `A friend in your trading group says "great opportunity to average down." The CE is now "cheap" at ₹75. You have margin available. If NIFTY bounces just 150 points, you can break even or profit.`,
    choices: [
      {
        label: 'Buy more CE at ₹75 to average down and reduce breakeven',
        isCorrect: false,
        outcome: `NIFTY sliced through the support level and fell another 300 points. Both your positions are now ₹12. Total loss: ₹33,600. Averaging down on a directional option trade turns a bad trade into a catastrophic one — time decay never stops.`,
        lesson: `Options lose value from two directions: price movement AND time decay. Averaging down doubles your exposure to both. A missed trade is a lesson; a doubled position on a loser is a capital wipe.`,
      },
      {
        label: 'Exit at ₹75, document why the trade failed, move on',
        isCorrect: true,
        outcome: `You exit at ₹75, crystallising a ₹10,500 loss. Reviewing the trade, you notice the breakout had lower-than-average volume — a red flag you missed. Your next breakout trade, you check volume. It saves you from another false breakout.`,
        lesson: `Every loss has a lesson. Cutting early protects capital and gives you mental bandwidth to learn. Adding to losers compounds the financial AND the psychological damage.`,
      },
    ],
  },
  {
    id: 3,
    title: 'FOMO Breakout Entry',
    difficulty: 'easy',
    setup: `NIFTY has just broken above 23,500 — a level it's tried 4 times. The move is sharp: 180 points in 12 minutes. Your watchlist shows CE premiums exploding. Everyone in the trading room is buying.`,
    situation: `You missed the breakout entry. The move has already happened. But the momentum feels unstoppable. You could buy the 23500 CE even now — it's already up 150%.`,
    choices: [
      {
        label: 'Buy 23500 CE now — momentum is strong, don\'t miss the move',
        isCorrect: false,
        outcome: `You buy at ₹310. NIFTY stalls at 23,680 and starts a pullback — a classic "buy the breakout, sell the news" pattern. The CE collapses to ₹145 in 45 minutes. You sell in panic. Loss: ₹16,500.`,
        lesson: `Chasing breakouts after a 150%+ move in the premium means you're buying exhaustion, not momentum. The risk:reward has already shifted against you. Better to wait for a pullback and re-test.`,
      },
      {
        label: 'Wait for a pullback to the breakout level (23,500) before entering',
        isCorrect: true,
        outcome: `NIFTY pulls back from 23,680 to 23,510 over 40 minutes. You buy the CE at ₹165 — a re-test of the level. NIFTY holds and grinds higher to 23,850 by EOD. Your CE is at ₹290. Profit: ₹12,500.`,
        lesson: `Patience is an edge. The best breakout trades often offer a second chance at the re-test. Waiting lets you buy closer to your stop, meaning better risk:reward and smaller position size risk.`,
      },
    ],
  },
  {
    id: 4,
    title: 'Overtrading After a Win',
    difficulty: 'medium',
    setup: `You had an excellent morning. NIFTY CE gave you ₹28,000 profit in 90 minutes. It's 11:15 AM. Your daily target was ₹15,000. You've already exceeded it. The market is now choppy — oscillating in a 100-point range.`,
    situation: `You feel confident, almost invincible. The chop feels like it's about to break. You've already identified 3 potential trades. Your account is up nicely for the day.`,
    choices: [
      {
        label: 'Keep trading — you\'re hot today, the edge is yours',
        isCorrect: false,
        outcome: `You take 3 more trades in the choppy session. Two stop out, one gives a small profit. Net result: ₹14,200 given back. Your ₹28,000 morning becomes a ₹13,800 day. Chop kills momentum strategies. And you were forcing trades that weren't there.`,
        lesson: `Winning doesn't create an "edge for the day." Confidence from a win can make you see setups that don't exist. Choppy, low-volatility markets after a big move are the worst environment to trade.`,
      },
      {
        label: 'Log the profit, close the screen for the day, go for a walk',
        isCorrect: true,
        outcome: `You book ₹28,000 and step away. The market spends the afternoon churning. Traders who forced afternoon trades mostly lost money. You end the day at +₹28,000, mentally fresh, and you compound the win by sleeping well.`,
        lesson: `Hitting your daily target and stopping is a discipline, not weakness. Protecting a good day is as important as finding the trades that built it. Consistency over time beats one great day followed by a giveback.`,
      },
    ],
  },
  {
    id: 5,
    title: 'Breaking Your Stop Loss',
    difficulty: 'hard',
    setup: `You sold NIFTY 23,200 PE at ₹85 with a clear plan: exit if it crosses ₹130. NIFTY is sliding lower and your PE has just touched ₹128. Your stop is ₹130.`,
    situation: `NIFTY looks weak. The PE might go to ₹200+ if the slide continues. Exiting now feels like giving up just as the trade is going your way. But your plan said ₹130 exit.`,
    choices: [
      {
        label: 'Hold — NIFTY is weak, PE could go to ₹200, the trade is working',
        isCorrect: false,
        outcome: `NIFTY found support at a key level and bounced 250 points in 35 minutes. Your PE collapsed to ₹38. You exited near ₹40 — far worse than your ₹130 planned exit. The trade that was "working" wiped most of your original premium collected.`,
        lesson: `A stop loss is a pre-set decision made when you were calm and objective. Overriding it in the heat of the moment means letting emotion override analysis. The 2 points to ₹130 is noise; the risk of a full reversal is real.`,
      },
      {
        label: 'Exit at ₹130 as planned — rules exist for a reason',
        isCorrect: true,
        outcome: `You exit at ₹130 for a ₹4,500 loss on the trade. You review: NIFTY's slide had momentum, but you also note there was a strong support level 150 points lower that you had ignored. The process was right even if the outcome stung.`,
        lesson: `Trading with rules separates professionals from gamblers. The best traders have losses too — but they're controlled losses. Discipline on one trade saves you from the catastrophic trade that breaks accounts.`,
      },
    ],
  },
  {
    id: 6,
    title: 'The Hot Tip',
    difficulty: 'easy',
    setup: `A trader you follow on Twitter posts: "AAPL-style breakout setting up in RELIANCE — massive call writing at 2900. Easy ₹50,000 trade. Loading up heavily. NFA." Your own watchlist shows RELIANCE near a level but no strong setup.`,
    situation: `The trader has 80,000 followers. Their last 3 tips made money. You have ₹60,000 margin available. The urgency feels real — others are already in.`,
    choices: [
      {
        label: 'Buy RELIANCE options now — the trader has a good track record',
        isCorrect: false,
        outcome: `RELIANCE opens flat, drifts down. The "massive call writing" was a misread — it was part of a collar hedge, not directional. The option expires worthless. You lose ₹14,000. The Twitter trader never posts a loss update.`,
        lesson: `No one tweets their losing trades. A track record on Twitter is survivorship bias — you see the wins, not the losses. Trade only what you understand and can verify yourself.`,
      },
      {
        label: 'Investigate the setup yourself before trading, skip if unclear',
        isCorrect: true,
        outcome: `You check RELIANCE charts — the setup doesn't match your criteria. You skip it. RELIANCE indeed goes sideways. Your ₹60,000 margin stays intact for your own setups the next day, one of which gives a clean ₹18,000 trade.`,
        lesson: `Every trade must be YOUR trade — based on YOUR analysis. Tips, signals, and calls are other people's ideas filtered through their (unknown) bias and risk profile. Your account, your rules.`,
      },
    ],
  },
  {
    id: 7,
    title: 'Ignoring VIX Spike',
    difficulty: 'medium',
    setup: `India VIX has jumped from 13 to 22 overnight due to global geopolitical news. Your strategy works best in low-VIX environments (below 16). You have a NIFTY directional trade planned for today.`,
    situation: `VIX may settle by afternoon. You've been waiting for this setup for 3 days. The trade looks good technically. You don't want to miss another day.`,
    choices: [
      {
        label: 'Enter the trade anyway — VIX will settle by afternoon',
        isCorrect: false,
        outcome: `VIX stayed elevated all day. NIFTY swung ±400 points in both directions — far wider than your stop accommodated. You were stopped out twice, losing ₹19,000 across both attempts. High VIX environments are low-signal, high-noise.`,
        lesson: `Strategy conditions matter as much as the setup itself. A trade that works in 13 VIX behaves completely differently in 22 VIX. Respect your strategy's operating conditions — when they're violated, sit out.`,
      },
      {
        label: 'Skip today — wait for VIX to return below 16 before trading',
        isCorrect: true,
        outcome: `NIFTY whipsawed violently. Most directional trades lost money in the chaotic price action. You watched from the sidelines, took notes on how the market behaved, and traded the next day when VIX dropped to 17. Clean ₹11,000 trade.`,
        lesson: `Patience is most tested when you have a setup but conditions aren't right. Skipping trades when your edge is compromised is not weakness — it's strategic self-control that protects long-term performance.`,
      },
    ],
  },
  {
    id: 8,
    title: 'End-of-Day Gamble',
    difficulty: 'hard',
    setup: `It's 3:15 PM. You're down ₹12,000 for the day on two stopped-out trades. NIFTY expiry is tomorrow. You see a NIFTY 22,800 CE at just ₹30 — a "lottery ticket" that could pay ₹200+ if NIFTY spikes in the last 45 minutes.`,
    situation: `₹30 per lot feels like a small risk. If NIFTY closes at 22,850 tomorrow, you'd turn the day around completely. The premium is "almost zero anyway."`,
    choices: [
      {
        label: 'Buy 10 lots of the ₹30 CE — small premium, big upside potential',
        isCorrect: false,
        outcome: `NIFTY drifted sideways to close at 22,740. On expiry day, the CE expired worthless. ₹15,000 gone (10 lots × 75 × ₹20 avg decay). You turned a ₹12,000 loss day into a ₹27,000 loss day by gambling on a low-probability bet.`,
        lesson: `"Cheap" options near expiry have cheap premiums because probability of profit is very low — that's how pricing works. A lottery-ticket trade to recover a loss is compounding bad psychology with bad math.`,
      },
      {
        label: 'Accept the ₹12,000 loss and close the screens for the day',
        isCorrect: true,
        outcome: `You close flat, absorb the ₹12,000 loss. The next morning you review the day's trades. Both stopped-out trades were valid setups — they just didn't work. Your process was sound. You trade fresh next day and recover ₹8,000 by noon.`,
        lesson: `Losses are part of trading. The damage from chasing a loss with a desperate trade is almost always larger than the original loss. Live to trade another day — that is the professional mindset.`,
      },
    ],
  },
];
