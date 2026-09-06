import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLang } from '@/lib/LanguageContext';

export default function AliyahModal({ open, aliyah, sefer, parashah, existing, onClose, onSave, onRemove }) {
  const [date, setDate] = useState('');
  const [synagogue, setSynagogue] = useState('');
  const [notes, setNotes] = useState('');
  const { t, tr, dir } = useLang();

  useEffect(() => {
    if (open) {
      setDate(existing?.date ? String(existing.date).slice(0, 10) : '');
      setSynagogue(existing?.synagogue || '');
      setNotes(existing?.notes || '');
    }
  }, [open, existing]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md text-start" dir={dir}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">{tr(aliyah) || ''}</DialogTitle>
          <p className="text-sm text-muted-foreground">{tr(sefer)} · {tr(parashah)}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5 text-start">
            <Label>{t('modalDate')}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5 text-start">
            <Label>{t('modalSynagogue')}</Label>
            <Input value={synagogue} onChange={(e) => setSynagogue(e.target.value)} placeholder={t('modalSynagoguePlaceholder')} />
          </div>
          <div className="space-y-1.5 text-start">
            <Label>{t('modalNotes')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t('modalNotesPlaceholder')} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-start">
          {existing && (
            <Button variant="destructive" onClick={onRemove}>{t('modalDelete')}</Button>
          )}
          <Button onClick={() => onSave({ date, synagogue, notes })}>{t('modalSave')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
