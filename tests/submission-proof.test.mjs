import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const contractPath = "contracts/claim_adjudicator.py";
const readmePath = "README.md";
const clientPath = "src/claim-adjudicator-client.ts";
const deployPath = "deploy/001_deploy_claim_adjudicator.mjs";
const judgeNotesPath = "submission-pack/JUDGE-NOTES.md";

test("contract uses GenLayer non-deterministic primitives", () => {
  const source = readFileSync(contractPath, "utf8");
  assert.match(source, /gl\.nondet\.web\.get/);
  assert.match(source, /gl\.nondet\.exec_prompt/);
  assert.match(source, /gl\.vm\.run_nondet_unsafe/);
});

test("contract exposes multi-phase lifecycle methods", () => {
  const source = readFileSync(contractPath, "utf8");
  for (const name of [
    "file_claim",
    "respondent_reply",
    "close_evidence",
    "timeout_claim",
    "adjudicate",
    "appeal",
    "set_arbiter",
    "get_claim_json",
    "get_claim_ids",
    "get_claim_count",
    "get_phase",
    "latest_summary",
    "get_owner",
    "get_arbiter",
  ]) {
    assert.match(source, new RegExp(`def ${name}\\(`));
  }
});

test("contract has role-based authorization", () => {
  const source = readFileSync(contractPath, "utf8");
  assert.match(source, /def _assert_role\(/);
  assert.match(source, /def _assert_phase\(/);
  assert.ok(source.includes('"claimant"'), "missing claimant role");
  assert.ok(source.includes('"respondent"'), "missing respondent role");
  assert.ok(source.includes('"arbiter"'), "missing arbiter role");
});

test("contract has category-based classification", () => {
  const source = readFileSync(contractPath, "utf8");
  assert.ok(source.includes('"refund"'), "missing refund category");
  assert.ok(source.includes('"return"'), "missing return category");
  assert.ok(source.includes('"dispute"'), "missing dispute category");
  assert.ok(source.includes('"warranty"'), "missing warranty category");
});

test("consensus output materially changes stored claim state", () => {
  const source = readFileSync(contractPath, "utf8");
  for (const signal of [
    'claim["verdict"] = outcome["verdict"]',
    'claim["confidence"] = outcome["confidence"]',
    'claim["basis"] = outcome["basis"]',
    'claim["rule_match_score"] = outcome["rule_match_score"]',
    'claim["resolved"] = True',
    'claim["phase"] = "resolved"',
  ]) {
    assert.ok(source.includes(signal), `missing signal: ${signal}`);
  }
});

test("contract supports timeout auto-resolution", () => {
  const source = readFileSync(contractPath, "utf8");
  assert.match(source, /def timeout_claim\(/);
  assert.ok(source.includes("timeout_deadline"), "missing timeout_deadline");
  assert.ok(source.includes("respondent_timeout"), "missing respondent_timeout basis");
});

test("contract uses real GEN escrow with payable and emit_transfer", () => {
  const source = readFileSync(contractPath, "utf8");
  // Payable function
  assert.ok(source.includes("@gl.public.write.payable"), "missing @gl.public.write.payable on file_claim");
  assert.match(source, /def appeal\(/);
  // Value requirement
  assert.ok(source.includes("gl.message.value"), "missing gl.message.value check");
  // Real settlement
  assert.ok(source.includes("emit_transfer"), "missing emit_transfer for settlement");
  assert.ok(source.includes("_settle_claim"), "missing _settle_claim method");
  // u256 type for value
  assert.ok(source.includes("u256("), "missing u256 type for value handling");
});

test("appeal flow requires fresh escrow and marks settled escrow as single-use", () => {
  const source = readFileSync(contractPath, "utf8");
  assert.ok(source.includes('claim["escrow_settled"] = True'), "missing escrow_settled marker after settlement");
  assert.ok(source.includes('claim["escrow_amount"] = 0'), "missing escrow zero-out after settlement");
  assert.ok(source.includes("A positive GEN appeal escrow is required"), "missing positive appeal escrow requirement");
  assert.ok(source.includes("Appeal requires the previous escrow round to be settled first"), "missing prior settlement guard");
});

test("contract has prompt injection protection", () => {
  const source = readFileSync(contractPath, "utf8");
  assert.ok(source.includes("SECURITY RULES"), "missing SECURITY RULES in prompt");
  assert.ok(source.includes("UNTRUSTED DATA"), "missing UNTRUSTED DATA markers");
  assert.ok(source.includes("--- BEGIN"), "missing BEGIN delimiter");
  assert.ok(source.includes("--- END"), "missing END delimiter");
});

test("repo includes deploy helper and reusable client helper", () => {
  assert.equal(existsSync(deployPath), true);
  assert.equal(existsSync(clientPath), true);
  const client = readFileSync(clientPath, "utf8");
  assert.match(client, /writeContract/);
  assert.match(client, /readContract/);
  assert.match(client, /waitForTransactionReceipt/);
  assert.match(client, /fileClaim/);
  assert.match(client, /timeoutClaim/);
  assert.match(client, /appealEscrowAmount/);
});

test("README documents intelligent-contract fit and repository tree", () => {
  const readme = readFileSync(readmePath, "utf8");
  assert.match(readme, /Intelligent Contract/);
  assert.match(readme, /Repository Structure/);
  assert.match(readme, /claim-adjudicator/);
  assert.match(readme, /gl\.vm\.run_nondet_unsafe/);
  assert.match(readme, /Timeout Auto-Resolution/);
  assert.match(readme, /Real GEN Escrow/);
  assert.match(readme, /Appeal escrow safety/);
});

test("submission materials exist for reviewer handoff", () => {
  assert.equal(existsSync(judgeNotesPath), true);
  const judgeNotes = readFileSync(judgeNotesPath, "utf8");
  assert.match(judgeNotes, /Builder -> Intelligent Contracts/);
  assert.match(judgeNotes, /real GenLayer contract code is included/);
});
