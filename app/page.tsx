"use client";

import type React from 'react';
import { useState } from 'react';
import DxfParser from 'dxf-parser';
import type { DxfJson, BoundingBox } from './interfaces/dxf.ts';
import { 
  calculatePolygonArea,
  calculatePolygonPerimeter,
  isClosedLoop, 
  getMeasurementUnit,
  calculateLineLength,
  processArcOrCircle,
  doLinesIntersect,
} from './scripts/geometryUtils';


const analyzeDXF = (
  dxfJson: DxfJson
): {
  boundingBox: BoundingBox;
  totalCuttingLength: number;
  totalSurfaceArea: number;
  unitOfMeasurement: string;
  loopCount: number;
  netSurfaceArea: number;
} | null => {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  let totalCuttingLength = 0;
  let totalSurfaceArea = 0;
  let loopCount = 0;
  let polygonAreas = 0;
  let circleAreas = 0;

  const lines: { start: { x: number; y: number; }; end: { x: number; y: number; }; }[] = [];
  const polygons: { start: { x: number; y: number; }; end: { x: number; y: number; }; }[][] = [];

  // Determine the unit of measurement
  let unitOfMeasurement = 'unknown';
  if (dxfJson.header && dxfJson.header.$MEASUREMENT !== undefined) {
    unitOfMeasurement = getMeasurementUnit(dxfJson.header.$MEASUREMENT);
  }

  if (dxfJson.entities) {
    

    for (const entity of dxfJson.entities) {
      if (entity.vertices) {
        // Update bounding box with vertices
        for (const vertex of entity.vertices) {
          minX = Math.min(minX, vertex.x);
          minY = Math.min(minY, vertex.y);
          maxX = Math.max(maxX, vertex.x);
          maxY = Math.max(maxY, vertex.y);
        }

        if (entity.vertices.length === 2) {
          const line = { start: entity.vertices[0], end: entity.vertices[1] };
          lines.push(line);
          totalCuttingLength += calculateLineLength(line);
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

        if(isClosed) {
          // Add surface area for circles only
          const circleArea = Math.PI * radius ** 2;
          totalSurfaceArea += circleArea;
          circleAreas += circleArea;
          loopCount++;
        }
      }
    }

    // Check for intersections to determine if lines form a polygon
    const usedLines = new Set<string>();
    const lineToString = (line: { start: { x: number; y: number; }; end: { x: number; y: number; }; }): string => {
      return `${line.start.x},${line.start.y} - ${line.end.x},${line.end.y}`;
    };

    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        if (doLinesIntersect(lines[i], lines[j])) {
          console.log(`Lines ${i} and ${j} intersect`);
          const line1Str = lineToString(lines[i]);
          const line2Str = lineToString(lines[j]);

          if (!usedLines.has(line1Str) && !usedLines.has(line2Str)) {
            usedLines.add(line1Str);
            usedLines.add(line2Str);

            // Check if all lines form a closed loop
            const polygonLines = Array.from(usedLines).map(lineStr => {
              const [start, end] = lineStr.split(' - ');
              const [startX, startY] = start.split(',').map(Number);
              const [endX, endY] = end.split(',').map(Number);
              return { start: { x: startX, y: startY }, end: { x: endX, y: endY } };
            });

            if (isClosedLoop(polygonLines.map(line => line.start).concat(polygonLines[polygonLines.length - 1].end))) {
              // Calculate polygon area using the Shoelace theorem
              //const polygonArea = calculatePolygonArea(entity.vertices);
              //totalSurfaceArea += polygonArea;
              //polygonAreas += polygonArea;

              // Calculate the perimeter of the closed loop
              //totalCuttingLength += calculatePolygonPerimeter(entity.vertices);

              console.log(`Found a loop with lines: ${Array.from(usedLines).join(', ')}`);
              polygons.push(polygonLines);
              usedLines.clear(); // Reset the set after counting the polygon
              
            }
          }
        }
      }
    }

    // Ensure polygons are unique
    const uniquePolygons = new Set(polygons.map(polygon => JSON.stringify(polygon)));
    loopCount += uniquePolygons.size;
  }

  // Calculate DXF width and length
  let dxfwidth = 0;
  let dxflength = 0;
  if (dxfJson.header && dxfJson.header.$EXTMAX !== undefined && dxfJson.header.$EXTMIN !== undefined) {
    dxfwidth = dxfJson.header.$EXTMAX.x - dxfJson.header.$EXTMIN.x;
    dxflength = dxfJson.header.$EXTMAX.y - dxfJson.header.$EXTMIN.y;
  }

  // Calculate the area of the bounding box
  const boundingBoxArea = dxfwidth * dxflength;

  // Calculate the net surface area
  const netSurfaceArea = boundingBoxArea - polygonAreas - circleAreas;

  // Check if the bounding box is a line
  const boundingBoxIsLine = (minX === maxX || minY === maxY);

  // Check if any polygon matches the bounding box
  const boundingBoxPolygon = polygons.some(polygon => {
    const polygonMinX = Math.min(...polygon.map(line => Math.min(line.start.x, line.end.x)));
    const polygonMinY = Math.min(...polygon.map(line => Math.min(line.start.y, line.end.y)));
    const polygonMaxX = Math.max(...polygon.map(line => Math.max(line.start.x, line.end.x)));
    const polygonMaxY = Math.max(...polygon.map(line => Math.max(line.start.y, line.end.y)));
    return polygonMinX === minX && polygonMinY === minY && polygonMaxX === maxX && polygonMaxY === maxY;
  });

  return {
    boundingBox: { minX, minY, maxX, maxY,
      width: dxfwidth,
      height: dxflength,
     },
    totalCuttingLength,
    totalSurfaceArea,
    unitOfMeasurement,
    loopCount: boundingBoxIsLine || boundingBoxPolygon ? loopCount - 1 : loopCount, // Adjust loop count if bounding box is a line or matches a polygon
    netSurfaceArea,
  };
};

const Index = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    boundingBox: BoundingBox;
    totalCuttingLength: number;
    totalSurfaceArea: number;
    unitOfMeasurement: string;
    loopCount: number;
    netSurfaceArea: number;
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
          <p>{analysisResult.netSurfaceArea.toFixed(2)} {analysisResult.unitOfMeasurement}²</p>
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