// Fictional example material for the public demo. No customer data is included.
export const sampleDocs = [
  {
    id: 'support', title: 'Customer support playbook', type: 'Operations guide', updated: 'Demo source',
    sections: [
      { heading: 'Urgent incidents', text: 'Treat a production outage, payment failure, or security concern as an urgent incident. Create an incident record immediately, assign an incident owner, and acknowledge the report within 15 minutes. The owner should confirm customer impact before proposing a fix.' },
      { heading: 'Customer updates', text: 'For urgent incidents, send a clear status update every 30 minutes until service is restored. Record the last update time and the next promised update in the incident record. Do not promise a resolution time until the technical owner has confirmed it.' },
      { heading: 'Routine requests', text: 'Route routine how-to questions to customer support. A teammate reviews the suggested answer against the current documentation before sending it. If the documentation does not answer the question, ask for clarification instead of guessing.' }
    ]
  },
  {
    id: 'returns', title: 'Returns and refunds policy', type: 'Customer policy', updated: 'Demo source',
    sections: [
      { heading: 'Refund window', text: 'A customer may request a refund within 14 calendar days of delivery. The request needs an order number and a reason for return. A support teammate checks the purchase record before confirming eligibility.' },
      { heading: 'Damaged items', text: 'For an item that arrived damaged, request photos of the packaging and product. Escalate the case to the returns owner within one business day. Do not ask the customer to ship a damaged item until the returns owner provides instructions.' },
      { heading: 'Refund approval', text: 'Refunds above $500 require a finance reviewer. The reviewer records the decision and reference number in the case. The refund is not issued automatically by the support workflow.' }
    ]
  },
  {
    id: 'onboarding', title: 'Client onboarding SOP', type: 'Team procedure', updated: 'Demo source',
    sections: [
      { heading: 'After a new client signs', text: 'When a new client signs, create an onboarding record and assign an account owner. The owner confirms the primary contact, project goals, and the agreed scope. Schedule a kickoff call within five business days.' },
      { heading: 'Access and handoff', text: 'Request only the system access needed for the agreed scope. Store access details in the approved credential manager, not in email or chat. The delivery team reviews the handoff checklist before implementation begins.' },
      { heading: 'First milestone', text: 'Share a first milestone plan after the kickoff call. The plan should state the owner, deliverable, acceptance check, and target date for each item. Any scope change needs written approval.' }
    ]
  },
  {
    id: 'finance', title: 'Invoice exception workflow', type: 'Finance procedure', updated: 'Demo source',
    sections: [
      { heading: 'Exception checks', text: 'Hold an invoice when the purchase order does not match, the invoice appears duplicated, or the amount exceeds $5,000. Record the reason for the hold and assign the case to a finance reviewer. No payment is released while the hold is active.' },
      { heading: 'Human approval', text: 'A finance reviewer verifies the vendor, invoice number, purchase order, and supporting documents. The reviewer may approve an exception only with a written reason. A second reviewer is required for invoices above $10,000.' },
      { heading: 'Audit trail', text: 'Keep the original invoice, detected flags, reviewer identity, decision time, and approval reason together in the case record. Export the audit trail for month-end reconciliation.' }
    ]
  }
];
