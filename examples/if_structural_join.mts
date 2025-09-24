// Structural join at if-expressions: keep common fields

let flag = true;

let v = if (flag) { x: 1, y: 2 } else { x: 0, z: 9 };

// v is treated as { x: number } (common field)
let x = v.x;

concat("x=", toString(x))

