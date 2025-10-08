import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, UserMinus, Mail, Phone } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { studentsApi, groupsApi } from "@/lib/api";

interface ManageEnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: any;
}

const ManageEnrollmentModal = ({ open, onOpenChange, course }: ManageEnrollmentModalProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("enroll");
  const [loading, setLoading] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const [s, g] = await Promise.all([
          studentsApi.list().catch((err) => {
            console.warn('[ManageEnrollmentModal] Failed to load students:', err);
            return [];
          }),
          groupsApi.list().catch((err) => {
            console.warn('[ManageEnrollmentModal] Failed to load groups:', err);
            return [];
          }),
        ]);
        if (!alive) return;
        setStudents(Array.isArray(s) ? s : []);
        setGroups(Array.isArray(g) ? g : []);
      } catch {
        console.error('[ManageEnrollmentModal] Unexpected error loading data');
        if (alive) {
          setStudents([]);
          setGroups([]);
        }
      }
    })();
    return () => { alive = false; };
  }, [open]);

  const groupMap = useMemo(() => {
    const m = new Map<number, any>();
    (groups || []).forEach((g: any) => { if (g && typeof g.id === 'number') m.set(Number(g.id), g); });
    return m;
  }, [groups]);

  const enrolledStudents = useMemo(() => {
    const gid = Number(course?.group_id);
    if (!Number.isFinite(gid)) return [] as any[];
    return (students || [])
      .filter((s: any) => Number(s.group_id) === gid)
      .map((s: any) => ({
        id: s.id,
        name: s.full_name || s.name || '',
        email: s.email || '',
        phone: s.phone || '',
        status: s.status || 'active',
        enrolledDate: s.created_at || null,
      }));
  }, [students, course?.group_id]);

  const availableStudents = useMemo(() => {
    const gid = Number(course?.group_id);
    return (students || [])
      .filter((s: any) => Number(s.group_id) !== gid)
      .map((s: any) => ({
        id: s.id,
        name: s.full_name || s.name || '',
        email: s.email || '',
        phone: s.phone || '',
        level: groupMap.get(Number(s.group_id))?.level || '',
        status: s.status || 'active',
      }));
  }, [students, course?.group_id, groupMap]);

  const handleEnrollStudent = async (studentId: number) => {
    if (!course?.group_id) return;
    setLoading(true);
    try {
      await studentsApi.update(studentId, { group_id: Number(course.group_id) });
      setStudents(prev => prev.map((s: any) => s.id === studentId ? { ...s, group_id: Number(course.group_id) } : s));
      toast({ title: t.success, description: t.enrollStudents || 'Enroll Students' });
    } catch (err: any) {
      toast({ title: t.error, description: err?.message || 'Failed to enroll student', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleUnenrollStudent = async (studentId: number) => {
    setLoading(true);
    try {
      await studentsApi.update(studentId, { group_id: null });
      setStudents(prev => prev.map((s: any) => s.id === studentId ? { ...s, group_id: null } : s));
      toast({ title: t.success, description: t.unenrollStudents || 'Unenroll Students', variant: 'destructive' });
    } catch (err: any) {
      toast({ title: t.error, description: err?.message || 'Failed to unenroll student', variant: 'destructive' });
    }
    setLoading(false);
  };

  const filteredStudents = selectedAction === "enroll" 
    ? availableStudents.filter(student =>
        (student.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (student.email || '').toLowerCase().includes((searchTerm || '').toLowerCase())
      )
    : enrolledStudents.filter(student =>
        (student.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (student.email || '').toLowerCase().includes((searchTerm || '').toLowerCase())
      );

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t.manageEnrollment} - {course.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">{t.searchStudents || 'Search Students'}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={`${t.search || 'Search'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="action">{t.actions || 'Actions'}</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enroll">{t.enrollStudents || 'Enroll Students'}</SelectItem>
                  <SelectItem value="unenroll">{t.unenrollStudents || 'Unenroll Students'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Course Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">{t.currentEnrollment || 'Current Enrollment'}:</span> {enrolledStudents.length}/{(groups.find((g:any)=> Number(g.id)===Number(course?.group_id))?.capacity) ?? '—'}
              </div>
              <div>
                <span className="font-medium">{t.availableSpots}:</span> {(() => {
                  const cap = groups.find((g:any)=> Number(g.id)===Number(course?.group_id))?.capacity;
                  return cap != null ? Math.max(0, cap - enrolledStudents.length) : '—';
                })()}
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.student}</TableHead>
                  <TableHead>{t.groupContact || 'Contact'}</TableHead>
                  {selectedAction === "enroll" && <TableHead>{t.level}</TableHead>}
                  {selectedAction === "unenroll" && <TableHead>{t.status}</TableHead>}
                  <TableHead>{t.actions || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {t.noResultsFound}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {String(student.name || '').split(' ').map(n => n?.[0] || '').join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </div>
                        </div>
                      </TableCell>
                      {selectedAction === "enroll" && (
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {"level" in student ? (student.level || '—') : "—"}
                          </Badge>
                        </TableCell>
                      )}
                      {selectedAction === "unenroll" && (
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {"status" in student ? (student.status || '—') : "—"}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>
                        {selectedAction === "enroll" ? (
                          <Button
                            size="sm"
                            onClick={() => handleEnrollStudent(student.id)}
                            disabled={loading}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {t.enroll || 'Enroll'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUnenrollStudent(student.id)}
                            disabled={loading}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            {t.unenroll || 'Remove'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageEnrollmentModal;