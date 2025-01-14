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

  let hasOwnerVar = stateVarMap.has("owner") && stateVarMap.get("owner") === "address";

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
      0, 0
    );
  }

  // Ensure payable functions cannot be view/pure
  if (fn.isPayable && (fn.isView || fn.isPure)) {
    throw new CompileError(
      `Function '${fn.name}' cannot be payable and view/pure at the same time.`,
      0, 0
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
      case "ExpressionStatement":
        checkExpression(stmt.expression); // Check the expression in the statement
        break;
    default:
      throw new CompileError(`Unsupported statement type: '${stmt.type}'`, 0, 0);
  }
}

function checkVariableAssignment(
  stmt: VariableAssignment,
  stateVarMap: Map<string, string>
) {
  const varName = resolveVarName(stmt.varName, stateVarMap);
  if (!varName || !stateVarMap.has(varName)) {
    throw new CompileError(
      `Undefined variable '${varName || "unknown"}'`,
      0,
      0
    );
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
  const varName = resolveVarName(stmt.initialization.varName, stateVarMap);

  // If the variable is not in the stateVarMap, it's either an inline declaration or undefined
  if (!varName || !stateVarMap.has(varName)) {
      if (stmt.initialization.type === "VariableAssignment") {
          // Treat this as a valid inline declaration
          stateVarMap.set(varName!, "unknown"); // You can replace "unknown" with the actual type
      } else {
          throw new CompileError(
              `Undefined variable in 'for' loop initialization: '${varName || "unknown"}'`,
              0,
              0
          );
      }
  }

  checkVariableAssignment(stmt.initialization, stateVarMap);
  checkExpression(stmt.condition);
  checkExpression(stmt.increment);
  stmt.body.forEach((s) => checkStatement(s, stateVarMap, fn));
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
      0, 0
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
      checkExpression(expr.operand!);
      break;
    case "TernaryOp":
      checkExpression(expr.condition!);
      checkExpression(expr.trueBranch!);
      checkExpression(expr.falseBranch!);
      break;
    case "FunctionCall":
      expr.arguments!.forEach(arg => checkExpression(arg));
      break;
    case "MemberAccess":
      checkExpression(expr.object!);
      break;
    case "IndexAccess":
      checkExpression(expr.object!);
      checkExpression(expr.index!);
      break;
      case "Tuple":
        if (!expr.elements || expr.elements.length === 0) {
          throw new CompileError(`Empty tuple is not allowed`, 0, 0);
        }
        expr.elements.forEach(element => checkExpression(element)); // Check all elements in the tuple
        break;
        case "ArrayLiteral":
          if (!expr.elements) {
            throw new CompileError(`Invalid array literal`, 0, 0);
          }
          // Allow empty arrays in valid contexts like variable resets
          if (expr.elements.length === 0) {
            return; // Empty arrays are valid in this context
          }
          expr.elements.forEach(element => checkExpression(element)); // Check all elements in the array
          break;
          case "ObjectLiteral":
            if (!expr.properties) {
              throw new CompileError(`Invalid object literal`, 0, 0);
            }
            expr.properties.forEach(property => {
              checkExpression(property.value); // Check the value of each property
            });
            break;
        
    default:
      throw new CompileError(`Unsupported expression type: '${expr.type}'`, 0, 0);
  }
}

function resolveVarName(varName: Expression, stateVarMap: Map<string, string>): string | null {
  if (varName.type === "Identifier") {
    return varName.value; // Return the variable name
  }
  if (varName.type === "MemberAccess") {
    const objectName = resolveVarName(varName.object!, stateVarMap);
    return objectName ? `${objectName}.${varName.member}` : null;
  }
  if (varName.type === "IndexAccess") {
    const objectName = resolveVarName(varName.object!, stateVarMap);
    return objectName ? `${objectName}[...]` : null; // Simplified index representation
  }
  return null; // Unsupported variable reference
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
  if (typeName.endsWith("[]")) {
    const baseType = typeName.slice(0, -2); // Remove the "[]" suffix to check the base type
    if (ALLOWED_BASE_TYPES.has(baseType)) {
      return;
    }
  }
  throw new CompileError(`Unknown or unsupported type '${typeName}'`, 0, 0);
}
