Claim Adjudicator is a standalone intelligent contract primitive for
adversarial dispute resolution and claim adjudication on GenLayer.

Builders can file a claim with a category, policy URL, subject URL,
evidence URL, and optional respondent reply. The contract fetches
those sources with `gl.nondet.web.get(...)`, asks for a structured
judgment with `gl.nondet.exec_prompt(...)`, and finalizes state only
after `gl.vm.run_nondet_unsafe(...)` validates the result.

Key improvements over a basic adjudicator:
- Category-based classification (refund, return, dispute, warranty, other)
- Timeout auto-resolution when respondent is silent
- Arbiter management for delegated dispute resolution
- Multi-phase adversarial lifecycle with time-locked deadlines
- Appeal escrow safety: each settled escrow round can be paid only once, and denied-claim appeals require a fresh GEN escrow deposit

The primitive is reusable for buyer protection, marketplace disputes,
warranty claims, merchant refund workflows, and escrow release decisions.

Updated live deployment on August 4, 2026:

- Repo: `https://github.com/Longc5513/claim-adjudicator`
- Contract:
  `https://explorer-bradbury.genlayer.com/address/0xae909D9ea0867fB846e948C5636EAb56b73033e7`
- Transaction:
  `https://explorer-bradbury.genlayer.com/tx/0x7641fb2c257578e4319763bbcbfe7c75abd3579c203c7f35048257403c7279e0`
