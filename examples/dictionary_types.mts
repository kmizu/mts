// Dictionary type annotation examples

// Using Dict<K, V> syntax
let person: Dict<string, string> = ["name": "Alice", "city": "Tokyo", "job": "Engineer"];
let scores: Dict<string, number> = ["math": 95, "science": 87, "english": 92];
let flags: Dict<string, boolean> = ["debug": true, "production": false, "testing": true];

// Using [K : V] syntax
let inventory: [string : number] = ["apples": 10, "bananas": 25, "oranges": 15];
let prices: [string : number] = ["apple": 120, "banana": 80, "orange": 150];

// Number-keyed dictionaries
let months: Dict<number, string> = [1: "January", 2: "February", 3: "March"];
let weekdays: [number : string] = [1: "Monday", 2: "Tuesday", 3: "Wednesday"];

// Mixed type examples (each dictionary has consistent key and value types)
let userIds: Dict<string, number> = ["alice": 101, "bob": 102, "charlie": 103];
let levels: Dict<number, string> = [1: "beginner", 2: "intermediate", 3: "advanced"];

// Nested dictionary types
let gameStats: Dict<string, Dict<string, number>> = [
  "alice": ["wins": 15, "losses": 3, "draws": 2],
  "bob": ["wins": 8, "losses": 7, "draws": 5]
];

// Dictionary operations with type annotations
let playerName: string = "alice";
let aliceStats: Dict<string, number> = gameStats[playerName];
let aliceWins: number = aliceStats["wins"];
let aliceLosses: number = aliceStats["losses"];

// Function with dictionary parameters
let calculateTotal = (items: Dict<string, number>) => {
  // Manual calculation since we don't have iteration yet
  let apple: number = items["apple"];
  let banana: number = items["banana"];
  let orange: number = items["orange"];
  apple + banana + orange
};

// Function that returns a dictionary
let createUser = (name: string, age: number) => {
  ["name": name, "age": toString(age), "status": "active"]
};

// Test the functions
let totalInventory: number = calculateTotal(inventory);
let newUser: Dict<string, string> = createUser("Diana", 28);
let userName: string = newUser["name"];

// Complex nested structure
let company: Dict<string, Dict<string, Dict<string, number>>> = [
  "engineering": [
    "backend": ["alice": 95000, "bob": 87000],
    "frontend": ["charlie": 82000, "diana": 89000]
  ]
];

let aliceSalary: number = company["engineering"]["backend"]["alice"];

concat(
  concat("Total inventory: ", toString(totalInventory)),
  concat(", Alice's salary: ", toString(aliceSalary))
)