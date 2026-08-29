/**
 * Sanitized matching strategy.
 * Exact production object/field names and thresholds are intentionally changed.
 */
function findRelatedEntity_(lead) {
  // 1) Prefer a stable business key whenever one exists.
  if (lead.external_product_code) {
    const exact = queryByExternalCode_(lead.external_product_code);
    if (exact) return exact;
  }

  // 2) Fall back to a limited candidate set, then score normalized values.
  const candidates = queryCandidates_(lead);
  if (!candidates.length) return null;

  const inputName = normalizeText_(lead.product_name);
  const inputAddress = normalizeText_(lead.address);
  const inputPrice = parseNumber_(lead.price);

  const ranked = candidates.map(candidate => {
    let score = 0;
    const candidateName = normalizeText_(candidate.name);
    const candidateAddress = normalizeText_(candidate.address);

    if (inputName && candidateName && inputName === candidateName) score += 30;
    else if (containsEither_(inputName, candidateName)) score += 18;

    if (containsEither_(inputAddress, candidateAddress)) score += 35;
    if (inputPrice && Number(candidate.price) === inputPrice) score += 12;

    return { ...candidate, score };
  }).sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];

  // Do not create a false-positive relationship just to keep automation moving.
  if (!best || best.score < 25) return null;
  if (second && best.score === second.score) return null;

  return best;
}

function normalizeText_(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\s　]/g, '')
    .replace(/[‐‑‒–—―ー]/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function containsEither_(a, b) {
  return Boolean(a && b && (a.includes(b) || b.includes(a)));
}

function parseNumber_(value) {
  const match = String(value || '').replace(/,/g, '').match(/\d+/);
  return match ? Number(match[0]) : null;
}
