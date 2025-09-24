// Match expressions with guards demonstration
let categorize = (age) => {
  match age {
    n if n < 0 => "Invalid age",
    n if n < 13 => "Child",
    n if n < 20 => "Teenager",
    n if n < 60 => "Adult",
    n if n < 100 => "Senior",
    _ => "Centenarian"
  }
};

// Create a test function that returns a single value
let runTest = () => {
  let cat1 = categorize(5);    // Child
  let cat2 = categorize(15);   // Teenager
  let cat3 = categorize(35);   // Adult
  let cat4 = categorize(70);   // Senior
  let cat5 = categorize(105);  // Centenarian

  // Return a concatenated result
  concat(
    concat(
      concat(
        concat("5yo: ", cat1),
        concat(", 15yo: ", cat2)
      ),
      concat(", 35yo: ", cat3)
    ),
    concat(
      concat(", 70yo: ", cat4),
      concat(", 105yo: ", cat5)
    )
  )
};

runTest()