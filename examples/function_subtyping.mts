// Function Subtyping (params contravariant, returns covariant)

let getX = (p) => p.x; // ({ x: T | ρ }) => T

// callWithXY expects a function that can accept at least { x: number, y: number }
let callWithXY = (f) => f({ x: 1, y: 2 });

let r = callWithXY(getX); // OK: getX accepts { x }, which is supertype of { x, y }

concat("r=", toString(r))

