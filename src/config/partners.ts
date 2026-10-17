/**
 * Partner Configuration for Our ShadowCore.
 *
 * Restricts access to exactly two approved Google accounts.
 * Enforced on both frontend and strictly inside Firestore Security Rules.
 */

// Clearly documented allowlist of the two partner Google accounts
export const AUTHORIZED_PARTNERS = [
  {
    role: 'Partner 1',
    email: 'ziniashahrin07@gmail.com',
    label: 'Primary Partner',
  },
  {
    role: 'Partner 2',
    email: 'partner2@example.com', // Placeholder: Update this with your partner's Google account email
    label: 'Beloved Partner',
  },
] as const;

export const AUTHORIZED_EMAILS: readonly string[] = AUTHORIZED_PARTNERS.map(
  (p) => p.email.toLowerCase()
);

/**
 * Checks whether an email matches one of the two authorized partner accounts.
 */
export function isAuthorizedPartnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return AUTHORIZED_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Finds partner info for a given email address.
 */
export function getPartnerInfo(email: string | null | undefined) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return AUTHORIZED_PARTNERS.find((p) => p.email.toLowerCase() === normalized) || null;
}
