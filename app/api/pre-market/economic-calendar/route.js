// app/api/pre-market/economic-calendar/route.js
import { NextResponse } from 'next/server';

// Static calendar - can be updated daily or fetched from external source
const CALENDAR_DATA = [
  // Sample events - replace with real data source
  {
    time: '10:00',
    event: 'IIP (Industrial Production)',
    impact: 'HIGH',
    country: 'India',
    previous: '3.5%',
    forecast: '4.1%',
    actual: null,
  },
  {
    time: '11:30',
    event: 'RBI Governor Speech',
    impact: 'HIGH',
    country: 'India',
    previous: null,
    forecast: null,
    actual: null,
  },
  {
    time: '14:00',
    event: 'FII/DII Data Release',
    impact: 'MEDIUM',
    country: 'India',
    previous: null,
    forecast: null,
    actual: null,
  },
  {
    time: '18:00',
    event: 'ECB Interest Rate Decision',
    impact: 'HIGH',
    country: 'Europe',
    previous: '4.50%',
    forecast: '4.50%',
    actual: null,
  },
  {
    time: '20:30',
    event: 'US CPI (Inflation)',
    impact: 'HIGH',
    country: 'US',
    previous: '3.1%',
    forecast: '2.9%',
    actual: null,
  },
  {
    time: '22:00',
    event: 'Fed Minutes Release',
    impact: 'MEDIUM',
    country: 'US',
    previous: null,
    forecast: null,
    actual: null,
  },
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const country = searchParams.get('country'); // Filter by country
    const impact = searchParams.get('impact'); // Filter by impact

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Filter events
    let events = [...CALENDAR_DATA];

    if (country) {
      events = events.filter(e => e.country === country);
    }

    if (impact) {
      events = events.filter(e => e.impact === impact);
    }

    // Add timing information
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    events = events.map(event => {
      const [hours, minutes] = event.time.split(':').map(Number);
      const eventTimeMinutes = hours * 60 + minutes;
      const minutesUntil = eventTimeMinutes - currentTime;
      
      let status = 'UPCOMING';
      if (minutesUntil < 0) {
        status = 'COMPLETED';
      } else if (minutesUntil < 30) {
        status = 'SOON';
      }

      return {
        ...event,
        minutesUntil: minutesUntil > 0 ? minutesUntil : null,
        status,
        isToday: date === todayStr,
      };
    });

    // Sort by time
    events.sort((a, b) => {
      const [aH, aM] = a.time.split(':').map(Number);
      const [bH, bM] = b.time.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    });

    // Summary statistics
    const summary = {
      total: events.length,
      high: events.filter(e => e.impact === 'HIGH').length,
      medium: events.filter(e => e.impact === 'MEDIUM').length,
      low: events.filter(e => e.impact === 'LOW').length,
      upcoming: events.filter(e => e.status === 'UPCOMING').length,
      completed: events.filter(e => e.status === 'COMPLETED').length,
    };

    // Next important event
    const nextHighImpact = events.find(e => e.impact === 'HIGH' && e.status !== 'COMPLETED');

    return NextResponse.json({
      success: true,
      date,
      events,
      summary,
      nextHighImpact,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Economic calendar error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// POST endpoint to update calendar (for manual updates)
export async function POST(request) {
  try {
    const { event } = await request.json();
    
    // In production, save to database
    // For now, just return success
    
    return NextResponse.json({
      success: true,
      message: 'Event added to calendar',
      event,
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}