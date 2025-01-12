#!/usr/bin/env node
import { Command } from "commander";
import { compileFile } from "./index";

const program = new Command();

program
  .name("nalthon")
  .description("Nalthon - An experimental Ethereum Smart Contract Compiler in TypeScript")
  .version("1.0.0");

program
  .command("compile")
  .argument("<file>", "Nalthon (.nl) source file")
  .description("Compile a .nl contract to ABI + Bytecode")
  .action((file) => {
    try {
      const output = compileFile(file);
      console.log(JSON.stringify(output, null, 2));
    } catch (err: any) {
      console.error("Compilation error:", err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
