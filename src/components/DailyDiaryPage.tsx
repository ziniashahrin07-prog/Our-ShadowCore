import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  BookOpen,
  Search,
  Plus,
  Save,
  Edit3,
  Trash2,
  Heart,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react';
import { DiaryEntry } from '../types';
import {
  subscribeDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from '../services/diaryService';
import { useAuth } from '../context/AuthContext';

interface DailyDiaryPageProps {
  onDirtyChange: (isDirty: boolean) => void;
}

export const DailyDiaryPage: React.FC<DailyDiaryPageProps> = ({ onDirtyChange }) => {
  const { user } = useAuth();

  // Firestore Realtime Data
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [authorFilter, setAuthorFilter] = useState<'all' | 'mine' | 'partner'>('all');

  // Deletion prompt
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Track if form has unsaved edits
  const isDirty = useMemo(() => {
    return title.trim().length > 0 || text.trim().length > 0;
  }, [title, text]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // Subscribe to Firestore entries
  useEffect(() => {
    setLoading(true);
    setFetchError(null);

    const unsubscribe = subscribeDiaryEntries(
      (data) => {
        setEntries(data);
        setLoading(false);
      },
      (err) => {
        console.error('Subscription error in diary:', err);
        setFetchError('Unable to load entries. Firestore rules or network issue.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle Form Submission
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !text.trim() || !entryDate) {
      setSaveErrorMsg('Please provide a date, title, and journal text.');
      return;
    }

    setIsSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      if (editingId) {
        await updateDiaryEntry(editingId, {
          title: title.trim(),
          date: entryDate,
          text: text, // Verbatim user-written text
          authorName: user.displayName || 'Partner',
        });
        setSaveSuccessMsg('Diary entry updated successfully.');
        setEditingId(null);
      } else {
        await createDiaryEntry({
          title: title.trim(),
          date: entryDate,
          text: text, // Exact user-written text without alterations
          authorUid: user.uid,
          authorEmail: user.email || '',
          authorName: user.displayName || user.email?.split('@')[0] || 'Partner',
        });
        setSaveSuccessMsg('Your entry has been immortalized in the shared diary.');
      }

      // Reset Form
      setTitle('');
      setText('');
      setEntryDate(new Date().toISOString().split('T')[0]);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveErrorMsg(err?.message || 'Failed to save entry to Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (entry: DiaryEntry) => {
    if (entry.authorUid !== user?.uid) return;
    setEditingId(entry.id);
    setTitle(entry.title);
    setText(entry.text);
    setEntryDate(entry.date);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setText('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setSaveErrorMsg(null);
  };

  const confirmDelete = async (id: string) => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await deleteDiaryEntry(id);
      setDeletingId(null);
      if (editingId === id) {
        cancelEdit();
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Failed to delete entry: ' + (err?.message || 'Permission denied'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered & Searched Timeline Entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesText = entry.text.toLowerCase().includes(q);
        const matchesAuthor = entry.authorName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesText && !matchesAuthor) return false;
      }

      // Month filter
      if (selectedMonthFilter !== 'all') {
        if (!entry.date.startsWith(selectedMonthFilter)) return false;
      }

      // Author filter
      if (authorFilter === 'mine' && entry.authorUid !== user?.uid) return false;
      if (authorFilter === 'partner' && entry.authorUid === user?.uid) return false;

      return true;
    });
  }, [entries, searchQuery, selectedMonthFilter, authorFilter, user?.uid]);

  // Extract unique months for filter dropdown
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(set).sort().reverse();
  }, [entries]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E7DF] text-[#7A223B] text-xs font-semibold tracking-wider uppercase">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Sacred Chronicles</span>
        </div>
        <h1 className="font-serif-romantic text-3xl sm:text-4xl font-bold text-[#4A1726]">
          Our Daily Diary
        </h1>
        <p className="text-sm text-[#785E65] font-literature italic max-w-xl mx-auto">
          Every thought, reflection, and tender moment written together, preserved forever in our shared
          record.
        </p>
      </div>

      {/* Diary Entry Compose/Edit Canvas */}
      <section className="bg-[#FFFDFB] border border-[#E8DCD2] rounded-3xl p-6 sm:p-8 shadow-xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#F0E5DC] gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#7A223B]/10 text-[#7A223B] flex items-center justify-center">
              {editingId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-serif-romantic text-lg font-bold text-[#4A1726]">
                {editingId ? 'Edit Diary Entry' : 'Pen Today’s Thoughts'}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-[#8A6F75]">
                <UserCheck className="w-3.5 h-3.5 text-[#9E3E56]" />
                <span>
                  Author: <strong className="text-[#4A2E35]">{user?.displayName || user?.email}</strong>
                </span>
              </div>
            </div>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-1.5 text-xs text-[#8A6F75] hover:text-[#4A1726] bg-[#F5EBE4] px-3 py-1.5 rounded-lg transition-colors self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel Edit</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        {saveSuccessMsg && (
          <div className="mb-6 flex items-center gap-2 p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
        {saveErrorMsg && (
          <div className="mb-6 flex items-center gap-2 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
        )}

        {/* Entry Form */}
        <form onSubmit={handleSaveEntry} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Date Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                Entry Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:ring-2 focus:ring-[#9E3E56]/30 focus:border-[#9E3E56]"
                />
              </div>
            </div>

            {/* Title Field */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                Entry Title
              </label>
              <input
                type="text"
                placeholder="Give this memory or day a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] placeholder-[#9E8B8F] focus:outline-none focus:ring-2 focus:ring-[#9E3E56]/30 focus:border-[#9E3E56]"
              />
            </div>
          </div>

          {/* Large Text Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#7A223B]">
                Your Story (Verbatim Journal Text)
              </label>
              <span className="text-[11px] text-[#8C6D75]">
                {text.length} characters • {text.trim() ? text.trim().split(/\s+/).length : 0} words
              </span>
            </div>
            <textarea
              rows={9}
              placeholder="What happened today? What made you smile, think of us, or feel grateful? Write freely..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              className="w-full p-4 rounded-2xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm sm:text-base text-[#38272A] placeholder-[#9E8B8F] focus:outline-none focus:ring-2 focus:ring-[#9E3E56]/30 focus:border-[#9E3E56] font-literature leading-relaxed"
            />
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-[#8A6F75] font-literature italic">
              * Exact words are saved directly to Cloud Firestore. Only the author can modify or delete this entry.
            </p>
            <button
              type="submit"
              disabled={isSaving || !title.trim() || !text.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7A223B] text-white text-xs font-semibold uppercase tracking-wider shadow-sm shadow-[#7A223B]/25 hover:bg-[#5E1A2D] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Preserving...' : editingId ? 'Update Entry' : 'Save Entry'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Timeline Controls: Search & Filters */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#7A223B]" />
            <h2 className="font-serif-romantic text-2xl font-bold text-[#4A1726]">
              Chronological Timeline
            </h2>
            <span className="text-xs bg-[#F3E7DF] text-[#7A223B] font-semibold px-2.5 py-0.5 rounded-full">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-[#9E8B8F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#D9C4BD] bg-[#FFFDFB] text-[#38272A] focus:outline-none focus:ring-1 focus:ring-[#9E3E56]"
              />
            </div>

            {/* Month Filter */}
            {availableMonths.length > 0 && (
              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-[#D9C4BD] bg-[#FFFDFB] text-[#4A2E35] focus:outline-none"
              >
                <option value="all">All Months</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}

            {/* Author Filter */}
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-[#D9C4BD] bg-[#FFFDFB] text-[#4A2E35] focus:outline-none"
            >
              <option value="all">All Authors</option>
              <option value="mine">My Entries</option>
              <option value="partner">Partner’s Entries</option>
            </select>
          </div>
        </div>

        {/* Timeline List or Empty State */}
        {loading ? (
          <div className="bg-[#FFFDFB] border border-[#E8DCD2] rounded-3xl p-12 text-center text-sm text-[#8C6D75]">
            <div className="w-8 h-8 rounded-full border-2 border-[#7A223B] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="font-literature italic">Opening the shared diary...</p>
          </div>
        ) : fetchError ? (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-6 text-center text-xs text-[#991B1B]">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-[#991B1B]" />
            <p className="font-semibold">{fetchError}</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          /* MANDATORY EMPTY STATE: No dummy entries, exact required empty state */
          <div className="bg-[#FFFDFB] border border-dashed border-[#D9C4BD] rounded-3xl p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#FAF5EC] border border-[#EADFD5] text-[#9E3E56] flex items-center justify-center mx-auto shadow-xs">
              <Heart className="w-7 h-7 text-[#9E3E56]" />
            </div>
            <h3 className="font-serif-romantic text-2xl font-bold text-[#4A1726]">
              Your story begins here
            </h3>
            <p className="text-sm text-[#785E65] font-literature italic max-w-md mx-auto">
              This diary starts completely empty, waiting for the authentic words and cherished days that
              the two of you will share. Use the editor above to record your first entry.
            </p>
          </div>
        ) : (
          <div className="relative pl-4 sm:pl-8 border-l-2 border-[#E8DCD2] space-y-6 my-4">
            {filteredEntries.map((entry) => {
              const isAuthor = entry.authorUid === user?.uid;
              const formattedDate = new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div key={entry.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[21px] sm:-left-[37px] top-6 w-3 h-3 rounded-full bg-[#7A223B] ring-4 ring-[#FAF6F0]" />

                  {/* Entry Card */}
                  <div className="bg-[#FFFDFB] border border-[#E8DCD2] hover:border-[#D4BDB4] rounded-2xl p-6 shadow-xs transition-all">
                    {/* Entry Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#F2E7DF] gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#8C6D75] mb-1">
                          <Calendar className="w-3.5 h-3.5 text-[#9E3E56]" />
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span
                            className={`font-medium ${
                              isAuthor ? 'text-[#7A223B]' : 'text-[#4A2E35]'
                            }`}
                          >
                            {isAuthor ? 'You' : entry.authorName}
                          </span>
                        </div>
                        <h4 className="font-serif-romantic text-xl font-bold text-[#38272A]">
                          {entry.title}
                        </h4>
                      </div>

                      {/* Author Edit / Delete Controls */}
                      {isAuthor && (
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => startEdit(entry)}
                            className="p-1.5 rounded-lg text-[#6B5157] hover:text-[#7A223B] hover:bg-[#F3E7DF] transition-colors"
                            title="Edit this entry"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(entry.id)}
                            className="p-1.5 rounded-lg text-[#6B5157] hover:text-[#991B1B] hover:bg-[#FEE2E2] transition-colors"
                            title="Delete this entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Verbatim Journal Text Body */}
                    <div className="text-sm sm:text-base text-[#38272A] font-literature leading-relaxed whitespace-pre-wrap">
                      {entry.text}
                    </div>

                    {/* Footer Metadata */}
                    <div className="mt-4 pt-3 border-t border-[#F7EFE9] flex items-center justify-between text-[11px] text-[#A38A90]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Saved to shared database</span>
                      </div>
                      <span className="font-mono text-[10px]">ID: {entry.id.substring(0, 16)}...</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231518]/50 backdrop-blur-xs">
          <div className="max-w-md w-full bg-[#FFFDFB] rounded-3xl p-6 border border-[#E8DCD2] shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#991B1B] flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-serif-romantic text-lg font-bold text-center text-[#4A1726] mb-2">
              Delete Diary Entry?
            </h3>
            <p className="text-xs text-center text-[#6B5157] leading-relaxed mb-6 font-literature">
              Are you sure you want to remove this entry from your shared story? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-[#D9C4BD] text-xs font-semibold text-[#54383E] hover:bg-[#F5ECE5]"
              >
                Keep Entry
              </button>
              <button
                disabled={isDeleting}
                onClick={() => confirmDelete(deletingId)}
                className="px-4 py-2 rounded-xl bg-[#991B1B] text-xs font-semibold text-white hover:bg-[#7F1D1D]"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
