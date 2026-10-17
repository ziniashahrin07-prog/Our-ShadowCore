import React from 'react';
import {
  Heart,
  Lock,
  Sparkles,
  ShieldCheck,
  Feather,
  Users,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AUTHORIZED_PARTNERS } from '../config/partners';

export const WelcomePage: React.FC = () => {
  const { signInWithGoogle, loading, authError, user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between relative overflow-hidden">
      {/* Decorative Floral & Watercolor Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-[#F5D8DE]/60 to-[#FCEEE9]/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-gradient-to-bl from-[#E4BFC6]/40 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-gradient-to-tr from-[#FCEEE9]/50 to-transparent blur-3xl pointer-events-none" />

      {/* Main Sanctuary Card */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:py-20 flex flex-col items-center justify-center relative z-10 text-center">
        {/* Wax Seal / Emblem */}
        <div className="mb-6 relative group">
          <div className="w-24 h-24 rounded-full wax-seal flex items-center justify-center text-[#FFE4EC] shadow-xl ring-4 ring-[#FAF6F0] group-hover:scale-105 transition-transform duration-300">
            <Heart className="w-11 h-11 fill-[#FFE4EC]/90 text-transparent" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#EADFD5] border-2 border-[#FAF6F0] flex items-center justify-center text-[#7A223B]">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title & Tagline */}
        <h1 className="font-serif-romantic text-4xl sm:text-6xl font-bold tracking-tight text-[#4A1726] mb-3">
          Our ShadowCore
        </h1>
        <p className="font-script-calligraphy text-2xl sm:text-3xl text-[#9E3E56] mb-6">
          Two hearts, one story, a thousand little moments.
        </p>

        {/* Private Welcome Message */}
        <div className="max-w-2xl bg-[#FFFDFB] border border-[#E8DCD2] rounded-3xl p-6 sm:p-8 shadow-sm mb-8 text-[#5E474C] text-sm sm:text-base leading-relaxed">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#9E3E56] font-semibold mb-3">
            <Feather className="w-4 h-4" />
            <span>A Sanctuary Dedicated Solely To The Two Of Us</span>
            <Feather className="w-4 h-4" />
          </div>
          <p className="font-literature text-lg sm:text-xl text-[#3A2429] italic mb-3">
            “Within these private digital pages lives our unspoken affection, the everyday thoughts we
            whisper, our solemn promises, and the quiet milestones that belong to no one else in the world.”
          </p>
          <p className="text-xs text-[#8A6D74]">
            This private romantic journal is cryptographically sealed and strictly restricted to exactly
            two authorized partner accounts. Every personal memory, letter, and diary entry remains purely
            yours.
          </p>
        </div>

        {/* Sign In / Auth Handling */}
        {user ? (
          <div className="max-w-md w-full bg-[#FFF0F3] border border-[#F0CCD4] rounded-2xl p-6 shadow-xs text-center mb-6">
            <div className="w-10 h-10 rounded-full bg-[#9E3E56] text-white flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif-romantic text-lg font-bold text-[#541828] mb-1">
              Account Signed In
            </h3>
            <p className="text-xs text-[#6B4B52] mb-4">
              Signed in as <strong className="text-[#3A2429]">{user.email}</strong>.
            </p>
            <p className="text-xs text-[#8F374A] mb-4 bg-white/70 py-2 px-3 rounded-lg border border-[#F0CCD4]">
              This Google account is not in the private 2-partner allowlist. Cloud Firestore has secured
              all private records.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={signOut}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#7A223B] text-white hover:bg-[#5E1A2D] transition-colors"
              >
                Sign Out / Switch Account
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#7A223B] via-[#912944] to-[#6E1C32] text-[#FFF6F8] font-medium text-base shadow-md shadow-[#7A223B]/25 hover:shadow-lg hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.84h6.887C18.2 16.15 15.61 17.7 12.24 17.7c-3.71 0-6.72-3.01-6.72-6.72s3.01-6.72 6.72-6.72c1.7 0 3.24.64 4.43 1.7l2.67-2.67C17.65 2.1 15.12 1.25 12.24 1.25 6.3 1.25 1.5 6.05 1.5 12s4.8 10.75 10.74 10.75c6.23 0 10.36-4.38 10.36-10.55 0-.71-.07-1.39-.21-1.915H12.24z" />
              </svg>
              <span>{loading ? 'Opening Google Sign-In...' : 'Sign In with Google'}</span>
            </button>

            {authError && (
              <div className="w-full text-left bg-[#FFF0F3] border border-[#F2C0CA] text-[#7A223B] text-xs p-3.5 rounded-xl leading-relaxed">
                <strong className="block font-semibold mb-1">Authorization Notice:</strong>
                {authError}
              </div>
            )}
          </div>
        )}

        {/* Security & Two-Partner Allowlist Details */}
        <div className="mt-12 max-w-2xl w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="bg-[#FFFDFB]/80 border border-[#EBDCD0] rounded-2xl p-4.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-2">
              <Users className="w-4 h-4" />
              <span>Two-Partner Protection</span>
            </div>
            <p className="text-xs text-[#6B5157] leading-relaxed mb-3">
              Only the two designated Google accounts can read, compose, or interact with records.
            </p>
            <div className="space-y-1.5 text-[11px] font-mono text-[#4A2E35] bg-[#F7EFE9] p-2.5 rounded-lg border border-[#E4D1C6]">
              {AUTHORIZED_PARTNERS.map((partner, idx) => (
                <div key={idx} className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9E3E56] shrink-0" />
                  <span className="font-semibold">{partner.role}:</span>
                  <span className="truncate">{partner.email}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FFFDFB]/80 border border-[#EBDCD0] rounded-2xl p-4.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Trust Database Rules</span>
            </div>
            <p className="text-xs text-[#6B5157] leading-relaxed mb-2">
              Rules strictly validate verified Google tokens. Unauthenticated visits and unlisted Google
              accounts are rejected by Cloud Firestore at the database layer.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8C6D75]">
              <KeyRound className="w-3.5 h-3.5 text-[#9E3E56]" />
              <span>Author-only edits & delete permissions enforced.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[#EBDCD0] text-center text-xs text-[#8A6F75] font-literature relative z-10">
        Our ShadowCore • A Sacred Romantic Journal for Two
      </footer>
    </div>
  );
};
