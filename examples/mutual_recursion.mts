// Mutual recursion example (even/odd)

let isEven = (n) => {
  if (n == 0) {
    true;
  } else {
    isOdd(n - 1);
  }
};

let isOdd = (n) => {
  if (n == 0) {
    false;
  } else {
    isEven(n - 1);
  }
};

isEven(4);
