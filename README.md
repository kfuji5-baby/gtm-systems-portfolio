# GTM Systems Portfolio — Lead Intake, CRM Automation & Prioritization

A sanitized portfolio example derived from production Sales Operations / GTM Systems work I implemented for a B2C sales organization.

> **Sanitization & ownership note**
> I inherited an existing Salesforce environment and a partially implemented lead-management process that was unreliable and incomplete. I diagnosed failure points, redesigned key workflow logic, and implemented the automation, matching, duplicate prevention, Salesforce synchronization, manual-review handling, customer prioritization, and CRM workflow improvements represented here.
>
> This repository is **not the employer's production source repository**. It contains representative excerpts that I personally worked on, rewritten/sanitized for public review. Customer data, credentials, Salesforce org IDs, internal URLs, company-specific object/field names, and commercially sensitive rules have been removed or replaced. Some scoring weights and identifiers are intentionally illustrative rather than production values.

## The problem

Inbound inquiries arrived by email and required repetitive manual work before a salesperson could act on them. The existing process had several operational failure modes:

- repeated or duplicate processing of the same inquiry;
- inconsistent CRM record creation and relationships;
- unreliable customer/property matching;
- manual ownership assignment and follow-up task creation;
- weak error visibility when an automated match was ambiguous;
- fragmented CRM UX that made prioritization and follow-up harder for sales reps.

My goal was not simply to "move data into Salesforce." It was to create a safer operational workflow that could automate high-confidence cases while explicitly routing ambiguous cases for human review.

## What I implemented

### 1. Inbound lead ingestion

A Google Apps Script workflow reads labeled inbound email, parses structured inquiry fields, validates minimum required data, and stores a normalized staging record. Duplicate protection uses both message-level and business-level identifiers.

### 2. Idempotent Salesforce synchronization

Only staging rows in a processable state are synchronized. The workflow finds or creates related CRM entities, persists Salesforce IDs back to the staging layer, creates the inquiry relationship and initial follow-up task, and changes the row state to `synced`. Re-running the automation does not blindly recreate records.

### 3. Matching with a manual-review escape hatch

Customer matching normalizes phone/name inputs. Property matching prefers a stable external/business key, then falls back to normalized candidate matching and weighted similarity. Low-confidence or tied matches are not forced; they enter `manual_review` for a person to resolve.

### 4. Sales prioritization

I later implemented a customer-prioritization model in Salesforce using observable customer attributes, completed sales activities, recency, finance progress, and next-action hygiene. The public example keeps the mechanism but intentionally changes production field names and weights.

### 5. Salesforce UX / workflow redesign

The broader project included Apex + Lightning Web Components for customer search, filtering, activity management, duplicate handling, customer assignment, and sales workflow improvements. The production package included regression tests and was iterated through multiple releases based on frontline feedback.

## Architecture

![Architecture](docs/architecture.svg)

```text
Inbound email
    │
    ▼
Parse + validate
    │
    ├── duplicate? ──► skip safely
    │
    ▼
Staging / process state
    │
    ▼
CRM matching + normalization
    │
    ├── ambiguous? ──► manual_review
    │
    ▼
Salesforce sync
(Account / Contact / Inquiry / Related Entity)
    │
    ▼
Ownership + follow-up task
    │
    ▼
Sales workflow + prioritization + reporting
```

## Representative code

| File | What it demonstrates |
| --- | --- |
| [`src/inboundLeadParser.js`](src/inboundLeadParser.js) | Email parsing, validation, message/business-key deduplication, concurrency control |
| [`src/salesforceSync.js`](src/salesforceSync.js) | Stateful/idempotent CRM synchronization, error paths, task creation |
| [`src/matchingEngine.js`](src/matchingEngine.js) | Normalization, deterministic-key matching, weighted fallback, ambiguity handling |
| [`src/prospectScoring.apex`](src/prospectScoring.apex) | Salesforce-side prioritization based on customer completeness, activity, recency and next actions |

## Example workflow states

```text
parsed -> synced
       -> manual_review
       -> error
```

A row only reaches `synced` after the required CRM relationships and follow-up action have been created. Errors remain visible for retry instead of disappearing into logs.

## Design decisions

**Prefer idempotency over cleverness.** Salesforce IDs are persisted after each successful step so a retry can continue without creating unnecessary duplicates.

**Use deterministic identifiers first.** Stable inquiry/property identifiers are stronger than fuzzy text comparison, so fuzzy matching is only a fallback.

**Fail safely on ambiguity.** A false positive CRM match is usually worse than a manual review. Tied or low-confidence matches therefore stop automation.

**Normalize before comparing.** Phone numbers, whitespace, full-/half-width characters, punctuation and Japanese address/name formatting create avoidable mismatches if compared raw.

**Keep humans in the loop where judgment matters.** The automation handles repetitive work; sales/admin users retain control over uncertain matches and business exceptions.

## What I would improve next

- centralize configuration for routing/scoring instead of embedding rules in code;
- add structured telemetry and alerts for failure rate, latency and retry volume;
- expand unit/integration test coverage around parser variants and Salesforce API failures;
- add a dead-letter/retry queue rather than using the staging sheet as the primary recovery mechanism;
- measure operational impact directly: response time, duplicate rate, routing accuracy, conversion by score band, and manual-review rate;
- where appropriate, move API orchestration toward a more durable integration layer as scale/volume grows.

## Tech used in the production work

Salesforce · Apex · Lightning Web Components · Salesforce REST API · Google Apps Script · Gmail · Google Sheets · Power BI

## Why this repo is intentionally small

The underlying production systems contain organization-specific metadata, customer information and internal business rules that should not be public. This repo is therefore a **portfolio-safe technical walkthrough**, not a code dump. The purpose is to show how I approach GTM systems problems: identify an operational failure mode, model the workflow, automate the repeatable path, preserve data integrity, and give humans a clear exception path.
