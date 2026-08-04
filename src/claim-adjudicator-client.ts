import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const ACCEPTED_STATUS = "ACCEPTED";

function requireTrimmedValue(value: string, label: string, minLength = 1): string {
  const normalized = value.trim();
  if (normalized.length < minLength) {
    throw new Error(`${label} is required${minLength > 1 ? ` and must be at least ${minLength} characters.` : "."}`);
  }
  return normalized;
}

function requireAddress(value: string, label: string): `0x${string}` {
  const normalized = requireTrimmedValue(value, label);
  if (!/^0x[a-fA-F0-9]{40}$/.test(normalized)) {
    throw new Error(`${label} must be a valid 0x address.`);
  }
  return normalized as `0x${string}`;
}

function requireHttpsUrl(value: string, label: string): string {
  const normalized = requireTrimmedValue(value, label, 12);
  const url = new URL(normalized);
  if (url.protocol !== "https:") {
    throw new Error(`${label} must use https.`);
  }
  if (/(^localhost$)|(^127\.)|(^10\.)|(^192\.168\.)|(^172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname)) {
    throw new Error(`${label} cannot point to localhost or a private network.`);
  }
  return normalized;
}

function getExecutionFailure(receipt: any): string | null {
  const leaderReceipt = receipt?.consensus_data?.leader_receipt;
  if (!leaderReceipt) return null;

  const executionResult = String(leaderReceipt.execution_result || "").toUpperCase();
  if (executionResult && executionResult !== "SUCCESS") {
    return leaderReceipt.error || `Execution result was ${executionResult}.`;
  }

  const eqOutputs = leaderReceipt.eq_outputs?.leader || {};
  for (const raw of Object.values(eqOutputs)) {
    if (typeof raw !== "string") continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.transaction_success === false) {
        return parsed.transaction_error || "Transaction execution returned transaction_success=false.";
      }
    } catch { /* Ignore */ }
  }
  return null;
}

async function waitForConfirmedExecution(client: any, txHash: `0x${string}`) {
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: ACCEPTED_STATUS,
    fullTransaction: true,
    retries: 120,
    interval: 3000,
  });

  const statusName = String(receipt?.statusName || receipt?.status || "").toUpperCase();
  if (statusName && statusName !== "ACCEPTED" && statusName !== "FINALIZED") {
    throw new Error(`Transaction reached unexpected status ${statusName}.`);
  }

  const executionFailure = getExecutionFailure(receipt);
  if (executionFailure) {
    throw new Error(`GenLayer execution failed: ${executionFailure}`);
  }
  return receipt;
}

export async function connectStudionetWallet(account: `0x${string}`) {
  return createClient({ chain: studionet, account });
}

// ──────────────────────────────────────────────
// Deploy
// ──────────────────────────────────────────────

export async function deployClaimAdjudicator(client: any, contractCode: string) {
  await client.connect("studionet");
  await client.initializeConsensusSmartContract();
  const txHash = await client.deployContract({
    code: new TextEncoder().encode(contractCode),
    args: [],
  });
  return waitForConfirmedExecution(client, txHash);
}

// ──────────────────────────────────────────────
// Phase 1: File Claim
// ──────────────────────────────────────────────

export async function fileClaim(params: {
  client: any;
  contractAddress: string;
  claimId: string;
  title: string;
  category: string;
  respondentAddress: string;
  policyUrl: string;
  subjectUrl: string;
  evidenceUrl: string;
  facts: string;
  reason: string;
  escrowAmount: number;
}) {
  const txHash = await params.client.writeContract({
    address: requireAddress(params.contractAddress, "Contract address"),
    functionName: "file_claim",
    args: [
      requireTrimmedValue(params.claimId, "Claim ID", 4).toLowerCase(),
      requireTrimmedValue(params.title, "Title", 8),
      requireTrimmedValue(params.category, "Category", 3),
      requireAddress(params.respondentAddress, "Respondent address"),
      requireHttpsUrl(params.policyUrl, "Policy URL"),
      requireHttpsUrl(params.subjectUrl, "Subject URL"),
      requireHttpsUrl(params.evidenceUrl, "Evidence URL"),
      requireTrimmedValue(params.facts, "Facts", 24),
      requireTrimmedValue(params.reason, "Reason", 16),
      params.escrowAmount,
    ],
  });
  return waitForConfirmedExecution(params.client, txHash);
}

