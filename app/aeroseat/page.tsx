'use client';

import type React from 'react';
import { useState } from 'react';

export default function FlightSearchPage() {
  const [originAirport, setOriginAirport] = useState('');
  const [destinationAirport, setDestinationAirport] = useState('');
  const [cabinClass, setCabinClass] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  interface Flight {
    flightNumber: string;
    departureAirport: string;
    departureTime: string;
    arrivalAirport: string;
    arrivalTime: string;
    duration: string;
    price: number;
  }

  const [flights, setFlights] = useState<Flight[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    try {
      const response = await fetch(`/api/search?originAirport=${originAirport}&destinationAirport=${destinationAirport}`);
      const data = await response.json();
      console.log(data);
      setFlights(data);
    } catch (error) {
        setError(`Error fetching flights: ${error}`);
    }
  };
  

  return (
    <div>
      <h1>Flight Search</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="origin-airport">Origin Airport:</label>
          <input
            type="text"
            id="origin-airport"
            value={originAirport}
            onChange={(e) => setOriginAirport(e.target.value)}
            style={{ color: 'black' }}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="destination-airport">Destination Airport:</label>
          <input
            type="text"
            id="destination-airport"
            value={destinationAirport}
            onChange={(e) => setDestinationAirport(e.target.value)}
            style={{ color: 'black' }}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="cabin-class">Cabin Class:</label>
          <input
            type="text"
            id="cabin-class"
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value)}
            style={{ color: 'black' }}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="start-date">Start Date:</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ color: 'black' }}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="end-date">End Date:</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ color: 'black' }}
          />
        </div>
        <button type="submit">Search Flights</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {flights.length > 0 && (
        <div>
          <h2>Flight Results</h2>
          <table>
            <thead>
              <tr>
                <th>Flight Number</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th>Duration</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr key={flight.flightNumber}>
                  <td>{flight.flightNumber}</td>
                  <td>
                    {flight.departureAirport} - {flight.departureTime}
                  </td>
                  <td>
                    {flight.arrivalAirport} - {flight.arrivalTime}
                  </td>
                  <td>{flight.duration}</td>
                  <td>${flight.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
