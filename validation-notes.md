# Validation notes

This file summarizes verified production behavior represented by the sanitized portfolio examples.

## Deployment evidence

A target-org Salesforce CLI dry run validated a release with:

- 25 / 25 metadata components validated
- 14 / 14 tests passed
- 0 test failures

These are deployment-validation results, not a claim of 100% code coverage.

## Representative regression scenarios

| Scenario | Risk controlled |
|---|---|
| Similar administrative area names | Prevent substring-based geographic false positives |
| Hiragana / katakana / kanji + furigana | Prevent Japanese-script search gaps |
| Hyphenated / plain / partial phone numbers | Prevent contact lookup failures caused by formatting |
| Structured property city → address → name → legacy value | Make geographic resolution deterministic |
| Cross-filter OR + mandatory safety AND | Prevent excluded records from re-entering action audiences |
| Actual / legacy / created-date fallback | Preserve inquiry chronology across old and new records |

## Measurement boundary

The production evidence verifies functionality, deployment quality, production availability, and workflow capability. Search frequency, user time saved, adoption rate, and downstream revenue impact were not fully instrumented, so this portfolio does not invent ROI claims.
