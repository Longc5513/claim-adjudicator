import { existsSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = resolve("contracts/claim_adjudicator.py");

if (!existsSync(contractPath)) {
  console.error("Missing contract file:", contractPath);
  process.exit(1);
}

console.log("Deploy command:");
console.log(
  "genlayer deploy --contract contracts/claim_adjudicator.py"
);
