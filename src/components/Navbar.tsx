import React, { useState } from 'react';
import {
  BookOpen,
  Mail,
  Camera,
  Compass,
  CalendarHeart,
  ShieldCheck,
  Menu,
  X,
  Heart,
  Sparkles,
} from 'lucide-react';
import { PageTab } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  hasUnsavedChanges: boolean;
  onAttemptNavigation: (targetTab: PageTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  hasUnsavedChanges,
  onAttemptNavigation,
}) => {
  const { user, partnerInfo } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: PageTab) => {
    if (hasUnsavedChanges && tab !== currentTab) {
      onAttemptNavigation(tab);
    } else {
      onSelectTab(tab);
      setMobileMenuOpen(false);
    }
  };

  const navItems: { tab: PageTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'diary', label: 'Daily Diary', icon: <BookOpen className="w-4 h-4" /> },
    { tab: 'letters', label: 'Letters to You', icon: <Mail className="w-4 h-4" /> },
    { tab: 'memories', label: 'Our Memories', icon: <Camera className="w-4 h-4" /> },
    { tab: 'dreams', label: 'Dreams & Promises', icon: <Compass className="w-4 h-4" /> },
    { tab: 'dates', label: 'Special Dates', icon: <CalendarHeart className="w-4 h-4" /> },
    { tab: 'privacy', label: 'Account & Privacy', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#EBDCD0] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Header */}
          <div
            onClick={() => handleTabClick('diary')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7A223B] to-[#591024] flex items-center justify-center text-[#F8E7ED] shadow-sm group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-romantic text-2xl font-bold tracking-tight text-[#541828]">
                  Our ShadowCore
                </span>
                <Sparkles className="w-4 h-4 text-[#D98A9D]" />
              </div>
              <p className="text-xs text-[#8A6F75] font-literature italic">
                Two hearts, one story, a thousand little moments
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => handleTabClick(item.tab)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#7A223B] text-[#FFF6F8] shadow-sm shadow-[#7A223B]/20'
                      : 'text-[#5E474C] hover:bg-[#F3E7DF] hover:text-[#38272A]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Partner Status Badge & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {user && (
              <div
                onClick={() => handleTabClick('privacy')}
                className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#F3E8E2] border border-[#E4D1C6] cursor-pointer hover:bg-[#EFE0D9] transition-colors"
                title={`Signed in as ${user.email}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Partner'}
                    className="w-6 h-6 rounded-full border border-[#D98A9D]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#7A223B] text-white flex items-center justify-center text-xs font-semibold">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'P'}
                  </div>
                )}
                <div className="text-left text-xs leading-tight">
                  <div className="font-medium text-[#4A2E35]">
                    {partnerInfo?.role || 'Partner'}
                  </div>
                  <div className="text-[10px] text-[#8C6D75] truncate max-w-[110px]">
                    {user.displayName || user.email}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#5E474C] hover:bg-[#F3E7DF]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#EBDCD0] bg-[#FAF6F0] px-4 pt-2 pb-6 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const active = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => handleTabClick(item.tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  active
                    ? 'bg-[#7A223B] text-[#FFF6F8]'
                    : 'text-[#5E474C] hover:bg-[#F3E7DF]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
