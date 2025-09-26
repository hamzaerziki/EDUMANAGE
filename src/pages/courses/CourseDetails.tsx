import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Calendar, 
  Users, 
  UserCheck,
  Clock,
  DollarSign,
  ArrowLeft,
  Edit,
  UserPlus,
  TrendingUp,
  MessageSquare,
  Plus
} from "lucide-react";
import { coursesApi, teachersApi, groupsApi, studentsApi, subjectsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import EditCourseModal from "@/components/modals/EditCourseModal";
import AdminFeedbackCollectionModal from "@/components/modals/AdminFeedbackCollectionModal";

const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [courseStats, setCourseStats] = useState({
    totalEnrolled: 0,
    capacity: 0,
    enrollmentRate: 0,
    avgAttendance: 0
  });

  useEffect(() => {
    if (!id) {
      console.error('No course ID provided in URL');
      navigate('/courses');
      return;
    }
    
    console.log('CourseDetails: Loading course with ID:', id);
    const loadCourseData = async () => {
      try {
        setLoading(true);
        
        console.log('Loading course data for ID:', id);
        
        // Load course data and metadata with comprehensive error handling
        const courseData = await coursesApi.get(parseInt(id!));
        console.log('Loaded course data:', courseData);
        
        // Ensure all required fields exist with defaults
        const fullCourseData = { 
          id: parseInt(id!),
          name: courseData.name || 'Cours sans nom',
          description: courseData.description || 'Aucune description disponible',
          category: courseData.category || 'Général',
          teacher_id: courseData.teacher_id,
          group_id: courseData.group_id,
          max_students: courseData.max_students || 30,
          fee: courseData.fee || 0,
          duration: courseData.duration || '3 mois',
          schedule: courseData.schedule || 'Horaire à définir',
          start_date: courseData.start_date,
          end_date: courseData.end_date,
          status: courseData.status || 'active',
          level: courseData.level || 'intermediate',
          prerequisites: courseData.prerequisites,
          objectives: courseData.objectives,
          created_at: courseData.created_at,
          updated_at: courseData.updated_at
        };
        
        setCourse(fullCourseData);
        console.log('Full course data set to state:', fullCourseData);
        
        // Load teacher data if available
        if (fullCourseData.teacher_id) {
          try {
            const teacherData = await teachersApi.get(fullCourseData.teacher_id);
            setTeacher(teacherData);
            console.log('Teacher data loaded:', teacherData);
          } catch (error) {
            console.warn('Failed to load teacher data:', error);
            setTeacher(null);
          }
        }
        
        // Load group data if available
        if (fullCourseData.group_id) {
          try {
            const groupData = await groupsApi.get(fullCourseData.group_id);
            setGroup(groupData);
            console.log('Group data loaded:', groupData);
          } catch (error) {
            console.warn('Failed to load group data:', error);
            setGroup(null);
          }
        }
        
        // Load enrolled students
        try {
          const allStudents = await studentsApi.list();
          const courseStudents = fullCourseData.group_id 
            ? allStudents.filter((s: any) => s.group_id === fullCourseData.group_id)
            : [];
          setEnrolledStudents(courseStudents);
          console.log('Enrolled students loaded:', courseStudents.length);
        } catch (error) {
          console.warn('Failed to load students:', error);
          setEnrolledStudents([]);
        }
        
      } catch (error) {
        console.error('Error loading course data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du cours",
          variant: "destructive"
        });
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back || 'Retour'}
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back || 'Retour'}
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-muted-foreground">{t.courseNotFound || 'Cours non trouvé'}</h2>
          <p className="text-muted-foreground mt-2">{t.courseNotFoundDesc || 'Le cours demandé n\'a pas été trouvé.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back || 'Retour'}
          </Button>
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
                <p className="text-muted-foreground">
                  {t.courseDetails} - {course.category || 'Général'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/courses/${id}/evaluations`)}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Évaluations des Étudiants
                </Button>
                <Button 
                  onClick={() => setFeedbackModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t.collectFeedback || 'Collecter Feedback'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditCourseModal course={course} />
          <Button onClick={() => navigate(`/courses/${id}/inscriptions`)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t.manageEnrollment || 'Gérer les inscriptions'}
          </Button>
          <AdminFeedbackCollectionModal 
            open={feedbackModalOpen}
            onOpenChange={setFeedbackModalOpen}
            course={course} 
            teacher={teacher}
            enrolledStudents={enrolledStudents}
          />
        </div>
      </div>

      {/* Course Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.enrolledStudents}</CardTitle>
            <Users className="h-4 w-4 text-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue">{enrolledStudents.length}</div>
            <p className="text-xs text-muted-foreground">sur {course.max_students || '∞'} places</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.enrollmentRate}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green">
              {course.max_students ? Math.round((enrolledStudents.length / course.max_students) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Taux d'inscription</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frais de cours</CardTitle>
            <DollarSign className="h-4 w-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange">
              {course.fee ? `${course.fee} MAD` : 'Gratuit'}
            </div>
            <p className="text-xs text-muted-foreground">Par étudiant</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durée</CardTitle>
            <Calendar className="h-4 w-4 text-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple">
              {course.duration || '—'}
            </div>
            <p className="text-xs text-muted-foreground">Durée du cours</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">{t.overview}</TabsTrigger>
          <TabsTrigger value="students">{t.students}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Course Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Informations sur le cours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{course.name}</h3>
                  {course.description && (
                    <p className="text-muted-foreground mt-1">{course.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Durée:</span>
                    <p>{course.duration || '—'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date de début:</span>
                    <p>{course.start_date ? new Date(course.start_date).toLocaleDateString() : '—'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date de fin:</span>
                    <p>{course.end_date ? new Date(course.end_date).toLocaleDateString() : '—'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Frais:</span>
                    <p>{course.fee ? `${course.fee} MAD` : '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teacher Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Enseignant
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teacher ? (
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={teacher.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {teacher.full_name?.charAt(0) || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium text-lg">{teacher.full_name}</p>
                      <p className="text-sm text-muted-foreground">{teacher.speciality}</p>
                      <p className="text-sm text-muted-foreground">{teacher.email}</p>
                      <p className="text-sm text-muted-foreground">{teacher.phone}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Pas d'enseignant assigné</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enrollment Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Statut d'inscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Inscription actuelle</span>
                  <span className="font-medium">{enrolledStudents.length} / {course.max_students || '∞'}</span>
                </div>
                {course.max_students > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, Math.round((enrolledStudents.length / course.max_students) * 100))}%` }}
                    />
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="font-medium text-green">{course.max_students ? Math.round((enrolledStudents.length / course.max_students) * 100) : 0}%</p>
                    <p className="text-muted-foreground">Capacité utilisée</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue">{courseStats.avgAttendance}%</p>
                    <p className="text-muted-foreground">Assiduité moyenne</p>
                  </div>
                  <div>
                    <p className="font-medium text-purple">
                      {course.max_students > 0 ? Math.max(0, course.max_students - enrolledStudents.length) : '∞'}
                    </p>
                    <p className="text-muted-foreground">Places disponibles</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Étudiants inscrits ({enrolledStudents.length})</h3>
            <Button onClick={() => navigate(`/courses/${id}/inscriptions`)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Gérer les inscriptions
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              {enrolledStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Pas d'étudiants inscrits</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => navigate(`/courses/${id}/inscriptions`)}
                  >
                    Inscrire des étudiants
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {enrolledStudents.map((student) => (
                    <Card key={student.id} className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {String(student.full_name || student.name || '').split(' ').map(n => n?.[0] || '').join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{student.full_name || student.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                        </div>
                        <Button onClick={() => {
                          setSelectedStudent(student);
                          setFeedbackModalOpen(true);
                        }}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Évaluations
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDetails;
