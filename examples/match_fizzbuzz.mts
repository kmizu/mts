// FizzBuzz using match expressions
let fizzbuzz = (n) => {
  let mod3 = n % 3 == 0;
  let mod5 = n % 5 == 0;

  if (mod3 && mod5) {
    "FizzBuzz";
  } else if (mod3) {
    "Fizz";
  } else if (mod5) {
    "Buzz";
  } else {
    toString(n);
  }
};

// Generate FizzBuzz for numbers 1-15
let test = () => {
  let r1 = fizzbuzz(1);
  let r2 = fizzbuzz(2);
  let r3 = fizzbuzz(3);
  let r4 = fizzbuzz(4);
  let r5 = fizzbuzz(5);
  let r6 = fizzbuzz(6);
  let r15 = fizzbuzz(15);

  concat(concat(concat(concat(concat(concat(r1, ", "), r3), ", "), r5), ", "), r15)
};

test()