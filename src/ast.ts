// AST (Abstract Syntax Tree) definitions for MTS

export type Position = {
  line: number;
  column: number;
};

export type Location = {
  start: Position;
  end: Position;
};

// Literals
export type NumberLiteral = {
  kind: "NumberLiteral";
  value: number;
  loc?: Location;
};

export type StringLiteral = {
  kind: "StringLiteral";
  value: string;
  loc?: Location;
};

export type BooleanLiteral = {
  kind: "BooleanLiteral";
  value: boolean;
  loc?: Location;
};

export type NullLiteral = {
  kind: "NullLiteral";
  loc?: Location;
};

export type UndefinedLiteral = {
  kind: "UndefinedLiteral";
  loc?: Location;
};

// Identifiers and Variables
export type Identifier = {
  kind: "Identifier";
  name: string;
  loc?: Location;
};

export type VariableBinding = {
  identifier: Identifier;
  initializer: Expression;
  typeAnnotation?: TypeAnnotation;
  loc?: Location;
};

export type VariableDeclaration = {
  kind: "VariableDeclaration";
  bindings: VariableBinding[];
  loc?: Location;
};

export type ImportSpecifier = {
  imported: string;
  local: string;
  loc?: Location;
};

export type ImportDeclaration = {
  kind: "ImportDeclaration";
  specifiers: ImportSpecifier[];
  source: string;
  loc?: Location;
};

// Arrays
export type ArrayExpression = {
  kind: "ArrayExpression";
  elements: Expression[];
  loc?: Location;
};

export type IndexExpression = {
  kind: "IndexExpression";
  array: Expression;
  index: Expression;
  loc?: Location;
};

// Objects
export type ObjectProperty = {
  key: string;
  value: Expression;
  loc?: Location;
};

export type ObjectExpression = {
  kind: "ObjectExpression";
  properties: ObjectProperty[];
  loc?: Location;
};

// Dictionary entries and expressions
export type DictionaryEntry = {
  key: Expression;
  value: Expression;
  loc?: Location;
};

export type DictionaryExpression = {
  kind: "DictionaryExpression";
  entries: DictionaryEntry[];
  loc?: Location;
};

export type MemberExpression = {
  kind: "MemberExpression";
  object: Expression;
  property: string;
  loc?: Location;
};

// Type annotations for parameters
export type TypeAnnotation = {
  kind: "TypeAnnotation";
  type: TypeExpression;
  loc?: Location;
};

// Type expressions for type annotations
export type TypeExpression =
  | PrimitiveTypeExpression
  | ArrayTypeExpression
  | DictionaryTypeExpression
  | ObjectTypeExpression
  | FunctionTypeExpression
  | TypeVariable;

export type PrimitiveTypeExpression = {
  kind: "PrimitiveTypeExpression";
  primitive: "number" | "string" | "boolean" | "null" | "undefined" | "unit";
  loc?: Location;
};

export type ArrayTypeExpression = {
  kind: "ArrayTypeExpression";
  elementType: TypeExpression;
  loc?: Location;
};

export type DictionaryTypeExpression = {
  kind: "DictionaryTypeExpression";
  keyType: TypeExpression;
  valueType: TypeExpression;
  loc?: Location;
};

export type ObjectTypeExpression = {
  kind: "ObjectTypeExpression";
  fields: { key: string; type: TypeExpression }[];
  loc?: Location;
};

export type FunctionTypeExpression = {
  kind: "FunctionTypeExpression";
  paramTypes: TypeExpression[];
  returnType: TypeExpression;
  loc?: Location;
};

export type TypeVariable = {
  kind: "TypeVariable";
  name: string;
  loc?: Location;
};

// Parameter with optional type annotation
export type Parameter = {
  kind: "Parameter";
  identifier: Identifier;
  typeAnnotation?: TypeAnnotation;
  loc?: Location;
};

// Functions
export type FunctionExpression = {
  kind: "FunctionExpression";
  parameters: Parameter[];
  body: Expression;
  returnTypeAnnotation?: TypeAnnotation;
  loc?: Location;
};

export type CallExpression = {
  kind: "CallExpression";
  callee: Expression;
  arguments: Expression[];
  loc?: Location;
};

// Binary operations
export type BinaryOperator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "=="
  | "!="
  | "<"
  | "<="
  | ">"
  | ">="
  | "&&"
  | "||";

export type BinaryExpression = {
  kind: "BinaryExpression";
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
  loc?: Location;
};

// Unary operations
export type UnaryOperator = "!" | "-";

export type UnaryExpression = {
  kind: "UnaryExpression";
  operator: UnaryOperator;
  operand: Expression;
  loc?: Location;
};

// Control flow
export type IfExpression = {
  kind: "IfExpression";
  condition: Expression;
  thenBranch: Expression;
  elseBranch: Expression | null;
  loc?: Location;
};

export type MatchCase = {
  pattern: Pattern;
  guard?: Expression;
  body: Expression;
  loc?: Location;
};

export type MatchExpression = {
  kind: "MatchExpression";
  expression: Expression;
  cases: MatchCase[];
  loc?: Location;
};

// Patterns for match expressions
export type LiteralPattern = {
  kind: "LiteralPattern";
  value: NumberLiteral | StringLiteral | BooleanLiteral | NullLiteral;
  loc?: Location;
};

export type IdentifierPattern = {
  kind: "IdentifierPattern";
  identifier: Identifier;
  loc?: Location;
};

export type WildcardPattern = {
  kind: "WildcardPattern";
  loc?: Location;
};

export type Pattern = LiteralPattern | IdentifierPattern | WildcardPattern;

// Block expressions
export type BlockExpression = {
  kind: "BlockExpression";
  statements: Statement[];
  expression: Expression;
  loc?: Location;
};

// Statements (used within blocks)
export type LetStatement = {
  kind: "LetStatement";
  bindings: VariableBinding[];
  loc?: Location;
};

export type ExpressionStatement = {
  kind: "ExpressionStatement";
  expression: Expression;
  loc?: Location;
};

export type Statement = LetStatement | ExpressionStatement;

// All expressions
export type Expression =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | UndefinedLiteral
  | Identifier
  | ArrayExpression
  | IndexExpression
  | ObjectExpression
  | DictionaryExpression
  | MemberExpression
  | FunctionExpression
  | CallExpression
  | BinaryExpression
  | UnaryExpression
  | IfExpression
  | MatchExpression
  | BlockExpression
  | VariableDeclaration;

// Program (top-level)
export type TopLevelStatement = Expression | ImportDeclaration;

export type Program = {
  kind: "Program";
  body: TopLevelStatement[];
  loc?: Location;
};

// AST Node type (union of all AST node types)
export type ASTNode =
  | Program
  | Expression
  | Statement
  | Pattern
  | ObjectProperty
  | MatchCase
  | ImportDeclaration;
