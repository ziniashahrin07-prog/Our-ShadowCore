import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Camera,
  MapPin,
  Calendar,
  Plus,
  Save,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Heart,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Link as LinkIcon,
  Search,
} from 'lucide-react';
import { Memory } from '../types';
import {
  subscribeMemories,
  createMemory,
  updateMemory,
  deleteMemory,
} from '../services/memoryService';
import { compressImageFile } from '../utils/imageCompressor';
import { useAuth } from '../context/AuthContext';

interface MemoriesPageProps {
  onDirtyChange: (isDirty: boolean) => void;
}

export const MemoriesPage: React.FC<MemoriesPageProps> = ({ onDirtyChange }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [memoryDate, setMemoryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Detail view modal
  const [viewingMemory, setViewingMemory] = useState<Memory | null>(null);

  // Deletion
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  const isDirty = useMemo(() => {
    return isAdding && (title.trim().length > 0 || description.trim().length > 0);
  }, [isAdding, title, description]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeMemories(
      (data) => {
        setMemories(data);
        setLoading(false);
      },
      (err) => {
        console.error('Subscription error in memories:', err);
        setFetchError('Unable to load memories.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setIsProcessingPhoto(true);
    setSaveErrorMsg(null);
    try {
      // Compress to optimize directly in Firestore doc (< 250KB)
      const compressedDataUrl = await compressImageFile(file, 1000, 0.75);
      setPhotoUrl(compressedDataUrl);
    } catch (err) {
      console.error('Photo compression error:', err);
      setSaveErrorMsg('Failed to process image. You may also provide a direct image link.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      setSaveErrorMsg('Please fill in both a title and description for this memory.');
      return;
    }

    setIsSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      if (editingId) {
        await updateMemory(editingId, {
          title: title.trim(),
          memoryDate,
          description: description.trim(),
          location: location.trim(),
          photoUrl,
          photoCaption: photoCaption.trim(),
          authorName: user.displayName || user.email?.split('@')[0] || 'Partner',
        });
        setSaveSuccessMsg('Memory updated successfully.');
      } else {
        await createMemory({
          title: title.trim(),
          memoryDate,
          description: description.trim(),
          location: location.trim(),
          photoUrl,
          photoCaption: photoCaption.trim(),
          authorUid: user.uid,
          authorEmail: user.email || '',
          authorName: user.displayName || user.email?.split('@')[0] || 'Partner',
        });
        setSaveSuccessMsg('Cherished memory immortalized in our album.');
      }

      resetForm();
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Save memory error:', err);
      setSaveErrorMsg(err?.message || 'Failed to save memory.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setLocation('');
    setPhotoUrl('');
    setPhotoCaption('');
    setMemoryDate(new Date().toISOString().split('T')[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (mem: Memory) => {
    if (mem.authorUid !== user?.uid) return;
    setEditingId(mem.id);
    setTitle(mem.title);
    setMemoryDate(mem.memoryDate);
    setDescription(mem.description);
    setLocation(mem.location || '');
    setPhotoUrl(mem.photoUrl || '');
    setPhotoCaption(mem.photoCaption || '');
    setIsAdding(true);
    setViewingMemory(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteMemory(id);
      setDeletingId(null);
      if (viewingMemory?.id === id) setViewingMemory(null);
    } catch (err: any) {
      console.error('Delete memory error:', err);
      alert('Delete failed: ' + (err?.message || 'Access denied'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMemories = useMemo(() => {
    return memories.filter((mem) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          mem.title.toLowerCase().includes(q) ||
          mem.description.toLowerCase().includes(q) ||
          mem.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [memories, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E7DF] text-[#7A223B] text-xs font-semibold tracking-wider uppercase">
          <Camera className="w-3.5 h-3.5" />
          <span>Shared Album</span>
        </div>
        <h1 className="font-serif-romantic text-3xl sm:text-4xl font-bold text-[#4A1726]">
          Our Memories
        </h1>
        <p className="text-sm text-[#785E65] font-literature italic max-w-xl mx-auto">
          Photographs, golden afternoons, journeys taken hand in hand, and the times we felt most alive.
        </p>

        {!isAdding && (
          <div className="pt-2">
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#7A223B] text-white text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-[#5E1A2D] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Capture a Memory</span>
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
                <Camera className="w-5 h-5" />
              </div>
              <h2 className="font-serif-romantic text-xl font-bold text-[#4A1726]">
                {editingId ? 'Edit Memory' : 'Immortalize a Shared Memory'}
              </h2>
            </div>
            <button onClick={resetForm} className="p-1.5 rounded-lg text-[#8C6D75] hover:bg-[#F3E7DF]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveMemory} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                  Memory Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Walking in the rain, That small café in Kyoto"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                  Date of Memory
                </label>
                <input
                  type="date"
                  value={memoryDate}
                  onChange={(e) => setMemoryDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                Location (Optional)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#9E8B8F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Where did this happen? (e.g. Kyoto, Lakefront cottage, Our balcony)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={150}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-[#FAF5EC] text-sm text-[#38272A] focus:outline-none focus:border-[#9E3E56]"
                />
              </div>
            </div>

            {/* Photograph Input (Upload or URL) */}
            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E8DCD2] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7A223B] flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> Optional Photograph
                </span>
                <div className="flex items-center gap-1 bg-[#EADFD5] p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPhotoMode('upload')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      photoMode === 'upload' ? 'bg-white font-medium text-[#4A1726] shadow-xs' : 'text-[#6B5157]'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoMode('url')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      photoMode === 'url' ? 'bg-white font-medium text-[#4A1726] shadow-xs' : 'text-[#6B5157]'
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {photoMode === 'upload' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload-input"
                  />
                  <label
                    htmlFor="photo-upload-input"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-[#D9C4BD] rounded-xl p-5 hover:border-[#9E3E56] transition-colors cursor-pointer bg-white/60"
                  >
                    <Upload className="w-6 h-6 text-[#9E3E56] mb-1.5" />
                    <span className="text-xs font-medium text-[#4A2E35]">
                      {isProcessingPhoto ? 'Optimizing photograph...' : 'Click to select a photo from your device'}
                    </span>
                    <span className="text-[11px] text-[#8C6D75] mt-0.5">
                      Automatically compressed and safely saved in your private cloud
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-[#9E8B8F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-white text-sm text-[#38272A] focus:outline-none"
                  />
                </div>
              )}

              {/* Photo Preview */}
              {photoUrl && (
                <div className="relative inline-block mt-2">
                  <img
                    src={photoUrl}
                    alt="Memory Preview"
                    className="max-h-48 rounded-xl border border-[#E8DCD2] object-cover shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-[#7A223B] text-white shadow-xs hover:bg-[#5E1A2D]"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {photoUrl && (
                <input
                  type="text"
                  placeholder="Photo caption (e.g. Golden hour over the hills)"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  maxLength={300}
                  className="w-full px-3 py-2 rounded-xl border border-[#D9C4BD] bg-white text-xs text-[#38272A] focus:outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A223B] mb-1.5">
                Story of This Memory
              </label>
              <textarea
                rows={6}
                placeholder="What happened? What feelings rushed through your heart that day?"
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
                <span>{isSaving ? 'Preserving...' : editingId ? 'Update Memory' : 'Save Memory'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Memory Details Modal */}
      {viewingMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231518]/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-2xl w-full my-8 bg-[#FFFDFB] rounded-3xl p-6 sm:p-8 border border-[#E8DCD2] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setViewingMemory(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#FAF5EC] text-[#8C6D75] hover:text-[#4A1726]"
            >
              <X className="w-5 h-5" />
            </button>

            {viewingMemory.photoUrl && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-[#E8DCD2] bg-[#FAF6F0]">
                <img
                  src={viewingMemory.photoUrl}
                  alt={viewingMemory.title}
                  className="w-full max-h-[420px] object-cover"
                />
                {viewingMemory.photoCaption && (
                  <p className="p-3 text-xs text-center text-[#785E65] font-literature italic bg-[#FAF6F0]">
                    “{viewingMemory.photoCaption}”
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#8C6D75]">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-[#9E3E56]" />
                  {viewingMemory.memoryDate}
                </span>
                {viewingMemory.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#9E3E56]" />
                    {viewingMemory.location}
                  </span>
                )}
                <span>• Author: {viewingMemory.authorName}</span>
              </div>

              <h2 className="font-serif-romantic text-2xl sm:text-3xl font-bold text-[#38272A]">
                {viewingMemory.title}
              </h2>

              <div className="font-literature text-base sm:text-lg text-[#4A2E35] leading-relaxed whitespace-pre-wrap">
                {viewingMemory.description}
              </div>

              {viewingMemory.authorUid === user?.uid && (
                <div className="pt-4 border-t border-[#F0E5DC] flex justify-end gap-3">
                  <button
                    onClick={() => startEdit(viewingMemory)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FAF5EC] hover:bg-[#F3E7DF] text-[#7A223B]"
                  >
                    Edit Memory
                  </button>
                  <button
                    onClick={() => setDeletingId(viewingMemory.id)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B]"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Memory Album Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#7A223B]" />
            <h2 className="font-serif-romantic text-2xl font-bold text-[#4A1726]">
              Scrapbook Gallery
            </h2>
            <span className="text-xs bg-[#F3E7DF] text-[#7A223B] font-semibold px-2.5 py-0.5 rounded-full">
              {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
            </span>
          </div>

          <div className="relative sm:w-64">
            <Search className="w-4 h-4 text-[#9E8B8F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#D9C4BD] bg-[#FFFDFB] text-[#38272A] focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-[#FFFDFB] border border-[#E8DCD2] rounded-3xl p-12 text-center text-sm text-[#8C6D75]">
            <div className="w-8 h-8 rounded-full border-2 border-[#7A223B] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="font-literature italic">Opening the memory album...</p>
          </div>
        ) : fetchError ? (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-6 text-center text-xs text-[#991B1B]">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">{fetchError}</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          /* MANDATORY EMPTY STATE: No dummy memories */
          <div className="bg-[#FFFDFB] border border-dashed border-[#D9C4BD] rounded-3xl p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#FAF5EC] border border-[#EADFD5] text-[#9E3E56] flex items-center justify-center mx-auto shadow-xs">
              <Camera className="w-7 h-7 text-[#9E3E56]" />
            </div>
            <h3 className="font-serif-romantic text-2xl font-bold text-[#4A1726]">
              No memories captured yet
            </h3>
            <p className="text-sm text-[#785E65] font-literature italic max-w-md mx-auto">
              Immortalize your first shared moment together. Upload a photograph or record a story from
              your journey.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemories.map((mem) => {
              return (
                <div
                  key={mem.id}
                  onClick={() => setViewingMemory(mem)}
                  className="bg-[#FFFDFB] border border-[#E8DCD2] hover:border-[#D4BDB4] rounded-3xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Polaroid-style photo or placeholder */}
                    {mem.photoUrl ? (
                      <div className="aspect-4/3 rounded-2xl overflow-hidden border border-[#EADFD5] bg-[#FAF5EC] mb-3 relative">
                        <img
                          src={mem.photoUrl}
                          alt={mem.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-4/3 rounded-2xl border border-dashed border-[#E0D0C5] bg-[#FAF6F0] mb-3 flex flex-col items-center justify-center text-[#A38A90] p-4 text-center">
                        <Camera className="w-8 h-8 mb-1.5 opacity-40 text-[#7A223B]" />
                        <span className="text-xs font-literature italic">Story without a photograph</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-[#8C6D75] mb-1 font-mono">
                      <span>{mem.memoryDate}</span>
                      {mem.location && (
                        <span className="truncate max-w-[120px] flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-[#9E3E56]" />
                          {mem.location}
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif-romantic text-lg font-bold text-[#38272A] line-clamp-1 mb-1.5 group-hover:text-[#7A223B] transition-colors">
                      {mem.title}
                    </h4>

                    <p className="text-xs text-[#5E474C] font-literature line-clamp-3 leading-relaxed">
                      {mem.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#F5EBE4] flex items-center justify-between text-[11px] text-[#A38A90]">
                    <span>By {mem.authorUid === user?.uid ? 'You' : mem.authorName}</span>
                    <span className="text-[#7A223B] font-medium group-hover:underline">Read memory</span>
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
              Delete Memory?
            </h3>
            <p className="text-xs text-center text-[#6B5157] mb-6 font-literature">
              Are you sure you want to delete this memory from your shared album?
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-[#D9C4BD] text-xs font-semibold text-[#54383E]"
              >
                Keep Memory
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
