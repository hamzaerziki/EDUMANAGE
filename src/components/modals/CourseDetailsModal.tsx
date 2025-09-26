import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Calendar, 
  Users, 
  UserCheck,
  Clock,
  DollarSign,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface CourseDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: any;
}

const CourseDetailsModal = ({ open, onOpenChange, course }: CourseDetailsModalProps) => {
  // Simple validation
  if (!course) {
    return null;
  }

  const { t } = useTranslation();

  // Simple safe values
  const title = course.title || 'Course';
  const teacher = course.teacher || 'Unassigned';
  const enrolled = course.studentsEnrolled || 0;
  const category = course.category || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Details - {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">{title}</h2>
            {course.description && (
              <p className="text-muted-foreground">{course.description}</p>
            )}
            {category && (
              <Badge variant="outline" className="bg-blue/10 text-blue border-blue/20 w-fit">
                {category}
              </Badge>
            )}
          </div>

          {/* Simple Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enrollment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue">{enrolled} Students</div>
            </CardContent>
          </Card>

          {/* Teacher Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Teacher
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {teacher.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">{teacher}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{course.schedule || 'Not scheduled'}</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailsModal;