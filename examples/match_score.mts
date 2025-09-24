// Score grading using match expressions
let getGrade = (score) => {
  match score {
    100 => "Perfect!",
    90 => "A",
    80 => "B",
    70 => "C",
    60 => "D",
    _ => "F"
  }
};

// Get grades for various scores
let grade1 = getGrade(100);
let grade2 = getGrade(90);
let grade3 = getGrade(75); // Will be "F" since we only match exact values
let grade4 = getGrade(60);

concat(concat(concat(grade1, ", "), grade2), concat(", ", grade4))