// ──────────────────────────────────────────────
// Phase 2: Respondent Reply
// ──────────────────────────────────────────────

export async function respondentReply(params: {
  client: any;
  contractAddress: string;
  claimId: string;
  replyUrl: string;
  counterEvidenceUrl: string;
}) {
  const txHash = await params.client.writeContract({
    address: requireAddress(params.contractAddress, "Contract address"),
    functionName: "respondent_reply",
    args: [
      requireTrimmedValue(params.claimId, "Claim ID", 4).toLowerCase(),
      requireHttpsUrl(params.replyUrl, "Reply URL"),
      requireHttpsUrl(params.counterEvidenceUrl, "Counter evidence URL"),
    ],
  });
  return waitForConfirmedExecution(params.client, txHash);
}

// ──────────────────────────────────────────────
// Phase 3: Close Evidence
// ──────────────────────────────────────────────

export async function closeEvidence(client: any, contractAddress: string, claimId: string) {
  const txHash = await client.writeContract({
    address: requireAddress(contractAddress, "Contract address"),
    functionName: "close_evidence",
    args: [requireTrimmedValue(claimId, "Claim ID", 4).toLowerCase()],
  });
  return waitForConfirmedExecution(client, txHash);
}

// ──────────────────────────────────────────────
// Timeout
// ──────────────────────────────────────────────

export async function timeoutClaim(client: any, contractAddress: string, claimId: string) {
  const txHash = await client.writeContract({
    address: requireAddress(contractAddress, "Contract address"),
    functionName: "timeout_claim",
    args: [requireTrimmedValue(claimId, "Claim ID", 4).toLowerCase()],
  });
  return waitForConfirmedExecution(client, txHash);
}

// ──────────────────────────────────────────────
// Phase 4: Adjudicate
// ──────────────────────────────────────────────

export async function adjudicate(client: any, contractAddress: string, claimId: string) {
  const txHash = await client.writeContract({
    address: requireAddress(contractAddress, "Contract address"),
    functionName: "adjudicate",
    args: [requireTrimmedValue(claimId, "Claim ID", 4).toLowerCase()],
  });
  return waitForConfirmedExecution(client, txHash);
}

// ──────────────────────────────────────────────
// Phase 5: Appeal
// ──────────────────────────────────────────────

export async function appeal(params: {
  client: any;
  contractAddress: string;
  claimId: string;
  newEvidenceUrl: string;
  appealEscrowAmount: number;
}) {
  const txHash = await params.client.writeContract({
    address: requireAddress(params.contractAddress, "Contract address"),
    functionName: "appeal",
    args: [
      requireTrimmedValue(params.claimId, "Claim ID", 4).toLowerCase(),
      requireHttpsUrl(params.newEvidenceUrl, "New evidence URL"),
      params.appealEscrowAmount,
    ],
  });
  return waitForConfirmedExecution(params.client, txHash);
}

// ──────────────────────────────────────────────
// Read functions
// ──────────────────────────────────────────────

export async function readClaim(client: any, contractAddress: string, claimId: string) {
  const raw = await client.readContract({
    address: requireAddress(contractAddress, "Contract address"),
    functionName: "get_claim_json",
    args: [requireTrimmedValue(claimId, "Claim ID", 4).toLowerCase()],
  });
  return typeof raw === "string" ? JSON.parse(raw.replace(/'/g, "\"")) : raw;
}

export async function getPhase(client: any, contractAddress: string, claimId: string) {
  return await client.readContract({
    address: requireAddress(contractAddress, "Contract address"),
    functionName: "get_phase",
    args: [requireTrimmedValue(claimId, "Claim ID", 4).toLowerCase()],
  });
}

export async function getClaimCount(client: any, contractAddress: string) {
  return await client.readContract({
    address: requireAddress(contractAddress, "Contract address"),
    functionName: "get_claim_count",
    args: [],
  });
}
