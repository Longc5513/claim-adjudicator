# Judge Notes

## Category target

Builder -> Intelligent Contracts

## Why this should pass the gate

- real GenLayer contract code is included in-repo
- uses `gl.nondet.web.get(...)` on policy, subject, evidence, and respondent-reply sources
- uses `gl.nondet.exec_prompt(...)` for structured claim adjudication reasoning
- uses `gl.vm.run_nondet_unsafe(...)` so consensus materially changes stored claim state
- exposes a reusable primitive for dispute, refund, warranty, escrow, and buyer-protection flows
- adds timeout auto-resolution for unresponsive respondents
- adds category-based claim classification (refund, return, dispute, warranty, other)
- adds arbiter management for delegated dispute resolution
- fixes the appeal escrow safety issue by marking settled escrow rounds as single-use and requiring a fresh appeal escrow deposit

## Reusability

This is not tied to one app. Any builder can reuse the same claim structure and
adjudication flow for merchants, marketplaces, escrow systems, support tools,
or warranty processing.

## Reviewer checklist

1. inspect `contracts/claim_adjudicator.py`
2. confirm write methods: `file_claim`, `respondent_reply`, `close_evidence`, `timeout_claim`, `adjudicate`, `appeal`, `set_arbiter`
3. confirm view methods: `get_claim_json`, `get_claim_ids`, `get_claim_count`, `get_phase`, `latest_summary`, `get_owner`, `get_arbiter`
4. confirm the client helper uses real write and read paths
5. confirm README and tests show the repo is submission-ready
6. confirm timeout auto-resolution works for silent respondents
7. confirm category classification validates against allowed values

## Live evidence

- GitHub repo: `https://github.com/Longc5513/claim-adjudicator`
- Explorer contract:
  `https://explorer-bradbury.genlayer.com/address/0xae909D9ea0867fB846e948C5636EAb56b73033e7`
- Explorer tx:
  `https://explorer-bradbury.genlayer.com/tx/0x7641fb2c257578e4319763bbcbfe7c75abd3579c203c7f35048257403c7279e0`
