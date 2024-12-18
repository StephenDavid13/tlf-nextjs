// /pages/api/flights.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { originAirport, destinationAirport } = req.query;

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'Partner-Authorization': 'pro_2m4aGqnPOY02DoC4ynbXtcfcBui',
    },
  };

  const url = `https://seats.aero/partnerapi/search?origin_airport=${originAirport}&destination_airport=${destinationAirport}&take=500`;

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch flight data' });
  }
}
