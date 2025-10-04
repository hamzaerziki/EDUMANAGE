import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  GraduationCap, 
  BookOpen,
  Clock,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Download
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { timetableApi, API_BASE } from "@/lib/api";

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: any | null;
}

export const GroupDetailsModal = ({ isOpen, onClose, group }: GroupDetailsModalProps) => {
  const { t, language } = useTranslation();
  const { toast } = useToast();

  if (!group) return null;

  const getStatusColor = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) return "bg-red-100 text-red-800 border-red-200";
    if (percentage >= 75) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getStatusText = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) return t.groupFull;
    if (percentage >= 75) return t.almostFull;
    return t.availableSpots;
  };

  const downloadSchedulePDF = async () => {
    try {
      const gid = Number(group.id);
      if (Number.isNaN(gid)) throw new Error('Invalid group id');
      const resp = await timetableApi.groupPdf(gid);
      if (resp?.path) {
        const url = `${API_BASE}${resp.path}`;
        window.open(url, '_blank');
      } else {
        throw new Error('No PDF path returned');
      }
    } catch (e:any) {
      toast({ title: t.error || 'Error', description: e?.message || (t.downloadFailed || 'Failed to download schedule PDF'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div class="flex items-center justify-between gap-3">
            <DialogTitle class="flex items-center gap-2">
              <GraduationCap class="h-5 w-5" />
              {t.groupDetails} - {group.name}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Group Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Matière:</span>
                <span>{group.subject}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Enseignant:</span>
                <span>{group.teacher}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Horaire:</span>
                <span>{group.schedule}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Salle:</span>
                <span>{group.classroom}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Niveau:</span>
                <span>{group.level} - {group.grade}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Capacité:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary">
                    {group.enrolled}/{group.capacity}
                  </span>
                  <Badge className={`border ${getStatusColor(group.enrolled, group.capacity)}`}>
                    {getStatusText(group.enrolled, group.capacity)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t.enrolledStudentsInGroup} ({group.students?.length || 0})
            </h3>
            
            {group.students?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.groupStudent}</TableHead>
                    <TableHead>{t.groupContact}</TableHead>
                    <TableHead>{t.groupAverage}</TableHead>
                    <TableHead>{t.groupAttendance}</TableHead>
                    <TableHead>{t.groupEnrollment}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.students.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {student.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {String(student.id).padStart(4, '0')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-xs">
                            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="truncate max-w-[120px]">{student.email}</span>
                          </div>
                          <div className="flex items-center text-xs">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            {student.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{student.gpa}/20</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{student.attendance}%</span>
                          <div className="w-10 bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${student.attendance}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(student.enrollmentDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t.noStudentsEnrolled}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>
              {t.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};