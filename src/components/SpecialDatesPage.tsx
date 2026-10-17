import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarHeart,
  Calendar,
  Gift,
  Heart,
  Plus,
  Save,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Repeat,
  X,
} from 'lucide-react';
import { SpecialDate, SpecialDateCategory } from '../types';
import {
  subscribeSpecialDates,
  createSpecialDate,
  updateSpecialDate,
  deleteSpecialDate,
} from '../services/dateService';
import { useAuth } from '../context/AuthContext';

interface SpecialDatesPageProps {
  onDirtyChange: (isDirty: boolean) => void;
}

export const SpecialDatesPage: React.FC<SpecialDatesPageProps> = ({ onDirtyChange }) => {
  const { user } = useAuth();

  const [dates, setDates] = useState<SpecialDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SpecialDateCategory>('anniversary');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isRecurringAnnually, setIsRecurringAnnually] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Deletion
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isDirty = useMemo(() => {
    return isAdding && title.trim().length > 0;
  }, [isAdding, title]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeSpecialDates(
      (data) => {
        setDates(data);
        setLoading(false);
      },
      (err) => {
        console.error('Subscription error in special dates:', err);
        setFetchError('Unable to load special dates.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !eventDate) {
      setSaveErrorMsg('Please provide a title and event date.');
      return;
    }

    setIsSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      if (editingId) {
        await updateSpecialDate(editingId, {
          title: title.trim(),
          category,
          eventDate,
          notes: notes.trim(),
          isRecurringAnnually,
          authorName: user.displayName || user.email?.split('@')[0] || 'Partner',
        });
        setSaveSuccessMsg('Special date updated successfully.');
      } else {
        await createSpecialDate({
          title: title.trim(),
          category,
          eventDate,
          notes: notes.trim(),
          isRecurringAnnually,
          authorUid: user.uid,
          authorEmail: user.email || '',
          authorName: user.displayName || user.email?.split('@')[0] || 'Partner',
        });
        setSaveSuccessMsg('Special date recorded in our calendar.');
      }

      resetForm();
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Save error in special dates:', err);
      setSaveErrorMsg(err?.message || 'Failed to save special date.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setTitle('');
    setCategory('anniversary');
    setNotes('');
    setIsRecurringAnnually(true);
    setEventDate(new Date().toISOString().split('T')[0]);
  };

  const startEdit = (item: SpecialDate) => {
    if (item.authorUid !== user?.uid) return;
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setEventDate(item.eventDate);
    setNotes(item.notes || '');
    setIsRecurringAnnually(item.isRecurringAnnually);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteSpecialDate(id);
      setDeletingId(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Delete failed: ' + (err?.message || 'Access denied'));
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Calculates days since original date and days until next recurrence
   */
  const calculateDateMetrics = (dateStr: string, isRecurring: boolean) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dateStr.split('-').map(Number);
    const originalDate = new Date(year, month - 1, day);
    originalDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - originalDate.getTime();
    const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Next recurrence
    let daysUntilNext = 0;
    if (isRecurring) {
      let nextOccurrence = new Date(today.getFullYear(), month - 1, day);
      if (nextOccurrence < today) {
        nextOccurrence = new Date(today.getFullYear() + 1, month - 1, day);
      }
      const timeToNext = nextOccurrence.getTime() - today.getTime();
      daysUntilNext = Math.round(timeToNext / (1000 * 60 * 60 * 24));
    } else {
      if (originalDate >= today) {
        daysUntilNext = Math.round((originalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        daysUntilNext = -1; // Passed non-recurring
      }
    }

    return { daysSince, daysUntilNext };
  };

  const getCategoryBadge = (cat: SpecialDateCategory) => {
    switch (cat) {
      case 'anniversary':
        return { label: 'Anniversary', icon: <Heart className="w-3.5 h-3.5" />, color: 'bg-[#FFE2E8] text-[#9E2A44] border-[#F5B8C6]' };
      case 'birthday':
        return { label: 'Birthday', icon: <Gift className="w-3.5 h-3.5" />, color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' };
      case 'first_date':
        return { label: 'First Date / First Kiss', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]' };
      case 'milestone':
        return { label: 'Milestone', icon: <CalendarHeart className="w-3.5 h-3.5" />, color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]' };
      default:
        return { label: 'Special Occasion', icon: <Calendar className="w-3.5 h-3.5" />, color: 'bg-[#F3E8E2] text-[#6B5157] border-[#E4D1C6]' };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E7DF] text-[#7A223B] text-xs font-semibold tracking-wider uppercase">
          <CalendarHeart className="w-3.5 h-3.5" />
          <span>Milestones & Anniversaries</span>
        </div>
        <h1 className="font-serif-romantic text-3xl sm:text-4xl font-bold text-[#4A1726]">
          Our Special Dates
        </h1>
        <p className="text-sm text-[#785E65] font-literature italic max-w-xl mx-auto">
          The anniversaries, birthdays, and sacred moments on the calendar that mark the rhythm of our
          lives together.
        </p>

        {!isAdding && (
          <div className="pt-2">
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#7A223B] text-white text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-[#5E1A2D] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record a Special Date</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}
      {saveErrorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* Add / Edit Form */}
      {isAdding && (
        <section className="bg-[#FFFDFB] border border-[#E8DCD2] rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#F0E5DC]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#7A223B]/10 text-[#7A223B] flex items-center justify-center">
                <CalendarHeart className="w-5 h-5" />
              </div>
              <h2 className="font-serif-romantic text-xl font-bold text-[#4A1726]">
                {editingId ? 'Edit Special Date' : 'Mark a Sacred Date'}
              </h2>
            </div>
            <button onClick={resetForm} className="p-1.5 rounded-lg text-[#8C6D75] hover:bg-[#F3E7DF]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SpecialDateCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
                >
                  <option value="anniversary">Anniversary</option>
                  <option value="birthday">Birthday</option>
                  <option value="first_date">First Date / First Kiss</option>
                  <option value="milestone">Milestone / Life Event</option>
                  <option value="other">Other Special Date</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                  Occasion Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-xs text-[#54383E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurringAnnually}
                    onChange={(e) => setIsRecurringAnnually(e.target.checked)}
                    className="rounded border-[#D9C4BD] text-[#7A223B] focus:ring-[#9E3E56]"
                  />
                  <span className="font-medium flex items-center gap-1">
                    <Repeat className="w-3.5 h-3.5 text-[#9E3E56]" />
                    Celebrates Every Year
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                Occasion Title
              </label>
              <input
                type="text"
                placeholder="e.g. Our First Date, Partner's Birthday, The Day We Said Yes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                Sweet Notes & Meaning (Optional)
              </label>
              <textarea
                rows={4}
                placeholder="How did we celebrate? What does this day mean to our hearts?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-4 rounded-2xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] font-literature leading-relaxed focus:outline-none focus:border-[#9E3E56]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl border border-[#D9C4BD] text-xs font-semibold text-[#54383E] hover:bg-[#F5ECE5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !title.trim() || !eventDate}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#7A223B] text-white text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-[#5E1A2D] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Preserving...' : editingId ? 'Update Date' : 'Save Date'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Dates Grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#7A223B]" />
          <h2 className="font-serif-romantic text-2xl font-bold text-[#4A1726]">
            Our Cherished Calendar
          </h2>
          <span className="text-xs bg-[#F3E7DF] text-[#7A223B] font-semibold px-2.5 py-0.5 rounded-full">
            {dates.length} {dates.length === 1 ? 'date' : 'dates'}
          </span>
        </div>

        {loading ? (
          <div className="bg-[#FFFDFB] border border-[#E8DCD2] rounded-3xl p-12 text-center text-sm text-[#8C6D75]">
            <div className="w-8 h-8 rounded-full border-2 border-[#7A223B] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="font-literature italic">Gathering milestones...</p>
          </div>
        ) : fetchError ? (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-6 text-center text-xs text-[#991B1B]">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">{fetchError}</p>
          </div>
        ) : dates.length === 0 ? (
          /* MANDATORY EMPTY STATE: No dummy dates */
          <div className="bg-[#FFFDFB] border border-dashed border-[#D9C4BD] rounded-3xl p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#FAF5EC] border border-[#EADFD5] text-[#9E3E56] flex items-center justify-center mx-auto shadow-xs">
              <CalendarHeart className="w-7 h-7 text-[#9E3E56]" />
            </div>
            <h3 className="font-serif-romantic text-2xl font-bold text-[#4A1726]">
              No special dates recorded yet
            </h3>
            <p className="text-sm text-[#785E65] font-literature italic max-w-md mx-auto">
              Mark the days that changed your lives forever. Add anniversaries, birthdays, and
              unforgettable firsts using the button above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {dates.map((item) => {
              const isAuthor = item.authorUid === user?.uid;
              const badge = getCategoryBadge(item.category);
              const { daysSince, daysUntilNext } = calculateDateMetrics(
                item.eventDate,
                item.isRecurringAnnually
              );

              return (
                <div
                  key={item.id}
                  className="bg-[#FFFDFB] border border-[#E8DCD2] hover:border-[#D4BDB4] rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Badge & Recurrence */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badge.color}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      {item.isRecurringAnnually && (
                        <span className="flex items-center gap-1 text-[11px] text-[#7A223B] bg-[#FAF5EC] px-2 py-0.5 rounded-full font-medium">
                          <Repeat className="w-3 h-3" /> Every Year
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif-romantic text-2xl font-bold text-[#38272A] mb-1">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-[#8C6D75] font-mono mb-4">
                      <Calendar className="w-3.5 h-3.5 text-[#9E3E56]" />
                      <span>{item.eventDate}</span>
                    </div>

                    {/* Romantic Days Counter Card */}
                    <div className="bg-[#FAF5EC] border border-[#EBDCD0] rounded-2xl p-4 mb-4 grid grid-cols-2 divide-x divide-[#E8DCD2] text-center">
                      <div className="px-2">
                        <span className="block text-[11px] uppercase tracking-wider text-[#8A6F75] font-semibold">
                          {daysSince >= 0 ? 'Days of Loving' : 'Days Until'}
                        </span>
                        <span className="font-serif-romantic text-2xl font-bold text-[#7A223B]">
                          {Math.abs(daysSince)}
                        </span>
                        <span className="block text-[10px] text-[#8C6D75] font-literature italic">
                          {daysSince >= 0 ? 'since this date' : 'remaining'}
                        </span>
                      </div>

                      <div className="px-2">
                        <span className="block text-[11px] uppercase tracking-wider text-[#8A6F75] font-semibold">
                          {item.isRecurringAnnually ? 'Next Celebration' : 'Countdown'}
                        </span>
                        <span className="font-serif-romantic text-2xl font-bold text-[#9E3E56]">
                          {daysUntilNext === 0
                            ? 'Today! 🎉'
                            : daysUntilNext > 0
                            ? `${daysUntilNext}d`
                            : 'Passed'}
                        </span>
                        <span className="block text-[10px] text-[#8C6D75] font-literature italic">
                          {daysUntilNext === 0
                            ? 'Happy celebration!'
                            : daysUntilNext > 0
                            ? 'days left'
                            : 'in history'}
                        </span>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="font-literature text-sm text-[#5E474C] leading-relaxed whitespace-pre-wrap mb-2">
                        “{item.notes}”
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-[#F5EBE4] flex items-center justify-between text-xs">
                    <span className="text-[#8C6D75]">
                      Recorded by {isAuthor ? 'You' : item.authorName}
                    </span>

                    {isAuthor && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 rounded-lg text-[#6B5157] hover:bg-[#F3E7DF]"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 rounded-lg text-[#991B1B] hover:bg-[#FEE2E2]"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231518]/50 backdrop-blur-xs">
          <div className="max-w-md w-full bg-[#FFFDFB] rounded-3xl p-6 border border-[#E8DCD2] shadow-2xl">
            <h3 className="font-serif-romantic text-lg font-bold text-center text-[#4A1726] mb-2">
              Remove Special Date?
            </h3>
            <p className="text-xs text-center text-[#6B5157] mb-6 font-literature">
              Are you sure you want to delete this special date from your shared calendar?
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-[#D9C4BD] text-xs font-semibold text-[#54383E]"
              >
                Keep Date
              </button>
              <button
                disabled={isDeleting}
                onClick={() => confirmDelete(deletingId)}
                className="px-4 py-2 rounded-xl bg-[#991B1B] text-xs font-semibold text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
