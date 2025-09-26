import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";

export interface SessionData {
  id: string;
  title: string;
  teacher: string;
  group: string;
  subject: string;
  classroom: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  day: number;       // 0-6
  level: string;
  students: number;
  color: string;
}

interface QuickEditSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionData | null;
  onSave: (updated: SessionData) => void;
}

const QuickEditSessionModal = ({ open, onOpenChange, session, onSave }: QuickEditSessionModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [form, setForm] = useState<SessionData | null>(session);

  useEffect(() => {
    setForm(session);
  }, [session]);

  if (!form) return null;

  const setField = (key: keyof SessionData, value: any) => {
    setForm(prev => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value } as SessionData;
      if (key === 'startTime') {
        const sH = parseInt(String(value).split(':')[0] || '8', 10);
        const eH = parseInt((next.endTime || '09:00').split(':')[0], 10);
        if (!(eH > sH)) next.endTime = `${String(Math.min(sH + 1, 23)).padStart(2, '0')}:00`;
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!form) return;
    const startH = parseInt((form.startTime || '08:00').split(':')[0], 10);
    const endH = parseInt((form.endTime || '09:00').split(':')[0], 10);
    if (startH < 8 || endH > 23) {
      toast({ title: t.error, description: t.timeOutOfBounds || 'Please select times between 08:00 and 23:00' });
      return;
    }
    if (endH <= startH) {
      toast({ title: t.error, description: t.invalidTimeRange || 'End time must be after start time' });
      return;
    }
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t.editSchedule || 'Edit Schedule'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t.courseTitle}</Label>
              <Input id="title" value={form.title} onChange={(e) => setField('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">{t.teacher}</Label>
              <Input id="teacher" value={form.teacher} onChange={(e) => setField('teacher', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classroom">{t.room}</Label>
              <Input id="classroom" value={form.classroom} onChange={(e) => setField('classroom', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.students}</Label>
              <Input type="number" min={0} value={form.students} onChange={(e) => setField('students', parseInt(e.target.value || '0', 10))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">{t.startTime}</Label>
              <Select value={form.startTime} onValueChange={(v) => setField('startTime', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.startTime} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 16 }, (_, i) => String(8 + i).padStart(2, '0')).map((h) => (
                    <SelectItem key={h} value={`${h}:00`}>{h}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">{t.endTime}</Label>
              <Select value={form.endTime} onValueChange={(v) => setField('endTime', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.endTime} />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const sH = parseInt((form.startTime || '08:00').split(':')[0], 10);
                    const from = Math.max(9, sH + 1);
                    const count = Math.max(0, 24 - from);
                    return Array.from({ length: count }, (_, i) => String(from + i).padStart(2, '0')).map((h) => (
                      <SelectItem key={h} value={`${h}:00`}>{h}:00</SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
            <Button onClick={handleSave}>{t.saveChanges}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickEditSessionModal;
