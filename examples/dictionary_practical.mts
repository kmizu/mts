// Practical dictionary example: User management system

// User database as dictionary
let users: Dict<string, Dict<string, string>> = [
  "alice": ["name": "Alice Smith", "email": "alice@example.com", "role": "admin"],
  "bob": ["name": "Bob Johnson", "email": "bob@example.com", "role": "user"],
  "charlie": ["name": "Charlie Brown", "email": "charlie@example.com", "role": "user"]
];

// Configuration using dictionaries
let config: Dict<string, string> = [
  "app_name": "UserManager",
  "version": "1.0.0",
  "environment": "development",
  "debug_mode": "true"
];

// Permission system using dictionaries
let permissions: Dict<string, Dict<string, boolean>> = [
  "admin": ["read": true, "write": true, "delete": true, "manage_users": true],
  "user": ["read": true, "write": false, "delete": false, "manage_users": false],
  "guest": ["read": true, "write": false, "delete": false, "manage_users": false]
];

// Helper function to get user info
let getUserInfo = (userId: string) => {
  let user: Dict<string, string> = users[userId];
  if (user) {
    user
  } else {
    ["error": "User not found"]
  }
};

// Helper function to check permissions
let hasPermission = (role: string, action: string) => {
  let rolePerms: Dict<string, boolean> = permissions[role];
  if (rolePerms) {
    let perm: boolean = rolePerms[action];
    perm
  } else {
    false
  }
};

// Simulate user operations
let currentUser: string = "alice";
let userInfo: Dict<string, string> = getUserInfo(currentUser);
let userRole: string = userInfo["role"];
let canWrite: boolean = hasPermission(userRole, "write");
let canDelete: boolean = hasPermission(userRole, "delete");

// Application state using nested dictionaries
let appState: Dict<string, Dict<string, string>> = [
  "ui": ["theme": "dark", "language": "en", "sidebar": "collapsed"],
  "user": ["current": currentUser, "last_login": "2024-09-24", "session_timeout": "3600"],
  "system": ["status": "healthy", "uptime": "99.9", "last_backup": "2024-09-23"]
];

// Cache system using dictionaries
let cache: Dict<string, string> = [
  "user_alice_profile": "cached_profile_data",
  "config_last_updated": "2024-09-24T10:00:00Z",
  "stats_daily": "cached_stats_data"
];

// Log system using dictionaries
let logs: Dict<number, Dict<string, string>> = [
  1: ["timestamp": "10:30:15", "level": "INFO", "message": "User alice logged in"],
  2: ["timestamp": "10:31:22", "level": "DEBUG", "message": "Cache hit for user profile"],
  3: ["timestamp": "10:32:01", "level": "WARN", "message": "High memory usage detected"]
];

// Get specific log entry
let logEntry: Dict<string, string> = logs[1];
let logMessage: string = logEntry["message"];
let logLevel: string = logEntry["level"];

// Build result message
let result = concat(
  concat("App: ", config["app_name"]),
  concat(
    concat(" | User: ", userInfo["name"]),
    concat(
      concat(" | Can write: ", toString(canWrite)),
      concat(" | Latest log: ", logMessage)
    )
  )
);

result