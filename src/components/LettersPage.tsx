import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Feather,
  Plus,
  Send,
  Edit3,
  Trash2,
  Calendar,
  Lock,
  Unlock,
  Heart,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
} from 'lucide-react';
import { Letter, PaperStyle } from '../types';
import {
  subscribeLetters,
  createLetter,
  updateLetter,
  deleteLetter,
} from '../services/letterService';
import { useAuth } from '../context/AuthContext';

interface LettersPageProps {
  onDirtyChange: (isDirty: boolean) => void;
}

export const LettersPage: React.FC<LettersPageProps> = ({ onDirtyChange }) => {
  const { user } = useAuth();

  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Compose / Edit state
  const [isComposing, setIsComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [letterDate, setLetterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>('parchment');
  const [isSealed, setIsSealed] = useState(true);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Viewing detail letter
  const [viewingLetter, setViewingLetter] = useState<Letter | null>(null);
  const [unsealedLetters, setUnsealedLetters] = useState<Record<string, boolean>>({});

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isDirty = useMemo(() => {
    return isComposing && (title.trim().length > 0 || content.trim().length > 0);
  }, [isComposing, title, content]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeLetters(
      (data) => {
        setLetters(data);
        setLoading(false);
      },
      (err) => {
        console.error('Subscription error in letters:', err);
        setFetchError('Unable to load love letters from database.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !content.trim()) {
      setSaveErrorMsg('Please fill in both a title and letter content.');
      return;
    }

    setIsSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      if (editingId) {
        await updateLetter(editingId, {
          title: title.trim(),
          letterDate,
          content,
          senderName: user.displayName || user.email?.split('@')[0] || 'Partner',
          recipientName: recipientName.trim(),
          paperStyle,
          isSealed,
        });
        setSaveSuccessMsg('Love letter updated successfully.');
      } else {
        await createLetter({
          title: title.trim(),
          letterDate,
          content,
          senderUid: user.uid,
          senderEmail: user.email || '',
          senderName: user.displayName || user.email?.split('@')[0] || 'Partner',
          recipientName: recipientName.trim(),
          paperStyle,
          isSealed,
        });
        setSaveSuccessMsg('Your letter has been sealed and placed in the archives.');
      }

      resetForm();
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error saving letter:', err);
      setSaveErrorMsg(err?.message || 'Failed to save letter.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setIsComposing(false);
    setEditingId(null);
    setTitle('');
    setContent('');
    setRecipientName('');
    setPaperStyle('parchment');
    setIsSealed(true);
    setLetterDate(new Date().toISOString().split('T')[0]);
  };

  const startEdit = (letter: Letter) => {
    if (letter.senderUid !== user?.uid) return;
    setEditingId(letter.id);
    setTitle(letter.title);
    setContent(letter.content);
    setRecipientName(letter.recipientName);
    setPaperStyle(letter.paperStyle);
    setIsSealed(letter.isSealed);
    setLetterDate(letter.letterDate);
    setIsComposing(true);
    setViewingLetter(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteLetter(id);
      setDeletingId(null);
      if (viewingLetter?.id === id) setViewingLetter(null);
    } catch (err: any) {
      console.error('Failed to delete letter:', err);
      alert('Delete failed: ' + (err?.message || 'Access denied'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getStationeryClass = (style: PaperStyle) => {
    switch (style) {
      case 'vintage-rose':
        return 'bg-rose-petal border-[#E8CCD5] text-[#3D252E]';
      case 'midnight':
        return 'bg-midnight-velvet border-[#442337] text-[#F8E7ED]';
      case 'pressed-petals':
        return 'bg-pressed-petals border-[#E8D1D9] text-[#38262C]';
      case 'parchment':
      default:
        return 'bg-parchment border-[#EADFD5] text-[#3D2E2E]';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E7DF] text-[#7A223B] text-xs font-semibold tracking-wider uppercase">
          <Mail className="w-3.5 h-3.5" />
          <span>Intimate Epistles</span>
        </div>
        <h1 className="font-serif-romantic text-3xl sm:text-4xl font-bold text-[#4A1726]">
          Letters to You
        </h1>
        <p className="text-sm text-[#785E65] font-literature italic max-w-xl mx-auto">
          Longer personal letters penned with quiet tenderness, meant to be unsealed and savored forever.
        </p>

        {!isComposing && (
          <div className="pt-2">
            <button
              onClick={() => setIsComposing(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#7A223B] text-white text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-[#5E1A2D] transition-colors cursor-pointer"
            >
              <Feather className="w-4 h-4" />
              <span>Compose a New Letter</span>
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

      {/* Compose or Edit Drawer */}
      {isComposing && (
        <section className="bg-[#FFFDFB] border border-[#E8DCD2] rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#F0E5DC]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#7A223B]/10 text-[#7A223B] flex items-center justify-center">
                <Feather className="w-5 h-5" />
              </div>
              <h2 className="font-serif-romantic text-xl font-bold text-[#4A1726]">
                {editingId ? 'Edit Love Letter' : 'Pen an Intimate Letter'}
              </h2>
            </div>
            <button
              onClick={resetForm}
              className="p-1.5 rounded-lg text-[#8C6D75] hover:bg-[#F3E7DF]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveLetter} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                  Recipient Salutation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Partner's name or salutation"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                  Letter Date
                </label>
                <input
                  type="date"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                  Stationery Style
                </label>
                <select
                  value={paperStyle}
                  onChange={(e) => setPaperStyle(e.target.value as PaperStyle)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
                >
                  <option value="parchment">Classic Parchment</option>
                  <option value="vintage-rose">Vintage Rose Petal</option>
                  <option value="midnight">Midnight Velvet</option>
                  <option value="pressed-petals">Pressed Petals</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                Letter Subject / Title
              </label>
              <input
                type="text"
                placeholder="Title or subject of this letter..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#7A223B]">
                  Letter Content
                </label>
                <span className="text-[11px] text-[#8C6D75]">
                  {content.length} characters • {content.trim() ? content.trim().split(/\s+/).length : 0} words
                </span>
              </div>
              <textarea
                rows={12}
                placeholder="Pour your heart out onto this page..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className={`w-full p-5 rounded-2xl border ${getStationeryClass(
                  paperStyle
                )} font-literature text-base sm:text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#9E3E56]/40`}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#54383E]">
                <input
                  type="checkbox"
                  checked={isSealed}
                  onChange={(e) => setIsSealed(e.target.checked)}
                  className="rounded border-[#D9C4BD] text-[#7A223B] focus:ring-[#9E3E56]"
                />
                <span className="font-medium">Seal with Wax Emblem (Recipient unseals to reveal)</span>
              </label>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-xl border border-[#D9C4BD] text-xs font-semibold text-[#54383E] hover:bg-[#F5ECE5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !title.trim() || !content.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#7A223B] text-white text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-[#5E1A2D] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSaving ? 'Sealing...' : editingId ? 'Update Letter' : 'Seal & Send Letter'}</span>
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Interactive Letter Viewing Modal */}
      {viewingLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231518]/60 backdrop-blur-xs overflow-y-auto">
          <div
            className={`max-w-2xl w-full my-8 rounded-3xl p-6 sm:p-10 border shadow-2xl relative ${getStationeryClass(
              viewingLetter.paperStyle
            )}`}
          >
            {/* Close button */}
            <button
              onClick={() => setViewingLetter(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Check if sealed and not yet unsealed by viewer */}
            {viewingLetter.isSealed && !unsealedLetters[viewingLetter.id] ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 rounded-full wax-seal mx-auto flex items-center justify-center text-[#FFE4EC] shadow-xl">
                  <Heart className="w-9 h-9 fill-current" />
                </div>
                <div>
                  <h3 className="font-serif-romantic text-2xl font-bold mb-1">
                    A Sealed Letter
                  </h3>
                  <p className="font-script-calligraphy text-2xl text-[#9E3E56]">
                    For {viewingLetter.recipientName}
                  </p>
                  <p className="text-xs opacity-75 mt-2">
                    Penned on {viewingLetter.letterDate} by {viewingLetter.senderName}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setUnsealedLetters((prev) => ({ ...prev, [viewingLetter.id]: true }))
                  }
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#7A223B] text-white text-xs font-semibold tracking-wider uppercase shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Break Wax Seal & Read</span>
                </button>
              </div>
            ) : (
              /* Full Letter Text */
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="border-b border-current/15 pb-4">
                  <div className="flex items-center justify-between text-xs opacity-75 mb-2 font-mono">
                    <span>{viewingLetter.letterDate}</span>
                    <span className="capitalize">{viewingLetter.paperStyle} Edition</span>
                  </div>
                  <h2 className="font-serif-romantic text-2xl sm:text-3xl font-bold">
                    {viewingLetter.title}
                  </h2>
                  <p className="font-script-calligraphy text-2xl text-[#9E3E56] mt-1">
                    Dearest {viewingLetter.recipientName},
                  </p>
                </div>

                <div className="font-literature text-base sm:text-lg leading-relaxed whitespace-pre-wrap min-h-[160px]">
                  {viewingLetter.content}
                </div>

                <div className="pt-6 border-t border-current/15 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs opacity-75 italic">Forever yours,</p>
                    <p className="font-script-calligraphy text-2xl text-[#9E3E56]">
                      {viewingLetter.senderName}
                    </p>
                  </div>

                  {viewingLetter.senderUid === user?.uid && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(viewingLetter)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/10 hover:bg-black/20"
                      >
                        Edit Letter
                      </button>
                      <button
                        onClick={() => setDeletingId(viewingLetter.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#991B1B]/15 text-[#991B1B] hover:bg-[#991B1B]/25"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Letters Archive List */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#7A223B]" />
          <h2 className="font-serif-romantic text-2xl font-bold text-[#4A1726]">
            The Letterbox Archive
          </h2>
          <span className="text-xs bg-[#F3E7DF] text-[#7A223B] font-semibold px-2.5 py-0.5 rounded-full">
            {letters.length} {letters.length === 1 ? 'letter' : 'letters'}
          </span>
        </div>

        {loading ? (
          <div className="bg-[#FFFDFB] border border-[#E8DCD2] rounded-3xl p-12 text-center text-sm text-[#8C6D75]">
            <div className="w-8 h-8 rounded-full border-2 border-[#7A223B] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="font-literature italic">Retrieving letterbox...</p>
          </div>
        ) : fetchError ? (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-6 text-center text-xs text-[#991B1B]">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">{fetchError}</p>
          </div>
        ) : letters.length === 0 ? (
          /* MANDATORY EMPTY STATE: No dummy letters */
          <div className="bg-[#FFFDFB] border border-dashed border-[#D9C4BD] rounded-3xl p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#FAF5EC] border border-[#EADFD5] text-[#9E3E56] flex items-center justify-center mx-auto shadow-xs">
              <Mail className="w-7 h-7 text-[#9E3E56]" />
            </div>
            <h3 className="font-serif-romantic text-2xl font-bold text-[#4A1726]">
              No letters written yet
            </h3>
            <p className="text-sm text-[#785E65] font-literature italic max-w-md mx-auto">
              Pour your heart onto the page for your love. Compose your first intimate letter using the
              button above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {letters.map((letter) => {
              const isSender = letter.senderUid === user?.uid;
              return (
                <div
                  key={letter.id}
                  onClick={() => setViewingLetter(letter)}
                  className={`rounded-2xl p-5 border cursor-pointer hover:shadow-md transition-all relative group flex flex-col justify-between ${getStationeryClass(
                    letter.paperStyle
                  )}`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs opacity-70 mb-2">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{letter.letterDate}</span>
                      </div>
                      {letter.isSealed ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-[#9E3E56]">
                          <Lock className="w-3 h-3" /> Wax Sealed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] opacity-70">
                          <Unlock className="w-3 h-3" /> Open
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif-romantic text-xl font-bold mb-1">
                      {letter.title}
                    </h4>
                    <p className="font-script-calligraphy text-lg text-[#9E3E56] mb-3">
                      To {letter.recipientName}
                    </p>

                    <p className="font-literature text-sm line-clamp-3 opacity-90 leading-relaxed">
                      {letter.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-current/15 flex items-center justify-between text-xs">
                    <span className="italic opacity-80">
                      From: {isSender ? 'You' : letter.senderName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#7A223B] font-medium group-hover:underline">
                      <Eye className="w-3.5 h-3.5" /> Open Letter
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Letter Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231518]/50 backdrop-blur-xs">
          <div className="max-w-md w-full bg-[#FFFDFB] rounded-3xl p-6 border border-[#E8DCD2] shadow-2xl">
            <h3 className="font-serif-romantic text-lg font-bold text-center text-[#4A1726] mb-2">
              Delete Love Letter?
            </h3>
            <p className="text-xs text-center text-[#6B5157] mb-6 font-literature">
              This letter will be permanently erased from your shared sanctuary.
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-[#D9C4BD] text-xs font-semibold text-[#54383E]"
              >
                Keep Letter
              </button>
              <button
                disabled={isDeleting}
                onClick={() => confirmDelete(deletingId)}
                className="px-4 py-2 rounded-xl bg-[#991B1B] text-xs font-semibold text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
