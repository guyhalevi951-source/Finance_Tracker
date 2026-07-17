import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, X } from 'lucide-react';

interface ExpenseAttachmentFieldProps {
  existingAttachmentUrl?: string;
  pendingAttachmentFile: File | null;
  removeAttachment: boolean;
  onAttachmentFileChange: (file: File | null) => void;
  onRemoveAttachment: () => void;
}

export function ExpenseAttachmentField({
  existingAttachmentUrl,
  pendingAttachmentFile,
  removeAttachment,
  onAttachmentFileChange,
  onRemoveAttachment,
}: ExpenseAttachmentFieldProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingAttachmentFile) {
      setPendingPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(pendingAttachmentFile);
    setPendingPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pendingAttachmentFile]);

  const previewUrl = removeAttachment
    ? null
    : (pendingPreviewUrl ?? existingAttachmentUrl ?? null);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
        {t('expense.details.attachment')}
      </label>

      {previewUrl ? (
        <div className="space-y-3">
          <img
            src={previewUrl}
            alt={t('expense.details.attachment')}
            className="max-h-48 w-full rounded-xl border border-slate-200 dark:border-slate-600 object-contain"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
            >
              {t('expense.editModal.replaceAttachment')}
            </button>
            <button
              type="button"
              onClick={onRemoveAttachment}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-400"
              aria-label={t('expense.editModal.removeAttachment')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full min-h-[44px] px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          {t('expense.editModal.attachImage')}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onAttachmentFileChange(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}
