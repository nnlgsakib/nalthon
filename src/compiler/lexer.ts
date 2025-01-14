import { Token, TokenType } from "./types";
import { CompileError } from "../utils/errors";
import * as fs from 'fs';

// Recognized keywords in Nalthon
const KEYWORDS = new Map<string, TokenType>([
  ["contract", TokenType.Contract],
  ["def", TokenType.Def],
  ["if", TokenType.If],
  ["else", TokenType.Else],
  ["while", TokenType.While],
  ["for", TokenType.For],
  ["break", TokenType.Break],
  ["continue", TokenType.Keyword],
  ["return", TokenType.Return],
  ["payable", TokenType.Payable],
  ["view", TokenType.View],
  ["pure", TokenType.Pure],
  ["onlyOwner", TokenType.OnlyOwner],
  ["memory", TokenType.Memory],
  ["storage", TokenType.Storage],
  ["st", TokenType.St], // Start block keyword
  ["en", TokenType.En], // End block keyword
  ["constructor", TokenType.Identifier], // Special identifier for constructors
  ["struct", TokenType.Struct],
  ["true", TokenType.BooleanLiteral],
  ["false", TokenType.BooleanLiteral],
]);

const MULTI_CHAR_TOKENS = new Map([
  ["->", TokenType.Arrow],
  ["&&", TokenType.Symbol], // Logical AND
  ["||", TokenType.Symbol], // Logical OR
  ["==", TokenType.Symbol], // Equality
  ["!=", TokenType.Symbol], // Inequality
  ["<=", TokenType.Symbol], // Less than or equal
  [">=", TokenType.Symbol], // Greater than or equal
]);

const SINGLE_CHAR_TOKENS = new Map([
  ["(", TokenType.OpenParen],
  [")", TokenType.CloseParen],
  [":", TokenType.Colon],
  [";", TokenType.Semicolon],
  ["=", TokenType.Equals],
  [",", TokenType.Comma],
  ["+", TokenType.Plus],
  ["-", TokenType.Minus],
  ["*", TokenType.Asterisk],
  ["/", TokenType.Slash],
  ["<", TokenType.LessThan],
  [">", TokenType.GreaterThan],
  ["{", TokenType.OpenBrace],
  ["}", TokenType.CloseBrace],
  ["[", TokenType.OpenBracket],
  ["]", TokenType.CloseBracket],
  ["%", TokenType.Percent],
  ["^", TokenType.Caret],
  ["&", TokenType.Ampersand],
  ["|", TokenType.Pipe],
  ["~", TokenType.Tilde],
  ["!", TokenType.Exclamation],
  ["?", TokenType.Question],
  [".", TokenType.Dot],
]);

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let current = 0;
  let line = 1;
  let col = 1;

  function advance(count = 1) {
    current += count;
    col += count;
  }

  function isAtEnd() {
    return current >= source.length;
  }

  while (!isAtEnd()) {
    const char = source[current];

    // Handle newlines
    if (char === "\n") {
      line++;
      col = 1;
      advance();
      continue;
    }

    // Skip whitespace
    if (/\s/.test(char)) {
      advance();
      continue;
    }

    // Comments (single-line, starting with '#')
    if (char === "#") {
      advance();
      while (!isAtEnd() && source[current] !== "\n") {
        advance();
      }
      continue;
    }

    // String literals
    if (char === '"') {
      let value = "";
      const startCol = col;
      advance(); // Skip opening quote

      while (!isAtEnd()) {
        const currentChar = source[current];

        if (currentChar === '"') {
          advance(); // Skip closing quote
          break;
        }

        if (currentChar === "\\") {
          advance();
          const escapeChar = source[current];
          switch (escapeChar) {
            case "n":
              value += "\n";
              break;
            case "t":
              value += "\t";
              break;
            case "\\":
              value += "\\";
              break;
            case '"':
              value += '"';
              break;
            default:
              throw new CompileError(`Invalid escape sequence '\\${escapeChar}'`, line, col);
          }
        } else {
          value += currentChar;
        }
        advance();
      }

      tokens.push({
        type: TokenType.StringLiteral,
        value,
        line,
        column: startCol,
      });
      continue;
    }

    // Multi-char tokens
    let foundMultiChar = false;
    for (const [pattern, type] of MULTI_CHAR_TOKENS) {
      if (source.startsWith(pattern, current)) {
        tokens.push({
          type,
          value: pattern,
          line,
          column: col,
        });
        advance(pattern.length);
        foundMultiChar = true;
        break;
      }
    }
    if (foundMultiChar) continue;

    // Single char tokens
    if (SINGLE_CHAR_TOKENS.has(char)) {
      tokens.push({
        type: SINGLE_CHAR_TOKENS.get(char)!,
        value: char,
        line,
        column: col,
      });
      advance();
      continue;
    }

    // Numbers (Integer and Decimal)
    if (/\d/.test(char)) {
      let value = "";
      const startCol = col;
      let hasDecimal = false;

      while (!isAtEnd() && /[\d.]/.test(source[current])) {
        if (source[current] === ".") {
          if (hasDecimal) throw new CompileError("Invalid number format", line, col);
          hasDecimal = true;
        }
        value += source[current];
        advance();
      }

      tokens.push({
        type: TokenType.NumberLiteral,
        value,
        line,
        column: startCol,
      });
      continue;
    }

    // Identifiers & Keywords
    if (/[A-Za-z_]/.test(char)) {
      let value = "";
      const startCol = col;
      while (!isAtEnd() && /[A-Za-z0-9_]/.test(source[current])) {
        value += source[current];
        advance();
      }

      const type = KEYWORDS.get(value) || TokenType.Identifier;
      tokens.push({
        type,
        value,
        line,
        column: startCol,
      });
      continue;
    }

    throw new CompileError(`Unexpected character '${char}' at line ${line}, column ${col}`, line, col);
  }
  const tokenString = JSON.stringify(tokens, null, 2);

  // Save tokens to a file
  fs.writeFileSync('tokens.txt', tokenString, 'utf8');

  tokens.push({ type: TokenType.EOF, value: "", line, column: col });
  return tokens;
}
