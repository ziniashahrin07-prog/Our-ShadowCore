import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  Mail,
  Lock,
  KeyRound,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AUTHORIZED_PARTNERS } from '../config/partners';

export const AccountPrivacyPage: React.FC = () => {
  const { user, signOut, partnerInfo } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyConfigSnippet = () => {
    const snippet = `// In src/config/partners.ts and firestore.rules:\nPartner 1: ${AUTHORIZED_PARTNERS[0].email}\nPartner 2: ${AUTHORIZED_PARTNERS[1].email}`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E7DF] text-[#7A223B] text-xs font-semibold tracking-wider uppercase">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Sanctuary & Sovereignty</span>
        </div>
        <h1 className="font-serif-romantic text-3xl sm:text-4xl font-bold text-[#4A1726]">
          Account & Privacy
        </h1>
        <p className="text-sm text-[#785E65] font-literature italic max-w-xl mx-auto">
          Clear transparency into your active session, partner connection status, and zero-trust
          cryptographic security.
        </p>
      </div>

      {/* User Account Card */}
      <section className="bg-[#FFFDFB] border border-[#E8DCD2] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#F0E5DC] gap-4">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Partner'}
                className="w-16 h-16 rounded-full border-2 border-[#9E3E56] shadow-xs object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#7A223B] text-white flex items-center justify-center text-2xl font-bold">
                {user?.displayName ? user.displayName[0].toUpperCase() : 'P'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif-romantic text-xl font-bold text-[#38272A]">
                  {user?.displayName || 'Authorized Partner'}
                </h2>
                <span className="bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Account
                </span>
              </div>
              <p className="text-xs text-[#6B5157] font-mono mt-0.5">{user?.email}</p>
              <div className="inline-block mt-1 text-[11px] text-[#7A223B] bg-[#FAF5EC] px-2 py-0.5 rounded-md font-medium">
                Role: {partnerInfo?.role || 'Partner'} ({partnerInfo?.label || 'Authorized'})
              </div>
            </div>
          </div>

          <button
            onClick={signOut}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#D9C4BD] bg-white hover:bg-[#FEE2E2] hover:border-[#FECACA] hover:text-[#991B1B] text-xs font-semibold text-[#54383E] transition-colors self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Security Details Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-xs text-[#5E474C]">
          <div className="bg-[#FAF5EC] p-3.5 rounded-xl border border-[#EBDCD0]">
            <span className="block text-[10px] uppercase tracking-wider text-[#8C6D75] font-semibold mb-1">
              Firebase Auth UID
            </span>
            <span className="font-mono text-[#38272A] break-all">{user?.uid || 'Unknown'}</span>
          </div>

          <div className="bg-[#FAF5EC] p-3.5 rounded-xl border border-[#EBDCD0]">
            <span className="block text-[10px] uppercase tracking-wider text-[#8C6D75] font-semibold mb-1">
              Google Email Verification
            </span>
            <span className="text-[#166534] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
              {user?.emailVerified ? 'Confirmed by Google OAuth' : 'Pending'}
            </span>
          </div>
        </div>
      </section>

      {/* Two-Partner Allowlist Status */}
      <section className="bg-[#FFFDFB] border border-[#E8DCD2] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0E5DC]">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#7A223B]" />
            <h3 className="font-serif-romantic text-xl font-bold text-[#4A1726]">
              Two-Partner Allowlist Enforcement
            </h3>
          </div>
          <button
            onClick={copyConfigSnippet}
            className="flex items-center gap-1.5 text-xs text-[#7A223B] bg-[#FAF5EC] hover:bg-[#F3E7DF] px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Config'}</span>
          </button>
        </div>

        <p className="text-xs text-[#6B5157] font-literature leading-relaxed">
          Access to this romantic sanctuary is cryptographically guarded by Cloud Firestore. Exactly two
          Google accounts have authorization. Third-party Google accounts receive instant permission
          denials at the cloud database level.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AUTHORIZED_PARTNERS.map((partner, idx) => {
            const isCurrent = user?.email?.toLowerCase() === partner.email.toLowerCase();
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#FFF0F3] border-[#F2C0CA]'
                    : 'bg-[#FAF5EC] border-[#EADFD5]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#7A223B] flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    {partner.role}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] bg-[#7A223B] text-white px-2 py-0.5 rounded-full font-semibold">
                      You are here
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-[#38272A] font-medium break-all">
                  {partner.email}
                </div>
                <div className="text-[11px] text-[#8C6D75] mt-1 font-literature italic">
                  {partner.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security Architecture & Rules Explanation */}
      <section className="bg-[#FFFDFB] border border-[#E8DCD2] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#F0E5DC]">
          <FileCode className="w-5 h-5 text-[#7A223B]" />
          <h3 className="font-serif-romantic text-xl font-bold text-[#4A1726]">
            Firestore Security Rules Audit
          </h3>
        </div>

        <p className="text-xs text-[#6B5157] leading-relaxed">
          Our security rules were audited and deployed directly to Cloud Firestore. Below is how the
          eight pillars of security protect every personal entry:
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#FAF5EC] border border-[#EADFD5] space-y-1">
            <strong className="text-[#4A1726] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              1. Master Allowlist & Verified Google Accounts
            </strong>
            <p className="text-[#6B5157]">
              Every database request evaluates <code className="bg-white/70 px-1 py-0.5 rounded text-[#7A223B]">request.auth.token.email_verified == true</code> and verifies that the email matches one of the two authorized partner emails.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF5EC] border border-[#EADFD5] space-y-1">
            <strong className="text-[#4A1726] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              2. Author-Only Edits & Deletions
            </strong>
            <p className="text-[#6B5157]">
              Both partners can read all shared entries in the shared story. However, only the partner who penned an entry (<code className="bg-white/70 px-1 py-0.5 rounded text-[#7A223B]">authorUid == request.auth.uid</code>) can edit or delete it.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF5EC] border border-[#EADFD5] space-y-1">
            <strong className="text-[#4A1726] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              3. Anti-Impersonation & Field Immutability
            </strong>
            <p className="text-[#6B5157]">
              The <code className="bg-white/70 px-1 py-0.5 rounded text-[#7A223B]">authorUid</code>, document ID, and <code className="bg-white/70 px-1 py-0.5 rounded text-[#7A223B]">createdAt</code> timestamp are strictly immutable. Neither partner can reassign author attribution.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF5EC] border border-[#EADFD5] space-y-1">
            <strong className="text-[#4A1726] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              4. Strict Key Whitelisting & Size Limits
            </strong>
            <p className="text-[#6B5157]">
              Every write validates <code className="bg-white/70 px-1 py-0.5 rounded text-[#7A223B]">data.keys().hasOnly(...)</code>, completely rejecting injected shadow fields or malformed document structures.
            </p>
          </div>
        </div>

        {/* How to configure Partner 2 */}
        <div className="mt-4 p-4 rounded-2xl bg-[#FFF8EE] border border-[#FAD7A0] text-xs space-y-2">
          <div className="flex items-center gap-2 text-[#B45309] font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Configuring Partner 2’s Google Account</span>
          </div>
          <p className="text-[#78350F] leading-relaxed">
            Partner 1 is active with <strong className="font-semibold">{AUTHORIZED_PARTNERS[0].email}</strong>. When your partner is ready to join, replace the placeholder <strong className="font-semibold">{AUTHORIZED_PARTNERS[1].email}</strong> in <code className="bg-white/80 px-1 py-0.5 rounded text-[#9A3412]">src/config/partners.ts</code> and update the match in <code className="bg-white/80 px-1 py-0.5 rounded text-[#9A3412]">firestore.rules</code>.
          </p>
        </div>
      </section>
    </div>
  );
};
