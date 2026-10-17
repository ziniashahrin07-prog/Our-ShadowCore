# Our ShadowCore Security Specification & Red Team Audit

## 1. System Invariants & Access Control Model
Our ShadowCore is an ultra-private romantic journal restricted exclusively to **exactly two authorized Google accounts**:
- Partner 1: `ziniashahrin07@gmail.com`
- Partner 2: `partner2@example.com` (placeholder configuration)

### Security Invariants:
1. **Zero Public Access**: Unauthenticated requests are rejected immediately across all endpoints.
2. **Strict Two-Account Allowlist**: Any authenticated user whose verified email is not in the 2-account allowlist receives `PERMISSION_DENIED` on all read and write attempts.
3. **Email Verification Mandatory**: Users must have `request.auth.token.email_verified == true`.
4. **Shared Read Model**: Both authorized partners can read all records in `diary_entries`, `letters`, `memories`, `dreams_promises`, and `special_dates`.
5. **Author-Only Write Mutation**: Only the original creator (`authorUid` or `senderUid`) can edit or delete an entry.
6. **Immutable Identity & Timestamps**: `authorUid`, `senderUid`, `createdAt`, and document ID are immutable once created.
7. **Strict Field Whitelisting**: Unknown / shadow fields are rejected on creation and update.

---

## 2. The "Dirty Dozen" Attack Payloads

1. **Payload 1: Unauthenticated Read/Write**
   - Attempt: Anonymous or unauthenticated actor requests `GET /diary_entries/entry_1`.
   - Result: `PERMISSION_DENIED`.

2. **Payload 2: Third-Party Authenticated User Read**
   - Attempt: User signed in as `intruder@gmail.com` (email verified) requests `GET /diary_entries/entry_1`.
   - Result: `PERMISSION_DENIED` (Email not in allowlist).

3. **Payload 3: Unverified Email Attack**
   - Attempt: User with email `ziniashahrin07@gmail.com` but `email_verified: false` attempts `GET /letters/letter_1`.
   - Result: `PERMISSION_DENIED`.

4. **Payload 4: Identity Spoofing on Create**
   - Attempt: Partner 1 (`uid_1`) creates a diary entry with `authorUid: "uid_2"`.
   - Result: `PERMISSION_DENIED` (Author UID must match `request.auth.uid`).

5. **Payload 5: Partner Impersonation on Update**
   - Attempt: Partner 2 (`uid_2`) attempts to edit or overwrite an entry created by Partner 1 (`authorUid: "uid_1"`).
   - Result: `PERMISSION_DENIED` (Only author can update).

6. **Payload 6: Partner Impersonation on Delete**
   - Attempt: Partner 2 (`uid_2`) attempts to delete a love letter created by Partner 1 (`senderUid: "uid_1"`).
   - Result: `PERMISSION_DENIED` (Only sender/author can delete).

7. **Payload 7: Author Immutability Hijack**
   - Attempt: Partner 1 edits their own entry but attempts to transfer ownership by changing `authorUid` from `"uid_1"` to `"uid_2"`.
   - Result: `PERMISSION_DENIED` (`authorUid` is immutable).

8. **Payload 8: Creation Timestamp Tampering**
   - Attempt: User attempts to create an entry with a spoofed historical timestamp `createdAt: "1999-01-01T00:00:00Z"` instead of `request.time`.
   - Result: `PERMISSION_DENIED`.

9. **Payload 9: Shadow Field Injection**
   - Attempt: User submits a memory payload with an injected administrative field `{"isAdmin": true, "shadowRole": "superuser"}`.
   - Result: `PERMISSION_DENIED` (`hasOnly` strict key validation).

10. **Payload 10: Denial of Wallet (Oversized Payload)**
    - Attempt: User attempts to write a title of 200,000 characters to exhaust storage or bandwidth.
    - Result: `PERMISSION_DENIED` (String length exceeded bounds).

11. **Payload 11: Malformed Document ID**
    - Attempt: Writing to document with path `/diary_entries/../../etc/passwd` or oversized junk ID.
    - Result: `PERMISSION_DENIED` (`isValidId` check).

12. **Payload 12: Blank Document / Empty Title Bypass**
    - Attempt: Creating a diary entry with empty title `title: ""`.
    - Result: `PERMISSION_DENIED` (`minLength >= 1`).
