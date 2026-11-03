# Phase A validation preparation package

2026-10-21. **Inert preparation only.** Nothing in this directory starts a service, connects to a database, creates a user or runs a test. No executable runner or active migration is supplied because target admission and complete baseline review are blocked.

- `environment-assessment.json`: sanitized read-only environment observations and historical probe distinction.
- `source-lock.json`: SHA-256 identities of existing designs, SQL proposals, source candidates and recorded schema metadata. No keys or row data.
- `recorded-prechange-objects.json`: selected historical policy/constraint/column/grant definitions and all 44 recorded application-function fingerprints. Full function DDL and owners are not reconstructed or certified.
- `baseline-recipe.json`: dependency order and explicit missing evidence.
- `fixture-contract.json`: synthetic-only actor/data contract; identities not created.
- `test-cases.csv`: machine-readable cases, all NOT RUN.
- `run-state.template.json`: execution disabled, no target, no implicit authorization.

The three parent reports define environment, test assertions and recovery/promotion gates. Existing `.sql.proposed` files remain separate and unmodified. Future harness implementation must enforce target identity and explicit authorization before any connection or mutation. A source fingerprint cannot authorize production execution.
