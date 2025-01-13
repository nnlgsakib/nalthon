
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
  
    // Recursive function to parse mappings
    function parseMapping(): string {
      consume(TokenType.Identifier); // Consume 'mapping'
      consume(TokenType.OpenParen); // Consume '('
  
      // Parse key type
      const keyType = consume(TokenType.Identifier).value;
  
      // Handle separator (either '->' or ',')
      let separatorToken = consume();
      if (separatorToken.type !== TokenType.Arrow && separatorToken.type !== TokenType.Comma) {
        throw new CompileError(
          `Expected token 'Arrow' or 'Comma', got '${separatorToken.type}' at line ${separatorToken.line}, column ${separatorToken.column}`,
          separatorToken.line,
          separatorToken.column
        );
      }
  
      // Parse value type: check if the value type is another mapping
      let valueType: string;
      if (peek().type === TokenType.Identifier && peek().value === "mapping") {
        valueType = parseMapping(); // Recursively parse nested mapping
      } else {
        valueType = consume(TokenType.Identifier).value;
      }
  
      consume(TokenType.CloseParen); // Consume ')'
  
      return `mapping(${keyType} ${separatorToken.value} ${valueType})`;
    }
  
    // Check if the variable is a mapping
    let typeName: string;
    if (peek().type === TokenType.Identifier && peek().value === "mapping") {
      typeName = parseMapping();
    } else {
      typeName = consume(TokenType.Identifier).value; // Regular type
    }
  
    let storageLocation: "memory" | "storage" | undefined;
    if (peek().type === TokenType.Memory) {
      consume(TokenType.Memory);
      storageLocation = "memory";
    } else if (peek().type === TokenType.Storage) {
      consume(TokenType.Storage);
      storageLocation = "storage";
    }
  
    if (peek().type === TokenType.Semicolon) consume(TokenType.Semicolon);
  
    return { name: nameToken.value, typeName, storageLocation };
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

    // Parse the loop variable (either a new declaration or an existing variable)
    let initialization: VariableAssignment;
    const firstToken = peek();

    if (firstToken.type === TokenType.Identifier) {
        // Variable name
        const varName = consume(TokenType.Identifier).value;

        // Check for assignment operator '='
        if (peek().type === TokenType.Equals) {
            consume(); // Consume '='

            // Parse the initialization expression (e.g., `0`)
            const expression = parseExpression();

            initialization = {
                type: "VariableAssignment",
                varName: { type: "Identifier", value: varName },
                expression,
            };
        } else {
            // If '=' is not found, treat it as an existing variable (validate later in semantic checks)
            throw new CompileError(
                `Expected '=' after variable name in 'for' loop initialization, got '${peek().value}'`,
                peek().line,
                peek().column
            );
        }
    } else {
        throw new CompileError(
            `Expected variable declaration or existing variable in 'for' loop initialization, got '${firstToken.type}'`,
            firstToken.line,
            firstToken.column
        );
    }

    // Expect the `to` keyword for the upper bound
    if (peek().type !== TokenType.Identifier || peek().value !== "to") {
        throw new CompileError(
            `Expected 'to' keyword in 'for' loop after initialization, got '${peek().value}'`,
            peek().line,
            peek().column
        );
    }
    consume(); // Consume the 'to' keyword

    // Parse the upper bound expression
    const upperBound = parseExpression();

    // Handle optional `step` keyword for custom increments
    let increment: Expression;
    if (peek().type === TokenType.Identifier && peek().value === "step") {
        consume(); // Consume the 'step' keyword
        increment = parseExpression(); // Parse the custom step expression
    } else {
        // Default increment: assume `i = i + 1`
        const loopVar = (initialization.varName as Expression).value; // Get the loop variable
        increment = {
            type: "BinaryOp",
            left: { type: "Identifier", value: loopVar },
            operator: "+",
            right: { type: "Literal", value: 1 },
        };
    }

    // Expect an opening brace `{` for the loop body
    consume(TokenType.OpenBrace);

    // Parse the loop body
    const body: Statement[] = [];
    while (peek().type !== TokenType.CloseBrace) {
        body.push(parseStatement());
    }

    // Expect a closing brace `}`
    consume(TokenType.CloseBrace);

    // Return the updated ForStatement AST node
    return {
        type: "ForStatement",
        initialization,
        condition: upperBound,
        increment,
        body,
    };
}



  function parseStatement(): Statement {
    const token = peek();
  
    if (token.type === TokenType.If) return parseIfStatement();
    if (token.type === TokenType.While) return parseWhileStatement();
    if (token.type === TokenType.For) return parseForStatement();
    if (token.type === TokenType.Return) return parseReturnStatement();
    if (token.type === TokenType.Break) return parseBreakStatement();
  
    // Handle variable assignments and general expressions
    if (token.type === TokenType.Identifier) {
      const expression = parseExpression();
  
      // Check if this is a variable assignment
      if (peek().type === TokenType.Equals) {
        consume(TokenType.Equals); // Consume '='
        const rightExpression = parseExpression();
        if (peek().type === TokenType.Semicolon) consume(TokenType.Semicolon);
        return { type: "VariableAssignment", varName: expression, expression: rightExpression };
      }
  
      // Otherwise, treat it as a standalone expression statement
      if (peek().type === TokenType.Semicolon) consume(TokenType.Semicolon);
      return { type: "ExpressionStatement", expression };
    }
  
    throw new CompileError(
      `Unexpected token '${token.type}' at line ${token.line}, column ${token.column}`,
      token.line,
      token.column
    );
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
    const varName = parsePrimaryExpression(); // Parse complex variable names
    consume(TokenType.Equals); // Expect '='
    const expression = parseExpression(); // Parse the right-hand side
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

  function parseMultiplicativeExpression(): Expression {
    let left = parseUnaryExpression(); // Start with a unary expression
  
    while (
      peek().type === TokenType.Asterisk || // '*' for multiplication
      peek().type === TokenType.Slash || // '/' for division
      peek().type === TokenType.Percent // '%' for modulus
    ) {
      const operator = consume().value; // Consume the operator
      const right = parseUnaryExpression(); // Parse the right-hand side
      left = { type: "BinaryOp", left, operator, right }; // Construct the binary operation
    }
  
    return left;
  }
  
  function parseAdditiveExpression(): Expression {
    let left = parseMultiplicativeExpression(); // Start with a multiplicative expression
  
    while (peek().type === TokenType.Plus || peek().type === TokenType.Minus) {
      const operator = consume().value; // Consume '+' or '-'
      const right = parseMultiplicativeExpression(); // Parse the right-hand side
      left = { type: "BinaryOp", left, operator, right }; // Construct the binary operation
    }
  
    return left;
  }
  // function parseAdditiveExpression(): Expression {
  //   let left = parseUnaryExpression();
  //   while (peek().type === TokenType.Plus || peek().type === TokenType.Minus) {
  //     const operator = consume().value;
  //     const right = parseUnaryExpression();
  //     left = { type: "BinaryOp", left, operator, right };
  //   }
  //   return left;
  // }

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
  
      // Handle member access and index access
      while (peek().type === TokenType.Dot || peek().type === TokenType.OpenBracket || peek().type === TokenType.OpenParen) {
        if (peek().type === TokenType.Dot) {
          consume(TokenType.Dot); // Consume the dot operator
          const member = consume(TokenType.Identifier);
          expression = { type: "MemberAccess", object: expression, member: member.value };
        } else if (peek().type === TokenType.OpenBracket) {
          consume(TokenType.OpenBracket); // Consume '['
          const indexExpression = parseExpression(); // Parse the index
          consume(TokenType.CloseBracket); // Consume ']'
          expression = { type: "IndexAccess", object: expression, index: indexExpression };
        } else if (peek().type === TokenType.OpenParen) {
          consume(TokenType.OpenParen); // Consume '('
          const args: Expression[] = [];
          while (peek().type !== TokenType.CloseParen) {
            args.push(parseExpression()); // Parse arguments
            if (peek().type === TokenType.Comma) {
              consume(TokenType.Comma); // Consume ',' if more arguments
            } else {
              break;
            }
          }
          consume(TokenType.CloseParen); // Consume ')'
          expression = { type: "FunctionCall", object: expression, arguments: args };
        }
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