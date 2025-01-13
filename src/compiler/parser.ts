import { tokenize } from "./lexer";
import { Token, TokenType } from "./types";
import {
  Program,
  ContractDefinition,
  VariableDeclaration,
  FunctionDefinition,
  Parameter,
  Statement,
  Expression,
  IfStatement,
  WhileStatement,
  ForStatement,
  BreakStatement,
  VariableAssignment,
  ReturnStatement,
} from "./ast";
import { CompileError } from "../utils/errors";

export function parse(source: string): Program {
  const tokens = tokenize(source);
  let current = 0;

  function peek(offset = 0): Token {
    return tokens[current + offset];
  }

  function consume(expected?: TokenType): Token {
    const token = peek();
    if (expected && token.type !== expected) {
      throw new CompileError(
        `Expected token '${expected}', got '${token.type}' at line ${token.line}, column ${token.column}`,
        token.line,
        token.column
      );
    }
    current++;
    return token;
  }

  const program: Program = { contracts: [] };

  while (peek().type !== TokenType.EOF) {
    program.contracts.push(parseContract());
  }

  return program;

  function parseContract(): ContractDefinition {
    consume(TokenType.Contract);
    const nameToken = consume(TokenType.Identifier);
    const contractName = nameToken.value;

    consume(TokenType.St);

    const stateVars: VariableDeclaration[] = [];
    const functions: FunctionDefinition[] = [];

    while (peek().type !== TokenType.En) {
      if (peek().type === TokenType.Def) {
        functions.push(parseFunction());
      } else {
        stateVars.push(parseStateVar());
      }
    }

    consume(TokenType.En);
    return { name: contractName, stateVars, functions };
  }

  function parseStateVar(): VariableDeclaration {
    const nameToken = consume(TokenType.Identifier);
    consume(TokenType.Colon);
    const typeToken = consume(TokenType.Identifier);

    let storageLocation: "memory" | "storage" | undefined;
    if (peek().type === TokenType.Memory) {
      consume(TokenType.Memory);
      storageLocation = "memory";
    } else if (peek().type === TokenType.Storage) {
      consume(TokenType.Storage);
      storageLocation = "storage";
    }

    if (peek().type === TokenType.Semicolon) consume(TokenType.Semicolon);

    return { name: nameToken.value, typeName: typeToken.value, storageLocation };
  }

  function parseFunction(): FunctionDefinition {
    consume(TokenType.Def);

    const fnName = consume(TokenType.Identifier).value;

    consume(TokenType.OpenParen);
    const parameters: Parameter[] = [];
    while (peek().type !== TokenType.CloseParen) {
      const paramName = consume(TokenType.Identifier).value;
      consume(TokenType.Colon);
      const paramType = consume(TokenType.Identifier).value;

      let defaultValue: Expression | undefined;
      if (peek().type === TokenType.Equals) {
        consume(TokenType.Equals);
        defaultValue = parseExpression();
      }

      parameters.push({ name: paramName, typeName: paramType, defaultValue });

      if (peek().type === TokenType.Comma) {
        consume(TokenType.Comma);
      } else {
        break;
      }
    }
    consume(TokenType.CloseParen);

    let isPayable = false;
    let isView = false;
    let isPure = false;
    let isOnlyOwner = false;

    while (
      [TokenType.Payable, TokenType.View, TokenType.Pure, TokenType.OnlyOwner].includes(peek().type)
    ) {
      const modifier = consume();
      if (modifier.type === TokenType.Payable) isPayable = true;
      if (modifier.type === TokenType.View) isView = true;
      if (modifier.type === TokenType.Pure) isPure = true;
      if (modifier.type === TokenType.OnlyOwner) isOnlyOwner = true;
    }

    let returnType: string | undefined;
    if (peek().type === TokenType.Arrow) {
      consume(TokenType.Arrow);
      returnType = consume(TokenType.Identifier).value;
    }

    consume(TokenType.St);
    const body: Statement[] = [];
    while (peek().type !== TokenType.En) {
      body.push(parseStatement());
    }
    consume(TokenType.En);

    return { name: fnName, parameters, returnType, isPayable, isView, isPure, isOnlyOwner, body };
  }

  function parseStatement(): Statement {
    const token = peek();

    if (token.type === TokenType.If) return parseIfStatement();
    if (token.type === TokenType.While) return parseWhileStatement();
    if (token.type === TokenType.For) return parseForStatement();
    if (token.type === TokenType.Return) return parseReturnStatement();
    if (token.type === TokenType.Break) return parseBreakStatement();
    if (token.type === TokenType.Identifier) return parseVariableAssignment();

    throw new CompileError(
      `Unexpected token '${token.type}' at line ${token.line}, column ${token.column}`,
      token.line,
      token.column
    );
  }

  function parseIfStatement(): IfStatement {
    consume(TokenType.If);
    const condition = parseExpression();

    consume(TokenType.OpenBrace);
    const thenBlock: Statement[] = [];
    while (peek().type !== TokenType.CloseBrace) {
      thenBlock.push(parseStatement());
    }
    consume(TokenType.CloseBrace);

    let elseBlock: Statement[] | undefined;
    if (peek().type === TokenType.Else) {
      consume(TokenType.Else);

      if (peek().type === TokenType.OpenBrace) {
        consume(TokenType.OpenBrace);
        elseBlock = [];
        while (peek().type !== TokenType.CloseBrace) {
          elseBlock.push(parseStatement());
        }
        consume(TokenType.CloseBrace);
      } else if (peek().type === TokenType.If) {
        elseBlock = [parseIfStatement()];
      } else {
        throw new CompileError(
          `Unexpected token after 'else': '${peek().type}' at line ${peek().line}, column ${peek().column}`,
          peek().line,
          peek().column
        );
      }
    }

    return { type: "IfStatement", condition, thenBlock, elseBlock };
  }

  function parseWhileStatement(): WhileStatement {
    consume(TokenType.While);
    const condition = parseExpression();
    consume(TokenType.St);
    const body: Statement[] = [];
    while (peek().type !== TokenType.En) {
      body.push(parseStatement());
    }
    consume(TokenType.En);
    return { type: "WhileStatement", condition, body };
  }

  function parseForStatement(): ForStatement {
    consume(TokenType.For);
    consume(TokenType.OpenParen);
    const initialization = parseVariableAssignment();
    if (peek().type === TokenType.Semicolon) consume(TokenType.Semicolon);
    const condition = parseExpression();
    if (peek().type === TokenType.Semicolon) consume(TokenType.Semicolon);
    const increment = parseExpression();
    consume(TokenType.CloseParen);

    consume(TokenType.St);
    const body: Statement[] = [];
    while (peek().type !== TokenType.En) {
      body.push(parseStatement());
    }
    consume(TokenType.En);

    return { type: "ForStatement", initialization, condition, increment, body };
  }

  function parseBreakStatement(): BreakStatement {
    consume(TokenType.Break);
    if (peek().type === TokenType.Semicolon) consume(TokenType.Semicolon);
    return { type: "BreakStatement" };
  }

  function parseReturnStatement(): ReturnStatement {
    consume(TokenType.Return);
    const expression = peek().type !== TokenType.Semicolon ? parseExpression() : undefined;
    if (peek().type === TokenType.Semicolon) consume(TokenType.Semicolon);
    return { type: "ReturnStatement", expression };
  }

  function parseVariableAssignment(): VariableAssignment {
    const varName = consume(TokenType.Identifier).value;
    consume(TokenType.Equals);
    const expression = parseExpression();
    if (peek().type === TokenType.Semicolon) consume(TokenType.Semicolon);
    return { type: "VariableAssignment", varName, expression };
  }

  function parseExpression(): Expression {
    return parseLogicalExpression();
  }

  function parseLogicalExpression(): Expression {
    let left = parseBitwiseExpression();

    while (peek().type === TokenType.Symbol && (peek().value === "&&" || peek().value === "||")) {
      const operator = consume().value;
      const right = parseBitwiseExpression();
      left = { type: "LogicalOp", left, operator, right };
    }

    return left;
  }

  function parseBitwiseExpression(): Expression {
    let left = parseComparisonExpression();

    while (peek().type === TokenType.Ampersand || peek().type === TokenType.Pipe) {
      const operator = consume().value;
      const right = parseComparisonExpression();
      left = { type: "BitwiseOp", left, operator, right };
    }

    return left;
  }

  function parseComparisonExpression(): Expression {
    let left = parseAdditiveExpression();
    while (
      [TokenType.LessThan, TokenType.GreaterThan, TokenType.Equals, TokenType.Symbol].includes(
        peek().type
      )
    ) {
      const operator = consume().value;
      const right = parseAdditiveExpression();
      left = { type: "BinaryOp", left, operator, right };
    }
    return left;
  }

  function parseAdditiveExpression(): Expression {
    let left = parseUnaryExpression();
    while (peek().type === TokenType.Plus || peek().type === TokenType.Minus) {
      const operator = consume().value;
      const right = parseUnaryExpression();
      left = { type: "BinaryOp", left, operator, right };
    }
    return left;
  }

  function parseUnaryExpression(): Expression {
    if (peek().type === TokenType.Exclamation) {
      const operator = consume().value;
      const operand = parseUnaryExpression();
      return { type: "UnaryOp", operator, operand };
    }
    return parsePrimaryExpression();
  }

  function parsePrimaryExpression(): Expression {
    const base = consume();

    if (
      base.type === TokenType.NumberLiteral ||
      base.type === TokenType.StringLiteral ||
      base.type === TokenType.BooleanLiteral
    ) {
      return { type: "Literal", value: base.value };
    }

    if (base.type === TokenType.Identifier) {
      let expression: Expression = { type: "Identifier", value: base.value };

      // Handle dot syntax for member access
      while (peek().type === TokenType.Dot) {
        consume(TokenType.Dot); // Consume the dot operator
        const member = consume(TokenType.Identifier);
        expression = { type: "MemberAccess", object: expression, member: member.value };
      }

      return expression;
    }

    if (base.type === TokenType.OpenParen) {
      const expression = parseExpression();
      consume(TokenType.CloseParen);
      return expression;
    }

    throw new CompileError(
      `Unexpected token in expression: '${base.type}' at line ${base.line}, column ${base.column}`,
      base.line,
      base.column
    );
  }
}
