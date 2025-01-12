import { tokenize } from "./lexer";
import { Token, TokenType } from "./types";
import { Program, ContractDefinition, VariableDeclaration, FunctionDefinition, Parameter } from "./ast";
import { CompileError } from "../utils/errors";

export function parse(source: string): Program {
  const tokens = tokenize(source);
  let current = 0;

  function peek(offset = 0): Token {
    return tokens[current + offset];
  }

  function consume(expected?: TokenType): Token {
    const tk = peek();
    if (expected && tk.type !== expected) {
      throw new CompileError(
        `Expected token '${expected}', got '${tk.type}'`,
        tk.line,
        tk.column
      );
    }
    current++;
    return tk;
  }

  const program: Program = { contracts: [] };

  while (true) {
    const tk = peek();
    if (tk.type === TokenType.EOF) break;
    if (tk.type !== TokenType.Contract) {
      throw new CompileError("Expected 'contract' keyword", tk.line, tk.column);
    }
    program.contracts.push(parseContract());
  }

  return program;

  function parseContract(): ContractDefinition {
    consume(TokenType.Contract);
    const nameToken = consume(TokenType.Identifier);
    const contractName = nameToken.value;

    consume(TokenType.OpenBrace);

    const stateVars: VariableDeclaration[] = [];
    const functions: FunctionDefinition[] = [];

    while (peek().type !== TokenType.CloseBrace && peek().type !== TokenType.EOF) {
      if (peek().type === TokenType.Def) {
        functions.push(parseFunction());
      } else {
        stateVars.push(parseStateVar());
      }
    }

    consume(TokenType.CloseBrace);

    return {
      name: contractName,
      stateVars,
      functions,
    };
  }

  function parseStateVar(): VariableDeclaration {
    // e.g. "owner: address;  or  totalSupply: uint256 storage;"
    const nameToken = consume(TokenType.Identifier);
    consume(TokenType.Colon);
    const typeToken = consume(TokenType.Identifier);

    let storageLoc: "memory" | "storage" | undefined;
    if (peek().type === TokenType.Memory) {
      consume(TokenType.Memory);
      storageLoc = "memory";
    } else if (peek().type === TokenType.Storage) {
      consume(TokenType.Storage);
      storageLoc = "storage";
    }

    if (peek().type === TokenType.Semicolon) {
      consume(TokenType.Semicolon);
    } else {
      throw new CompileError("Expected ';' after variable declaration", peek().line, peek().column);
    }

    return {
      name: nameToken.value,
      typeName: typeToken.value,
      storageLocation: storageLoc,
    };
  }

  function parseFunction(): FunctionDefinition {
    consume(TokenType.Def);
    const fnName = consume(TokenType.Identifier).value;

    consume(TokenType.OpenParen);
    const parameters: Parameter[] = [];
    while (peek().type !== TokenType.CloseParen) {
      const pName = consume(TokenType.Identifier).value;
      consume(TokenType.Colon);
      const pType = consume(TokenType.Identifier).value;
      parameters.push({ name: pName, typeName: pType });

      if (peek().type === TokenType.Comma) {
        consume(TokenType.Comma);
      } else {
        break;
      }
    }
    consume(TokenType.CloseParen);

    // optional "-> returnType"
    let returnType: string | undefined;
    if (peek().type === TokenType.Arrow) {
      consume(TokenType.Arrow);
      const rtToken = consume(TokenType.Identifier);
      returnType = rtToken.value;
    }

    consume(TokenType.OpenBrace);

    // Potential modifiers inside
    let isPayable = false;
    let isView = false;
    let isPure = false;
    let isOnlyOwner = false;

    // We'll skip real statement parsing for brevity,
    // but let's gather tokens we care about:
    const body: any[] = [];
    while (peek().type !== TokenType.CloseBrace && peek().type !== TokenType.EOF) {
      const tk = peek();
      if (tk.type === TokenType.Payable) {
        consume();
        isPayable = true;
      } else if (tk.type === TokenType.View) {
        consume();
        isView = true;
      } else if (tk.type === TokenType.Pure) {
        consume();
        isPure = true;
      } else if (tk.type === TokenType.OnlyOwner) {
        consume();
        isOnlyOwner = true;
      } else {
        // skip or parse actual statements
        consume();
      }
    }

    consume(TokenType.CloseBrace);

    return {
      name: fnName,
      parameters,
      returnType,
      isPayable,
      isView,
      isPure,
      isOnlyOwner,
      body,
    };
  }
}
