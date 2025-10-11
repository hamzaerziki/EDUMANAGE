import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { studentsApi } from "@/lib/api";
import { subjectsApi } from "@/lib/api";
import { User, Mail, Phone, Calendar } from "lucide-react";

interface AddStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (student: any) => void;
  defaultGroupId?: number | null;
}

const AddStudentModal = ({ open, onOpenChange, onCreated, defaultGroupId }: AddStudentModalProps) => {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    grade: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    address: "",
    enrolledCourses: [] as string[]
  });
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  // Complete Moroccan curriculum grades (Primary → Collège → Lycée)
  const moroccanGrades = [
    // Primaire
    { value: "1ap", label: "1ère Année Primaire", level: "Primaire" },
    { value: "2ap", label: "2ème Année Primaire", level: "Primaire" },
    { value: "3ap", label: "3ème Année Primaire", level: "Primaire" },
    { value: "4ap", label: "4ème Année Primaire", level: "Primaire" },
    { value: "5ap", label: "5ème Année Primaire", level: "Primaire" },
    { value: "6ap", label: "6ème Année Primaire", level: "Primaire" },
    
    // Collège
    { value: "1ac", label: "1ère Année Collège", level: "Collège" },
    { value: "2ac", label: "2ème Année Collège", level: "Collège" },
    { value: "3ac", label: "3ème Année Collège", level: "Collège" },
    
    // Lycée - Tronc Commun
    { value: "tc-sci", label: "Tronc Commun Sciences", level: "Lycée" },
    { value: "tc-let", label: "Tronc Commun Lettres", level: "Lycée" },
    { value: "tc-tech", label: "Tronc Commun Technologique", level: "Lycée" },
    
    // Lycée - 1ère Année Bac
    { value: "1bac-sci-math", label: "1ère Année Bac Sciences Math", level: "Lycée" },
    { value: "1bac-sci-exp", label: "1ère Année Bac Sciences Exp", level: "Lycée" },
    { value: "1bac-let", label: "1ère Année Bac Lettres", level: "Lycée" },
    { value: "1bac-hum", label: "1ère Année Bac Sciences Humaines", level: "Lycée" },
    { value: "1bac-eco", label: "1ère Année Bac Économie", level: "Lycée" },
    
    // Lycée - 2ème Année Bac
    { value: "2bac-pc", label: "2ème Année Bac PC", level: "Lycée" },
    { value: "2bac-svt", label: "2ème Année Bac SVT", level: "Lycée" },
    { value: "2bac-math", label: "2ème Année Bac Math", level: "Lycée" },
    { value: "2bac-let", label: "2ème Année Bac Lettres", level: "Lycée" },
    { value: "2bac-hum", label: "2ème Année Bac Sciences Humaines", level: "Lycée" },
    { value: "2bac-eco", label: "2ème Année Bac Économie", level: "Lycée" }
  ];

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
        ? prev.enrolledCourses.filter(lbl => lbl !== courseLabel)
        : [...prev.enrolledCourses, courseLabel]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const full_name = `${(formData.firstName || '').trim()} ${(formData.lastName || '').trim()}`.trim();
      if (!full_name) throw new Error('Full name is required');
      const payload = {
        full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        birth_date: formData.dateOfBirth || null,
        gender: null as any,
        address: formData.address || null,
        group_id: (typeof defaultGroupId === 'number' ? defaultGroupId : null) as any,
        status: 'active' as const,
      };
      const created = await studentsApi.create(payload);
      toast({
        title: t.success,
        description: `${full_name} ${language==='fr'?'ajouté(e)':'added'}${language==='ar'?'':'.'}`,
      });
      try { onCreated && onCreated(created); } catch {}
      onOpenChange(false);
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        grade: "",
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        address: "",
        enrolledCourses: []
      });
    } catch (err: any) {
      let msg = (err?.message || 'Failed to add student').slice(0, 300);
      if (msg.includes('duplicate key value violates unique constraint')) {
        msg = 'A student with this email already exists.';
      }
      toast({ title: t.error, description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t.addStudent}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.personalInformation}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t.firstName} *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t.lastName} *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                />
              </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t.dateOfBirth} *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dateOfBirth"
                    type="date"
                    className="pl-10"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">{t.grade} *</Label>
                <Select value={formData.grade} onValueChange={(value) => handleInputChange("grade", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectGrade || t.grade} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Group by level */}
                    <div className="p-2">
                      <div className="font-semibold text-sm text-blue mb-2">🎒 {t.groupPrimary}</div>
                      {moroccanGrades.filter(g => g.level === "Primaire").map((grade) => (
                        <SelectItem key={grade.value} value={grade.value}>
                          {grade.label}
                        </SelectItem>
                      ))}
                    </div>
                    <div className="p-2">
                      <div className="font-semibold text-sm text-green mb-2">🎓 {t.groupMiddle}</div>
                      {moroccanGrades.filter(g => g.level === "Collège").map((grade) => (
                        <SelectItem key={grade.value} value={grade.value}>
                          {grade.label}
                        </SelectItem>
                      ))}
                    </div>
                    <div className="p-2">
                      <div className="font-semibold text-sm text-purple mb-2">🏆 {t.groupHigh}</div>
                      {moroccanGrades.filter(g => g.level === "Lycée").map((grade) => (
                        <SelectItem key={grade.value} value={grade.value}>
                          {grade.label}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.parentInformation}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="parentName">{t.parentName} *</Label>
              <Input
                id="parentName"
                value={formData.parentName}
                onChange={(e) => handleInputChange("parentName", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentPhone">{t.parentPhone} *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="parentPhone"
                    className="pl-10"
                    value={formData.parentPhone}
                    onChange={(e) => handleInputChange("parentPhone", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentEmail">{t.parentEmail}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="parentEmail"
                    type="email"
                    className="pl-10"
                    value={formData.parentEmail}
                    onChange={(e) => handleInputChange("parentEmail", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t.address}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>
          </div>

          {/* Course Enrollment */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.courseEnrollment}</h3>
            <div className="grid grid-cols-2 gap-3">
              {subjectOptions.map((label, idx) => {
                const id = `subj-${idx}`;
                return (
                  <div key={id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={id}
                      checked={formData.enrolledCourses.includes(label)}
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

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t.loading : t.addStudent}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentModal;