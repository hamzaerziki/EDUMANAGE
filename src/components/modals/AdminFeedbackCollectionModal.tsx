import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { feedbackApi } from "@/lib/api";
import { Star, MessageSquare, User, BookOpen, MessageCircle } from "lucide-react";

interface AdminFeedbackCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: any;
  teacher: any;
  enrolledStudents: any[];
}

const AdminFeedbackCollectionModal = ({ 
  open, 
  onOpenChange, 
  course, 
  teacher, 
  enrolledStudents 
}: AdminFeedbackCollectionModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [feedback, setFeedback] = useState({
    rating: 0,
    satisfaction_score: 0,
    teaching_quality: 0,
    course_content: 0,
    communication: 0,
    helpfulness: 0,
    comments: ""
  });

  const selectedStudent = enrolledStudents.find(s => s.id === parseInt(selectedStudentId));

  const StarRating = ({ value, onChange, max = 5, label }: { 
    value: number; 
    onChange: (value: number) => void; 
    max?: number;
    label: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[...Array(max)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className={`p-1 rounded transition-colors ${
              i < value 
                ? 'text-yellow-500 hover:text-yellow-600' 
                : 'text-gray-300 hover:text-yellow-400'
            }`}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value}/{max}
        </span>
      </div>
    </div>
  );

  const resetForm = () => {
    setSelectedStudentId("");
    setFeedback({
      rating: 0,
      satisfaction_score: 0,
      teaching_quality: 0,
      course_content: 0,
      communication: 0,
      helpfulness: 0,
      comments: ""
    });
  };

  const handleSubmit = async () => {
    if (feedback.rating === 0) {
      toast({
        title: "Évaluation requise",
        description: "Veuillez donner une note globale",
        variant: "destructive"
      });
      return;
    }

    // Validate that all required entities exist
    if (!teacher?.id) {
      toast({
        title: "Erreur",
        description: "Informations enseignant manquantes",
        variant: "destructive"
      });
      return;
    }

    if (!course?.id) {
      toast({
        title: "Erreur", 
        description: "Informations cours manquantes",
        variant: "destructive"
      });
      return;
    }

    if (!selectedStudentId || !selectedStudent) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un étudiant",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting feedback with data:', {
        student_id: parseInt(selectedStudentId),
        teacher_id: teacher?.id,
        course_id: course?.id,
        course_name: course?.name,
        teacher_name: teacher?.full_name,
        student_name: selectedStudent?.full_name
      });

      const result = await feedbackApi.create({
        student_id: parseInt(selectedStudentId),
        teacher_id: teacher.id,
        course_id: course.id,
        rating: feedback.rating,
        satisfaction_score: feedback.satisfaction_score,
        teaching_quality: feedback.teaching_quality,
        course_content: feedback.course_content,
        communication: feedback.communication,
        helpfulness: feedback.helpfulness,
        comments: feedback.comments
      });

      console.log('Feedback submission result:', result);

      toast({
        title: "Feedback enregistré !",
        description: `Feedback collecté pour ${selectedStudent?.full_name}`,
      });
      
      resetForm();
      
      // Close modal after successful submission
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
      
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      
      let errorMessage = "Échec de l'enregistrement du feedback";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.detail) {
        errorMessage = error.detail;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Collecter les Évaluations des Étudiants
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Collectez les évaluations des étudiants pour {teacher?.full_name} - Cours "{course?.name}"
          </p>
        </DialogHeader>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Student Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Sélection de l'Étudiant
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="student">Étudiant *</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un étudiant..." />
                </SelectTrigger>
                <SelectContent>
                  {enrolledStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.full_name} {student.email && `(${student.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedStudentId && (
            <>
              {/* Overall Rating */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Évaluation Globale
                </h3>
                
                <StarRating
                  value={feedback.rating}
                  onChange={(value) => setFeedback(prev => ({ ...prev, rating: value }))}
                  label="Note globale de l'enseignant *"
                />
              </div>

              {/* Satisfaction Score */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Satisfaction Générale
                </h3>
                
                <StarRating
                  value={feedback.satisfaction_score}
                  onChange={(value) => setFeedback(prev => ({ ...prev, satisfaction_score: value }))}
                  max={10}
                  label="Niveau de satisfaction (1-10)"
                />
              </div>

              {/* Detailed Ratings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Évaluation Détaillée
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StarRating
                    value={feedback.teaching_quality}
                    onChange={(value) => setFeedback(prev => ({ ...prev, teaching_quality: value }))}
                    label="Qualité d'enseignement"
                  />
                  
                  <StarRating
                    value={feedback.course_content}
                    onChange={(value) => setFeedback(prev => ({ ...prev, course_content: value }))}
                    label="Contenu du cours"
                  />
                  
                  <StarRating
                    value={feedback.communication}
                    onChange={(value) => setFeedback(prev => ({ ...prev, communication: value }))}
                    label="Communication"
                  />
                  
                  <StarRating
                    value={feedback.helpfulness}
                    onChange={(value) => setFeedback(prev => ({ ...prev, helpfulness: value }))}
                    label="Disponibilité et aide"
                  />
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Commentaires
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="comments">Commentaires de l'étudiant (optionnel)</Label>
                  <Textarea
                    id="comments"
                    value={feedback.comments}
                    onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
                    rows={4}
                    placeholder="Commentaires de l'étudiant sur l'enseignant et le cours..."
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            {selectedStudentId && (
              <>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Réinitialiser
                </Button>
                <Button type="button" disabled={loading} onClick={handleSubmit}>
                  {loading ? 'Enregistrement...' : 'Enregistrer le Feedback'}
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminFeedbackCollectionModal;
