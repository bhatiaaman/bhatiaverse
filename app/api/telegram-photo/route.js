// API route to fetch Telegram photos
// Requires TELEGRAM_BOT_TOKEN environment variable

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('file_id');

    if (!TELEGRAM_BOT_TOKEN) {
      return new Response('Telegram bot token not configured', { status: 500 });
    }

    if (!fileId) {
      return new Response('File ID is required', { status: 400 });
    }

    // First, get the file path from Telegram
    const fileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      throw new Error(`Failed to get file info: ${fileResponse.status}`);
    }

    const fileData = await fileResponse.json();

    if (!fileData.ok) {
      throw new Error(`Telegram API error: ${fileData.description}`);
    }

    // Get the actual file
    const photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
    const photoResponse = await fetch(photoUrl);

    if (!photoResponse.ok) {
      throw new Error(`Failed to fetch photo: ${photoResponse.status}`);
    }

    // Return the photo with appropriate headers
    const photoBlob = await photoResponse.blob();
    return new Response(photoBlob, {
      headers: {
        'Content-Type': photoResponse.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error fetching Telegram photo:', error);
    return new Response('Failed to fetch photo', { status: 500 });
  }
}