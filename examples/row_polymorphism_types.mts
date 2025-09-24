// Row Polymorphism Type Examples
// This file demonstrates the type signatures that row polymorphism generates

// Single field access function
// Type: ({ x: T | ρ }) => T
let getX = (obj) => obj.x;

// Multiple field access function
// Type: ({ x: number, y: number | ρ }) => number
let sumXY = (point) => point.x + point.y;

// Three field access function
// Type: ({ x: number, y: number, z: number | ρ }) => number
let sumXYZ = (point) => point.x + point.y + point.z;

// String field function
// Type: ({ name: string | ρ }) => string
let getName = (person) => person.name;

print("Row polymorphism enables structural subtyping:");
print("Functions accept objects with required fields plus any extras");
print("");

print("Example function types (use -t flag to see them):");
print("getX:    ({ x: T | ρ }) => T");
print("sumXY:   ({ x: number, y: number | ρ }) => number");
print("sumXYZ:  ({ x: number, y: number, z: number | ρ }) => number");
print("getName: ({ name: string | ρ }) => string");
print("");

print("The ρ (rho) represents additional fields that can be present");
print("but are ignored by the function - this is row polymorphism!");

// Test with objects having different numbers of fields
let point2D = { x: 1, y: 2 };
let point3D = { x: 1, y: 2, z: 3 };
let person = { name: "Alice", age: 30, city: "Tokyo" };

// All work due to structural subtyping
getX(point2D);   // Works: has x field
getX(point3D);   // Works: has x field (ignores y, z)
sumXY(point2D);  // Works: has x, y fields
sumXY(point3D);  // Works: has x, y fields (ignores z)
getName(person); // Works: has name field (ignores age, city)

print("✓ All function calls type-check successfully!");