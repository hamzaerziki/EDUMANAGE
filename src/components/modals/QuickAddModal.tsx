import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, UserCheck, BookOpen, Calendar, CreditCard, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickAddModal = ({ open, onOpenChange }: QuickAddModalProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const quickActions = [
    {
      title: t.addStudent,
      description: t.addNew,
      icon: Users,
      color: "text-blue",
      bgColor: "bg-blue/10",
      action: () => {
        onOpenChange(false);
        // Open add student modal or navigate
        navigate('/students');
      }
    },
    {
      title: t.addTeacher,
      description: t.addNew,
      icon: UserCheck,
      color: "text-green",
      bgColor: "bg-green/10",
      action: () => {
        onOpenChange(false);
        navigate('/teachers');
      }
    },
    {
      title: t.addCourse,
      description: t.addNew,
      icon: BookOpen,
      color: "text-purple",
      bgColor: "bg-purple/10",
      action: () => {
        onOpenChange(false);
        navigate('/courses');
      }
    },
    {
      title: t.editSchedule,
      description: t.schedule,
      icon: Calendar,
      color: "text-orange",
      bgColor: "bg-orange/10",
      action: () => {
        onOpenChange(false);
        navigate('/schedule');
      }
    },
    {
      title: t.recordPayment,
      description: t.addNew,
      icon: CreditCard,
      color: "text-pink",
      bgColor: "bg-pink/10",
      action: () => {
        onOpenChange(false);
        navigate('/payments');
      }
    },
    {
      title: t.generateReport,
      description: t.reports,
      icon: FileText,
      color: "text-teal",
      bgColor: "bg-teal/10",
      action: () => {
        onOpenChange(false);
        navigate('/reports');
      }
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t.quickAdd || t.quickActions}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              onClick={action.action}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${action.bgColor}`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{action.title}</h3>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddModal;