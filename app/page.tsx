"use client";

import type React from 'react';
import { useState } from 'react';
import DxfParser from 'dxf-parser';

interface DxfJson {
  header?: {
    $EXTMAX?: { x: number; y: number; z: number };
    $EXTMIN?: { x: number; y: number; z: number };
    $MEASUREMENT?: number;
  };
  entities?: Array<{
    type: string;
    center?: { x: number; y: number };
    radius?: number;
    vertices?: Array<{ x: number; y: number }>;
  }>;
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

const analyzeDXF = (
  dxfJson: DxfJson
): {
  boundingBox: BoundingBox;
  totalCuttingLength: number;
  totalSurfaceArea: number;
  unitOfMeasurement: string;
  loopCount: number;
} | null => {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  let totalCuttingLength = 0;
  let totalSurfaceArea = 0;
  let loopCount = 0;

  // Determine the unit of measurement
  let unitOfMeasurement = 'unknown';
  if (dxfJson.header && dxfJson.header.$MEASUREMENT !== undefined) {
    unitOfMeasurement = getMeasurementUnit(dxfJson.header.$MEASUREMENT);
  }

  if (dxfJson.entities) {
    for (const entity of dxfJson.entities) {
      console.log('Entity:', entity); // Debugging log

      if (entity.vertices) {
        // Update bounding box with vertices
        for (const vertex of entity.vertices) {
          minX = Math.min(minX, vertex.x);
          minY = Math.min(minY, vertex.y);
          maxX = Math.max(maxX, vertex.x);
          maxY = Math.max(maxY, vertex.y);
        }

        if (isClosedLoop(entity.vertices)) {
          console.log('Closed loop detected!');
          loopCount++;

          // Calculate polygon area using the Shoelace theorem
          totalSurfaceArea += calculatePolygonArea(entity.vertices);

          // Calculate the perimeter of the closed loop
          totalCuttingLength += calculatePolygonPerimeter(entity.vertices);
        }
      } else if (entity.center && entity.radius) {
        // Update bounding box for circles
        const radius = entity.radius;
        const center = entity.center;

        minX = Math.min(minX, center.x - radius);
        minY = Math.min(minY, center.y - radius);
        maxX = Math.max(maxX, center.x + radius);
        maxY = Math.max(maxY, center.y + radius);

        // Add circle perimeter and area
        totalCuttingLength += 2 * Math.PI * radius;
        totalSurfaceArea += Math.PI * radius * radius;

        // Count circles as loops
        loopCount++;
        console.log('Circle detected with radius:', radius);
      }
    }
  }

  if (
    minX !== Number.POSITIVE_INFINITY &&
    minY !== Number.POSITIVE_INFINITY &&
    maxX !== Number.NEGATIVE_INFINITY &&
    maxY !== Number.NEGATIVE_INFINITY
  ) {
    return {
      boundingBox: {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
      },
      totalCuttingLength,
      totalSurfaceArea,
      unitOfMeasurement,
      loopCount,
    };
  }

  return null;
};

// Function to calculate the perimeter of a polygon
const calculatePolygonPerimeter = (vertices: Array<{ x: number; y: number }>): number => {
  let perimeter = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n; // Next vertex, with wrapping
    const dx = vertices[j].x - vertices[i].x;
    const dy = vertices[j].y - vertices[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }

  console.log('Polygon perimeter:', perimeter);
  return perimeter;
};


// Function to check if a set of vertices forms a closed loop
const isClosedLoop = (vertices: Array<{ x: number; y: number }>): boolean => {
  if (vertices.length < 3) {
    console.log("Not enough vertices to form a closed loop.");
    return false; // A closed loop must have at least 3 vertices
  }

  const tolerance = 0.0001; // Small tolerance for floating point errors
  const firstVertex = vertices[0];
  const lastVertex = vertices[vertices.length - 1];

  // Check if the first and last vertex are the same within a tolerance
  const isClosed = Math.abs(firstVertex.x - lastVertex.x) < tolerance && Math.abs(firstVertex.y - lastVertex.y) < tolerance;
  
  console.log("Loop check for vertices:", firstVertex, lastVertex, "is closed:", isClosed); // Debug log
  return isClosed;
};

// Function to calculate the area of a polygon using the Shoelace Theorem
const calculatePolygonArea = (vertices: Array<{ x: number; y: number }>): number => {
  let area = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n; // Next vertex, with wrapping
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }

  area = Math.abs(area) / 2;
  console.log("Polygon area:", area);
  return area;
};

// Function to get the measurement unit based on the $MEASUREMENT value
const getMeasurementUnit = (measurement: number): string => {
  if (measurement === 1) {
    return 'mm'; // Millimeters
  }
  if (measurement === 0) {
    return 'inches'; // Inches
  }
  return 'unknown'; // Default or unknown unit
};

const Index = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ boundingBox: BoundingBox; totalCuttingLength: number; totalSurfaceArea: number; unitOfMeasurement: string, loopCount: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setLoading(true);
      setError(null);
      const fileText = await file.text();
      const parser = new DxfParser();

      try {
        const dxfData = parser.parse(fileText);
        if (dxfData) {
          const result = analyzeDXF(dxfData);
          setAnalysisResult(result);
        } else {
          console.error("Parsed DXF data is null");
          setError('Error parsing DXF data.');
        }
      } catch (error) {
        console.error("Error parsing DXF file:", error);
        setError('Failed to parse DXF file.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <input
        type="file"
        onChange={handleFileChange}
        accept=".dxf"
        className="mb-4 p-2 bg-gray-800 rounded"
      />
      {loading && <p className="text-yellow-400">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {fileName && <p>File: {fileName}</p>}
      {analysisResult && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold">Bounding Box:</h3>
          <p>Width: {analysisResult.boundingBox.width.toFixed(2)} {analysisResult.unitOfMeasurement}</p>
          <p>Height: {analysisResult.boundingBox.height.toFixed(2)} {analysisResult.unitOfMeasurement}</p>
          <h3 className="text-xl font-semibold mt-4">Total Cutting Length:</h3>
          <p>{analysisResult.totalCuttingLength.toFixed(2)} {analysisResult.unitOfMeasurement}</p>
          <h3 className="text-xl font-semibold mt-4">Surface Area:</h3>
          <p>{analysisResult.totalSurfaceArea.toFixed(2)} {analysisResult.unitOfMeasurement}²</p>
          <h3 className="text-xl font-semibold mt-4">Number of Loops:</h3>
          <p>{analysisResult.loopCount}</p>
        </div>
      )}
    </div>
  );
};

export default Index;
