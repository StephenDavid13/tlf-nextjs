import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const originAirport = searchParams.get('originAirport');
  const destinationAirport = searchParams.get('destinationAirport');

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'Partner-Authorization': process.env.PARTNER_AUTHORIZATION ?? '', // Use the environment variable or default to an empty string
    },
  };

  const url = `https://seats.aero/partnerapi/search?origin_airport=${originAirport}&destination_airport=${destinationAirport}&take=500`;

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch flight data' }, { status: 500 });
  }
}
