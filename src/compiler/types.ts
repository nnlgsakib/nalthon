import { Expression } from "./ast";

export enum TokenType {
    // Brackets/Braces/Parentheses
    OpenBrace = "OpenBrace",
    CloseBrace = "CloseBrace",
    OpenParen = "OpenParen",
    CloseParen = "CloseParen",
    OpenBracket = "OpenBracket",
    CloseBracket = "CloseBracket",
    //start and end indices
    En = "En",
    St = "St",
  
    // Punctuation
    Semicolon = "Semicolon",
    Comma = "Comma",
    Colon = "Colon",
    Dot = "Dot",
    Arrow = "Arrow",      // ->
  
    // Operators
    Equals = "Equals",    // =
    Plus = "Plus",        // +
    Minus = "Minus",      // -
    Asterisk = "Asterisk", // *
    Slash = "Slash",      // /
    Percent = "Percent",  // %
    Caret = "Caret",      // ^
    Ampersand = "Ampersand", // &
    Pipe = "Pipe",        // |
    Exclamation = "Exclamation", // !
    Tilde = "Tilde",      // ~
    LessThan = "LessThan", // <
    GreaterThan = "GreaterThan", // >
    Question = "Question", // ?
  
    // Keywords
    Contract = "Contract",
    Def = "Def",
    Payable = "Payable", 
    View = "View",
    Pure = "Pure",
    OnlyOwner = "OnlyOwner",
    Memory = "Memory",
    Storage = "Storage",
    Return = "Return",
    If = "If",
    Else = "Else",
    While = "While",
    For = "For",
    Break = "Break",
    Struct = "Struct",
  
    // Literals
    Identifier = "Identifier",
    NumberLiteral = "NumberLiteral",
    StringLiteral = "StringLiteral",
    BooleanLiteral = "BooleanLiteral",
    
    // Special
    EOF = "EOF",
    Comment = "Comment",
    
    // Generic
    Keyword = "Keyword",
    Symbol = "Symbol"
  }
  
  export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
  }

// Minimal ABI structures
export interface ABIParameter {
  name: string;
  type: string;
}

export interface ABIFunction {
  name: string;
  type: "function" | "constructor" | "fallback" | "receive";
  stateMutability?: "payable" | "view" | "pure" | "nonpayable";
  inputs: ABIParameter[];
  outputs: ABIParameter[];
}

export interface CompiledContract {
  contractName: string;
  abi: ABIFunction[];
  creationBytecode: string;
  runtimeBytecode: string;
}

export interface Parameter {
  name: string;
  typeName: string;
  defaultValue?: Expression;  // Add optional defaultValue property
}
