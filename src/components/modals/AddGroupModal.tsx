import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { teachersApi, subjectsApi, levelsApi } from "@/lib/api";

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (group: any) => void;
}

export const AddGroupModal = ({ isOpen, onClose, onAdd }: AddGroupModalProps) => {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    grade: '',
    subjects: [] as string[],
    teachers: [] as string[],
    classroom: '',
    capacity: '',
    schedule: ''
  });

  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);
  const [levelOptions, setLevelOptions] = useState<any[]>([]);
  const [gradeOptions, setGradeOptions] = useState<any[]>([]);
  
  // Load levels, subjects, and teachers from backend when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    (async () => {
      try {
        const [levels, subjects, teachers] = await Promise.all([
          levelsApi.list({ active_only: true }).catch(() => []),
          subjectsApi.list().catch(() => []),
          teachersApi.list().catch(() => [])
        ]);
        
        if (!alive) return;
        
        // Set levels
        setLevelOptions(Array.isArray(levels) ? levels : []);
        
        // Set subjects
        const subjectNames = Array.isArray(subjects) ? (subjects as any[]).map(x => x.name).filter(Boolean) : [];
        setSubjectOptions(Array.from(new Set(subjectNames)).sort((a,b)=>a.localeCompare(b)));
        
        // Set teachers
        const teacherNames = Array.isArray(teachers) ? (teachers as any[]).map(t => String(t.full_name || '')).filter(Boolean) : [];
        setTeacherOptions(Array.from(new Set(teacherNames)));
        
      } catch (error) {
        console.error('Failed to load form data:', error);
        // Fallback to empty arrays
        setLevelOptions([]);
        setSubjectOptions([]);
        setTeacherOptions([]);
      }
    })();
    return () => { alive = false; };
  }, [isOpen]);
  
  // Update grade options when level changes
  useEffect(() => {
    if (formData.level) {
      const selectedLevel = levelOptions.find(level => level.name === formData.level);
      setGradeOptions(selectedLevel?.grades || []);
    } else {
      setGradeOptions([]);
    }
  }, [formData.level, levelOptions]);

  const handleTeacherToggle = (teacher: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      teachers: checked 
        ? [...prev.teachers, teacher]
        : prev.teachers.filter(t => t !== teacher)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Classroom and schedule are now optional; subject can be multiple via checkboxes
    if (!formData.name || !formData.level || !formData.grade || 
        formData.teachers.length === 0 || !formData.capacity) {
      return;
    }

    const newGroup = {
      id: Date.now(),
      name: formData.name,
      level: formData.level,
      grade: formData.grade,
      subject: formData.subjects.join(', '),
      subjects: formData.subjects,
      teacher: formData.teachers.join(', '),
      teachers: formData.teachers,
      classroom: formData.classroom,
      capacity: parseInt(formData.capacity),
      enrolled: 0,
      schedule: formData.schedule,
      students: []
    };

      onAdd(newGroup);
      
      // Show success and next steps
      toast({
        title: "Group Created Successfully",
        description: `${newGroup.name} has been created and is ready for course assignment.`,
      });
      
      // Reset form
      setFormData({
        name: '',
        level: '',
        grade: '',
        subjects: [],
        teachers: [],
        classroom: '',
        capacity: '',
        schedule: ''
      });
      
      onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
            <DialogTitle>{t.newGroup}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t.groupName}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., 1st Bac Sciences - Group A"
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
                  {levelOptions.map((level) => (
                    <SelectItem key={level.id} value={level.name}>{level.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grade">{t.class}</Label>
              <Select value={formData.grade} onValueChange={(value) => setFormData({...formData, grade: value, subjects: []})}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectClass} />
                </SelectTrigger>
                <SelectContent>
                  {formData.level && moroccanLevels[formData.level as keyof typeof moroccanLevels]?.grades.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>{grade.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t.subjects}</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                {subjectOptions.map((s, idx) => {
                  const id = `group-subj-${idx}`;
                  const checked = formData.subjects.includes(s);
                  return (
                    <div key={id} className="flex items-center space-x-2">
                      <Checkbox id={id} checked={checked} onCheckedChange={(c)=>{
                        setFormData(prev => ({
                          ...prev,
                          subjects: (c as boolean) ? [...prev.subjects, s] : prev.subjects.filter(x => x !== s)
                        }));
                      }} />
                      <Label htmlFor={id} className="text-sm truncate">{s}</Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t.teachers} *</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
              {teacherOptions.map((teacher) => (
                <div key={teacher} className="flex items-center space-x-2">
                  <Checkbox
                    id={teacher}
                    checked={formData.teachers.includes(teacher)}
                    onCheckedChange={(checked) => handleTeacherToggle(teacher, checked as boolean)}
                  />
                  <Label htmlFor={teacher} className="text-sm">{teacher}</Label>
                </div>
              ))}
            </div>
            {formData.teachers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.teachers.map((teacher) => (
                  <Badge key={teacher} variant="secondary" className="text-xs">
                    {teacher}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="classroom">{t.room}</Label>
              <Input
                id="classroom"
                value={formData.classroom}
                onChange={(e) => setFormData({...formData, classroom: e.target.value})}
                placeholder={language === 'en' ? 'e.g., Room 101' : language === 'fr' ? 'ex., Salle 101' : 'مثل، قاعة 101'}
              />
            </div>

            <div>
              <Label htmlFor="capacity">{t.capacity} ({t.flexible})</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                placeholder={language === 'en' ? 'e.g., 25' : language === 'fr' ? 'ex., 25' : 'مثل، 25'}
                min="1"
                max="50"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                ℹ️ {t.morePeopleCanBeAdded}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="schedule">{t.scheduleManagement}</Label>
            <Input
              id="schedule"
              value={formData.schedule}
              onChange={(e) => setFormData({...formData, schedule: e.target.value})}
              placeholder={language === 'en' ? 'e.g., Mon-Wed-Fri 8h-10h' : language === 'fr' ? 'ex., Lun-Mer-Ven 8h-10h' : 'مثل، الاثنين-الأربعاء-الجمعة 8-10'}
            />
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