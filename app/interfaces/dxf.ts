/* eslint-disable @typescript-eslint/no-unused-vars */
export interface DxfJson {
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
  
// Define types for the DXF entities
export interface BaseEntity {
  type: string;
  center?: { x: number; y: number };
  radius?: number;
  vertices?: { x: number; y: number }[];
}

export interface EllipseEntity extends BaseEntity {
  type: "ELLIPSE";
  semiMajorAxis: number;
  semiMinorAxis: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}