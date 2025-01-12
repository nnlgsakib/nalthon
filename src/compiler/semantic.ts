import { Program, ContractDefinition, FunctionDefinition } from "./ast";
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

  // track function signatures to avoid collisions
  const sigMap = new Map<string, boolean>(); // name(paramCount)->exists

  for (const fn of contract.functions) {
    // If function is named "constructor", check that it has no return type
    if (fn.name === "constructor" && fn.returnType) {
      throw new CompileError(`Constructor cannot have a return type`, 0, 0);
    }

    // if "onlyOwner" used, we must have an 'owner' variable
    if (fn.isOnlyOwner && !hasOwnerVar) {
      throw new CompileError(
        `Function '${fn.name}' is onlyOwner, but no 'owner: address' variable found.`,
        0,
        0
      );
    }

    // can't be both payable and view/pure
    if (fn.isPayable && (fn.isView || fn.isPure)) {
      throw new CompileError(
        `Function '${fn.name}' cannot be payable and view/pure at the same time.`,
        0,
        0
      );
    }

    // check param types
    for (const p of fn.parameters) {
      checkValidType(p.typeName);
    }

    // function signature check: name + paramCount
    const sigKey = `${fn.name}(${fn.parameters.length})`;
    if (sigMap.has(sigKey)) {
      throw new CompileError(`Duplicate function signature '${sigKey}'`, 0, 0);
    }
    sigMap.set(sigKey, true);
  }
}

/**
 * Check if a type is recognized. If not, throw an error.
 * 
 * This is a simplified approach:
 * - We allow "uint256", "address", "bool", "string", "mapping(...)"
 */
function checkValidType(typeName: string): void {
  // if it starts with "mapping(", treat as mapping
  if (ALLOWED_BASE_TYPES.has(typeName)) {
    return;
  }
  if (typeName.startsWith("mapping(") && typeName.endsWith(")")) {
    return; 
  }
  throw new CompileError(`Unknown or unsupported type '${typeName}'`, 0, 0);
}
