// Match expression with guards example
let classify = (n) => {
  match n {
    0 => "zero",
    x if x < 0 => "negative",
    x if x > 100 => "large",
    _ => "normal"
  }
};

let test1 = classify(-5);
let test2 = classify(0);
let test3 = classify(50);
let test4 = classify(150);

test4