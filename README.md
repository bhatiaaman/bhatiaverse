This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Telegram Stock Updates Setup

The Stock Updates page fetches messages from a Telegram group. To set this up:

### 1. Create a Telegram Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the instructions
3. Save the bot token you receive

### 2. Add Bot to Your Group
1. Add your bot as an administrator to your Telegram group
2. Send at least one message in the group (this activates the bot)

### 3. Get Your Chat ID
1. Send a message in your group
2. Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` in your browser
3. Look for the `"chat":{"id":...}` field in the response
4. The ID will be negative for groups (e.g., `-1001234567890`)

### 4. Configure Environment Variables
1. Copy `.env.example` to `.env.local`
2. Add your bot token and chat ID:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

### 5. Restart the Development Server
After setting up the environment variables, restart your development server:
```bash
npm run dev
```

The Stock Updates page will now display messages from your Telegram group with timestamps!
