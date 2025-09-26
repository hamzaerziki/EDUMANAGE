import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { groupsApi, teachersApi, coursesApi, subjectsApi } from "@/lib/api";
import { BookOpen, Calendar, Users, DollarSign } from "lucide-react";

interface AddCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (course: Partial<{
    id: string;
    title: string;
    teacher: string;
    group: string;
    subject: string;
    classroom: string;
    startTime: string;
    endTime: string;
    day: number; // 0-6
    level: string;
    students: number;
    color: string;
  }>) => void;
}

const AddCourseModal = ({ open, onOpenChange, onAdd }: AddCourseModalProps) => {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    level: "",
    teacher: "",
    dateOfDay: "",
    startHour: "08:00",
    endHour: "09:00",
    fee: "",
    assignedGroup: ""
  });

  // Load teachers and groups from backend when modal opens
  const [teachers, setTeachers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        setOptionsLoading(true);
        const [t, g, s] = await Promise.all([
          teachersApi.list().catch(() => []),
          groupsApi.list().catch(() => []),
          subjectsApi.list().catch(() => []),
        ]);
        if (!alive) return;
        setTeachers(t || []);
        setGroups(g || []);
        const subs = Array.isArray(s) ? (s as any[]).map(x => x.name).filter(Boolean) : [];
        setSubjectOptions(Array.from(new Set(subs)).sort((a,b)=>a.localeCompare(b)));
      } finally {
        if (alive) setOptionsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open]);

  // DB-backed subjects created by the user
  const subjects = subjectOptions;

  // Complete Moroccan curriculum levels from primary to high school
  const levels = [
    // Primary School (المدرسة الابتدائية)
    "السنة الأولى ابتدائي (1st Grade Primary)",
    "السنة الثانية ابتدائي (2nd Grade Primary)",
    "السنة الثالثة ابتدائي (3rd Grade Primary)",
    "السنة الرابعة ابتدائي (4th Grade Primary)",
    "السنة الخامسة ابتدائي (5th Grade Primary)",
    "السنة السادسة ابتدائي (6th Grade Primary)",
    
    // Middle School (الإعدادية)
    "السنة الأولى إعدادي (1st Grade Middle School)",
    "السنة الثانية إعدادي (2nd Grade Middle School)",
    "السنة الثالثة إعدادي (3rd Grade Middle School)",
    
    // High School (الثانوية)
    "الجذع المشترك علمي (Common Core Scientific)",
    "الجذع المشترك أدبي (Common Core Literary)",
    "الجذع المشترك تكنولوجي (Common Core Technological)",
    "الجذع المشترك مهني (Common Core Professional)",
    
    // First Year Bac (الأولى باكالوريا)
    "الأولى باك علوم رياضية (1st Bac Mathematical Sciences)",
    "الأولى باك علوم تجريبية (1st Bac Experimental Sciences)",
    "الأولى باك علوم اقتصادية والتدبير (1st Bac Economics & Management)",
    "الأولى باك آداب وعلوم إنسانية (1st Bac Literature & Human Sciences)",
    "الأولى باك علوم والتكنولوجيات الكهربائية (1st Bac Electrical Sciences & Technology)",
    "الأولى باك علوم والتكنولوجيات الميكانيكية (1st Bac Mechanical Sciences & Technology)",
    "الأولى باك فنون تطبيقية (1st Bac Applied Arts)",
    
    // Second Year Bac (الثانية باكالوريا)
    "الثانية باك علوم رياضية أ (2nd Bac Mathematical Sciences A)",
    "الثانية باك علوم رياضية ب (2nd Bac Mathematical Sciences B)",
    "الثانية باك علوم فيزيائية (2nd Bac Physical Sciences)",
    "الثانية باك علوم الحياة والأرض (2nd Bac Life & Earth Sciences)",
    "الثانية باك علوم الزراعية (2nd Bac Agricultural Sciences)",
    "الثانية باك علوم اقتصادية (2nd Bac Economic Sciences)",
    "الثانية باك علوم التدبير المحاسبي (2nd Bac Accounting Management Sciences)",
    "الثانية باك آداب (2nd Bac Literature)",
    "الثانية باك علوم إنسانية (2nd Bac Human Sciences)",
    "الثانية باك علوم شرعية (2nd Bac Islamic Studies)",
    "الثانية باك علوم والتكنولوجيات الكهربائية (2nd Bac Electrical Sciences & Technology)",
    "الثانية باك علوم والتكنولوجيات الميكانيكية (2nd Bac Mechanical Sciences & Technology)",
    "الثانية باك فنون تطبيقية (2nd Bac Applied Arts)"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value } as typeof prev;
      // If startHour changes, ensure endHour remains strictly after startHour
      if (field === 'startHour') {
        const startH = parseInt(value.split(':')[0] || '8', 10);
        const endH = parseInt((next.endHour || '09:00').split(':')[0], 10);
        if (!(endH > startH)) {
          const adjusted = Math.min(startH + 1, 23);
          next.endHour = `${String(adjusted).padStart(2, '0')}:00`;
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate time window and ordering
    const startH = parseInt((formData.startHour || '08:00').split(':')[0], 10);
    const endH = parseInt((formData.endHour || '09:00').split(':')[0], 10);
    if (startH < 8 || endH > 23) {
      // Out of bounds
      toast({ title: t.error, description: t.timeOutOfBounds || 'Please select times between 08:00 and 23:00' });
      return;
    }
    if (endH <= startH) {
      toast({ title: t.error, description: t.invalidTimeRange || 'End time must be after start time' });
      return;
    }
    setLoading(true);
    // Optimistically add to schedule view immediately
    try {
      const day = formData.dateOfDay ? new Date(formData.dateOfDay).getDay() : 0;
      const groupObj = groups.find((g: any) => String(g.id) === formData.assignedGroup);
      onAdd?.({
        id: String(Date.now()),
        title: formData.title || formData.category,
        subject: formData.category,
        teacher: (teachers.find((t:any) => String(t.id) === formData.teacher)?.full_name) || '',
        group: groupObj ? groupObj.name : '',
        classroom: '-',
        startTime: formData.startHour,
        endTime: formData.endHour,
        day,
        level: formData.level,
        students: 0,
        color: 'bg-blue-500',
      });
    } catch {}

    // Persist course in backend
    const created = await coursesApi.create({
      name: formData.title || formData.category,
      teacher_id: formData.teacher ? Number(formData.teacher) : null,
      group_id: formData.assignedGroup ? Number(formData.assignedGroup) : null,
    });

    // Persist course meta (fee, start_date, duration) if available
    try {
      const durationHours = Math.max(1, endH - startH);
      await coursesApi.upsertMeta(Number(created?.id), {
        fee: formData.fee ? Number(formData.fee) : null,
        start_date: formData.dateOfDay || null,
        duration: `${durationHours}h`,
      });
    } catch {}

    toast({
      title: t.courseCreatedSuccessfully,
      description: `${formData.title}`,
    });

    setLoading(false);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      title: "",
      category: "",
      level: "",
      teacher: "",
      dateOfDay: "",
      startHour: "08:00",
      endHour: "09:00",
      fee: "",
      assignedGroup: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t.addCourse}
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
                placeholder={t.placeholder}
                required
              />
            </div>


            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t.subject} *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectSubject} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">{t.level} *</Label>
                <Select value={formData.level} onValueChange={(value) => handleInputChange("level", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectLevel} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    {teachers.map((teacher: any) => (
                      <SelectItem key={teacher.id} value={String(teacher.id)}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfDay">{t.startDate} *</Label>
                <Input
                  id="dateOfDay"
                  type="date"
                  value={formData.dateOfDay}
                  onChange={(e) => handleInputChange("dateOfDay", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startHour">{t.startTime} *</Label>
                <Select value={formData.startHour} onValueChange={(value) => handleInputChange("startHour", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.startTime} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 16 }, (_, i) => {
                      const hour = String(8 + i).padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endHour">{t.endTime} *</Label>
                <Select value={formData.endHour} onValueChange={(value) => handleInputChange("endHour", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.endTime} />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const sH = parseInt((formData.startHour || '08:00').split(':')[0], 10);
                      const from = Math.max(9, sH + 1); // strictly after start
                      const count = Math.max(0, 24 - from); // from..23 inclusive
                      return Array.from({ length: count }, (_, i) => String(from + i).padStart(2, '0')).map((hour) => (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedGroup">{t.assignToGroup}</Label>
                <Select value={formData.assignedGroup} onValueChange={(value) => handleInputChange("assignedGroup", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectGroup} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group: any) => (
                      <SelectItem key={group.id} value={String(group.id)}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.durationAndPricing}</h3>
            
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
                  placeholder="Enter fee in MAD"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t.loading : t.addCourse}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseModal;