import fs from "fs";
import path from "path";
import { parse } from "./compiler/parser";
import { semanticCheck } from "./compiler/semantic";
import { compileProgram } from "./compiler/codegen";
import { CompiledContract } from "./compiler/types";

export function compileSource(source: string): CompiledContract[] {
  // 1) Parse source -> AST
  const ast = parse(source);

  // 2) Semantic checks
  semanticCheck(ast);

  // 3) Generate code
  const compiled = compileProgram(ast);
  return compiled;
}

export function compileFile(filePath: string): CompiledContract[] {
  const fullPath = path.resolve(filePath);
  const source = fs.readFileSync(fullPath, "utf-8");
  return compileSource(source);
}
