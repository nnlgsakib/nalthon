
export interface Program {
  contracts: ContractDefinition[];
}

export interface ContractDefinition {
  name: string;
  stateVars: VariableDeclaration[];
  functions: FunctionDefinition[];
}

export interface VariableDeclaration {
  name: string;
  typeName: string;
  storageLocation?: "memory" | "storage";
}

export interface FunctionDefinition {
  name: string;
  parameters: Parameter[];
  returnType?: string;
  isConstructor?: boolean;
  isPayable?: boolean;
  isView?: boolean;
  isPure?: boolean;
  isOnlyOwner?: boolean;
  body: Statement[];
}

export interface Parameter {
  name: string;
  typeName: string;
}

export type Statement =
  | VariableAssignment
  | IfStatement
  | WhileStatement
  | ForStatement
  | BreakStatement
  | ContinueStatement
  | ReturnStatement
  | ExpressionStatement;

// export interface VariableAssignment {
//   type: "VariableAssignment";
//   varName: string;
//   expression: Expression;
// }

export interface ExpressionStatement {
  type: "ExpressionStatement";
  expression: Expression;
}

export interface VariableAssignment {
  type: "VariableAssignment";
  varName: Expression; // Allow complex expressions like IndexAccess
  expression: Expression;
}

export interface IfStatement {
  type: "IfStatement";
  condition: Expression;
  thenBlock: Statement[];
  elseBlock?: Statement[];
}

export interface WhileStatement {
  type: "WhileStatement";
  condition: Expression;
  body: Statement[];
}

export interface ForStatement {
  type: "ForStatement";
  initialization: VariableAssignment;
  condition: Expression;
  increment: Expression;
  body: Statement[];
}

export interface BreakStatement {
  type: "BreakStatement";
}

export interface ContinueStatement {
  type: "ContinueStatement";
}

export interface ReturnStatement {
  type: "ReturnStatement";
  expression?: Expression;
}

export interface ExpressionStatement {
  type: "ExpressionStatement";
  expression: Expression;
}
export interface IndexAccess {
  type: "IndexAccess";
  object: Expression; // The variable or mapping being indexed
  index: Expression; // The index expression
}

export interface MemberAccess {
  type: "MemberAccess";
  object: Expression; // The variable being accessed
  member: string; // The member being accessed
}

export interface Expression {
  type: "Literal" | "Identifier" | "BinaryOp" | "UnaryOp" | "FunctionCall" | "MemberAccess" | "TernaryOp"| "BitwiseOp"|"LogicalOp" | "IndexAccess" | "ExpressionStatement";
  value?: any;
  left?: Expression;
  operator?: string;
  right?: Expression;
  arguments?: Expression[];
  object?: Expression;
  member?: string;
  condition?: Expression;
  trueBranch?: Expression;
  falseBranch?: Expression;
  operand?: Expression;
  index?: Expression;
  expression?: Expression;

}
export interface Parameter {
  name: string;
  typeName: string;
  defaultValue?: Expression;  // Add optional defaultValue property
}
