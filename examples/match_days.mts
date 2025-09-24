// Days of the week using match expressions
let dayOfWeek = (n) => {
  match n {
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

// Month names
let monthName = (n) => {
  match n {
    1 => "January",
    2 => "February",
    3 => "March",
    4 => "April",
    5 => "May",
    6 => "June",
    7 => "July",
    8 => "August",
    9 => "September",
    10 => "October",
    11 => "November",
    12 => "December",
    _ => "Invalid month"
  }
};

// Test the functions
let day1 = dayOfWeek(1);
let day5 = dayOfWeek(5);
let day7 = dayOfWeek(7);

let month1 = monthName(1);
let month6 = monthName(6);
let month12 = monthName(12);

concat(
  concat(
    concat(day1, ", "),
    concat(day5, ", ")
  ),
  concat(
    concat(month1, ", "),
    month12
  )
)