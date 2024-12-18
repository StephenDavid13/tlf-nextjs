import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const originAirport = searchParams.get('originAirport');
  const destinationAirport = searchParams.get('destinationAirport');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'Partner-Authorization': process.env.PARTNER_AUTHORIZATION ?? '', // Use the environment variable or default to an empty string
    },
  };
    // Create a URLSearchParams object to manage query parameters
    const params = new URLSearchParams();

    // Add mandatory parameters
    params.set('origin_airport', originAirport ?? '');
    params.set('destination_airport', destinationAirport ?? '');
    params.set('take', '500');

    // Conditionally add optional parameters
    if (startDate && endDate) {
    params.set('start_date', startDate ?? '');
    params.set('end_date', endDate ?? '');
    }

    // Construct the final URL with the parameters
    const url = `https://seats.aero/partnerapi/search?${params.toString()}`;


  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch flight data' }, { status: 500 });
  }
}
