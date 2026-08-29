/**
 * Simplified / sanitized synchronization state machine.
 * Production object names and org-specific metadata are intentionally omitted.
 */
function syncPendingRowsToCrm() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INQUIRY_SHEET);
  const rows = sheet.getDataRange().getValues();
  const header = rows[0].map(v => String(v || '').trim());

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const data = rowToObject_(header, row);
    if (data.status !== 'parsed') return;

    try {
      // Persist IDs after every successful stage. This makes retries resumable.
      let accountId = data.crm_account_id;
      if (!accountId) {
        accountId = findCustomer_(data) || createCustomer_(data);
        setByHeader_(sheet, rowNumber, header, 'crm_account_id', accountId);
      }

      let relatedEntityId = data.crm_related_entity_id;
      if (!relatedEntityId) {
        const match = findRelatedEntity_(data);
        if (!match) {
          setByHeader_(sheet, rowNumber, header, 'status', 'manual_review');
          setByHeader_(sheet, rowNumber, header, 'error', 'No confident related-entity match.');
          return;
        }
        relatedEntityId = match.id;
        setByHeader_(sheet, rowNumber, header, 'crm_related_entity_id', relatedEntityId);
      }

      let inquiryId = data.crm_inquiry_id;
      if (!inquiryId) {
        inquiryId = findExistingInquiry_(accountId, relatedEntityId)
          || createInquiry_(data, accountId, relatedEntityId);
        setByHeader_(sheet, rowNumber, header, 'crm_inquiry_id', inquiryId);
      }

      let taskId = data.crm_task_id;
      if (!taskId) {
        taskId = createInitialFollowUp_(data, accountId, inquiryId);
        setByHeader_(sheet, rowNumber, header, 'crm_task_id', taskId);
      }

      setByHeader_(sheet, rowNumber, header, 'status', 'synced');
      setByHeader_(sheet, rowNumber, header, 'error', '');
      setByHeader_(sheet, rowNumber, header, 'processed_at', new Date());
    } catch (error) {
      setByHeader_(sheet, rowNumber, header, 'status', 'error');
      setByHeader_(sheet, rowNumber, header, 'error', error.message);
    }
  });
}

function normalizePhone_(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

function normalizeName_(value) {
  return String(value || '').replace(/[\s　]/g, '').trim();
}

function rowToObject_(header, row) {
  return header.reduce((obj, key, i) => {
    if (key) obj[key] = row[i];
    return obj;
  }, {});
}

function setByHeader_(sheet, rowNumber, header, name, value) {
  const index = header.indexOf(name);
  if (index < 0) throw new Error(`Missing column: ${name}`);
  sheet.getRange(rowNumber, index + 1).setValue(value);
}
