import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ENV_FILE_PATH = path.join(process.cwd(), '.env.local');

// Helper to read .env.local file
function readEnvFile() {
  try {
    if (!fs.existsSync(ENV_FILE_PATH)) {
      return {};
    }
    const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    return env;
  } catch (error) {
    console.error('Error reading env file:', error);
    return {};
  }
}

// Helper to write .env.local file
function writeEnvFile(env) {
  try {
    // Read existing file to preserve comments and structure
    let content = '';
    if (fs.existsSync(ENV_FILE_PATH)) {
      content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    }
    
    // Update or add each key
    for (const [key, value] of Object.entries(env)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        // Add to Kite section or end
        if (content.includes('# Kite Connect API')) {
          content = content.replace(
            /(# Kite Connect API.*?\n)/,
            `$1${key}=${value}\n`
          );
        } else {
          content += `\n${key}=${value}`;
        }
      }
    }
    
    fs.writeFileSync(ENV_FILE_PATH, content.trim() + '\n');
    return true;
  } catch (error) {
    console.error('Error writing env file:', error);
    return false;
  }
}

// Validate access token by making a simple API call
async function validateAccessToken(apiKey, accessToken) {
  if (!apiKey || !accessToken) return false;
  
  try {
    const response = await fetch('https://api.kite.trade/user/profile', {
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${apiKey}:${accessToken}`,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

// GET: Fetch current config (no secret returned)
export async function GET() {
  try {
    const env = readEnvFile();
    const apiKey = env.KITE_API_KEY || process.env.KITE_API_KEY || '';
    const accessToken = env.KITE_ACCESS_TOKEN || process.env.KITE_ACCESS_TOKEN || '';
    
    // Check if API Secret is available in env (for auto-fill hint, never return actual value)
    const hasApiSecretInEnv = !!(env.KITE_API_SECRET || process.env.KITE_API_SECRET);
    
    // Validate current token
    const tokenValid = await validateAccessToken(apiKey, accessToken);
    
    return NextResponse.json({
      success: true,
      config: {
        apiKey,
        accessToken,
        // API Secret is never stored or returned
      },
      tokenValid,
      hasApiSecretInEnv, // Hint for UI that secret is available
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Save config (only API Key, never secret)
export async function POST(request) {
  try {
    const body = await request.json();
    const { apiKey, accessToken } = body;
    
    const updates = {};
    
    if (apiKey !== undefined) {
      updates.KITE_API_KEY = apiKey;
    }
    
    // API Secret is never saved to env file
    
    if (accessToken !== undefined) {
      updates.KITE_ACCESS_TOKEN = accessToken;
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid updates provided' }, { status: 400 });
    }
    
    const success = writeEnvFile(updates);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Config saved successfully' });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to write config' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
