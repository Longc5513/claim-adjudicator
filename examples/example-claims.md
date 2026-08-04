# Example Claims

## 1. Electronics return window dispute

- category: `refund`
- policy URL: store returns page
- subject URL: item listing page
- evidence URL: order detail or delivery proof page
- outcome: `approved`

## 2. Marketplace damaged item claim

- category: `dispute`
- policy URL: marketplace buyer protection page
- subject URL: original listing page
- evidence URL: support ticket or public issue record
- outcome: `needs_review`

## 3. Warranty claim denial challenge

- category: `warranty`
- policy URL: manufacturer warranty terms
- subject URL: product specifications page
- evidence URL: repair report or condition evidence
- outcome: `denied`

## 4. Timeout auto-resolution

- category: `return`
- policy URL: merchant return policy
- subject URL: product page
- evidence URL: delivery proof
- scenario: respondent never replied, claimant calls `timeout_claim()`
- outcome: `approved` (auto-resolved)
