import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { feedbackApi } from "@/lib/api";
import { Star, MessageSquare, User, BookOpen, MessageCircle, HelpCircle } from "lucide-react";

interface StudentFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: any;
  course: any;
  student: any;
}

const StudentFeedbackModal = ({ open, onOpenChange, teacher, course, student }: StudentFeedbackModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    rating: 0, // Overall rating 1-5
    satisfaction_score: 0, // Satisfaction 1-10
    teaching_quality: 0, // 1-5
    course_content: 0, // 1-5
    communication: 0, // 1-5
    helpfulness: 0, // 1-5
    comments: ""
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (feedback.rating === 0) {
      toast({
        title: "Évaluation requise",
        description: "Veuillez donner une note globale",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await feedbackApi.create({
        student_id: student.id,
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

      toast({
        title: "Merci pour votre évaluation !",
        description: "Votre feedback a été enregistré avec succès",
      });
      
      onOpenChange(false);
      
      // Reset form
      setFeedback({
        rating: 0,
        satisfaction_score: 0,
        teaching_quality: 0,
        course_content: 0,
        communication: 0,
        helpfulness: 0,
        comments: ""
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Échec de l'enregistrement du feedback",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Évaluer l'Enseignant
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Évaluez {teacher?.full_name} pour le cours "{course?.name}"
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
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
              <Label htmlFor="comments">Commentaires additionnels (optionnel)</Label>
              <Textarea
                id="comments"
                value={feedback.comments}
                onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
                rows={4}
                placeholder="Partagez vos commentaires sur l'enseignant et le cours..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer l\'évaluation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentFeedbackModal;
