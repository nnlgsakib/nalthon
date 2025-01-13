
import { Program, ContractDefinition, FunctionDefinition } from "./ast";
import { CompiledContract, ABIFunction } from "./types";
import { getOpcodeHex } from "./opcodes";
import keccak256 from "keccak";

/**
 * Compile a program into multiple compiled contracts.
 */
export function compileProgram(program: Program): CompiledContract[] {
  return program.contracts.map(compileContract);
}

/**
 * Compile a single contract definition into a compiled contract.
 */
function compileContract(contractDef: ContractDefinition): CompiledContract {
  const { abi, constructorFn } = buildABI(contractDef);
  const runtimeBytecode = generateRuntimeBytecode(contractDef);
  const creationBytecode = generateCreationBytecode(runtimeBytecode, constructorFn);

  return {
    contractName: contractDef.name,
    abi,
    creationBytecode,
    runtimeBytecode,
  };
}

/**
 * Build the ABI for the contract.
 */
function buildABI(contractDef: ContractDefinition): { abi: ABIFunction[]; constructorFn?: FunctionDefinition } {
  const abi: ABIFunction[] = [];
  let constructorFn: FunctionDefinition | undefined;

  for (const fn of contractDef.functions) {
    if (fn.name === "constructor") {
      constructorFn = fn;
      abi.push({
        name: "",
        type: "constructor",
        stateMutability: fn.isPayable ? "payable" : "nonpayable",
        inputs: fn.parameters.map((p) => ({ name: p.name, type: p.typeName })),
        outputs: [],
      });
    } else {
      abi.push({
        name: fn.name,
        type: "function",
        stateMutability: getStateMutability(fn),
        inputs: fn.parameters.map((p) => ({ name: p.name, type: p.typeName })),
        outputs: fn.returnType ? [{ name: "", type: fn.returnType }] : [],
      });
    }
  }

  return { abi, constructorFn };
}

function getStateMutability(fn: FunctionDefinition): "payable" | "view" | "pure" | "nonpayable" {
  if (fn.isPayable) return "payable";
  if (fn.isView) return "view";
  if (fn.isPure) return "pure";
  return "nonpayable";
}

/**
 * Generate the creation bytecode for a contract.
 */
function generateCreationBytecode(runtimeBytecode: string, constructorFn?: FunctionDefinition): string {
  // Initialize creation code
  let bytecode = "";
  
  // Push code size
  const size = (runtimeBytecode.length / 2).toString(16).padStart(4, '0');
  bytecode += getOpcodeHex("PUSH2") + size;
  
  // Push memory location
  bytecode += getOpcodeHex("PUSH1") + "00";
  
  // Push current position
  bytecode += getOpcodeHex("PUSH1") + "00";
  
  // Copy runtime code to memory
  bytecode += getOpcodeHex("CODECOPY");
  
  // Return runtime code
  bytecode += getOpcodeHex("PUSH2") + size;
  bytecode += getOpcodeHex("PUSH1") + "00";
  bytecode += getOpcodeHex("RETURN");

  // Append runtime code
  return bytecode + runtimeBytecode;
}

/**
 * Generate the runtime bytecode for a contract.
 */
function generateRuntimeBytecode(contractDef: ContractDefinition): string {
  let bytecode = "";
  const functions = contractDef.functions.filter(fn => fn.name !== "constructor");
  
  // Start with initial jump table setup
  bytecode += getOpcodeHex("PUSH1") + "80"; // Free memory pointer
  bytecode += getOpcodeHex("PUSH1") + "40";
  bytecode += getOpcodeHex("MSTORE");
  
  // Add function selector logic
  bytecode += getOpcodeHex("PUSH1") + "00";
  bytecode += getOpcodeHex("CALLDATALOAD");
  bytecode += getOpcodeHex("PUSH1") + "E0";
  bytecode += getOpcodeHex("SHR"); // Get function selector
  
  // Generate jump table
  let functionOffset = 0;
  const jumpOffsets: number[] = [];
  
  functions.forEach((fn, index) => {
    const selector = generateFunctionSelector(fn);
    
    // Compare selector
    bytecode += getOpcodeHex("DUP1");
    bytecode += getOpcodeHex("PUSH4") + selector;
    bytecode += getOpcodeHex("EQ");
    
    // Calculate jump destination
    const jumpDest = 0x100 + (index * 0x50);
    jumpOffsets.push(jumpDest);
    
    bytecode += getOpcodeHex("PUSH2") + jumpDest.toString(16).padStart(4, '0');
    bytecode += getOpcodeHex("JUMPI");
  });
  
  // Add fallback/revert logic
  bytecode += getOpcodeHex("JUMPDEST"); // Invalid function selector
  bytecode += getOpcodeHex("PUSH1") + "00";
  bytecode += getOpcodeHex("DUP1");
  bytecode += getOpcodeHex("REVERT");
  
  // Add function implementations
  functions.forEach((fn, index) => {
    const offset = jumpOffsets[index];
    bytecode += generateFunctionImplementation(fn, offset);
  });
  
  return bytecode;
}

/**
 * Generate the implementation for a function.
 */
function generateFunctionImplementation(fn: FunctionDefinition, offset: number): string {
  let bytecode = "";
  
  // Function entry point
  bytecode += getOpcodeHex("JUMPDEST");
  
  // Non-payable check
  if (!fn.isPayable) {
    bytecode += getOpcodeHex("CALLVALUE");
    bytecode += getOpcodeHex("DUP1");
    bytecode += getOpcodeHex("ISZERO");
    bytecode += getOpcodeHex("PUSH2") + (offset + 0x0a).toString(16).padStart(4, '0');
    bytecode += getOpcodeHex("JUMPI");
    bytecode += getOpcodeHex("PUSH1") + "00";
    bytecode += getOpcodeHex("DUP1");
    bytecode += getOpcodeHex("REVERT");
    bytecode += getOpcodeHex("JUMPDEST");
    bytecode += getOpcodeHex("POP");
  }
  
  // Load parameters
  fn.parameters.forEach((param, index) => {
    const paramOffset = (index + 1) * 32; // Skip selector
    bytecode += getOpcodeHex("PUSH1") + paramOffset.toString(16).padStart(2, '0');
    bytecode += getOpcodeHex("CALLDATALOAD");
  });
  
  // Default implementation (returns 0 for view/pure functions)
  if (fn.returnType) {
    bytecode += getOpcodeHex("PUSH1") + "20"; // Return size
    bytecode += getOpcodeHex("PUSH1") + "00"; // Memory location
    bytecode += getOpcodeHex("PUSH1") + "00"; // Value to return
    bytecode += getOpcodeHex("DUP1");
    bytecode += getOpcodeHex("DUP3");
    bytecode += getOpcodeHex("MSTORE"); // Store value
    bytecode += getOpcodeHex("RETURN");
  } else {
    bytecode += getOpcodeHex("STOP");
  }
  
  return bytecode;
}

/**
 * Generate the function selector from a function definition.
 */
function generateFunctionSelector(fn: FunctionDefinition): string {
  const signature = `${fn.name}(${fn.parameters.map(p => p.typeName).join(",")})`;
  return keccak256("keccak256")
    .update(signature)
    .digest("hex")
    .slice(0, 8);
}
/**
 * Convert a number to a padded hexadecimal string.
 */
function toHex(value: number): string {
  const hex = value.toString(16);
  return hex.length % 2 === 0 ? hex : "0" + hex; // Ensure even-length
}