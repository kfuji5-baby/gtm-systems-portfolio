# System overview

The portfolio is organized around the operating flow rather than individual Salesforce objects.

```text
Inbound
  ↓
Normalize / Validate
  ↓
Match / Deduplicate
  ↓
Salesforce System of Record
  ├─ Customer / inquiry / property relationships
  ├─ Customer Master Cockpit
  ├─ Priority workflow
  ├─ Tasks / follow-up
  ├─ Campaign activation
  └─ Management reporting
```

## Design rules

1. Preserve historical coverage where migration risk is high.
2. Prefer structured data over legacy free text.
3. Keep distinct business concepts distinct in the UX.
4. Make Boolean behavior visible and predictable.
5. Treat safety exclusions as mandatory constraints.
6. Connect search directly to a controlled next action.
