import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Calendar, GraduationCap } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { subjectsApi } from "@/lib/api";

interface EditStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  onSave: (updatedStudent: any) => void;
}

const EditStudentModal = ({ open, onOpenChange, student, onSave }: EditStudentModalProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [subjectQuery, setSubjectQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    class: "",
    status: "",
    gpa: "",
    attendance: "",
    enrolledCourses: [] as string[]
  });
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const subs = await subjectsApi.list();
        if (!alive) return;
        const names = Array.isArray(subs) ? (subs as any[]).map(s => s.name).filter(Boolean) : [];
        setSubjectOptions(Array.from(new Set(names)).sort((a,b)=>a.localeCompare(b)));
      } catch {
        setSubjectOptions([]);
      }
    })();
    return () => { alive = false; };
  }, [open]);

  // Moroccan curriculum grades
  const moroccanGrades = [
    { value: "1ere-bac-sciences-maths", label: "1ère BAC Sciences Mathématiques" },
    { value: "1ere-bac-sciences-exp", label: "1ère BAC Sciences Expérimentales" },
    { value: "1ere-bac-lettres", label: "1ère BAC Lettres et Sciences Humaines" },
    { value: "2eme-bac-sciences-maths", label: "2ème BAC Sciences Mathématiques" },
    { value: "2eme-bac-sciences-exp", label: "2ème BAC Sciences Expérimentales" },
    { value: "2eme-bac-sciences-eco", label: "2ème BAC Sciences Économiques" },
    { value: "2eme-bac-lettres", label: "2ème BAC Lettres et Sciences Humaines" },
    { value: "tronc-commun-sciences", label: "Tronc Commun Sciences" },
    { value: "tronc-commun-lettres", label: "Tronc Commun Lettres" },
    { value: "college-3eme", label: "3ème Collège" },
    { value: "college-2eme", label: "2ème Collège" },
    { value: "college-1ere", label: "1ère Collège" }
  ];

  const filteredSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    if (!q) return subjectOptions;
    return subjectOptions.filter(s => s.toLowerCase().includes(q));
  }, [subjectOptions, subjectQuery]);

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        grade: student.grade || "",
        class: student.class || "",
        status: student.status || "",
        gpa: student.gpa?.toString() || "",
        attendance: student.attendance?.toString() || "",
        enrolledCourses: student.enrolledCourses || []
      });
    }
  }, [student]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCourseToggle = (courseLabel: string) => {
    setFormData(prev => ({
      ...prev,
      enrolledCourses: prev.enrolledCourses.includes(courseLabel)
        ? prev.enrolledCourses.filter(id => id !== courseLabel)
        : [...prev.enrolledCourses, courseLabel]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedStudent = {
      ...student,
      ...formData,
      gpa: formData.gpa ? parseFloat(formData.gpa) : null,
      attendance: formData.attendance ? parseInt(formData.attendance) : null
    };

    onSave(updatedStudent);

    toast({
      title: "Student Updated",
      description: `${formData.name} has been updated successfully.`,
    });

    setLoading(false);
    onOpenChange(false);
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t.editStudent || t.studentDetails || 'Edit Student'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.personalInformation}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">{t.name || 'Full Name'} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder={t.optional}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t.phone} *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.academicInformation}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">{t.grade} *</Label>
                <Select value={formData.grade} onValueChange={(value) => handleInputChange("grade", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectGrade || t.grade} />
                  </SelectTrigger>
                  <SelectContent>
                    {moroccanGrades.map((grade) => (
                      <SelectItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">{t.class}</Label>
                <Input
                  id="class"
                  value={formData.class}
                  onChange={(e) => handleInputChange("class", e.target.value)}
                  placeholder="e.g., 9A, 10B"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">{t.status}</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.allStatus || 'Select Status'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t.active}</SelectItem>
                    <SelectItem value="inactive">{t.inactive}</SelectItem>
                    <SelectItem value="pending">{t.pending}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpa">{t.average} (/{20})</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={formData.gpa}
                  onChange={(e) => handleInputChange("gpa", e.target.value)}
                  placeholder="0.0 - 20.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendance">{t.attendanceRate} (%)</Label>
                <Input
                  id="attendance"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.attendance}
                  onChange={(e) => handleInputChange("attendance", e.target.value)}
                  placeholder="0-100"
                />
              </div>
            </div>
          </div>

          {/* Course Enrollment */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.courseEnrollment}</h3>
            <Input
              placeholder={t.searchPlaceholder}
              value={subjectQuery}
              onChange={(e)=>setSubjectQuery(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {filteredSubjects.map((label, idx) => {
                const id = `sub-${idx}`;
                const checked = formData.enrolledCourses.includes(label);
                return (
                  <div key={id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={id}
                      checked={checked}
                      onChange={() => handleCourseToggle(label)}
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <Label htmlFor={id} className="text-sm font-normal">
                      {label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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

export default EditStudentModal;