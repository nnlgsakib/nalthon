import { Program } from "../compiler/ast";
import path from "path";
import fs from "fs";

export function saveAstToFile(ast: Program, baseDir: string = "./artifacts/contract_info"): void {
  try {
    // Ensure the base directory exists
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true }); // Create the directory structure if it doesn't exist
    }

    // Iterate over each contract in the program
    for (const contract of ast.contracts) {
      const contractDir = path.join(baseDir, contract.name.toLowerCase());

      // Ensure the contract-specific directory exists
      if (!fs.existsSync(contractDir)) {
        fs.mkdirSync(contractDir, { recursive: true });
      }

      // Save the AST for the specific contract
      const astPath = path.join(contractDir, "ast.json");
      const json = JSON.stringify(contract, null, 2); // Serialize the contract AST
      fs.writeFileSync(astPath, json, "utf8");
      console.log(`AST for contract ${contract.name} has been saved to ${astPath}`);
    }
  } catch (error: any) {
    console.error(`Failed to save AST: ${error.message}`);
    throw error; // Rethrow the error to make it visible to the caller
  }
}
