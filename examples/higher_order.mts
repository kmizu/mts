// Higher-order functions example

let apply = (f, x) => f(x);
let compose = (f, g) => (x) => f(g(x));

let addOne = (x) => x + 1;
let double = (x) => x * 2;

let addOneAndDouble = compose(double, addOne);

apply(addOneAndDouble, 5);
