# M2 read-only authority verifier migration

## Scope and implementation

- `verify_lesson_authority.py` accepts explicit `--lesson-key` and optional `--offering-id`.
- Registry-derived authority/release/manifest paths replace active L01 paths for explicit calls; legacy no-key behavior remains compatible.
- Authority identity must match before auditing artifacts. Source-package evidence comes from the selected manifest, never the active config fallback.
- Release paths stay inside the selected lesson; package-directory symlinks are rejected before file audits.
- Production audit receives the selected lesson and offering. `production_gate.check` now accepts the optional offering argument for this internal call.
- Missing/invalid manifests return failed integrity and blocked delivery. Invalid string rehearsal fields now return a schema failure instead of crashing.
- Pending-manual-acceptance releases remain delivery-blocked even when integrity passes and rehearsal fields happen to say passed.
- Integrity status and delivery status remain separate; CLI exit code represents integrity status, not permission to publish.

## Verification

62 unit tests passed; identity validation passed for 20 scoped lessons; git diff --check passed.
New verifier tests use synthetic temporary fixtures for complete release/ZIP integrity, L02/L10/L12 isolation, no writes or global mutation, missing/wrong identity, cross-lesson release references, symlink rejection, corruption, invalid rehearsal schema, human gates, CLI/offering forwarding and legacy compatibility.
The legacy test fixture deliberately mocks the full registry identity audit because it supplies only the minimal registry schema; it verifies that the legacy audit was still called. Explicit-context and release integrity checks run against real temporary files.

## Real repository read-only results

These are repository authority/release checks, not finalized-PPTX intake or a judgment about classroom content. No manifest was rewritten to resolve the failures.

| Lesson key | Integrity | Delivery | Exit | Failure count |
|---|---|---|---|---|
| boya-quasi-intermediate-i:lesson-02 | failed | blocked | 1 | 14 |
| boya-quasi-intermediate-i:lesson-03 | failed | blocked | 1 | 13 |
| boya-quasi-intermediate-i:lesson-04 | failed | blocked | 1 | 13 |
| boya-quasi-intermediate-i:lesson-05 | failed | blocked | 1 | 13 |
| boya-quasi-intermediate-i:lesson-06 | failed | blocked | 1 | 13 |
| boya-quasi-intermediate-i:lesson-07 | failed | blocked | 1 | 8 |
| boya-quasi-intermediate-i:lesson-08 | failed | blocked | 1 | 8 |
| boya-quasi-intermediate-i:lesson-09 | failed | blocked | 1 | 8 |
| boya-quasi-intermediate-i:lesson-10 | failed | blocked | 1 | 1 |
| boya-quasi-intermediate-i:lesson-11 | failed | blocked | 1 | 1 |
| boya-quasi-intermediate-i:lesson-12 | failed | blocked | 1 | 1 |

## Exact failure evidence

### boya-quasi-intermediate-i:lesson-02

- authority manifest files list is missing or empty
- unregistered authority file: lessons/boya-quasi-intermediate-i/lesson-02/20-approved/pptx/lesson-02-在线预习.pptx
- unregistered authority file: lessons/boya-quasi-intermediate-i/lesson-02/20-approved/pptx/lesson-02-实体课.pptx
- authority activity file count mismatch: manifest=None, actual=0
- authority manifest source_package is missing
- release authority entry is not declared in files: 'lessons/boya-quasi-intermediate-i/lesson-02/20-approved/pptx/lesson-02-实体课.pptx'
- release authority entry is not declared in files: 'lessons/boya-quasi-intermediate-i/lesson-02/20-approved/pptx/lesson-02-在线预习.pptx'
- release has no declared authority activity files
- production workflow audit: teaching-design manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-02/10-design/teaching-design/manifest.json
- production workflow audit: source gate is not verified
- production workflow audit: source QA gate is not passed
- production workflow audit: PBI teaching-design gate is not approved
- production workflow audit: configured historical package evidence is missing
- authority qa.rehearsal must be an object

### boya-quasi-intermediate-i:lesson-03

- authority manifest files list is missing or empty
- unregistered authority file: lessons/boya-quasi-intermediate-i/lesson-03/20-approved/pptx/lesson-03-在线预习.pptx
- unregistered authority file: lessons/boya-quasi-intermediate-i/lesson-03/20-approved/pptx/lesson-03-实体课.pptx
- authority activity file count mismatch: manifest=None, actual=0
- authority manifest source_package is missing
- release authority entry is not declared in files: 'lessons/boya-quasi-intermediate-i/lesson-03/20-approved/pptx/lesson-03-在线预习.pptx'
- release has no declared authority activity files
- production workflow audit: teaching-design manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-03/10-design/teaching-design/manifest.json
- production workflow audit: source gate is not verified
- production workflow audit: source QA gate is not passed
- production workflow audit: PBI teaching-design gate is not approved
- production workflow audit: configured historical package evidence is missing
- authority qa.rehearsal must be an object

### boya-quasi-intermediate-i:lesson-04

