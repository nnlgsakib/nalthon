import { Token, TokenType } from "./types";
import { CompileError } from "../utils/errors";

// Recognized keywords in Nalthon
const KEYWORDS = new Map<string, TokenType>([
  ["contract", TokenType.Contract],
  ["def", TokenType.Def],
  ["if", TokenType.Keyword],
  ["elif", TokenType.Keyword],
  ["else", TokenType.Keyword],
  ["return", TokenType.Keyword],
  ["for", TokenType.Keyword],
  ["while", TokenType.Keyword],
  ["payable", TokenType.Payable],
  ["view", TokenType.View],
  ["pure", TokenType.Pure],
  ["onlyOwner", TokenType.OnlyOwner],
  ["memory", TokenType.Memory],
  ["storage", TokenType.Storage],
]);

const MULTI_CHAR_TOKENS = new Map([
  ["->", TokenType.Arrow],
  ["=>", TokenType.Symbol],
  ["==", TokenType.Symbol],
  ["!=", TokenType.Symbol],
  ["<=", TokenType.Symbol],
  [">=", TokenType.Symbol],
]);

const SINGLE_CHAR_TOKENS = new Map([
  ["{", TokenType.OpenBrace],
  ["}", TokenType.CloseBrace],
  ["[", TokenType.OpenBracket],
  ["]", TokenType.CloseBracket],
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
  [".", TokenType.Dot],
  ["%", TokenType.Percent],
  ["^", TokenType.Caret],
  ["&", TokenType.Ampersand],
  ["|", TokenType.Pipe],
  ["~", TokenType.Tilde],
  ["!", TokenType.Exclamation],
  ["<", TokenType.LessThan],
  [">", TokenType.GreaterThan],
  ["?", TokenType.Question],
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

  while (current < source.length) {
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

    // Comments
    if (char === "#") {
      advance();
      while (current < source.length && source[current] !== "\n") {
        advance();
      }
      continue;
    }

    // String literals
    if (char === '"') {
      let value = "";
      const startCol = col;
      advance(); // Skip opening quote

      while (current < source.length) {
        const currentChar = source[current];
        
        // Handle end of string
        if (currentChar === '"') {
          advance(); // Skip closing quote
          break;
        }
        
        // Handle escape sequences
        if (currentChar === '\\') {
          advance(); // Skip backslash
          if (current >= source.length) {
            throw new CompileError("Unterminated string literal - escape sequence", line, col);
          }
          
          const nextChar = source[current];
          switch (nextChar) {
            case 'n': value += '\n'; break;
            case 't': value += '\t'; break;
            case 'r': value += '\r'; break;
            case '\\': value += '\\'; break;
            case '"': value += '"'; break;
            default:
              throw new CompileError(`Invalid escape sequence: \\${nextChar}`, line, col);
          }
          advance();
          continue;
        }

        // Handle unterminated strings
        if (currentChar === '\n') {
          throw new CompileError("Unterminated string literal - unexpected newline", line, col);
        }

        value += currentChar;
        advance();
      }

      if (current > source.length || source[current - 1] !== '"') {
        throw new CompileError("Unterminated string literal", line, startCol);
      }

      tokens.push({
        type: TokenType.StringLiteral,
        value,
        line,
        column: startCol
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
          column: col
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
        column: col
      });
      advance();
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let value = "";
      const startCol = col;
      while (current < source.length && /\d/.test(source[current])) {
        value += source[current];
        advance();
      }
      tokens.push({
        type: TokenType.NumberLiteral,
        value,
        line,
        column: startCol
      });
      continue;
    }

    // Identifiers & Keywords
    if (/[A-Za-z_]/.test(char)) {
      let value = "";
      const startCol = col;
      while (current < source.length && /[A-Za-z0-9_]/.test(source[current])) {
        value += source[current];
        advance();
      }
      
      const type = KEYWORDS.has(value) ? KEYWORDS.get(value)! : TokenType.Identifier;
      tokens.push({
        type,
        value,
        line,
        column: startCol
      });
      continue;
    }

    throw new CompileError(`Unexpected character: ${char}`, line, col);
  }

  tokens.push({
    type: TokenType.EOF,
    value: "",
    line,
    column: col
  });

  return tokens;
}