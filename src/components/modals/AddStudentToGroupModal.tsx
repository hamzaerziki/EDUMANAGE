import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Mail, Phone } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { studentsApi } from "@/lib/api";

interface AddStudentToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudents: (students: any[]) => void;
  group: any | null;
}

export const AddStudentToGroupModal = ({ isOpen, onClose, onAddStudents, group }: AddStudentToGroupModalProps) => {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!isOpen) return;
      setLoading(true);
      try {
        const data = await studentsApi.list();
        setAllStudents(Array.isArray(data) ? data : []);
      } catch {
        setAllStudents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen]);

  const availableStudents = useMemo(() => {
    // Only show students who are NOT assigned to any group (group_id is null/undefined)
    const unassignedStudents = (allStudents || []).filter((s: any) => {
      return s.group_id === null || s.group_id === undefined || s.group_id === '';
    });
    
    console.log('🔍 All students:', allStudents.length);
    console.log('🎯 Unassigned students (available for groups):', unassignedStudents.length);
    
    const term = (searchTerm || '').trim().toLowerCase();
    const filtered = term
      ? unassignedStudents.filter((s: any) => 
          String(s.full_name || s.name || '').toLowerCase().includes(term) || 
          String(s.email || '').toLowerCase().includes(term)
        )
      : unassignedStudents;
    
    // Normalize to UI shape
    return filtered.map((s: any) => ({
      id: s.id,
      name: s.full_name || s.name || `Student ${s.id}`,
      email: s.email || '',
      phone: s.phone || '',
      avatar: null,
      level: '',
      grade: '',
    }));
  }, [allStudents, searchTerm]);

  const handleStudentSelect = (studentId: number, checked: boolean) => {
    if (checked && selectedStudents.length >= (group?.capacity - group?.enrolled || 0)) {
      toast({
        title: t.warning,
        description: t.groupFull,
        variant: "destructive"
      });
      return;
    }
    
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) return;
    
    setLoading(true);
    
    try {
      // Get selected real student objects
      const studentsToAdd = availableStudents.filter(student => selectedStudents.includes(student.id));
       
      onAddStudents(studentsToAdd);
       
      toast({
        title: t.success,
      });
    } catch (error) {
      toast({
        title: t.error,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
    
    setSelectedStudents([]);
    setSearchTerm("");
    onClose();
  };

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.groupAddStudent} - {group.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t.searchGroupsPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Available capacity info */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">{t.capacity}:</span>
              <Badge variant="outline">
                {group.enrolled}/{group.capacity}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{t.availableSpots}</span>
              <Badge variant="secondary">
                {group.capacity - group.enrolled}
              </Badge>
            </div>
          </div>

          {/* Students Table */}
          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
            {availableStudents.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm ? 'Aucun étudiant trouvé' : 'Aucun étudiant disponible'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Aucun étudiant non assigné ne correspond à votre recherche.'
                    : 'Tous les étudiants sont déjà assignés à des groupes. Créez de nouveaux étudiants pour les ajouter à ce groupe.'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>{t.groupStudent}</TableHead>
                    <TableHead>{t.groupContact}</TableHead>
                    <TableHead>{t.level}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                          disabled={!selectedStudents.includes(student.id) && selectedStudents.length >= (group.capacity - group.enrolled)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {String(student.id).padStart(4, '0')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-xs">
                            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="truncate max-w-[120px]">{student.email}</span>
                          </div>
                          <div className="flex items-center text-xs">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            {student.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{student.level}</p>
                          <p className="text-xs text-muted-foreground">{student.grade}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {selectedStudents.length > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium">
                {selectedStudents.length} {t.students} {language === 'fr' ? 'sélectionné(s)' : language === 'ar' ? 'مختار' : 'selected'}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={selectedStudents.length === 0 || loading}
            >
              {loading ? t.loading : `${t.add} (${selectedStudents.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};