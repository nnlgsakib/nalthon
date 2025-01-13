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

export interface VariableAssignment {
  type: "VariableAssignment";
  varName: string;
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

export interface Expression {
  type: "Literal" | "Identifier" | "BinaryOp" | "UnaryOp" | "FunctionCall" | "MemberAccess" | "TernaryOp"| "BitwiseOp"|"LogicalOp";
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

}
export interface Parameter {
  name: string;
  typeName: string;
  defaultValue?: Expression;  // Add optional defaultValue property
}
