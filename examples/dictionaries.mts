// Dictionary operations example

// Basic string-keyed dictionary
let person = ["name": "Alice", "age": 30, "city": "Tokyo"];
let name = person["name"];
let age = person["age"];
let city = person["city"];

// Number-keyed dictionary
let numbers = [1: "one", 2: "two", 3: "three", 4: "four"];
let first = numbers[1];
let second = numbers[2];

// Mixed type keys
let mixed = ["string": 1, 42: "number key", true: "boolean key"];
let stringValue = mixed["string"];
let numberValue = mixed[42];
let booleanValue = mixed[true];

// Dynamic keys
let key = "dynamic";
let dynamicDict = [key: "computed key value"];
let value = dynamicDict[key];

// Nested dictionaries
let config = [
  "database": ["host": "localhost", "port": 5432],
  "cache": ["host": "redis.local", "port": 6379]
];
let dbHost = config["database"]["host"];
let cachePort = config["cache"]["port"];

// Dictionary with array values
let groups = [
  "admins": ["alice", "bob"],
  "users": ["charlie", "diana", "eve"],
  "guests": ["frank"]
];
let adminList = groups["admins"];
let firstAdmin = adminList[0];

// Non-existent key returns undefined
let missing = person["country"]; // undefined

// Accessing nested values
concat(
  concat("Database: ", dbHost),
  concat(", First admin: ", firstAdmin)
)