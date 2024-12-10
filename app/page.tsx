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
  processArcOrCircle
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

        if (isClosedLoop(entity.vertices)) {
          loopCount++;

          // Calculate polygon area using the Shoelace theorem
          totalSurfaceArea += calculatePolygonArea(entity.vertices);

          // Calculate the perimeter of the closed loop
          totalCuttingLength += calculatePolygonPerimeter(entity.vertices);
          console.log(`Polygon: ${entity.vertices} ${totalCuttingLength}`);
        } else {
            // Handle line entity (even unclosed ones)
            if (entity.vertices) {
              totalCuttingLength += calculateLineLength(entity.vertices);
              console.log(`Line: ${calculateLineLength(entity.vertices)} ${totalCuttingLength}`);
            }
              
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
        console.log(`${isClosed ? "Circle" : "Arc"}: ${length} Total: ${totalCuttingLength}`);
      
        // Add surface area for circles only
        if (isClosed) {
          totalSurfaceArea += Math.PI * radius * radius;
          loopCount++; // Count circles as loops
        }
      }
       else if (entity.type === 'ELLIPSE' && (entity as EllipseEntity).semiMajorAxis) {
        // Handle ellipse as before
        const ellipseEntity = entity as EllipseEntity;
        const a = ellipseEntity.semiMajorAxis;
        const b = ellipseEntity.semiMinorAxis;
        const center = ellipseEntity.center;

        if (center) {
          minX = Math.min(minX, center.x - a);
          minY = Math.min(minY, center.y - b);
          maxX = Math.max(maxX, center.x + a);
          maxY = Math.max(maxY, center.y + b);
        }

        // Add ellipse perimeter and area (approximated)
        const ellipsePerimeter = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
        totalCuttingLength += ellipsePerimeter;
        totalSurfaceArea += Math.PI * a * b;

        // Count ellipses as loops
        loopCount++;
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