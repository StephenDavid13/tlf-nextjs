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

export const calculateLineLength = (line: { start: { x: number; y: number; }; end: { x: number; y: number; }; }): number => {
  const { start, end } = line;
  const lineLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);

 return lineLength;

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

// Utility function to check if four lines form a closed rectangular box
export const isClosedBox = (lines: { start: { x: number; y: number }; end: { x: number; y: number } }[]): boolean => {
    if (lines.length !== 4) return false;
    
    // Collect all unique vertices from the 4 line entities
    const vertices = new Set<string>();
    for (const line of lines) {
      vertices.add(`${line.start.x},${line.start.y}`);
      vertices.add(`${line.end.x},${line.end.y}`);
    }
    
    if (vertices.size !== 4) return false; // Ensure only 4 unique points exist
    
    const coords = Array.from(vertices).map((v) => {
      const [x, y] = v.split(',').map(Number);
      return { x, y };
    });
    
    const uniqueX = [...new Set(coords.map((v) => v.x))];
    const uniqueY = [...new Set(coords.map((v) => v.y))];
    
    // A valid rectangular box has 2 unique x coordinates and 2 unique y coordinates
    return uniqueX.length === 2 && uniqueY.length === 2;
  };
  
  export const doLinesIntersect = (line1: { start: { x: number; y: number; }; end: { x: number; y: number; }; }, line2: { start: { x: number; y: number; }; end: { x: number; y: number; }; }): boolean => {
    const { start: p1, end: q1 } = line1;
    const { start: p2, end: q2 } = line2;
  
    const orientation = (p: { x: number; y: number; }, q: { x: number; y: number; }, r: { x: number; y: number; }) => {
      const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
      if (val === 0) return 0; // collinear
      return (val > 0) ? 1 : 2; // clock or counterclock wise
    };
  
    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);
  
    if (o1 !== o2 && o3 !== o4) {
      return true;
    }
    return false;
  };