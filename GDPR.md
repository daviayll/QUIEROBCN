# GDPR Compliance — QuieroBCN

> Internal reference document. Not a legal opinion. Consult a DPO or lawyer before going live.

## Responsible Party (Responsable del Tratamiento)

The solo real estate agent operating QuieroBCN is the Data Controller under GDPR.
A formal **Privacy Policy** page (`/privacidad`) must be published before the app goes live.

---

## Personal Data Processed

| Data | Category | Legal Basis | Retention |
|------|----------|-------------|-----------|
| Name, phone, email | Contact data | Art. 6(1)(b) — contract performance | Until erasure request or 3 years inactive |
| DNI / NIE / Passport | Identity document | Art. 6(1)(b) + Art. 9 (special category if nationality) | Until application closed or erasure request |
| Payslips (nóminas) | Financial data | Art. 6(1)(b) — necessary to assess solvency | Until application closed or erasure request |
| Work contract, tax returns | Financial data | Art. 6(1)(b) | Until application closed or erasure request |
| Bank statements | Financial data | Art. 6(1)(b) | Until application closed or erasure request |
| IP address / session data | Technical data | Art. 6(1)(f) — legitimate interest (security) | Supabase default (90 days) |

**Legal basis for document processing:** Art. 6(1)(b) — processing is necessary for the performance of a contract (finding and applying for a rental property). Explicit consent (Art. 7) is collected as an additional safeguard.

---

## Data Storage Architecture

### Database (Supabase PostgreSQL — EU region)
- All personal data stored in Supabase project (ensure EU region is selected: `eu-central-1` or `eu-west-1`)
- Row Level Security (RLS) enforced on all tables
- No client can read another client's data
- Admin access only via authenticated session with `user_metadata.role = 'admin'`

### Document Files (Supabase Storage)
- Bucket: `documents` — **private**, no public access
- Storage path: `documents/{user_id}/{doc_type}_{timestamp}.{ext}`
- Access: **signed URLs only**, maximum 1 hour expiry
- Never expose raw storage paths to the frontend
- Never write uploaded files to server disk (`/tmp` etc.)
- ZIP export: stream directly from signed URLs → response, no temp files

### Admin ZIP Export
- Every export is logged in `document_access_log` table (Art. 5(2) accountability)
- Exported ZIPs are only for immediate submission to a real estate company
- Admin must not store ZIPs on personal devices — submit and delete

---

## Key Technical Implementations

### Consent (`clients.consent_given_at`)
- Collected via explicit checkbox at registration (cannot be pre-ticked)
- Timestamp stored in `clients.consent_given_at`
- Consent text is versioned — if policy changes, re-consent may be required

### Right to Erasure (`request_gdpr_deletion` SQL function)
Call this function when a user requests deletion:
```typescript
const { data } = await supabase.rpc('request_gdpr_deletion', { p_user_id: userId })
// data.file_paths = array of storage paths to delete

// Then delete storage files:
for (const path of data.file_paths) {
  await supabase.storage.from('documents').remove([path])
}

// Finally delete auth user (requires service role):
await supabaseAdmin.auth.admin.deleteUser(userId)
```

What the function does automatically:
1. Anonymizes PII in `clients` row (name → `[ELIMINADO]`, etc.)
2. Sets `deletion_requested_at`
3. Soft-deletes documents (sets `deleted_at`, nulls `file_path`)
4. Removes pending matches
5. Unbookles future visit slots

What you must do in the app afterward:
- Delete all files from `documents/{user_id}/` in Supabase Storage
- Delete the auth user via service role

### Soft Delete on Documents (`documents.deleted_at`)
- Deleted documents are hidden from all queries (RLS updated)
- File path is set to `[DELETED]` after storage deletion
- Row retained for audit trail only

---

## Data Sharing

Documents are only shared with real estate companies (promotoras) when:
1. A client has been matched to a building AND
2. The client has booked a visit AND
3. The admin manually exports and submits the ZIP

This sharing must be disclosed in the Privacy Policy.

---

## Data Retention Policy

| Scenario | Action |
|----------|--------|
| Client account inactive > 3 years | Admin should trigger deletion |
| Client requests erasure | Run `request_gdpr_deletion()` immediately |
| Rental application rejected | Admin marks client inactive; data retained until client requests deletion |
| Visit completed, no application | Data retained per client request or 3-year rule |

---

## Required Before Going Live

- [ ] Publish `/privacidad` page with full Privacy Policy in Spanish
- [ ] Register as Data Controller with **AEPD** (Agencia Española de Protección de Datos) if processing special category data (identity documents may qualify)
- [ ] Ensure Supabase project is in an **EU region**
- [ ] Sign Supabase's **Data Processing Agreement (DPA)** — available in Supabase dashboard
- [ ] Implement the "Delete my account" button in the client portal (`/perfil`)
- [ ] Add retention policy: automated reminder or cron job to flag inactive accounts after 3 years
- [ ] Brief the admin on the obligation to delete ZIPs after submission

---

## Supabase GDPR Status

Supabase is GDPR-compliant and offers:
- Data Processing Agreement (DPA) — sign in dashboard under Settings → Legal
- EU hosting regions available (required for EU users)
- Encryption at rest and in transit
- SOC 2 Type II certified

Reference: https://supabase.com/security

---

## Contact for Data Requests

Clients can submit requests (access, rectification, erasure, portability) via:
- Email: [add admin email here]
- In-app: "Eliminar mi cuenta" button → triggers `request_gdpr_deletion()`

Response deadline: **30 days** (GDPR Art. 12)
