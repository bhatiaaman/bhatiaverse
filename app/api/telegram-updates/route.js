// API route to fetch Telegram updates from a group
// Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function GET() {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return Response.json({
        error: 'Telegram bot token or chat ID not configured',
        updates: []
      }, { status: 500 });
    }

    // Get updates from Telegram Bot API
    const updatesUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;
    const response = await fetch(updatesUrl, {
      headers: {
        'User-Agent': 'Bhatiaverse-Stock-Updates/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Telegram API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }

    // Filter updates for the specific chat (group)
    const chatUpdates = data.result
      .filter(update => update.message && update.message.chat.id.toString() === TELEGRAM_CHAT_ID)
      .map(update => update.message)
      .sort((a, b) => b.date - a.date) // Sort by newest first
      .slice(0, 50); // Limit to last 50 messages

    return Response.json({
      updates: chatUpdates,
      total: chatUpdates.length
    });

  } catch (error) {
    console.error('Error fetching Telegram updates:', error);
    return Response.json({
      error: error.message,
      updates: []
    }, { status: 500 });
  }
}