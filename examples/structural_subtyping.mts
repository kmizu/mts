// Structural Subtyping (width) — keep only required fields

let getX = (p) => p.x; // ({ x: T | ρ }) => T

let p2 = { x: 1, y: 2 };
let p3 = { x: 10, y: 20, z: 30 };

let x1 = getX(p2); // OK: has x
let x2 = getX(p3); // OK: extra fields ignored

// Nested object access also benefits from structural typing
let getNestedX = (o) => o.point.x;
let box = { point: { x: 42, y: 24 }, tag: "box", active: true };
let nx = getNestedX(box);

concat(
  concat("x1=", toString(x1)),
  concat(", x2=", toString(x2))
)
