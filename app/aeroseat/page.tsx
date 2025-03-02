'use client';

import { useState } from 'react';

interface Flight {
  ID: string;
  date: string;
  origin: string;
  destination: string;
  economyCost: string;
  premiumEconomyCost: string;
  businessCost: string;
  firstCost: string;
  source: string;
}

interface ApiResponseItem {
  ID: string;  
  Date: string;
  Route: {
    OriginAirport: string;
    DestinationAirport: string;
    Source: string;
  };
  YMileageCost?: string;
  WMileageCost?: string;
  JMileageCost?: string;
  FMileageCost?: string;
}

export default function FlightSearchPage() {
  const [originAirport, setOriginAirport] = useState('');
  const [destinationAirport, setDestinationAirport] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setFlights([]); // Clear previous flight results

    try {
      // Construct query parameters
      const params: Record<string, string> = {
        originAirport,
        destinationAirport,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Build the query string
      const queryString = new URLSearchParams(params).toString();

      const response = await fetch(`/api/search?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch flight data');
      }

      const data = await response.json();

      const formattedFlights: Flight[] = data.data.map((item: ApiResponseItem) => ({
        ID: item.ID,
        date: item.Date,
        origin: item.Route.OriginAirport,
        destination: item.Route.DestinationAirport,
        economyCost: item.YMileageCost ?? 'N/A',
        premiumEconomyCost: item.WMileageCost ?? 'N/A',
        businessCost: item.JMileageCost ?? 'N/A',
        firstCost: item.FMileageCost ?? 'N/A',
        source: item.Route.Source,
      }));

      setFlights(formattedFlights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  // Function to download CSV
  const downloadCSV = () => {
    const header = ['Date', 'Path', 'Source', 'Economy Cost', 'Premium Economy Cost', 'Business Cost', 'First Cost'];
    const rows = flights.map(flight => [
      flight.date,
      `${flight.origin} - ${flight.destination}`,
      flight.source,
      flight.economyCost,
      flight.premiumEconomyCost,
      flight.businessCost,
      flight.firstCost
    ]);

    // Convert rows into CSV format
    const csvContent = [
      header.join(','), // Join header as the first row
      ...rows.map(row => row.join(',')) // Join each row
    ].join('\n');

    // Create a Blob from the CSV content and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'flights.csv'; // Set download file name
    link.click(); // Trigger the download
    URL.revokeObjectURL(url); // Clean up URL object
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-black text-white p-6'>
      <h1 className='mb-6 text-3xl'>Flight Search</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="origin-airport" className='mr-5'>Origin Airport:</label>
          <input
            type="text"
            id="origin-airport"
            value={originAirport}
            onChange={(e) => setOriginAirport(e.target.value)}
            style={{ color: 'black' }}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="destination-airport" className='mr-5'>Destination Airport:</label>
          <input
            type="text"
            id="destination-airport"
            value={destinationAirport}
            onChange={(e) => setDestinationAirport(e.target.value)}
            style={{ color: 'black' }}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="start-date" className='mr-5'>Start Date (YYYY-MM-DD):</label>
          <input
            type="text"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ color: 'black' }}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="end-date" className='mr-5'>End Date (YYYY-MM-DD):</label>
          <input
            type="text"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ color: 'black' }}
          />
        </div>
        <button type="submit" className='rounded bg-red-600 p-3'>Search Flights</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {flights.length > 0 && (
        <div className='w-full'>
            <div className='bg-slate-300 max-h-[500px] overflow-y-auto mt-4 text-black'>
            <h2>Flight Results</h2>
            <table className='w-full'>
                <thead>
                <tr>
                    <th>Date</th>
                    <th>Path</th>
                    <th>Source</th>
                    <th>Economy Cost</th>
                    <th>Premium Economy Cost</th>
                    <th>Business Cost</th>
                    <th>First Cost</th>
                </tr>
                </thead>
                <tbody className='text-center'>
                {flights.map((flight) => (
                    <tr key={`${flight.date}-${flight.ID}`}>
                    <td>{flight.date}</td>
                    <td>{flight.origin} - {flight.destination}</td>
                    <td>{flight.source}</td>
                    <td>{flight.economyCost}</td>
                    <td>{flight.premiumEconomyCost}</td>
                    <td>{flight.businessCost}</td>
                    <td>{flight.firstCost}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
            <button type="button" onClick={downloadCSV} className='rounded bg-green-600 p-3 mt-4'>
            Download CSV
        </button>
      </div>
      )}
    </div>
  );
}
