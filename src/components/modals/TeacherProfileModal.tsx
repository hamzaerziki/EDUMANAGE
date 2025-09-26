import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserCheck, 
  Mail, 
  Phone, 
  Calendar, 
  GraduationCap,
  Users,
  BookOpen,
  Star,
  Award
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useState } from "react";
import { teachersApi } from "@/lib/api";

interface TeacherProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: any;
}

const TeacherProfileModal = ({ open, onOpenChange, teacher }: TeacherProfileModalProps) => {
  if (!teacher) return null;
  const { t } = useTranslation();

  const [stats, setStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoadingStats(true);
      setStatsError(null);
      try {
        const idNum = Number(teacher?.id);
        if (!Number.isFinite(idNum)) throw new Error('Invalid teacher id');
        
        console.log(`Loading stats for teacher ID: ${idNum}`);
        
        // First try to get debug info
        try {
          const debugInfo = await teachersApi.debugStats(idNum);
          console.log('Debug info:', debugInfo);
        } catch (e) {
          console.warn('Debug info failed:', e);
        }
        
        // Try to update stats first
        try {
          const updateResult = await teachersApi.updateStats(idNum);
          console.log('Update result:', updateResult);
        } catch (e) {
          console.warn('Update stats failed:', e);
        }
        
        // Now get the stats
        const data = await teachersApi.stats(idNum);
        console.log('Stats data received:', data);
        
        if (!alive) return;
        setStats(data || null);
      } catch (e: any) {
        console.error('Error loading teacher stats:', e);
        if (!alive) return;
        setStats(null);
        setStatsError(e?.message || 'Failed to load statistics');
      }
      if (alive) setLoadingStats(false);
    };
    
    if (open && teacher?.id) {
      load();
    }
    
    return () => { alive = false; };
  }, [open, teacher?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green/10 text-green border-green/20";
      case "on_leave": return "bg-red/10 text-red border-red/20";
      case "inactive": return "bg-red/10 text-red border-red/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {t.teacherProfile}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={teacher.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {(teacher.full_name || teacher.name || 'T').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{teacher.full_name || teacher.name || 'Unknown Teacher'}</h2>
              <div className="flex items-center gap-2">
                <Badge className={`border ${getStatusColor(teacher.status || 'active')}`}>
                  {(teacher.status || 'active') === 'active' ? t.active : t.inactive}
                </Badge>
                <Badge variant="outline" className="bg-blue/10 text-blue border-blue/20">
                  {teacher.speciality || teacher.department || 'Non spécifié'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t.contactInformation || 'Contact Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t.email}</p>
                    <p className="font-medium">{teacher.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t.phone}</p>
                    <p className="font-medium">{teacher.phone}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t.joiningDate || 'Joining Date'}</p>
                  <p className="font-medium">{new Date(teacher.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {t.professionalInformation || 'Professional Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t.department || 'Spécialité'}</p>
                  <p className="font-medium text-lg">{teacher.speciality || teacher.department || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.experience || 'Expérience'}</p>
                  <p className="font-medium text-lg">{loadingStats ? '…' : (stats?.experience != null ? `${stats.experience} ${t.yearsExperience || 'années'}` : '—')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t.subjectsTeaching || 'Matières enseignées'}</p>
                <div className="flex flex-wrap gap-2">
                  {loadingStats ? (
                    <span className="text-xs text-muted-foreground">Chargement…</span>
                  ) : statsError ? (
                    <span className="text-xs text-red-600">{statsError}</span>
                  ) : stats?.subjects > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {stats.subjects} matière{stats.subjects > 1 ? 's' : ''} enseignée{stats.subjects > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teaching Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t.teachingStatistics || 'Teaching Statistics'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Chargement des statistiques...</p>
                </div>
              )}
              {statsError && (
                <div className="text-center py-4">
                  <p className="text-red-600 text-sm">Erreur: {statsError}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-8 w-8 text-blue" />
                  </div>
                  <p className="text-2xl font-bold text-blue">{loadingStats ? '…' : (stats?.students ?? 0)}</p>
                  <p className="text-sm text-muted-foreground">{t.students}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <BookOpen className="h-8 w-8 text-green" />
                  </div>
                  <p className="text-2xl font-bold text-green">{loadingStats ? '…' : (stats?.subjects ?? 0)}</p>
                  <p className="text-sm text-muted-foreground">{t.subjects}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-8 w-8 text-purple" />
                  </div>
                  <p className="text-2xl font-bold text-purple">{loadingStats ? '…' : (stats?.experience != null ? stats.experience : '—')}</p>
                  <p className="text-sm text-muted-foreground">{t.yearsExperience || 'Years Experience'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5" />
                {t.performanceOverview || 'Performance Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green/5 rounded-lg border border-green/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-3 w-3 bg-green rounded-full"></div>
                      <span className="font-medium">{t.studentSatisfaction || 'Student Satisfaction'}</span>
                    </div>
                    <p className="text-2xl font-bold text-green">{loadingStats ? '…' : (stats?.satisfaction != null ? `${stats.satisfaction}%` : '—')}</p>
                  </div>
                  
                  <div className="p-4 bg-blue/5 rounded-lg border border-blue/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-3 w-3 bg-blue rounded-full"></div>
                      <span className="font-medium">{t.classAttendance || t.attendance || 'Attendance'}</span>
                    </div>
                    <p className="text-2xl font-bold text-blue">{loadingStats ? '…' : (stats?.attendance != null ? `${stats.attendance}%` : '—')}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-purple/5 rounded-lg border border-purple/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-3 bg-purple rounded-full"></div>
                    <span className="font-medium">{t.averageGradeImprovement || 'Average Grade Improvement'}</span>
                  </div>
                  <p className="text-2xl font-bold text-purple">{loadingStats ? '…' : (stats?.gradeImprovement != null ? `${stats.gradeImprovement >= 0 ? '+' : ''}${stats.gradeImprovement}%` : '—')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherProfileModal;