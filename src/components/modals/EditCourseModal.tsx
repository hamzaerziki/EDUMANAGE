import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { teachersApi, coursesApi } from "@/lib/api";
import { BookOpen, Calendar, Users, DollarSign } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface EditCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: any;
  onSave: (updatedCourse: any) => void;
}

const EditCourseModal = ({ open, onOpenChange, course, onSave }: EditCourseModalProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    teacher: "", // stores teacher_id as string
    maxStudents: "",
    startDate: "",
    fee: "",
    schedule: "",
    status: ""
  });

  const [teachers, setTeachers] = useState<Array<{ id: number; full_name: string }>>([]);

  const statuses = ["active", "completed", "upcoming"];

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const list = await teachersApi.list();
        if (!alive) return;
        const simplified = Array.isArray(list) ? (list as any[]).map(x => ({ id: x.id, full_name: x.full_name })) : [];
        setTeachers(simplified);
      } catch {
        setTeachers([]);
      }
      // Prefill course meta if available
      try {
        if (course?.id) {
          const meta = await coursesApi.getMeta(course.id).catch(() => null);
          if (meta) {
            setFormData(prev => ({
              ...prev,
              startDate: meta.start_date || "",
              maxStudents: meta.max_students != null ? String(meta.max_students) : "",
              fee: meta.fee != null ? String(meta.fee) : "",
              status: meta.status || prev.status,
            }));
          }
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, [open]);

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        teacher: course.teacher_id != null ? String(course.teacher_id) : "",
        maxStudents: "",
        startDate: "",
        fee: "",
        schedule: course.schedule || "",
        status: ""
      });
    }
  }, [course]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (course?.id) {
        // Persist core course fields
        await coursesApi.update(Number(course.id), {
          name: formData.title || course.title,
          teacher_id: formData.teacher ? Number(formData.teacher) : null,
        });
        // Persist meta fields (optional)
        await coursesApi.upsertMeta(Number(course.id), {
          fee: formData.fee ? Number(formData.fee) : null,
          status: formData.status || null,
          start_date: formData.startDate || null,
          max_students: formData.maxStudents ? Number(formData.maxStudents) : null,
        }).catch(() => null);
      }

      const teacherName = teachers.find(t => String(t.id) === formData.teacher)?.full_name || course.teacher;
      onSave({
        ...course,
        title: formData.title,
        description: formData.description,
        teacher: teacherName,
        schedule: course.schedule,
      });

      toast({
        title: t.courseUpdated || "Course Updated",
        description: `${formData.title} ${t.updatedSuccessfully || 'has been updated successfully.'}`,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: t.error, description: err?.message || 'Failed to update course', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t.editCourse}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.courseInformation}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">{t.courseTitle} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t.description}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Teaching Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.teachingInformation}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacher">{t.assignedTeacher} *</Label>
                <Select value={formData.teacher} onValueChange={(value) => handleInputChange("teacher", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectTeacher} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStudents">{t.maxStudents}</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="maxStudents"
                    type="number"
                    min="0"
                    className="pl-10"
                    value={formData.maxStudents}
                    onChange={(e) => handleInputChange("maxStudents", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">{t.schedule}</Label>
              <Input
                id="schedule"
                value={formData.schedule}
                onChange={(e) => handleInputChange("schedule", e.target.value)}
                placeholder="—"
                disabled
              />
            </div>
          </div>

          {/* Duration & Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.durationAndPricing}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t.startDate}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t.status}</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t.active}</SelectItem>
                    <SelectItem value="completed">{t.completed}</SelectItem>
                    <SelectItem value="upcoming">{t.upcoming || 'Upcoming'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee">{t.courseFee}</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fee"
                  type="number"
                  min="0"
                  className="pl-10"
                  value={formData.fee}
                  onChange={(e) => handleInputChange("fee", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t.loading : t.saveChanges}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCourseModal;