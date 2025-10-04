import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/useTranslation";
import { teachersApi, subjectsApi } from "@/lib/api";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (group: any) => void;
  group: any | null;
}

export const EditGroupModal = ({ isOpen, onClose, onEdit, group }: EditGroupModalProps) => {
  const { t, language } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    level: "",
    grade: "",
    subjects: [] as string[],
    teachers: [] as string[],
    schedule: "",
    classroom: "",
    capacity: ""
  });

  // DB-backed options
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);

  // Load teachers and subjects from backend when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    (async () => {
      try {
        const [tList, sList] = await Promise.all([
          teachersApi.list().catch(() => []),
          subjectsApi.list().catch(() => []),
        ]);
        if (!alive) return;
        const tNames = Array.isArray(tList) ? (tList as any[]).map((t:any)=> String(t.full_name || '')).filter(Boolean) : [];
        const sNames = Array.isArray(sList) ? (sList as any[]).map((s:any)=> String(s.name || '')).filter(Boolean) : [];
        setTeacherOptions(Array.from(new Set(tNames)));
        setSubjectOptions(Array.from(new Set(sNames)).sort((a,b)=>a.localeCompare(b)));
      } catch {
        setTeacherOptions([]);
        setSubjectOptions([]);
      }
    })();
    return () => { alive = false; };
  }, [isOpen]);

  // Moroccan curriculum levels and grades
  const moroccanLevels = {
    "primaire": {
      label: "Primaire",
      grades: [
        { value: "primaire-1ere", label: "1ère Année Primaire" },
        { value: "primaire-2eme", label: "2ème Année Primaire" },
        { value: "primaire-3eme", label: "3ème Année Primaire" },
        { value: "primaire-4eme", label: "4ème Année Primaire" },
        { value: "primaire-5eme", label: "5ème Année Primaire" },
        { value: "primaire-6eme", label: "6ème Année Primaire" }
      ]
    },
    "college": {
      label: "Collège",
      grades: [
        { value: "college-1ere", label: "1ère Année Collège" },
        { value: "college-2eme", label: "2ème Année Collège" },
        { value: "college-3eme", label: "3ème Année Collège" }
      ]
    },
    "lycee": {
      label: "Lycée",
      grades: [
        { value: "tronc-commun-sciences", label: "Tronc Commun Sciences" },
        { value: "tronc-commun-lettres", label: "Tronc Commun Lettres" },
        { value: "1ere-bac-sciences-maths", label: "1ère BAC Sciences Mathématiques" },
        { value: "1ere-bac-sciences-exp", label: "1ère BAC Sciences Expérimentales" },
        { value: "1ere-bac-lettres", label: "1ère BAC Lettres et Sciences Humaines" },
        { value: "2eme-bac-sciences-maths", label: "2ème BAC Sciences Mathématiques" },
        { value: "2eme-bac-sciences-exp", label: "2ème BAC Sciences Expérimentales" },
        { value: "2eme-bac-sciences-eco", label: "2ème BAC Sciences Économiques" },
        { value: "2eme-bac-lettres", label: "2ème BAC Lettres et Sciences Humaines" }
      ]
    }
  };

  useEffect(() => {
    if (group) {
      // Map label level to key if needed
      const levelKey = (() => {
        const val = (group.level || '').toLowerCase();
        if (val.startsWith('primaire')) return 'primaire';
        if (val.startsWith('coll')) return 'college';
        if (val.startsWith('lyc')) return 'lycee';
        return group.level || '';
      })();
      // Map grade label back to value code
      const gradeValue = (() => {
        const label = String(group.grade || '');
        const entries = Object.entries(moroccanLevels);
        for (const [k, lvl] of entries) {
          const found = lvl.grades.find(g => g.label === label);
          if (found) return found.value;
        }
        return group.grade || '';
      })();
      setFormData({
        name: group.name || "",
        level: levelKey,
        grade: gradeValue,
        subjects: Array.isArray(group.subjects) ? group.subjects : (group.subject ? [group.subject] : []),
        teachers: Array.isArray(group.teachers) ? group.teachers : (group.teacher ? [group.teacher] : []),
        schedule: group.schedule || "",
        classroom: group.classroom || "",
        capacity: group.capacity?.toString() || ""
      });
    }
  }, [group]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    
    const updatedGroup = {
      ...group,
      name: formData.name,
      level: moroccanLevels[formData.level as keyof typeof moroccanLevels]?.label || formData.level,
      grade: (moroccanLevels[formData.level as keyof typeof moroccanLevels]?.grades.find(g => g.value === formData.grade)?.label) || formData.grade,
      subjects: formData.subjects,
      // keep backward-compat display fields too
      subject: formData.subjects.join(', '),
      teachers: formData.teachers,
      teacher: formData.teachers.join(', '),
      schedule: formData.schedule,
      classroom: formData.classroom,
      capacity: parseInt(formData.capacity)
    };
    onEdit(updatedGroup);
    onClose();
  };

  if (!group) return null;

  // Available subjects and teachers from backend
  const availableSubjects = subjectOptions;
  const availableTeachers = teacherOptions;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t.groupModify} - {group.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t.groupName}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder={language === 'en' ? 'e.g., 1st Bac Sciences - Group A' : language === 'fr' ? 'ex: 1ère Bac Sciences - Groupe A' : 'مثال: الأولى باك علوم - المجموعة أ'}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="level">{t.level}</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value, grade: "", subjects: []})}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectLevel} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(moroccanLevels).map(([key, level]) => (
                    <SelectItem key={key} value={key}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label>{t.subjects}</Label>
              <div class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                {availableSubjects.map((s, idx) => {
                  const id = `subj-${idx}`;
                  const checked = formData.subjects.includes(s);
                  return (
                    <div key={id} class="flex items-center space-x-2">
                      <Checkbox id={id} checked={checked} onCheckedChange={(c) => {
                        setFormData(prev => ({
                          ...prev,
                          subjects: (c as boolean) ? [...prev.subjects, s] : prev.subjects.filter(x => x !== s)
                        }));
                      }} />
                      <Label htmlFor={id} class="text-sm truncate">{s}</Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t.teachers}</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                {availableTeachers.map((name, idx) => {
                  const id = `teach-${idx}`;
                  const checked = formData.teachers.includes(name);
                  return (
                    <div key={id} className="flex items-center space-x-2">
                      <Checkbox id={id} checked={checked} onCheckedChange={(c) => {
                        setFormData(prev => ({
                          ...prev,
                          teachers: (c as boolean) ? [...prev.teachers, name] : prev.teachers.filter(x => x !== name)
                        }))
                      }} />
                      <Label htmlFor={id} className="text-sm truncate">{name}</Label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="classroom">{t.room}</Label>
              <Input
                id="classroom"
                value={formData.classroom}
                onChange={(e) => setFormData({...formData, classroom: e.target.value})}
                placeholder={language === 'en' ? 'e.g., Room 101' : language === 'fr' ? 'ex: Salle 101' : 'مثل، قاعة 101'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schedule">{t.scheduleManagement}</Label>
              <Input
                id="schedule"
                value={formData.schedule}
                onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                placeholder={language === 'en' ? 'e.g., Mon-Wed-Fri 8h-10h' : language === 'fr' ? 'ex: Lun-Mer-Ven 8h-10h' : 'مثل، الاثنين-الأربعاء-الجمعة 8-10'}
              />
            </div>

            <div>
              <Label htmlFor="capacity">{t.capacity}</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                placeholder={language === 'en' ? 'e.g., 25' : language === 'fr' ? 'ex: 25' : 'مثال: 25'}
                min="1"
                max="50"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit">
              {t.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};