
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
  StructDefinition,
  StructField,
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
    const structs: StructDefinition[] = [];

    while (peek().type !== TokenType.En) {
        if (peek().type === TokenType.Def) {
            functions.push(parseFunction());
        } else if (peek().type === TokenType.Struct) {
            structs.push(parseStruct());
        } else {
            stateVars.push(parseStateVar());
        }
    }

    consume(TokenType.En);
    return { name: contractName, stateVars, functions, structs };
}
function parseStateVar(): VariableDeclaration {
  const nameToken = consume(TokenType.Identifier); // Variable name
  consume(TokenType.Colon); // Consume ':'

  const typeName = parseType(); // Parse the type (including mapping or array syntax)

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

function parseType(): string {
  // Check if the type is a mapping
  if (peek().type === TokenType.Identifier && peek().value === "mapping") {
    return parseMappingType(); // Delegate to parseMappingType
  }

  // Parse the base type (e.g., 'address', 'uint256', etc.)
  let typeName = consume(TokenType.Identifier).value;

  // Check for array syntax (e.g., 'address[]')
  while (peek().type === TokenType.OpenBracket) {
    consume(TokenType.OpenBracket); // Consume '['
    if (peek().type === TokenType.CloseBracket) {
      consume(TokenType.CloseBracket); // Consume ']'
      typeName += "[]"; // Append array notation
    } else {
      throw new CompileError(
        `Expected ']', got '${peek().type}' at line ${peek().line}, column ${peek().column}`,
        peek().line,
        peek().column
      );
    }
  }

  return typeName;
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

    let returnType: string | string[] | undefined;
    if (peek().type === TokenType.Arrow) {
        consume(TokenType.Arrow);

        // Handle tuple return types
        if (peek().type === TokenType.OpenParen) {
            consume(TokenType.OpenParen);
            const tupleTypes: string[] = [];
            while (peek().type !== TokenType.CloseParen) {
                tupleTypes.push(consume(TokenType.Identifier).value);
                if (peek().type === TokenType.Comma) {
                    consume(TokenType.Comma);
                } else {
                    break;
                }
            }
            consume(TokenType.CloseParen);
            returnType = tupleTypes;
        } else {
            // Single return type
            returnType = consume(TokenType.Identifier).value;
        }
    }

    consume(TokenType.St);
    const body: Statement[] = [];
    while (peek().type !== TokenType.En) {
        body.push(parseStatement());
    }
    consume(TokenType.En);

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






//struct 


function parseStruct(): StructDefinition {
  consume(TokenType.Struct);
  const structName = consume(TokenType.Identifier).value;

  consume(TokenType.St);

  const fields: StructField[] = [];
  while (peek().type !== TokenType.En) {
      const fieldName = consume(TokenType.Identifier).value;
      consume(TokenType.Colon);
      
      // Parse the field type, which could be a simple type or a mapping
      let fieldType: string;
      if (peek().type === TokenType.Identifier && peek().value === "mapping") {
          fieldType = parseMappingType();
      } else {
          fieldType = consume(TokenType.Identifier).value;
      }

      fields.push({
          name: fieldName,
          type: fieldType,
      });

      if (peek().type === TokenType.Semicolon) {
          consume(TokenType.Semicolon);
      }
  }

  consume(TokenType.En);

  return {
      type: "StructDefinition",
      name: structName,
      fields,
  };
}
function parseMappingType(): string {
  consume(TokenType.Identifier); // Consume 'mapping'
  consume(TokenType.OpenParen);  // Consume '('

  // Parse the key type (e.g., 'address')
  const keyType = consume(TokenType.Identifier).value;

  // Ensure the arrow '->' is present
  if (peek().type !== TokenType.Arrow) {
    throw new CompileError(
      `Expected '->', got '${peek().value}' at line ${peek().line}, column ${peek().column}`,
      peek().line,
      peek().column
    );
  }
  consume(TokenType.Arrow); // Consume the '->'

  // Parse the value type
  let valueType: string;
  if (peek().type === TokenType.Identifier && peek().value === "mapping") {
    valueType = parseMappingType(); // Recursively parse nested mappings
  } else {
    valueType = consume(TokenType.Identifier).value; // Simple type (e.g., uint256)
  }

  consume(TokenType.CloseParen); // Consume ')'

  return `mapping(${keyType} -> ${valueType})`;
}






function parseIfStatement(): IfStatement {
  consume(TokenType.If); // Consume the 'if' keyword

  // Parse the condition expression (supports compound conditions with logical operators)
  const condition = parseExpression();

  // Parse the 'then' block enclosed in braces
  consume(TokenType.OpenBrace); // Expect '{'
  const thenBlock: Statement[] = [];
  while (peek().type !== TokenType.CloseBrace) {
    thenBlock.push(parseStatement());
  }
  consume(TokenType.CloseBrace); // Expect '}'

  let elseBlock: Statement[] | undefined;
  if (peek().type === TokenType.Else) {
    consume(TokenType.Else); // Consume the 'else' keyword

    if (peek().type === TokenType.OpenBrace) {
      // Else block with braces
      consume(TokenType.OpenBrace); // Expect '{'
      elseBlock = [];
      while (peek().type !== TokenType.CloseBrace) {
        elseBlock.push(parseStatement());
      }
      consume(TokenType.CloseBrace); // Expect '}'
    } else if (peek().type === TokenType.If) {
      // Else-if condition
      elseBlock = [parseIfStatement()];
    } else {
      throw new CompileError(
        `Unexpected token after 'else': '${peek().type}' at line ${peek().line}, column ${peek().column}`,
        peek().line,
        peek().column
      );
    }
  }

  return {
    type: "IfStatement",
    condition,
    thenBlock,
    elseBlock,
  };
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
  const lhsExpression = parseExpression();

  // Check if this is a variable assignment
  if (peek().type === TokenType.Equals) {
      consume(TokenType.Equals); // Consume '='
      const rhsExpression = parseExpression();
      if (peek().type === TokenType.Semicolon) consume(TokenType.Semicolon);
      return {
          type: "VariableAssignment",
          varName: lhsExpression,
          expression: rhsExpression,
      };
  }

  // Otherwise, treat it as a standalone expression statement
  if (peek().type === TokenType.Semicolon) consume(TokenType.Semicolon);
  return { type: "ExpressionStatement", expression: lhsExpression };
}

  
  

  function parseBreakStatement(): BreakStatement {
    consume(TokenType.Break);
    if (peek().type === TokenType.Semicolon) consume(TokenType.Semicolon);
    return { type: "BreakStatement" };
  }

  function parseReturnStatement(): ReturnStatement {
    consume(TokenType.Return);

    let expression: Expression | undefined;

    if (peek().type === TokenType.OpenParen) {
        consume(TokenType.OpenParen); // Consume '(' for the tuple
        const elements: Expression[] = [];
        while (peek().type !== TokenType.CloseParen) {
            elements.push(parseExpression());
            if (peek().type === TokenType.Comma) {
                consume(TokenType.Comma); // Consume ',' between tuple elements
            } else {
                break;
            }
        }
        consume(TokenType.CloseParen); // Consume ')'
        expression = { type: "Tuple", elements };
    } else if (peek().type !== TokenType.Semicolon) {
        expression = parseExpression(); // Handle single expression return
    }

    if (peek().type === TokenType.Semicolon) {
        consume(TokenType.Semicolon);
    }

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
    if (peek().type === TokenType.OpenParen) {
        consume(TokenType.OpenParen); // Consume '(' for the tuple
        const elements: Expression[] = [];
        while (peek().type !== TokenType.CloseParen) {
            elements.push(parseExpression());
            if (peek().type === TokenType.Comma) {
                consume(TokenType.Comma); // Consume ',' between tuple elements
            } else {
                break;
            }
        }
        consume(TokenType.CloseParen); // Consume ')'
        return { type: "Tuple", elements };
    }

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

  function parseUnaryExpression(): Expression {
    if (peek().type === TokenType.Exclamation || peek().type === TokenType.Minus) {
        const operator = consume().value; // Consume '!' or '-'
        const operand = parseUnaryExpression(); // Recursively parse the operand
        return { type: "UnaryOp", operator, operand };
    }
    return parsePrimaryExpression(); // If no unary operator, parse as a primary expression
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

  function parsePrimaryExpression(): Expression {
    const base = consume();

    if (
        base.type === TokenType.NumberLiteral ||
        base.type === TokenType.StringLiteral ||
        base.type === TokenType.BooleanLiteral
    ) {
        return { type: "Literal", value: base.value };
    }

    if (base.type === TokenType.OpenBracket) {
        // Handle arrays
        const elements: Expression[] = [];
        while (peek().type !== TokenType.CloseBracket) {
            elements.push(parseExpression());
            if (peek().type === TokenType.Comma) {
                consume(TokenType.Comma); // Consume ',' between elements
            } else {
                break;
            }
        }
        consume(TokenType.CloseBracket); // Consume ']'
        return { type: "ArrayLiteral", elements };
    }

    if (base.type === TokenType.OpenBrace) {
        // Handle empty or initialized object literals
        const properties: { key: string; value: Expression }[] = [];
        while (peek().type !== TokenType.CloseBrace) {
            const key = consume(TokenType.Identifier).value;
            consume(TokenType.Colon); // Consume ':'
            const value = parseExpression();
            properties.push({ key, value });

            if (peek().type === TokenType.Comma) {
                consume(TokenType.Comma); // Consume ',' between properties
            } else {
                break;
            }
        }
        consume(TokenType.CloseBrace); // Consume '}'
        return { type: "ObjectLiteral", properties };
    }

    if (base.type === TokenType.Identifier) {
        let expression: Expression = { type: "Identifier", value: base.value };

        // Handle member access, index access, or function/constructor calls
        while (
            peek().type === TokenType.Dot ||
            peek().type === TokenType.OpenBracket ||
            peek().type === TokenType.OpenParen
        ) {
            if (peek().type === TokenType.Dot) {
                consume(TokenType.Dot); // Consume '.'
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
                        consume(TokenType.Comma); // Consume ',' between arguments
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