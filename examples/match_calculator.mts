// Simple calculator using match-like pattern
let calculate = (op, a, b) => {
  match op {
    "add" => a + b,
    "sub" => a - b,
    "mul" => a * b,
    "div" => a / b,
    _ => 0
  }
};

// Test calculations
let add_result = calculate("add", 10, 5);
let sub_result = calculate("sub", 10, 5);
let mul_result = calculate("mul", 10, 5);
let div_result = calculate("div", 10, 5);

// Create result string
concat(
  concat(
    concat(
      concat("10 + 5 = ", toString(add_result)),
      concat(", 10 - 5 = ", toString(sub_result))
    ),
    concat(", 10 * 5 = ", toString(mul_result))
  ),
  concat(", 10 / 5 = ", toString(div_result))
)