import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Sparkles,
  Heart,
  Plus,
  Save,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  Target,
  Flame,
} from 'lucide-react';
import { DreamPromise, DreamPromiseType, DreamPromiseStatus } from '../types';
import {
  subscribeDreamsPromises,
  createDreamPromise,
  updateDreamPromise,
  deleteDreamPromise,
} from '../services/dreamService';
import { useAuth } from '../context/AuthContext';

interface DreamsPromisesPageProps {
  onDirtyChange: (isDirty: boolean) => void;
}

export const DreamsPromisesPage: React.FC<DreamsPromisesPageProps> = ({ onDirtyChange }) => {
  const { user } = useAuth();

  const [items, setItems] = useState<DreamPromise[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter tab
  const [activeTab, setActiveTab] = useState<'all' | 'dream' | 'promise'>('all');

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<DreamPromiseType>('dream');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<DreamPromiseStatus>('envisioned');
  const [fulfilledDate, setFulfilledDate] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isDirty = useMemo(() => {
    return isAdding && (title.trim().length > 0 || description.trim().length > 0);
  }, [isAdding, title, description]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeDreamsPromises(
      (data) => {
        setItems(data);
        setLoading(false);
      },
      (err) => {
        console.error('Subscription error in dreams/promises:', err);
        setFetchError('Unable to load dreams & promises.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      setSaveErrorMsg('Please fill in both a title and description.');
      return;
    }

    setIsSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      if (editingId) {
        await updateDreamPromise(editingId, {
          type,
          title: title.trim(),
          description: description.trim(),
          targetDate,
          status,
          fulfilledDate: status === 'fulfilled' ? (fulfilledDate || new Date().toISOString().split('T')[0]) : '',
          authorName: user.displayName || user.email?.split('@')[0] || 'Partner',
        });
        setSaveSuccessMsg('Updated successfully.');
      } else {
        await createDreamPromise({
          type,
          title: title.trim(),
          description: description.trim(),
          targetDate,
          status,
          authorUid: user.uid,
          authorEmail: user.email || '',
          authorName: user.displayName || user.email?.split('@')[0] || 'Partner',
        });
        setSaveSuccessMsg(
          type === 'dream'
            ? 'New shared dream added to our horizon.'
            : 'Sacred promise sealed in our sanctuary.'
        );
      }

      resetForm();
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveErrorMsg(err?.message || 'Failed to save item.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setTargetDate('');
    setStatus('envisioned');
    setFulfilledDate('');
    setType('dream');
  };

  const startEdit = (item: DreamPromise) => {
    if (item.authorUid !== user?.uid) return;
    setEditingId(item.id);
    setType(item.type);
    setTitle(item.title);
    setDescription(item.description);
    setTargetDate(item.targetDate || '');
    setStatus(item.status);
    setFulfilledDate(item.fulfilledDate || '');
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFulfilled = async (item: DreamPromise) => {
    if (item.authorUid !== user?.uid) return;
    const nextStatus: DreamPromiseStatus = item.status === 'fulfilled' ? 'in_progress' : 'fulfilled';
    const nextDate = nextStatus === 'fulfilled' ? new Date().toISOString().split('T')[0] : '';

    try {
      await updateDreamPromise(item.id, {
        type: item.type,
        title: item.title,
        description: item.description,
        targetDate: item.targetDate || '',
        status: nextStatus,
        fulfilledDate: nextDate,
        authorName: item.authorName,
      });
    } catch (err: any) {
      console.error('Update status error:', err);
      alert('Unable to update status: ' + (err?.message || 'Permission denied'));
    }
  };

  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteDreamPromise(id);
      setDeletingId(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Delete failed: ' + (err?.message || 'Access denied'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items;
    return items.filter((item) => item.type === activeTab);
  }, [items, activeTab]);

  const dreamCount = useMemo(() => items.filter((i) => i.type === 'dream').length, [items]);
  const promiseCount = useMemo(() => items.filter((i) => i.type === 'promise').length, [items]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E7DF] text-[#7A223B] text-xs font-semibold tracking-wider uppercase">
          <Compass className="w-3.5 h-3.5" />
          <span>Visions & Vows</span>
        </div>
        <h1 className="font-serif-romantic text-3xl sm:text-4xl font-bold text-[#4A1726]">
          Our Dreams & Promises
        </h1>
        <p className="text-sm text-[#785E65] font-literature italic max-w-xl mx-auto">
          The adventures we yearn to seek side by side, and the sacred vows we keep to each other.
        </p>

        {!isAdding && (
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setType('dream');
                setIsAdding(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#7A223B] text-white text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-[#5E1A2D] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Plant a New Dream</span>
            </button>
            <button
              onClick={() => {
                setType('promise');
                setIsAdding(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#9E3E56] text-white text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-[#832F44] cursor-pointer"
            >
              <Heart className="w-4 h-4" />
              <span>Make a Solemn Promise</span>
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
                {type === 'dream' ? <Sparkles className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
              </div>
              <h2 className="font-serif-romantic text-xl font-bold text-[#4A1726]">
                {editingId
                  ? `Edit ${type === 'dream' ? 'Dream' : 'Promise'}`
                  : `Plant a New ${type === 'dream' ? 'Shared Dream' : 'Solemn Promise'}`}
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
                <div className="flex rounded-xl bg-[#FAF5EC] border border-[#D9C4BD] p-1">
                  <button
                    type="button"
                    onClick={() => setType('dream')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      type === 'dream' ? 'bg-[#7A223B] text-white shadow-xs' : 'text-[#5E474C]'
                    }`}
                  >
                    Shared Dream
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('promise')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      type === 'promise' ? 'bg-[#9E3E56] text-white shadow-xs' : 'text-[#5E474C]'
                    }`}
                  >
                    Promise
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                  Current Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DreamPromiseStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
                >
                  <option value="envisioned">Envisioned / Awaiting</option>
                  <option value="in_progress">In Progress / Nurturing</option>
                  <option value="fulfilled">Fulfilled / Accomplished</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                  Target Timeline / Date (Optional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                {type === 'dream' ? 'Dream Title' : 'Promise Title'}
              </label>
              <input
                type="text"
                placeholder={
                  type === 'dream'
                    ? 'e.g. Build our greenhouse in the countryside, Watch the Northern Lights'
                    : 'e.g. Always listen without anger, Hold your hand through storms'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                What this means to us (Description)
              </label>
              <textarea
                rows={5}
                placeholder="Describe this vision or pledge in your own words..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
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
                disabled={isSaving || !title.trim() || !description.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#7A223B] text-white text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-[#5E1A2D] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Preserving...' : editingId ? 'Update' : 'Plant into Our Story'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tabs */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBDCD0] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#7A223B] text-white shadow-xs'
                  : 'text-[#6B5157] hover:bg-[#F3E7DF]'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('dream')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dream'
                  ? 'bg-[#7A223B] text-white shadow-xs'
                  : 'text-[#6B5157] hover:bg-[#F3E7DF]'
              }`}
            >
              Dreams ({dreamCount})
            </button>
            <button
              onClick={() => setActiveTab('promise')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'promise'
                  ? 'bg-[#7A223B] text-white shadow-xs'
                  : 'text-[#6B5157] hover:bg-[#F3E7DF]'
              }`}
            >
              Promises ({promiseCount})
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="bg-[#FFFDFB] border border-[#E8DCD2] rounded-3xl p-12 text-center text-sm text-[#8C6D75]">
            <div className="w-8 h-8 rounded-full border-2 border-[#7A223B] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="font-literature italic">Reading visions & vows...</p>
          </div>
        ) : fetchError ? (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-6 text-center text-xs text-[#991B1B]">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">{fetchError}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* MANDATORY EMPTY STATE: No dummy items */
          <div className="bg-[#FFFDFB] border border-dashed border-[#D9C4BD] rounded-3xl p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#FAF5EC] border border-[#EADFD5] text-[#9E3E56] flex items-center justify-center mx-auto shadow-xs">
              <Compass className="w-7 h-7 text-[#9E3E56]" />
            </div>
            <h3 className="font-serif-romantic text-2xl font-bold text-[#4A1726]">
              No dreams or promises penned yet
            </h3>
            <p className="text-sm text-[#785E65] font-literature italic max-w-md mx-auto">
              Share a vision for tomorrow or a solemn vow for always. Plant your first shared dream or
              promise using the buttons above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredItems.map((item) => {
              const isAuthor = item.authorUid === user?.uid;
              const isPromise = item.type === 'promise';

              return (
                <div
                  key={item.id}
                  className="bg-[#FFFDFB] border border-[#E8DCD2] hover:border-[#D4BDB4] rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Header: Type and Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          isPromise
                            ? 'bg-[#FBE9ED] text-[#9E3E56] border border-[#F2C0CA]'
                            : 'bg-[#FAF1DC] text-[#946200] border border-[#E8D09E]'
                        }`}
                      >
                        {isPromise ? <Heart className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                        {isPromise ? 'Sacred Promise' : 'Shared Dream'}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full capitalize ${
                          item.status === 'fulfilled'
                            ? 'bg-[#DCFCE7] text-[#166534]'
                            : item.status === 'in_progress'
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-[#F3E8E2] text-[#6B5157]'
                        }`}
                      >
                        {item.status === 'fulfilled'
                          ? 'Fulfilled'
                          : item.status === 'in_progress'
                          ? 'In Progress'
                          : 'Envisioned'}
                      </span>
                    </div>

                    <h4 className="font-serif-romantic text-xl font-bold text-[#38272A] mb-2">
                      {item.title}
                    </h4>

                    <p className="font-literature text-sm text-[#5E474C] leading-relaxed whitespace-pre-wrap mb-4">
                      {item.description}
                    </p>

                    {item.targetDate && (
                      <div className="flex items-center gap-1.5 text-xs text-[#8C6D75] mb-2">
                        <Calendar className="w-3.5 h-3.5 text-[#9E3E56]" />
                        <span>Target: {item.targetDate}</span>
                      </div>
                    )}

                    {item.status === 'fulfilled' && item.fulfilledDate && (
                      <div className="flex items-center gap-1.5 text-xs text-[#166534] bg-[#F0FDF4] p-2 rounded-xl mb-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
                        <span>Fulfilled on {item.fulfilledDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Footer */}
                  <div className="pt-4 border-t border-[#F5EBE4] flex items-center justify-between text-xs">
                    <span className="text-[#8C6D75]">
                      By {isAuthor ? 'You' : item.authorName}
                    </span>

                    {isAuthor && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFulfilled(item)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            item.status === 'fulfilled'
                              ? 'bg-[#F3E8E2] text-[#6B5157] hover:bg-[#EBDCD0]'
                              : 'bg-[#DCFCE7] text-[#166534] hover:bg-[#BBF7D0]'
                          }`}
                        >
                          {item.status === 'fulfilled' ? 'Mark Ongoing' : 'Mark Fulfilled'}
                        </button>
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1 rounded-lg text-[#6B5157] hover:bg-[#F3E7DF]"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1 rounded-lg text-[#991B1B] hover:bg-[#FEE2E2]"
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
              Remove Item?
            </h3>
            <p className="text-xs text-center text-[#6B5157] mb-6 font-literature">
              Are you sure you want to delete this dream or promise from your shared story?
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-[#D9C4BD] text-xs font-semibold text-[#54383E]"
              >
                Keep
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
