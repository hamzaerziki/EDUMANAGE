import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Mail, Phone } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { subjectsApi } from "@/lib/api";

interface EditTeacherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: any;
  onSave: (updatedTeacher: any) => void;
}

const EditTeacherModal = ({ open, onOpenChange, teacher, onSave }: EditTeacherModalProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subjects: [] as string[],
    status: "",
    experience: ""
  });

  // Load subjects from DB
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState<boolean>(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      setSubjectsLoading(true);
      setSubjectsError(null);
      try {
        const subs = await subjectsApi.list();
        if (!alive) return;
        const names = Array.isArray(subs) ? (subs as any[]).map(s => s.name).filter(Boolean) : [];
        setSubjectOptions(Array.from(new Set(names)).sort((a,b)=>a.localeCompare(b)));
      } catch (e:any) {
        setSubjectOptions([]);
        setSubjectsError(e?.message || 'Failed to load subjects');
      }
      setSubjectsLoading(false);
    })();
    return () => { alive = false; };
  }, [open]);

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || "",
        email: teacher.email || "",
        phone: teacher.phone || "",
        subjects: teacher.subjects || [],
        status: teacher.status || "",
        experience: teacher.experience || ""
      });
    }
  }, [teacher]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubjectChange = (subject: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjects: checked 
        ? [...prev.subjects, subject]
        : prev.subjects.filter(s => s !== subject)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedTeacher = {
      ...teacher,
      ...formData
    };

    onSave(updatedTeacher);

    toast({
      title: "Teacher Updated",
      description: `${formData.name} has been updated successfully.`,
    });

    setLoading(false);
    onOpenChange(false);
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {t.editTeacher}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.professionalInformation || 'Professional Information'}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="experience">{t.experience || 'Experience'} *</Label>
              <Input
                id="experience"
                value={formData.experience}
                onChange={(e) => handleInputChange("experience", e.target.value)}
                placeholder="e.g., 5 years"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t.subjectsTeaching || 'Subjects Teaching'} *</Label>
              {subjectsLoading ? (
                <div className="text-sm text-muted-foreground">Chargement des matières…</div>
              ) : subjectsError ? (
                <div className="text-sm text-red-600">{subjectsError}</div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {subjectOptions.map((label, idx) => {
                    const id = `edit-teacher-subj-${idx}`;
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
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t.status}</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t.active}</SelectItem>
                  <SelectItem value="inactive">{t.inactive}</SelectItem>
                </SelectContent>
              </Select>
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

export default EditTeacherModal;