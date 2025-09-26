import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Star,
  Users,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Calendar,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { coursesApi, feedbackApi, teachersApi } from "@/lib/api";

const StudentEvaluations = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [teacherStats, setTeacherStats] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      navigate('/courses');
      return;
    }
    loadEvaluationData();
  }, [id]);

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      
      // Load course data
      const courseData = await coursesApi.get(parseInt(id!));
      setCourse(courseData);
      
      if (courseData.teacher_id) {
        // Load teacher data and statistics
        const [teacherData, teacherStatsData, feedbackData] = await Promise.all([
          teachersApi.get(courseData.teacher_id),
          teachersApi.stats(courseData.teacher_id),
          feedbackApi.getByTeacher(courseData.teacher_id)
        ]);
        
        setTeacher(teacherData);
        setTeacherStats(teacherStatsData);
        
        // Filter feedback for this specific course
        const courseFeedback = feedbackData.filter((f: any) => f.course_id === parseInt(id!));
        setFeedbackList(courseFeedback);
      }
      
    } catch (error) {
      console.error('Error loading evaluation data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'évaluation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCourseStats = () => {
    if (feedbackList.length === 0) {
      return {
        averageRating: 0,
        totalEvaluations: 0,
        averageSatisfaction: 0,
        averageTeachingQuality: 0,
        averageCourseContent: 0,
        averageCommunication: 0,
        averageHelpfulness: 0
      };
    }

    const total = feedbackList.length;
    return {
      averageRating: feedbackList.reduce((sum, f) => sum + f.rating, 0) / total,
      totalEvaluations: total,
      averageSatisfaction: feedbackList.reduce((sum, f) => sum + f.satisfaction_score, 0) / total,
      averageTeachingQuality: feedbackList.reduce((sum, f) => sum + f.teaching_quality, 0) / total,
      averageCourseContent: feedbackList.reduce((sum, f) => sum + f.course_content, 0) / total,
      averageCommunication: feedbackList.reduce((sum, f) => sum + f.communication, 0) / total,
      averageHelpfulness: feedbackList.reduce((sum, f) => sum + f.helpfulness, 0) / total
    };
  };

  const renderStars = (rating: number, maxRating: number = 5) => {
    return Array.from({ length: maxRating }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const stats = calculateCourseStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des évaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(`/courses/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au cours
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Évaluations des Étudiants</h1>
          <p className="text-muted-foreground">
            {course?.name} - {teacher?.full_name}
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</div>
            <div className="flex items-center mt-1">
              {renderStars(stats.averageRating)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Évaluations</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvaluations}</div>
            <p className="text-xs text-muted-foreground">Évaluations reçues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((stats.averageSatisfaction / 10) * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">{stats.averageSatisfaction.toFixed(1)}/10</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualité d'enseignement</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageTeachingQuality.toFixed(1)}/5</div>
            <div className="flex items-center mt-1">
              {renderStars(stats.averageTeachingQuality)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics and Feedback */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="details">Détails des notes</TabsTrigger>
          <TabsTrigger value="feedback">Commentaires</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des évaluations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Qualité d'enseignement</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(stats.averageTeachingQuality)}</div>
                      <span className="text-sm font-medium">{stats.averageTeachingQuality.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Contenu du cours</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(stats.averageCourseContent)}</div>
                      <span className="text-sm font-medium">{stats.averageCourseContent.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Communication</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(stats.averageCommunication)}</div>
                      <span className="text-sm font-medium">{stats.averageCommunication.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Disponibilité et aide</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(stats.averageHelpfulness)}</div>
                      <span className="text-sm font-medium">{stats.averageHelpfulness.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques de l'enseignant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teacherStats ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Étudiants enseignés</span>
                      <span className="font-medium">{teacherStats.students}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Matières enseignées</span>
                      <span className="font-medium">{teacherStats.subjects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Années d'expérience</span>
                      <span className="font-medium">{teacherStats.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Note moyenne globale</span>
                      <span className="font-medium">{teacherStats.averageRating}/5</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune statistique disponible</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails des évaluations par critère</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { label: "Note globale", value: stats.averageRating, max: 5 },
                  { label: "Satisfaction générale", value: stats.averageSatisfaction, max: 10 },
                  { label: "Qualité d'enseignement", value: stats.averageTeachingQuality, max: 5 },
                  { label: "Contenu du cours", value: stats.averageCourseContent, max: 5 },
                  { label: "Communication", value: stats.averageCommunication, max: 5 },
                  { label: "Disponibilité et aide", value: stats.averageHelpfulness, max: 5 }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm">{item.value.toFixed(1)}/{item.max}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(item.value / item.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commentaires des étudiants</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackList.length > 0 ? (
                <div className="space-y-4">
                  {feedbackList.map((feedback, index) => (
                    <div key={feedback.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>E{index + 1}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">Étudiant {index + 1}</p>
                            <div className="flex items-center gap-1">
                              {renderStars(feedback.rating)}
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(feedback.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          Satisfaction: {feedback.satisfaction_score}/10
                        </Badge>
                      </div>
                      
                      {feedback.comments && (
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-sm italic">"{feedback.comments}"</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-muted-foreground">Enseignement</p>
                          <p className="font-medium">{feedback.teaching_quality}/5</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Contenu</p>
                          <p className="font-medium">{feedback.course_content}/5</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Communication</p>
                          <p className="font-medium">{feedback.communication}/5</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Aide</p>
                          <p className="font-medium">{feedback.helpfulness}/5</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune évaluation disponible pour ce cours</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentEvaluations;
