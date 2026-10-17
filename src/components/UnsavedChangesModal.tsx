import React from 'react';
import { AlertCircle, HeartCrack } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231518]/50 backdrop-blur-xs">
      <div className="max-w-md w-full bg-[#FFFDFB] rounded-3xl p-6 sm:p-7 border border-[#E8DCD2] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-[#FFF0F3] border border-[#F2C0CA] text-[#9E3E56] flex items-center justify-center mx-auto mb-4">
          <HeartCrack className="w-6 h-6" />
        </div>

        <h3 className="font-serif-romantic text-xl font-bold text-center text-[#4A1726] mb-2">
          Unsaved Words
        </h3>

        <p className="text-sm text-center text-[#6B5157] leading-relaxed mb-6 font-literature">
          You have penned words that have not been saved to your shared sanctuary yet. If you leave now,
          these unsaved thoughts will be lost.
        </p>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#D9C4BD] text-xs font-semibold text-[#54383E] hover:bg-[#F5ECE5] transition-colors"
          >
            Keep Writing
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#7A223B] text-xs font-semibold text-white hover:bg-[#5E1A2D] shadow-sm shadow-[#7A223B]/20 transition-colors"
          >
            Discard & Leave
          </button>
        </div>
      </div>
    </div>
  );
};
