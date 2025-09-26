import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { teachersApi, subjectsApi } from "@/lib/api";
import { UserCheck, Mail, Phone, GraduationCap, BookOpen } from "lucide-react";

interface AddTeacherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: (teacher: any) => void;
}

const AddTeacherModal = ({ open, onOpenChange, onAdded }: AddTeacherModalProps) => {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subjects: [] as string[],
    qualification: "",
    experience: "",
    salary: "",
    joiningDate: "",
    address: ""
  });

  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  // Load DB-backed subjects
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubjectChange = (subjectLabel: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjects: checked 
        ? [...prev.subjects, subjectLabel]
        : prev.subjects.filter(s => s !== subjectLabel)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Persist to backend so teachers are available across the app (e.g., Add Course)
    try {
      const full_name = `${formData.firstName} ${formData.lastName}`.trim();
      const created = await teachersApi.create({
        full_name,
        speciality: (formData.subjects[0] || "") || null,
        email: formData.email || null,
        phone: formData.phone || null,
      });
      onAdded?.(created);
      toast({
        title: "Teacher Added Successfully",
        description: `${formData.firstName} ${formData.lastName} has been registered.`,
      });
    } catch {
      // If backend fails, still show an error toast
      toast({ title: "Error", description: "Failed to add teacher", variant: "destructive" });
    }

    setLoading(false);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subjects: [],
      qualification: "",
      experience: "",
      salary: "",
      joiningDate: "",
      address: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {t.addTeacher}
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
                    // email is optional by request
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

            <div className="space-y-2">
              <Label htmlFor="address">{t.address}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.academicInformation}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="joiningDate">{t.joiningDate || 'Joining Date'} *</Label>
              <Input
                id="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={(e) => handleInputChange("joiningDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t.subjects} *</Label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {subjectOptions.map((label, idx) => {
                  const id = `teacher-subj-${idx}`;
                  return (
                    <div key={id} className="flex items-center space-x-2">
                      <Checkbox
                        id={id}
                        checked={formData.subjects.includes(label)}
                        onCheckedChange={(checked) => handleSubjectChange(label, checked as boolean)}
                      />
                      <Label htmlFor={id} className="text-sm">{label}</Label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qualification">Highest Qualification *</Label>
                <Input
                  id="qualification"
                  placeholder="e.g., M.Sc., B.Ed."
                  value={formData.qualification}
                  onChange={(e) => handleInputChange("qualification", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (years) *</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={formData.experience}
                  onChange={(e) => handleInputChange("experience", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">{t.salary || 'Salary'} (Monthly)</Label>
              <Input
                id="salary"
                type="number"
                placeholder="Enter monthly salary"
                value={formData.salary}
                onChange={(e) => handleInputChange("salary", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t.loading : t.addTeacher}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeacherModal;