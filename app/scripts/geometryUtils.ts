// Function to calculate the perimeter of a polygon
export const calculatePolygonPerimeter = (vertices: Array<{ x: number; y: number }>): number => {
    let perimeter = 0;
    const n = vertices.length;
  
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n; // Next vertex, with wrapping
      const dx = vertices[j].x - vertices[i].x;
      const dy = vertices[j].y - vertices[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
  
    return perimeter;
};

export const calculateLineLength = (vertices: Array<{ x: number; y: number }> ): number => {
    const start = vertices[0] as { x: number; y: number };
    const end = vertices[1] as { x: number; y: number };

    // Calculate the length of the line
    const lineLength = Math.sqrt(
       (end.x - start.x) ** 2 + (end.y - start.y) ** 2);

    return lineLength;
};
  
// Function to calculate the area of a polygon (Shoelace Theorem)
export const calculatePolygonArea = (vertices: Array<{ x: number; y: number }>): number => {
    let area = 0;
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n; // Next vertex, with wrapping
        area += vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
    }

    area = Math.abs(area) / 2;
    return area;
};

// Function to handle arcs and circles separately
export const processArcOrCircle = (entity: {
    type: string;
    radius: number;
    startAngle?: number;
    endAngle?: number;
  }): { length: number; isClosed: boolean } => {
    const { radius, startAngle, endAngle } = entity;
  
    if (startAngle !== undefined && endAngle !== undefined) {
      // Handle arcs
      let angularSpan = endAngle - startAngle;
  
      // Ensure angular span is positive and within 0-2π radians
      if (angularSpan < 0) angularSpan += 2 * Math.PI;
      if (angularSpan > 2 * Math.PI) angularSpan %= 2 * Math.PI;
  
      // No conversion needed; angularSpan is already in radians
      const arcLength = radius * angularSpan;
      return { length: arcLength, isClosed: false };
    }
  
    // Handle circles
    const circleLength = 2 * Math.PI * radius; // Full circumference
    return { length: circleLength, isClosed: true };
  };
  
  
  


// Function to check if a set of vertices forms a closed loop
export const isClosedLoop = (vertices: Array<{ x: number; y: number }>): boolean => {
    if (vertices.length < 3) {
        return false; // A closed loop must have at least 3 vertices
    }

    const tolerance = 0.0001; // Small tolerance for floating point errors
    const firstVertex = vertices[0];
    const lastVertex = vertices[vertices.length - 1];

    const distance = Math.sqrt(
        (lastVertex.x - firstVertex.x) ** 2 + (lastVertex.y - firstVertex.y) ** 2
    );

    return distance < tolerance;
};

// Function to get measurement unit
export const getMeasurementUnit = (measurement: number): string => {
    switch (measurement) {
        case 0:
        return "in";
        case 1:
        return "mm";
        default:
        return "Unknown";
    }
};