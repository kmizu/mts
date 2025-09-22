// Fibonacci function example

let fib = (n: number) => {
  if (n <= 1) {
    n;
  } else {
    fib(n - 1) + fib(n - 2);
  }
};

fib(8);
