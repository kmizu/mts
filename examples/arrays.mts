// Arrays — basic utilities and indexing

let xs = [1, 2, 3, 4, 5];
let ys = [1, 2, 3];

let n = length(xs);
let h = head(xs);
let t = tail(xs);
let ys2 = push(ys, 4); // [1,2,3,4]

// 2D matrix access
let m = [[1, 2], [3, 4]];
let m01 = m[0][1]; // 2

concat("len=", toString(n))
