import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { attendanceStore, type AttendanceStatus } from "@/lib/attendanceStore";
import { groupsApi, studentsApi, attendanceApi } from "@/lib/api";

interface MarkAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClass?: any;
  selectedDate: Date;
}

const MarkAttendanceModal = ({ open, onOpenChange, selectedClass, selectedDate }: MarkAttendanceModalProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Group, 2: Mark Attendance
  const [selectedGroup, setSelectedGroup] = useState<string | number>("");
  const [attendance, setAttendance] = useState<{[key: string]: string}>({});
  const [groups, setGroups] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  // Load groups and students from backend when modal opens
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const [g, s] = await Promise.all([
          groupsApi.list(),
          studentsApi.list().catch(()=>[]),
        ]);
        setGroups(Array.isArray(g) ? g : []);
        setAllStudents(Array.isArray(s) ? s : []);
      } catch { setGroups([]); setAllStudents([]); }
    };
    load();
  }, [open]);

  // Helpers for external (passed-in) group
  const external = typeof selectedClass === 'object' && selectedClass ? selectedClass : null;
  const matchedGroup = groups.find((g:any) => String(g.id) === String(selectedGroup));
  const headerName = matchedGroup?.name || external?.name;
  const headerLevel = matchedGroup?.level || external?.grade || external?.level;
  const headerTeacher = external?.teacher || '';
  const currentStudents = matchedGroup
    ? (allStudents || []).filter((s:any)=> String(s.group_id) === String(matchedGroup.id)).map((s:any)=> ({ id: String(s.id), name: s.full_name || s.name || String(s.id), studentId: String(s.id), avatar: '' }))
    : [];

  // If opened with a preselected class (from group card), jump to step 2 and preselect that group
  useEffect(() => {
    if (open && selectedClass && step === 1 && !selectedGroup) {
      const pre = typeof selectedClass === 'string' || typeof selectedClass === 'number' ? selectedClass : selectedClass.id;
      if (pre) {
        setSelectedGroup(pre);
        setStep(2);
      }
    }
  }, [open, selectedClass, selectedGroup, step]);

  // Prefill previously saved attendance for this group and date
  useEffect(() => {
    const hydrate = async () => {
      if (!open || step !== 2) return;
      const gid = matchedGroup?.id || external?.id;
      if (!gid) return;
      try {
        const all = await attendanceApi.list().catch(()=>[]);
        const dateISO = selectedDate?.toISOString?.().slice(0,10);
        const byDate = (all || []).filter((a:any)=> String(a.date) === String(dateISO));
        // Build a map for latest status per student (list() returns desc by id). Keep first occurrence only.
        const statusByStudent: Record<string, string> = {};
        for (const rec of byDate) {
          const st = (allStudents || []).find((s:any)=> Number(s.id) === Number(rec.student_id));
          if (!st || Number(st.group_id) !== Number(gid)) continue;
          const key = String(st.id);
          if (statusByStudent[key] === undefined) {
            // First time we see this student in desc order = latest record
            statusByStudent[key] = rec.status;
          }
        }
        // Prefill attendance state with existing statuses
        if (Object.keys(statusByStudent).length) {
          setAttendance(statusByStudent);
        } else {
          setAttendance({});
        }
      } catch { /* ignore */ }
    };
    hydrate();
  }, [open, step, matchedGroup, external, selectedDate, allStudents]);

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const dateISO = (selectedDate || new Date()).toISOString().slice(0,10);
      const selections = Object.entries(attendance)
        .map(([id, status]) => ({ student_id: Number(id), status: status as AttendanceStatus }));
      // Persist each record in backend
      await Promise.all(
        selections.map(sel => attendanceApi.create({ student_id: sel.student_id, date: dateISO, status: sel.status as any }))
      );
      toast({ title: t.attendanceRecordedSuccessfully, description: `${selections.filter(s=>s.status==='present').length} ${t.present}, ${selections.filter(s=>s.status==='absent').length} ${t.absent}, ${selections.filter(s=>s.status==='late').length} ${t.late}` });
      // Broadcast a global event so lists/overview can refresh from backend
      try { window.dispatchEvent(new CustomEvent('attendance:updated')); } catch {}
    } catch (e:any) {
      toast({ title: t.error || 'Error', description: e?.message || 'Failed to save attendance', variant: 'destructive' });
    }
    setLoading(false);
    onOpenChange(false);
    setStep(1);
    setSelectedGroup("");
    setAttendance({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green/10 text-green border-green/20";
      case "absent": return "bg-red/10 text-red border-red/20";
      case "late": return "bg-orange/10 text-orange border-orange/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle className="h-4 w-4" />;
      case "absent": return <XCircle className="h-4 w-4" />;
      case "late": return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Reset state when modal closes to avoid stuck step
      setStep(1);
      setSelectedGroup("");
      setAttendance({});
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.markAttendance} {step === 1 ? `- ${t.selectGroup}` : `- ${headerName || ''}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? t.classOverview 
              : `${t.teacher}: ${headerTeacher || '-'} • ${headerLevel || '-'} • ${selectedDate?.toLocaleDateString?.() || new Date().toLocaleDateString()}`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.selectGroup}</h3>
            <div className="grid gap-3">
              {groups.map((group:any) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent"
                  onClick={() => {
                    setSelectedGroup(group.id);
                    setStep(2);
                  }}
                >
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-muted-foreground">{group.level || ''}</p>
                  </div>
                  <Badge variant="outline">{(allStudents||[]).filter((s:any)=> Number(s.group_id)===Number(group.id)).length} {(t.students && typeof t.students.toLowerCase === 'function') ? t.students.toLowerCase() : 'students'}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {!selectedClass && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                >
                  ← {t.backToGroups}
                </Button>
              )}
              <h3 className="text-sm font-medium text-muted-foreground">{t.markAttendance}</h3>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-green/10">
                <p className="text-2xl font-bold text-green">
                  {Object.values(attendance).filter(status => status === 'present').length}
                </p>
                <p className="text-sm text-green">{t.present}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red/10">
                <p className="text-2xl font-bold text-red">
                  {Object.values(attendance).filter(status => status === 'absent').length}
                </p>
                <p className="text-sm text-red">{t.absent}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange/10">
                <p className="text-2xl font-bold text-orange">
                  {Object.values(attendance).filter(status => status === 'late').length}
                </p>
                <p className="text-sm text-orange">{t.late}</p>
              </div>
            </div>

            {/* Student List */}
            <div className="space-y-3">
              <h3 className="font-medium">{t.enrolledStudents} ({currentStudents.length})</h3>
              {currentStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.studentId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {attendance[student.id] && (
                      <Badge className={`border ${getStatusColor(attendance[student.id])}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(attendance[student.id])}
                          <span className="capitalize">{attendance[student.id]}</span>
                        </div>
                      </Badge>
                    )}
                    
                    <Select 
                      value={attendance[student.id] || ""} 
                      onValueChange={(value) => handleAttendanceChange(student.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder={t.status} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">{t.present}</SelectItem>
                        <SelectItem value="absent">{t.absent}</SelectItem>
                        <SelectItem value="late">{t.late}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => {
                const allPresent: {[key: string]: string} = {};
                currentStudents.forEach((student) => {
                  allPresent[student.id] = 'present';
                });
                setAttendance(allPresent);
              }}>
                {t.markAllPresent}
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  {t.cancel}
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || Object.keys(attendance).length === 0}
                >
                  {loading ? t.loading : t.recordAttendance}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t.cancel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MarkAttendanceModal;