// Row Polymorphism Examples
// Row polymorphism allows functions to work with objects that have at least
// the required fields, while ignoring additional fields.

// Basic row polymorphism - function requires only 'x' field
let getX = (obj) => obj.x;

// Multiple field access - requires both 'x' and 'y' fields
let sumXY = (point) => point.x + point.y;

// Three field access - requires 'x', 'y', and 'z' fields
let sumXYZ = (point) => point.x + point.y + point.z;

// Test objects with different field combinations
let point2D = { x: 10, y: 20 };
let point3D = { x: 1, y: 2, z: 3 };
let point4D = { x: 5, y: 10, z: 15, w: 20 };

// Row polymorphism in action - extra fields are ignored
let x1 = getX(point2D);      // Works: has 'x' field (ignores 'y')
let x2 = getX(point3D);      // Works: has 'x' field (ignores 'y', 'z')
let x3 = getX(point4D);      // Works: has 'x' field (ignores 'y', 'z', 'w')

let sum1 = sumXY(point2D);   // Works: has both 'x' and 'y' fields
let sum2 = sumXY(point3D);   // Works: has 'x', 'y' fields (ignores 'z')
let sum3 = sumXY(point4D);   // Works: has 'x', 'y' fields (ignores 'z', 'w')

let sum4 = sumXYZ(point3D);  // Works: has 'x', 'y', 'z' fields
let sum5 = sumXYZ(point4D);  // Works: has 'x', 'y', 'z' fields (ignores 'w')

// Demonstrate structural subtyping with different function
let distance = (p) => p.x * p.x + p.y * p.y;

let dist1 = distance(point2D);  // 2D point works
let dist2 = distance(point3D);  // 3D point also works (ignores z)
let dist3 = distance(point4D);  // 4D point also works (ignores z, w)

// Display results showing row polymorphism in action
print("=== Row Polymorphism Examples ===");
print("Functions work with objects that have the required fields,");
print("ignoring any additional fields (structural subtyping).");
print("");

print("Results demonstrate that the same functions work on:");
print("- 2D points: {x, y}");
print("- 3D points: {x, y, z}");
print("- 4D points: {x, y, z, w}");
print("");

print("Single field access results:");
print(x1);  // getX(point2D) = 10
print(x2);  // getX(point3D) = 1
print(x3);  // getX(point4D) = 5
print("");

print("Two field sum results:");
print(sum1); // sumXY(point2D) = 30
print(sum2); // sumXY(point3D) = 3
print(sum3); // sumXY(point4D) = 15
print("");

print("Three field sum results:");
print(sum4); // sumXYZ(point3D) = 6
print(sum5); // sumXYZ(point4D) = 30
print("");

print("Distance calculation results:");
print(dist1); // distance(point2D) = 500
print(dist2); // distance(point3D) = 5
print(dist3); // distance(point4D) = 125
print("");

print("✓ Row polymorphism working correctly!");

