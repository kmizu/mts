// Array type annotation examples

// Using Array<T> syntax
let numbers: Array<number> = [1, 2, 3, 4, 5];
let names: Array<string> = ["Alice", "Bob", "Charlie"];

// Using [T] syntax
let scores: [number] = [85, 92, 78, 95];
let words: [string] = ["hello", "world", "from", "MTS"];

// Nested arrays
let matrix: Array<Array<number>> = [[1, 2], [3, 4], [5, 6]];
let deep: [[[string]]] = [[["nested"], ["array"]], [["structure"]]];

// Array operations with type annotations
let sum: number = numbers[0] + numbers[1] + numbers[2];
let firstScore: number = scores[0];
let greeting: string = concat(words[0], concat(" ", words[1]));

// Function with array parameters
let arraySum = (arr: Array<number>) => {
  let total: number = 0;
  let len: number = length(arr);
  // Simple manual sum of first few elements
  if (len > 0) { total = total + arr[0]; } else { total; };
  if (len > 1) { total = total + arr[1]; } else { total; };
  if (len > 2) { total = total + arr[2]; } else { total; };
  total
};

// Test the function
let result: number = arraySum([10, 20, 30]);

concat(
  concat("Sum: ", toString(sum)),
  concat(", Result: ", toString(result))
)