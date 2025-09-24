// Simple array type annotation examples

// Array<T> syntax
let nums: Array<number> = [1, 2, 3];
let strs: Array<string> = ["hello", "world"];

// [T] syntax
let scores: [number] = [85, 92, 78];
let names: [string] = ["Alice", "Bob"];

// Nested arrays
let matrix: Array<Array<number>> = [[1, 2], [3, 4]];

// Simple operations
let first: number = nums[0];
let second: string = strs[1];
let cell: number = matrix[1][0];

// Result
concat(
  concat("First: ", toString(first)),
  concat(", Second: ", second)
)