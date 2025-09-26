import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Edit, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { subjectsApi } from "@/lib/api";

interface Subject {
  id: number;
  name: string;
  category: string;
  description?: string;
  isActive: boolean;
}

const SubjectList = () => {
  console.log('SubjectList component is loading...');
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const loadSubjects = async () => {
    try {
      const data = await subjectsApi.list();
      setSubjects((data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category || 'General',
        description: s.description || '',
        isActive: s.is_active !== false,
      })));
    } catch (e: any) {
      toast({ title: t.error, description: e?.message || 'Failed to load subjects', variant: 'destructive' });
      setSubjects([]);
    }
  };

  useEffect(() => { loadSubjects(); }, []);

  const [newSubject, setNewSubject] = useState({
    name: "",
    category: "",
    description: ""
  });

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) {
      toast({ title: "Error", description: "Subject name is required", variant: "destructive" });
      return;
    }
    try {
      const created = await subjectsApi.create({
        name: newSubject.name.trim(),
        category: newSubject.category || null,
        description: newSubject.description || null,
        is_active: true,
      });
      setSubjects(prev => ([...prev, {
        id: created.id,
        name: created.name,
        category: created.category || 'General',
        description: created.description || '',
        isActive: created.is_active !== false,
      }]));
      setNewSubject({ name: "", category: "", description: "" });
      setIsAddModalOpen(false);
      toast({ title: "Success", description: "Subject added successfully" });
    } catch (e: any) {
      const msg = e?.message?.slice(0, 200) || 'Failed to create subject';
      toast({ title: t.error, description: msg, variant: 'destructive' });
    }
  };

  const handleEditSubject = async () => {
    if (!selectedSubject || !selectedSubject.name.trim()) {
      toast({ title: "Error", description: "Subject name is required", variant: "destructive" });
      return;
    }
    try {
      const updated = await subjectsApi.update(selectedSubject.id, {
        name: selectedSubject.name.trim(),
        category: selectedSubject.category || null,
        description: selectedSubject.description || null,
        is_active: selectedSubject.isActive,
      });
      setSubjects(prev => prev.map(s => s.id === updated.id ? ({
        id: updated.id,
        name: updated.name,
        category: updated.category || 'General',
        description: updated.description || '',
        isActive: updated.is_active !== false,
      }) : s));
      setIsEditModalOpen(false);
      setSelectedSubject(null);
      toast({ title: "Success", description: "Subject updated successfully" });
    } catch (e: any) {
      const msg = e?.message?.slice(0, 200) || 'Failed to update subject';
      toast({ title: t.error, description: msg, variant: 'destructive' });
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    try {
      await subjectsApi.remove(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
      toast({ title: "Success", description: "Subject deleted successfully" });
    } catch (e: any) {
      const msg = e?.message?.slice(0, 200) || 'Failed to delete subject';
      toast({ title: t.error, description: msg, variant: 'destructive' });
    }
  };

  const openEditModal = (subject: Subject) => {
    setSelectedSubject({ ...subject });
    setIsEditModalOpen(true);
  };

  const categories = Array.from(new Set(subjects.map(s => s.category || 'General')));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.subjectsManagement}</h1>
          <p className="text-muted-foreground">{t.overview}</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4" />
              {t.addSubject}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addSubject}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject-name">{t.subjectName} *</Label>
                <Input
                  id="subject-name"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  placeholder="e.g., Advanced Mathematics"
                />
              </div>
              <div>
                <Label htmlFor="subject-category">{t.category}</Label>
                <Select value={newSubject.category} onValueChange={(value) => setNewSubject({...newSubject, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sciences">Sciences</SelectItem>
                    <SelectItem value="Languages">Languages</SelectItem>
                    <SelectItem value="Humanities">Humanities</SelectItem>
                    <SelectItem value="Social Sciences">Social Sciences</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Arts">Arts</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject-description">{t.description}</Label>
                <Input
                  id="subject-description"
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                  placeholder="Brief description of the subject"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  {t.cancel}
                </Button>
                <Button onClick={handleAddSubject}>{t.addSubject}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {subjects.filter(s => s.isActive).length} {t.activeSubjects}
        </Badge>
      </div>

      {/* Categories Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {categories.map(category => (
          <Card key={category}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">{category}</p>
                  <p className="text-xs text-muted-foreground">
                    {subjects.filter(s => s.category === category && s.isActive).length} subjects
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subjects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSubjects.map((subject) => (
          <Card key={subject.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {subject.category}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(subject)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {subject.description && (
                <p className="text-sm text-muted-foreground">{subject.description}</p>
              )}
              <div className="mt-3 pt-3 border-t">
                <Badge variant={subject.isActive ? "default" : "secondary"}>
                  {subject.isActive ? t.active : t.inactive}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Edit Subject Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editSubject}</DialogTitle>
          </DialogHeader>
          {selectedSubject && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-subject-name">{t.subjectName} *</Label>
                <Input
                  id="edit-subject-name"
                  value={selectedSubject.name}
                  onChange={(e) => setSelectedSubject({...selectedSubject, name: e.target.value})}
                  placeholder="e.g., Advanced Mathematics"
                />
              </div>
              <div>
                <Label htmlFor="edit-subject-category">{t.category}</Label>
                <Select value={selectedSubject.category} onValueChange={(value) => setSelectedSubject({...selectedSubject, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sciences">Sciences</SelectItem>
                    <SelectItem value="Languages">Languages</SelectItem>
                    <SelectItem value="Humanities">Humanities</SelectItem>
                    <SelectItem value="Social Sciences">Social Sciences</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Arts">Arts</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-subject-description">{t.description}</Label>
                <Input
                  id="edit-subject-description"
                  value={selectedSubject.description || ""}
                  onChange={(e) => setSelectedSubject({...selectedSubject, description: e.target.value})}
                  placeholder="Brief description of the subject"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  {t.cancel}
                </Button>
                <Button onClick={handleEditSubject}>{t.save}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectList;