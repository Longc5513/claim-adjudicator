import { readFileSync } from "node:fs";

const source = readFileSync("contracts/claim_adjudicator.py", "utf8");

for (const signal of [
  "gl.nondet.web.get",
  "gl.nondet.exec_prompt",
  "gl.vm.run_nondet_unsafe",
  "file_claim",
  "respondent_reply",
  "adjudicate",
]) {
  if (!source.includes(signal)) {
    console.error(`Missing required signal: ${signal}`);
    process.exit(1);
  }
}

console.log("Contract verification signals are present.");
