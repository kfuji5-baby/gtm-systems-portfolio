/**
 * Representative Apex scoring pattern from a Salesforce sales-prioritization cockpit.
 * Production fields, labels, thresholds and weights are generalized/altered.
 */
private static Integer calculateProspectScore(
    CustomerSignals customer,
    ActivitySummary activity,
    Integer daysSinceContact,
    Boolean nextActionMissing,
    Boolean nextActionOverdue,
    Boolean hasPrimaryOpportunity
) {
    Integer score = 0;

    // Profile / discovery completeness
    if (customer.hasBudget) score += 4;
    if (customer.hasDesiredArea) score += 4;
    if (customer.hasProductPreference) score += 4;
    if (customer.hasPurchaseTiming) score += 4;

    // Observed engagement beats subjective stage labels
    score += Math.min(activity.outboundAttempts, 5);
    if (activity.connectedConversations > 0) score += 10;
    if (activity.proposals > 0) score += 8;
    if (activity.meetings > 0) score += 10;
    if (activity.highIntentActions > 0) score += 15;
    if (activity.financeProgress > 0) score += 10;

    // Operational hygiene / recency
    if (daysSinceContact != null && daysSinceContact <= 7) score += 5;
    if (!nextActionMissing) score += 5;
    if (hasPrimaryOpportunity) score += 8;
    if (daysSinceContact != null && daysSinceContact >= 14) score -= 10;
    if (nextActionOverdue) score -= 5;
    if (nextActionMissing) score -= 10;

    return Math.max(0, Math.min(99, score));
}

private static String scoreBand(Integer score) {
    Integer safe = score == null ? 0 : score;
    if (safe >= 65) return 'High Priority';
    if (safe >= 35) return 'Nurture';
    return 'Low Engagement';
}