- authority manifest files list is missing or empty
- unregistered authority file: lessons/boya-quasi-intermediate-i/lesson-04/20-approved/pptx/lesson-04-在线预习.pptx
- unregistered authority file: lessons/boya-quasi-intermediate-i/lesson-04/20-approved/pptx/lesson-04-实体课.pptx
- authority activity file count mismatch: manifest=None, actual=0
- authority manifest source_package is missing
- release authority entry is not declared in files: 'lessons/boya-quasi-intermediate-i/lesson-04/20-approved/pptx/lesson-04-在线预习.pptx'
- release has no declared authority activity files
- production workflow audit: teaching-design manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-04/10-design/teaching-design/manifest.json
- production workflow audit: source gate is not verified
- production workflow audit: source QA gate is not passed
- production workflow audit: PBI teaching-design gate is not approved
- production workflow audit: configured historical package evidence is missing
- authority qa.rehearsal must be an object

### boya-quasi-intermediate-i:lesson-05

- authority manifest files list is missing or empty
- unregistered authority file: lessons/boya-quasi-intermediate-i/lesson-05/20-approved/pptx/lesson-05-在线预习.pptx
- unregistered authority file: lessons/boya-quasi-intermediate-i/lesson-05/20-approved/pptx/lesson-05-实体课.pptx
- authority activity file count mismatch: manifest=None, actual=0
- authority manifest source_package is missing
- release authority entry is not declared in files: 'lessons/boya-quasi-intermediate-i/lesson-05/20-approved/pptx/lesson-05-在线预习.pptx'
- release has no declared authority activity files
- production workflow audit: teaching-design manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-05/10-design/teaching-design/manifest.json
- production workflow audit: source gate is not verified
- production workflow audit: source QA gate is not passed
- production workflow audit: PBI teaching-design gate is not approved
- production workflow audit: configured historical package evidence is missing
- authority qa.rehearsal must be an object

### boya-quasi-intermediate-i:lesson-06

- authority manifest files list is missing or empty
- unregistered authority file: lessons/boya-quasi-intermediate-i/lesson-06/20-approved/pptx/lesson-06-在线预习.pptx
- unregistered authority file: lessons/boya-quasi-intermediate-i/lesson-06/20-approved/pptx/lesson-06-实体课.pptx
- authority activity file count mismatch: manifest=None, actual=0
- authority manifest source_package is missing
- release authority entry is not declared in files: 'lessons/boya-quasi-intermediate-i/lesson-06/20-approved/pptx/lesson-06-在线预习.pptx'
- release has no declared authority activity files
- production workflow audit: teaching-design manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-06/10-design/teaching-design/manifest.json
- production workflow audit: source gate is not verified
- production workflow audit: source QA gate is not passed
- production workflow audit: PBI teaching-design gate is not approved
- production workflow audit: configured historical package evidence is missing
- authority qa.rehearsal must be an object

### boya-quasi-intermediate-i:lesson-07

- source package has unsupported status: 'active_source_pending_review'
- frozen source package tree hash mismatch
- frozen source package file count mismatch: manifest=None, actual=11
- release has no declared authority activity files
- production workflow audit: teaching-design manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-07/10-design/teaching-design/manifest.json
- production workflow audit: source gate is not verified
- production workflow audit: source QA gate is not passed
- production workflow audit: PBI teaching-design gate is not approved

### boya-quasi-intermediate-i:lesson-08

- source package has unsupported status: 'active_source_pending_review'
- frozen source package tree hash mismatch
- frozen source package file count mismatch: manifest=None, actual=10
- release has no declared authority activity files
- production workflow audit: teaching-design manifest is unavailable or invalid: /Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-quasi-intermediate-i/lesson-08/10-design/teaching-design/manifest.json
- production workflow audit: source gate is not verified
- production workflow audit: source QA gate is not passed
- production workflow audit: PBI teaching-design gate is not approved

### boya-quasi-intermediate-i:lesson-09

- source package has unsupported status: 'active_source_pending_review'
- frozen source package tree hash mismatch
- frozen source package file count mismatch: manifest=None, actual=11
- release has no declared authority activity files
- production workflow audit: canonical source hash differs from the approved source manifest
- production workflow audit: source gate is not verified
- production workflow audit: source QA gate is not passed
- production workflow audit: PBI teaching-design gate is not approved

### boya-quasi-intermediate-i:lesson-10

- authority manifest is missing: lessons/boya-quasi-intermediate-i/lesson-10/20-approved/lesson-manifest.json

### boya-quasi-intermediate-i:lesson-11

- authority manifest is missing: lessons/boya-quasi-intermediate-i/lesson-11/20-approved/lesson-manifest.json

### boya-quasi-intermediate-i:lesson-12

- authority manifest is missing: lessons/boya-quasi-intermediate-i/lesson-12/20-approved/lesson-manifest.json

## Boundaries and next slice

No actual teaching artifact, source/authority manifest, release, or AGENTS.md was changed in this slice. No release build or approval command ran. Existing dirty files were preserved.

M2 is not complete: release builder and remaining config consumers still need migration; legacy config keys stay until consumer coverage is complete. Next: add a read-only release planning interface and tests before migrating release writes. Requirements ownership/skill decomposition and the previously blocked precedence amendment remain separate unfinished work.
