import fs from "fs";
import path from "path";

function saveContractInfo(abi: object, bytecode: string, outputDir: string): void {
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true }); // Create the directory structure if it doesn't exist
    }

    // Save ABI to abi.json
    const abiPath = path.join(outputDir, "abi.json");
    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2), "utf8");
    console.log(`ABI has been saved to ${abiPath}`);

    // Save bytecode to bytecode.json
    const bytecodePath = path.join(outputDir, "bytecode.json");
    fs.writeFileSync(bytecodePath, JSON.stringify({ bytecode }, null, 2), "utf8");
    console.log(`Bytecode has been saved to ${bytecodePath}`);
  } catch (error: any) {
    console.error(`Failed to save contract info: ${error.message}`);
    throw error;
  }
}

export default saveContractInfo;
