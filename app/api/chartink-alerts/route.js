// Store alerts in memory - in production, use a database
const alerts = [];
const MAX_ALERTS = 100;

export async function POST(request) {
  try {
    const data = await request.json();

    // Validate webhook data
    if (!data) {
      return Response.json({ error: 'No data provided' }, { status: 400 });
    }

    // Create alert object with timestamp
    const alert = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...data,
    };

    // Add to the beginning of alerts array
    alerts.unshift(alert);

    // Keep only the last 100 alerts
    if (alerts.length > MAX_ALERTS) {
      alerts.pop();
    }

    console.log('Chartink alert received:', alert);

    return Response.json({ success: true, alert }, { status: 200 });
  } catch (error) {
    console.error('Error processing chartink alert:', error);
    return Response.json({ error: 'Failed to process alert' }, { status: 500 });
  }
}

export async function GET() {
  try {
    return Response.json({ alerts, total: alerts.length }, { status: 200 });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return Response.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { alertId } = body;

    if (alertId) {
      const index = alerts.findIndex(a => a.id === alertId);
      if (index > -1) {
        alerts.splice(index, 1);
        return Response.json({ success: true, message: 'Alert deleted' }, { status: 200 });
      }
      return Response.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Clear all alerts if no specific ID provided
    alerts.length = 0;
    return Response.json({ success: true, message: 'All alerts cleared' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return Response.json({ error: 'Failed to delete alert' }, { status: 500 });
  }
}
