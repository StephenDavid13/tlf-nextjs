"use client";

import type React from 'react';
import { useState } from 'react';
import DxfParser from 'dxf-parser';
import type { DxfJson, EllipseEntity, BoundingBox } from './interfaces/dxf.ts';
import { 
  calculatePolygonPerimeter, 
  calculatePolygonArea, 
  isClosedLoop, 
  getMeasurementUnit,
  calculateLineLength,
  processArcOrCircle,
  isClosedBox
} from './scripts/geometryUtils';


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

  let linesBuffer: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  }[] = []; // Buffer to store lines for potential rectangle checks

  // Determine the unit of measurement
  let unitOfMeasurement = 'unknown';
  if (dxfJson.header && dxfJson.header.$MEASUREMENT !== undefined) {
    unitOfMeasurement = getMeasurementUnit(dxfJson.header.$MEASUREMENT);
  }

  if (dxfJson.entities) {
    for (const entity of dxfJson.entities) {
      if (entity.type === 'LINE' && entity.start && entity.end) {
        // Collect LINE entities into a buffer
        linesBuffer.push({ start: entity.start, end: entity.end });

        // Update bounding box with this line's endpoints
        minX = Math.min(minX, entity.start.x, entity.end.x);
        minY = Math.min(minY, entity.start.y, entity.end.y);
        maxX = Math.max(maxX, entity.start.x, entity.end.x);
        maxY = Math.max(maxY, entity.start.y, entity.end.y);

        // If we have enough lines to potentially form a closed box, analyze
        if (linesBuffer.length >= 4) {
          const potentialBoxLines = linesBuffer.slice(0, 4); // Only take the first 4 lines
          if (isClosedBox(potentialBoxLines)) {
            // If they form a closed rectangular box
            const boxLength = calculateLineLength([
              { x: potentialBoxLines[0].start.x, y: potentialBoxLines[0].start.y },
              { x: potentialBoxLines[0].end.x, y: potentialBoxLines[0].end.y },
            ]);
            const boxWidth = calculateLineLength([
              { x: potentialBoxLines[1].start.x, y: potentialBoxLines[1].start.y },
              { x: potentialBoxLines[1].end.x, y: potentialBoxLines[1].end.y },
            ]);

            totalCuttingLength += 2 * (boxLength + boxWidth); // Perimeter of the box
            totalSurfaceArea += boxLength * boxWidth; // Area of the rectangular box
            loopCount++;
          }

          // Remove the first line to allow sliding window-like analysis
          linesBuffer.shift();
        }
      } else if (entity.center && entity.radius) {
        const { length, isClosed } = processArcOrCircle(entity as { type: string; radius: number; startAngle?: number; endAngle?: number });

        const radius = entity.radius;
        const center = entity.center;

        // Update bounding box
        minX = Math.min(minX, center.x - radius);
        minY = Math.min(minY, center.y - radius);
        maxX = Math.max(maxX, center.x + radius);
        maxY = Math.max(maxY, center.y + radius);

        // Add cutting length
        totalCuttingLength += length;

        // Add surface area for circles only
        if (isClosed) {
          totalSurfaceArea += Math.PI * radius * radius;
          loopCount++;
        }
      }
    }
  }

  let dxfwidth = 0;
  let dxflength = 0;
  if (dxfJson.header && dxfJson.header.$EXTMAX !== undefined && dxfJson.header.$EXTMIN !== undefined) {
    dxfwidth = dxfJson.header.$EXTMAX.x - dxfJson.header.$EXTMIN.x;
    dxflength = dxfJson.header.$EXTMAX.y - dxfJson.header.$EXTMIN.y;
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
        width: dxfwidth,
        height: dxflength,
      },
      totalCuttingLength,
      totalSurfaceArea,
      unitOfMeasurement,
      loopCount,
    };
  }

  return null;
};


const Index = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    boundingBox: BoundingBox;
    totalCuttingLength: number;
    totalSurfaceArea: number;
    unitOfMeasurement: string;
    loopCount: number;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state to store the raw DXF data
  const [rawDxfData, setRawDxfData] = useState<string | null>(null);

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
        
        // Store the raw DXF data as a JSON string for displaying
        setRawDxfData(JSON.stringify(dxfData, null, 2));

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

      {/* New section to display raw DXF data */}
      {rawDxfData && (
        <div className="mt-4 p-4 bg-gray-800 rounded text-sm overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Raw DXF Data:</h3>
          <pre>{rawDxfData}</pre>
        </div>
      )}
    </div>
  );
};

export default Index;