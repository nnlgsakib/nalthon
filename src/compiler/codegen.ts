
import { Program, ContractDefinition, FunctionDefinition } from "./ast";
import { CompiledContract, ABIFunction, ABIParameter } from "./types";
import { getOpcodeHex } from "./opcodes";
import keccak256 from "keccak";

export function compileProgram(program: Program): CompiledContract[] {
return program.contracts.map(contract => compileContract(contract));
}

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

function buildABI(contractDef: ContractDefinition): { abi: ABIFunction[], constructorFn?: FunctionDefinition } {
const abi: ABIFunction[] = [];
let constructorFn: FunctionDefinition | undefined;

for (const fn of contractDef.functions) {
if (fn.name === "constructor") {
constructorFn = fn;
abi.push({
name: "",
type: "constructor",
stateMutability: fn.isPayable ? "payable" : "nonpayable",
inputs: fn.parameters.map(p => ({
name: p.name,
type: p.typeName
})),
outputs: []
});
} else {
abi.push({
name: fn.name,
type: "function",
stateMutability: getStateMutability(fn),
inputs: fn.parameters.map(p => ({
name: p.name,
type: p.typeName
})),
outputs: fn.returnType ? [{ name: "ret", type: fn.returnType }] : []
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

function generateCreationBytecode(runtimeBytecode: string, constructorFn?: FunctionDefinition): string {
let bytecode = "";

// Calculate runtime code size
const codeSize = (runtimeBytecode.length / 2).toString(16).padStart(2, "0");

// Store runtime code size
bytecode += getOpcodeHex("PUSH1") + codeSize;

// Store code in memory and return it
bytecode += getOpcodeHex("DUP1");
bytecode += getOpcodeHex("PUSH1") + "00"; // memory destination
bytecode += getOpcodeHex("PUSH1") + "00"; // code offset
bytecode += getOpcodeHex("CODECOPY");

// Return runtime code
bytecode += getOpcodeHex("PUSH1") + "00"; // memory offset
bytecode += getOpcodeHex("RETURN");

// Append runtime code
return bytecode + runtimeBytecode;
}

function generateRuntimeBytecode(contractDef: ContractDefinition): string {
let bytecode = "";
let jumpTable: { selector: string; offset: number }[] = [];
let currentOffset = 0x100; // Start offset for function implementations

// Store non-constructor functions and their jump offsets
const functions = contractDef.functions.filter(fn => fn.name !== "constructor");
functions.forEach(fn => {
jumpTable.push({
selector: generateFunctionSelector(fn),
offset: currentOffset
});
currentOffset += 0x50; // Allocate space for each function implementation
});

// Function selector logic
bytecode += getOpcodeHex("CALLDATASIZE");
bytecode += getOpcodeHex("ISZERO");
bytecode += getOpcodeHex("PUSH2") + toHex(0x00ff); // Jump to fallback if no data
bytecode += getOpcodeHex("JUMPI");

// Load and mask function selector from calldata (first 4 bytes)
bytecode += getOpcodeHex("PUSH1") + "00";
bytecode += getOpcodeHex("CALLDATALOAD");
bytecode += getOpcodeHex("PUSH29") + "0100000000000000000000000000000000000000000000000000000000";
bytecode += getOpcodeHex("SWAP1");
bytecode += getOpcodeHex("DIV");

// Generate function dispatch table
for (const { selector, offset } of jumpTable) {
bytecode += getOpcodeHex("DUP1");
bytecode += getOpcodeHex("PUSH4") + selector;
bytecode += getOpcodeHex("EQ");
bytecode += getOpcodeHex("PUSH2") + toHex(offset);
bytecode += getOpcodeHex("JUMPI");
}

// Fallback function
bytecode += getOpcodeHex("JUMPDEST"); // 0x00ff
bytecode += getOpcodeHex("STOP");

// Generate function implementations
functions.forEach((fn, index) => {
const offset = jumpTable[index].offset;
bytecode += generateFunctionImplementation(fn, offset);
});

return bytecode;
}

function generateFunctionImplementation(fn: FunctionDefinition, offset: number): string {
let bytecode = "";

// Function entry point
bytecode += getOpcodeHex("JUMPDEST");

// Handle payable check
if (!fn.isPayable) {
bytecode += getOpcodeHex("CALLVALUE");
bytecode += getOpcodeHex("ISZERO");
bytecode += getOpcodeHex("PUSH2") + toHex(offset + 0x10);
bytecode += getOpcodeHex("JUMPI");
bytecode += getOpcodeHex("PUSH1") + "00";
bytecode += getOpcodeHex("DUP1");
bytecode += getOpcodeHex("REVERT");
bytecode += getOpcodeHex("JUMPDEST");
}

// Load parameters
fn.parameters.forEach((param, index) => {
bytecode += getOpcodeHex("PUSH1") + toHex(4 + (index * 32)); // 4 bytes selector + 32 bytes per parameter
bytecode += getOpcodeHex("CALLDATALOAD");
});

// Function body (placeholder - implement actual logic based on your language's semantics)
if (fn.returnType) {
// For functions with return values, store 0 and return it
bytecode += getOpcodeHex("PUSH1") + "00";
bytecode += getOpcodeHex("PUSH1") + "00";
bytecode += getOpcodeHex("MSTORE"); // Store at memory position 0
bytecode += getOpcodeHex("PUSH1") + "20";
bytecode += getOpcodeHex("PUSH1") + "00";
bytecode += getOpcodeHex("RETURN");
} else {
// For functions without return values
bytecode += getOpcodeHex("STOP");
}

return bytecode;
}

function generateFunctionSelector(fn: FunctionDefinition): string {
const signature = `${fn.name}(${fn.parameters.map(p => p.typeName).join(",")})`;
return keccak256('keccak256')
.update(signature)
.digest('hex')
.slice(0, 8); // First 4 bytes
}

function toHex(value: number): string {
return value.toString(16).padStart(4, "0");
}
