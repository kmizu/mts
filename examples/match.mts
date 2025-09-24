// Match expression examples

// Basic pattern matching
let dayName = (day) => {
  match day {
    1 => "Monday",
    2 => "Tuesday",
    3 => "Wednesday",
    4 => "Thursday",
    5 => "Friday",
    6 => "Saturday",
    7 => "Sunday",
    _ => "Invalid day"
  }
};

// Pattern matching with guards
let classify = (n) => {
  match n {
    0 => "zero",
    x if x < 0 => "negative",
    x if x > 100 => "large",
    x if x > 50 => "medium",
    _ => "small"
  }
};

// Test the functions
let day3 = dayName(3);
let r1 = println(day3);

let num1 = classify(-5);
let r2 = println(num1);

let num2 = classify(0);
let r3 = println(num2);

let num3 = classify(75);
let r4 = println(num3);

let num4 = classify(150);
let r5 = println(num4);

let num5 = classify(25);
let r6 = println(num5);

// Return the last result
"Match expressions work!"