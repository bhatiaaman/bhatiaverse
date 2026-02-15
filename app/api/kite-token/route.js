import { NextResponse } from 'next/server';
import crypto from 'crypto';
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

// Helper to update .env.local file
function updateEnvFile(key, value) {
  try {
    let content = '';
    if (fs.existsSync(ENV_FILE_PATH)) {
      content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    }
    
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
    
    fs.writeFileSync(ENV_FILE_PATH, content.trim() + '\n');
    return true;
  } catch (error) {
    console.error('Error updating env file:', error);
    return false;
  }
}

// Exchange request_token for access_token
export async function POST(request) {
  try {
    const { requestToken, apiSecret, useEnvSecret } = await request.json();
    
    if (!requestToken) {
      return NextResponse.json({ success: false, error: 'Request token is required' }, { status: 400 });
    }
    
    // Read API key from env
    const env = readEnvFile();
    const apiKey = env.KITE_API_KEY || process.env.KITE_API_KEY;
    
    // Use secret from request OR from env if useEnvSecret is true
    const secretToUse = useEnvSecret 
      ? (env.KITE_API_SECRET || process.env.KITE_API_SECRET)
      : apiSecret;
    
    if (!secretToUse) {
      return NextResponse.json({ 
        success: false, 
        error: useEnvSecret 
          ? 'API Secret not found in environment variables' 
          : 'API Secret is required' 
      }, { status: 400 });
    }
    
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'API Key must be configured first' 
      }, { status: 400 });
    }
    
    // Generate checksum: SHA256(api_key + request_token + api_secret)
    const checksum = crypto
      .createHash('sha256')
      .update(apiKey + requestToken + secretToUse)
      .digest('hex');
    
    // Exchange request_token for access_token
    const response = await fetch('https://api.kite.trade/session/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3',
      },
      body: new URLSearchParams({
        api_key: apiKey,
        request_token: requestToken,
        checksum: checksum,
      }),
    });
    
    const data = await response.json();
    
    if (data.status === 'success' && data.data?.access_token) {
      const accessToken = data.data.access_token;
      
      // Save access token to .env.local
      const saved = updateEnvFile('KITE_ACCESS_TOKEN', accessToken);
      
      if (saved) {
        return NextResponse.json({ 
          success: true, 
          accessToken,
          user: data.data.user_name || data.data.user_id,
          message: 'Access token saved to .env.local'
        });
      } else {
        return NextResponse.json({ 
          success: true, 
          accessToken,
          warning: 'Token generated but could not save to .env.local'
        });
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        error: data.message || 'Failed to get access token' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
