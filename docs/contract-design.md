# Contract Design

`ClaimAdjudicator` is a reusable intelligent contract primitive for
adversarial claim resolution that depends on messy web policy text
and conflicting public evidence.

## Why this primitive matters

Builders often need an adjudication layer between disputing parties and
escrow/payment logic:

- does a return policy actually cover this claim?
- is a claimant still inside the allowed refund window?
- does the respondent's reply change the final outcome?
- should downstream systems release funds, block a payout, or request review?

These are not clean deterministic checks. Policies vary, product pages differ,
and claimant/respondent evidence is often unstructured. GenLayer consensus makes
the result more useful than a centralized one-off decision.

## Lifecycle phases

1. `filed` — claimant opens claim with escrow deposit
2. `responded` — respondent submits reply and counter-evidence
3. `evidence_closed` — evidence period ends
4. `adjudicating` — AI consensus running
5. `resolved` — final verdict persisted on-chain

## Timeout auto-resolution

If a respondent never replies and the timeout window expires (default ~3 days),
the claimant can call `timeout_claim(...)` to auto-approve. This prevents
unresponsive parties from blocking resolution indefinitely.

## Consensus flow

`adjudicate(...)`:

1. fetches the policy page
2. fetches the subject page
3. fetches claimant evidence
4. optionally fetches respondent reply and counter-evidence
5. asks for a structured adjudication judgment
6. validates leader output with `gl.vm.run_nondet_unsafe(...)`
7. persists final adjudication state on-chain

## Stored outcome

A resolved claim stores:

- verdict (approved / denied / needs_review)
- confidence
- basis
- rule match score
- elapsed days
- rationale

This makes the primitive reusable for escrow, buyer protection, warranty review,
and marketplace dispute flows.

## Appeal escrow safety

Appeals are modeled as a new escrow round, not a replay of the original one.

- the original denied-claim escrow is settled immediately to the respondent
- the contract marks that escrow round as settled and zeroes the active escrow amount
- if the claimant appeals, they must provide a fresh GEN escrow deposit
- the appeal adjudication can only settle the fresh active escrow round

This prevents double-payment of a previously settled deposit and avoids pooled-fund leakage across claims.
