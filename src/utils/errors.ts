export class CompileError extends Error {
    constructor(message: string, public line?: number, public column?: number) {
      super(`CompileError: ${message} at line ${line}, column ${column}`);
    }
  }
  