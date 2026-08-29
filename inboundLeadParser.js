/**
 * Representative / sanitized excerpt from a production inbound-lead workflow.
 * Identifiers, labels and field names have been generalized.
 */
const INQUIRY_SHEET = 'Inbound_Inquiries';
const INBOUND_LABEL = 'Inbound Leads';

function runLeadAutomation() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    console.log('Another run is active; skipping this execution.');
    return;
  }

  try {
    importInboundInquiries();
    syncPendingRowsToCrm();
  } finally {
    lock.releaseLock();
  }
}

function importInboundInquiries() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INQUIRY_SHEET);
  const label = GmailApp.getUserLabelByName(INBOUND_LABEL);
  if (!sheet || !label) throw new Error('Required sheet or Gmail label is missing.');

  const existingMessageIds = existingValues_(sheet, 'gmail_message_id');
  const existingInquiryIds = existingValues_(sheet, 'external_inquiry_id');

  label.getThreads(0, 50).forEach(thread => {
    thread.getMessages().forEach(message => {
      if (existingMessageIds.has(message.getId())) return;

      const parsed = parseInquiry_(message.getPlainBody());
      if (!isValidInquiry_(parsed)) return;

      if (parsed.externalInquiryId && existingInquiryIds.has(parsed.externalInquiryId)) return;

      sheet.appendRow([
        message.getDate(),
        parsed.customerName,
        parsed.email,
        parsed.phone,
        parsed.productName,
        parsed.externalInquiryId,
        message.getId(),
        'parsed',
        '',
        new Date()
      ]);
    });
  });
}

function parseInquiry_(body) {
  return {
    customerName: extract_(body, /Customer Name:\s*([^\n\r]*)/i),
    email: extract_(body, /Email:\s*([^\s\n\r]*)/i),
    phone: extract_(body, /Phone:\s*([^\n\r]*)/i),
    productName: extract_(body, /Product:\s*([^\n\r]*)/i),
    externalInquiryId: extract_(body, /Inquiry ID:\s*([^\n\r]*)/i)
  };
}

function isValidInquiry_(lead) {
  if (!lead.customerName) return false;
  if (!lead.email && !lead.phone) return false;
  if (!lead.productName) return false;
  return true;
}

function extract_(text, regex) {
  const match = String(text || '').match(regex);
  return match ? String(match[1] || '').trim() : '';
}

function existingValues_(sheet, headerName) {
  const rows = sheet.getDataRange().getValues();
  const header = rows[0].map(String);
  const index = header.indexOf(headerName);
  if (index < 0) throw new Error(`Missing column: ${headerName}`);
  return new Set(rows.slice(1).map(row => String(row[index] || '').trim()).filter(Boolean));
}
