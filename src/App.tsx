import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { WelcomePage } from './components/WelcomePage';
import { DailyDiaryPage } from './components/DailyDiaryPage';
import { LettersPage } from './components/LettersPage';
import { MemoriesPage } from './components/MemoriesPage';
import { DreamsPromisesPage } from './components/DreamsPromisesPage';
import { SpecialDatesPage } from './components/SpecialDatesPage';
import { AccountPrivacyPage } from './components/AccountPrivacyPage';
import { UnsavedChangesModal } from './components/UnsavedChangesModal';
import { PageTab } from './types';
import { Heart, Lock, LogOut, ShieldAlert } from 'lucide-react';
import { AUTHORIZED_PARTNERS } from './config/partners';

function MainApp() {
  const { user, loading, isAuthorized, signOut } = useAuth();
  const [currentTab, setCurrentTab] = useState<PageTab>('diary');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingTab, setPendingTab] = useState<PageTab | null>(null);

  // If initial auth state is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full wax-seal flex items-center justify-center text-[#FFE4EC] animate-pulse">
          <Heart className="w-8 h-8 fill-current" />
        </div>
        <p className="font-serif-romantic text-lg text-[#541828]">Opening Our ShadowCore...</p>
      </div>
    );
  }

  // If user is not authenticated, show Welcome Page
  if (!user) {
    return <WelcomePage />;
  }

  // If user is signed in with a Google account NOT in the allowlist
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between p-4 sm:p-8">
        <div className="max-w-xl mx-auto my-auto w-full bg-[#FFFDFB] rounded-3xl p-8 border border-[#E8DCD2] shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#FFF0F3] border border-[#F2C0CA] text-[#9E3E56] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif-romantic text-2xl font-bold text-[#4A1726]">
              Access Restricted
            </h2>
            <p className="font-script-calligraphy text-2xl text-[#9E3E56]">
              Our ShadowCore is a Private Sanctuary
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#F2C8D2] text-xs text-[#5E3840] leading-relaxed text-left space-y-2">
            <p>
              Signed in as: <strong className="font-mono text-[#38272A]">{user.email}</strong>
            </p>
            <p>
              This romantic diary is strictly private and shared exclusively between two approved partner
              Google accounts. All private records are protected at the database level by Cloud Firestore
              security rules.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={signOut}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#7A223B] text-white text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-[#5E1A2D] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out / Switch to Authorized Account</span>
            </button>
          </div>
        </div>

        <footer className="text-center text-xs text-[#8A6F75] font-literature py-4">
          Our ShadowCore • Two Hearts, One Story
        </footer>
      </div>
    );
  }

  // Navigation handlers with unsaved changes safety
  const handleAttemptNavigation = (target: PageTab) => {
    if (hasUnsavedChanges && target !== currentTab) {
      setPendingTab(target);
    } else {
      setCurrentTab(target);
    }
  };

  const confirmDiscardAndNavigate = () => {
    if (pendingTab) {
      setHasUnsavedChanges(false);
      setCurrentTab(pendingTab);
      setPendingTab(null);
    }
  };

  const cancelDiscard = () => {
    setPendingTab(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between text-[#38272A]">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hasUnsavedChanges={hasUnsavedChanges}
        onAttemptNavigation={handleAttemptNavigation}
      />

      <main className="flex-1 pb-16">
        {currentTab === 'diary' && (
          <DailyDiaryPage onDirtyChange={setHasUnsavedChanges} />
        )}
        {currentTab === 'letters' && (
          <LettersPage onDirtyChange={setHasUnsavedChanges} />
        )}
        {currentTab === 'memories' && (
          <MemoriesPage onDirtyChange={setHasUnsavedChanges} />
        )}
        {currentTab === 'dreams' && (
          <DreamsPromisesPage onDirtyChange={setHasUnsavedChanges} />
        )}
        {currentTab === 'dates' && (
          <SpecialDatesPage onDirtyChange={setHasUnsavedChanges} />
        )}
        {currentTab === 'privacy' && <AccountPrivacyPage />}
      </main>

      {/* Unsaved changes confirmation dialog */}
      <UnsavedChangesModal
        isOpen={pendingTab !== null}
        onConfirm={confirmDiscardAndNavigate}
        onCancel={cancelDiscard}
      />

      {/* Persistent Sanctuary Footer */}
      <footer className="border-t border-[#EBDCD0] bg-[#FAF6F0] py-6 text-center text-xs text-[#8A6F75] font-literature">
        <div className="flex items-center justify-center gap-1.5 mb-1 text-[#7A223B]">
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span className="font-serif-romantic font-semibold">Our ShadowCore</span>
          <Heart className="w-3.5 h-3.5 fill-current" />
        </div>
        <p className="italic">A private romantic diary shared by exactly two partners.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
