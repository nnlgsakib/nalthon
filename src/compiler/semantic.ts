import { 
  Program, 
  ContractDefinition, 
  FunctionDefinition, 
  Statement, 
  Expression, 
  IfStatement, 
  WhileStatement, 
  ForStatement, 
  BreakStatement, 
  VariableAssignment,
  ReturnStatement 
} from "./ast";
import { CompileError } from "../utils/errors";

// Allowed base types (expand as needed)
const ALLOWED_BASE_TYPES = new Set(["uint256", "address", "bool", "string", "mapping"]);

/**
 * Perform comprehensive semantic checks on the entire AST
 */
export function semanticCheck(program: Program): void {
  for (const contract of program.contracts) {
    checkContract(contract);
  }
}

function checkContract(contract: ContractDefinition) {
  const stateVarMap = new Map<string, string>(); // name -> type

  for (const sv of contract.stateVars) {
    checkValidType(sv.typeName);
    if (stateVarMap.has(sv.name)) {
      throw new CompileError(`Duplicate state variable '${sv.name}'`, 0, 0);
    }
    stateVarMap.set(sv.name, sv.typeName);
  }

  let hasOwnerVar = false;
  if (stateVarMap.has("owner") && stateVarMap.get("owner") === "address") {
    hasOwnerVar = true;
  }

  // Track function signatures to avoid collisions
  const sigMap = new Map<string, boolean>(); // name(paramCount)->exists

  for (const fn of contract.functions) {
    checkFunction(fn, hasOwnerVar, stateVarMap);
  }
}

function checkFunction(
  fn: FunctionDefinition, 
  hasOwnerVar: boolean, 
  stateVarMap: Map<string, string>
) {
  // If function is named "constructor", check that it has no return type
  if (fn.name === "constructor" && fn.returnType) {
    throw new CompileError(`Constructor cannot have a return type`, 0, 0);
  }

  // if "onlyOwner" used, ensure 'owner' variable exists
  if (fn.isOnlyOwner && !hasOwnerVar) {
    throw new CompileError(
      `Function '${fn.name}' is onlyOwner, but no 'owner: address' variable found.`,
      0,
      0
    );
  }

  // Ensure payable functions cannot be view/pure
  if (fn.isPayable && (fn.isView || fn.isPure)) {
    throw new CompileError(
      `Function '${fn.name}' cannot be payable and view/pure at the same time.`,
      0,
      0
    );
  }

  // Check parameter types
  for (const p of fn.parameters) {
    checkValidType(p.typeName);
  }

  // Check function body statements
  fn.body.forEach(stmt => checkStatement(stmt, stateVarMap, fn));
}

function checkStatement(
  stmt: Statement, 
  stateVarMap: Map<string, string>, 
  fn: FunctionDefinition
) {
  switch (stmt.type) {
    case "VariableAssignment":
      checkVariableAssignment(stmt, stateVarMap);
      break;
    case "IfStatement":
      checkIfStatement(stmt, stateVarMap, fn);
      break;
    case "WhileStatement":
      checkWhileStatement(stmt, stateVarMap, fn);
      break;
    case "ForStatement":
      checkForStatement(stmt, stateVarMap, fn);
      break;
    case "BreakStatement":
      checkBreakStatement(stmt, fn);
      break;
    case "ReturnStatement":
      checkReturnStatement(stmt, fn);
      break;
    default:
      throw new CompileError(`Unsupported statement type: '${stmt.type}'`, 0, 0);
  }
}

function checkVariableAssignment(
  stmt: VariableAssignment, 
  stateVarMap: Map<string, string>
) {
  if (!stateVarMap.has(stmt.varName)) {
    throw new CompileError(`Undefined variable '${stmt.varName}'`, 0, 0);
  }
  checkExpression(stmt.expression);
}

function checkIfStatement(
  stmt: IfStatement, 
  stateVarMap: Map<string, string>, 
  fn: FunctionDefinition
) {
  checkExpression(stmt.condition);
  stmt.thenBlock.forEach(s => checkStatement(s, stateVarMap, fn));
  if (stmt.elseBlock) {
    stmt.elseBlock.forEach(s => checkStatement(s, stateVarMap, fn));
  }
}

function checkWhileStatement(
  stmt: WhileStatement, 
  stateVarMap: Map<string, string>, 
  fn: FunctionDefinition
) {
  checkExpression(stmt.condition);
  stmt.body.forEach(s => checkStatement(s, stateVarMap, fn));
}

function checkForStatement(
  stmt: ForStatement, 
  stateVarMap: Map<string, string>, 
  fn: FunctionDefinition
) {
  checkVariableAssignment(stmt.initialization, stateVarMap);
  checkExpression(stmt.condition);
  checkExpression(stmt.increment);
  stmt.body.forEach(s => checkStatement(s, stateVarMap, fn));
}

function checkBreakStatement(stmt: BreakStatement, fn: FunctionDefinition) {
  if (!fn.body.some(s => s.type === "WhileStatement" || s.type === "ForStatement")) {
    throw new CompileError(`'break' used outside of a loop`, 0, 0);
  }
}

function checkReturnStatement(
  stmt: ReturnStatement, 
  fn: FunctionDefinition
) {
  if (stmt.expression && !fn.returnType) {
    throw new CompileError(
      `Function '${fn.name}' does not expect a return value, but return expression found.`,
      0,
      0
    );
  }
  if (stmt.expression) {
    checkExpression(stmt.expression);
  }
}

function checkExpression(expr: Expression): void {
  switch (expr.type) {
    case "Literal":
    case "Identifier":
      break; // Literals and identifiers are inherently valid
    case "BinaryOp":
      checkExpression(expr.left!);
      checkExpression(expr.right!);
      break;
    case "UnaryOp":
      checkExpression(expr.value!);
      break;
    case "TernaryOp":
      checkExpression(expr.condition!);
      checkExpression(expr.trueBranch!);
      checkExpression(expr.falseBranch!);
      break;
    case "FunctionCall":
      expr.arguments!.forEach(arg => checkExpression(arg));
      break;
    default:
      throw new CompileError(`Unsupported expression type: '${expr.type}'`, 0, 0);
  }
}

/**
 * Check if a type is recognized. If not, throw an error.
 * 
 * This is a simplified approach:
 * - We allow "uint256", "address", "bool", "string", "mapping(...)"
 */
function checkValidType(typeName: string): void {
  if (ALLOWED_BASE_TYPES.has(typeName)) {
    return;
  }
  if (typeName.startsWith("mapping(") && typeName.endsWith(")")) {
    return;
  }
  throw new CompileError(`Unknown or unsupported type '${typeName}'`, 0, 0);
}
