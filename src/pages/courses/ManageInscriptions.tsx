import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, UserMinus, Mail, Phone, ArrowLeft, Users, BookOpen, CheckSquare, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { studentsApi, groupsApi, coursesApi } from "@/lib/api";

const ManageInscriptions = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("enroll");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAssignGroup, setShowAssignGroup] = useState(false);
  const [selectedGroupToAssign, setSelectedGroupToAssign] = useState<string>("");

  useEffect(() => {
    if (!id) {
      navigate('/courses');
      return;
    }

    const loadData = async () => {
      try {
        setPageLoading(true);
        console.log('Loading course data for ID:', id);

        // Load course data first
        const courseData = await coursesApi.get(parseInt(id));
        console.log('Received course data:', courseData);

        if (!courseData) {
          throw new Error('Course data not found');
        }

        // Get all available groups
        const groupsList = await groupsApi.list().catch(err => {
          console.warn('Failed to load groups:', err);
          return [];
        });
        console.log('Available groups:', groupsList);

        // Get all available students
        const studentsList = await studentsApi.list().catch(err => {
          console.warn('Failed to load students:', err);
          return [];
        });
        console.log('Available students:', studentsList);

        // Set state with loaded data
        setCourse(courseData);
        setStudents(Array.isArray(studentsList) ? studentsList : []);
        setGroups(Array.isArray(groupsList) ? groupsList : []);

      } catch (error: any) {
        console.error('Error loading data:', error);
        if (!error.message?.includes('Unauthorized') && !error.message?.includes('Session expired')) {
          toast({
            title: "Erreur",
            description: "Échec du chargement des données du cours",
            variant: "destructive"
          });
        }
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [id, navigate, toast]);

  const groupMap = useMemo(() => {
    const m = new Map<number, any>();
    (groups || []).forEach((g: any) => { 
      if (g && typeof g.id === 'number') m.set(Number(g.id), g); 
    });
    return m;
  }, [groups]);

  const enrolledStudents = useMemo(() => {
    const gid = Number(course?.group_id);
    if (!Number.isFinite(gid)) return [] as any[];
    return (students || [])
      .filter((s: any) => Number(s.group_id) === gid)
      .map((s: any) => ({
        id: s.id,
        name: s.full_name || s.name || '',
        email: s.email || '',
        phone: s.phone || '',
        status: s.status || 'active',
        enrolledDate: s.created_at || null,
      }));
  }, [students, course?.group_id]);

  const availableStudents = useMemo(() => {
    const gid = Number(course?.group_id);
    console.log('Debug - Course group_id:', course?.group_id, 'Parsed as:', gid);
    console.log('Debug - All students:', students);
    console.log('Debug - Students with group_id !== course.group_id:', students.filter((s: any) => Number(s.group_id) !== gid));
    
    return (students || [])
      .filter((s: any) => Number(s.group_id) !== gid)
      .map((s: any) => ({
        id: s.id,
        name: s.full_name || s.name || '',
        email: s.email || '',
        phone: s.phone || '',
        level: groupMap.get(Number(s.group_id))?.level || '',
        currentGroup: groupMap.get(Number(s.group_id))?.name || 'No group',
        status: s.status || 'active',
      }));
  }, [students, course?.group_id, groupMap]);

  const handleEnrollStudent = async (studentId: number) => {
    if (!course?.group_id) return;
    setLoading(true);
    try {
      await studentsApi.update(studentId, { group_id: Number(course.group_id) });
      setStudents(prev => prev.map((s: any) => 
        s.id === studentId ? { ...s, group_id: Number(course.group_id) } : s
      ));
      toast({ 
        title: t.success || 'Succès', 
        description: 'Étudiant inscrit avec succès' 
      });
    } catch (err: any) {
      toast({ 
        title: t.error || 'Erreur', 
        description: err?.message || 'Échec de l\'inscription de l\'étudiant', 
        variant: 'destructive' 
      });
    }
    setLoading(false);
  };

  const handleUnenrollStudent = async (studentId: number) => {
    setLoading(true);
    try {
      await studentsApi.update(studentId, { group_id: null });
      setStudents(prev => prev.map((s: any) => 
        s.id === studentId ? { ...s, group_id: null } : s
      ));
      toast({ 
        title: t.success || 'Succès', 
        description: 'Étudiant désinscrit avec succès',
        variant: 'destructive' 
      });
    } catch (err: any) {
      toast({ 
        title: t.error || 'Erreur', 
        description: err?.message || 'Échec de la désinscription de l\'étudiant', 
        variant: 'destructive' 
      });
    }
    setLoading(false);
  };

  const handleBulkEnroll = async () => {
    if (selectedStudents.size === 0 || !course?.group_id) return;
    
    setLoading(true);
    try {
      const promises = Array.from(selectedStudents).map(studentId =>
        studentsApi.update(studentId, { group_id: Number(course.group_id) })
      );
      
      await Promise.all(promises);
      
      setStudents(prev => prev.map((s: any) => 
        selectedStudents.has(s.id) ? { ...s, group_id: Number(course.group_id) } : s
      ));
      
      setSelectedStudents(new Set());
      
      toast({ 
        title: t.success || 'Succès', 
        description: `Inscription réussie de ${selectedStudents.size} étudiants` 
      });
    } catch (err: any) {
      toast({ 
        title: t.error || 'Erreur', 
        description: err?.message || 'Échec de l\'inscription des étudiants', 
        variant: 'destructive' 
      });
    }
    setLoading(false);
  };

  const handleBulkUnenroll = async () => {
    if (selectedStudents.size === 0) return;
    
    setLoading(true);
    try {
      const promises = Array.from(selectedStudents).map(studentId =>
        studentsApi.update(studentId, { group_id: null })
      );
      
      await Promise.all(promises);
      
      setStudents(prev => prev.map((s: any) => 
        selectedStudents.has(s.id) ? { ...s, group_id: null } : s
      ));
      
      setSelectedStudents(new Set());
      
      toast({ 
        title: t.success || 'Succès', 
        description: `Désinscription réussie de ${selectedStudents.size} étudiants`,
        variant: 'destructive' 
      });
    } catch (err: any) {
      toast({ 
        title: t.error || 'Erreur', 
        description: err?.message || 'Échec de la désinscription des étudiants', 
        variant: 'destructive' 
      });
    }
    setLoading(false);
  };

  const handleAssignGroup = async () => {
    if (!selectedGroupToAssign) return;

    setLoading(true);
    try {
      await coursesApi.update(id, { group_id: selectedGroupToAssign });
      setCourse(prev => ({ ...prev, group_id: selectedGroupToAssign }));
      toast({
        title: t.success || 'Succès',
        description: 'Groupe assigné avec succès'
      });
    } catch (err: any) {
      toast({
        title: t.error || 'Erreur',
        description: err?.message || 'Échec de l\'assignation du groupe',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const toggleStudentSelection = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const filteredStudents = selectedAction === "enroll" 
    ? availableStudents.filter(student =>
        (student.full_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : enrolledStudents.filter(student =>
        (student.full_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      );

  if (pageLoading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back || 'Retour'}
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back || 'Retour'}
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-muted-foreground">Cours non trouvé</h2>
          <p className="text-muted-foreground mt-2">Le cours demandé n'a pas été trouvé.</p>
        </div>
      </div>
    );
  }

  const currentGroup = groupMap.get(Number(course.group_id));
  const capacity = currentGroup?.capacity || 0;
  const enrolled = enrolledStudents.length;
  const availableSpots = capacity > 0 ? Math.max(0, capacity - enrolled) : '∞';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back || 'Retour'}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <UserPlus className="h-8 w-8" />
              {t.manageEnrollment || 'Gestion des inscriptions'}
            </h1>
            <p className="text-muted-foreground">{course.name}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/courses/${id}`)}>
          <BookOpen className="h-4 w-4 mr-2" />
          Voir les détails du cours
        </Button>
      </div>

      {/* Course Info Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t.currentEnrollment || 'Effectif actuel'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{enrolled}</span>
              <span className="text-muted-foreground">/ {capacity || '∞'}</span>
            </div>
            {capacity > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (enrolled / capacity) * 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t.availableStudents || 'Étudiants disponibles'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableStudents.length}</div>
            <p className="text-xs text-muted-foreground">{t.studentsNotInThisCourse || 'Étudiants non inscrits dans ce cours'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t.availableSpots || 'Places disponibles'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableSpots}</div>
            <p className="text-xs text-muted-foreground">
              {capacity > 0 ? (t.remainingCapacity || 'Capacité restante') : (t.noLimitSet || 'Pas de limite fixée')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">{t.searchStudents || 'Rechercher des étudiants'}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={`${t.search || 'Rechercher'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="action">{t.actions || 'Actions'}</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enroll">{t.enrollStudents || 'Inscrire des étudiants'}</SelectItem>
                  <SelectItem value="unenroll">{t.unenrollStudents || 'Désinscrire des étudiants'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedStudents.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {selectedStudents.size} étudiant{selectedStudents.size !== 1 ? 's' : ''} sélectionné{selectedStudents.size !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-2">
                {selectedAction === "enroll" ? (
                  <Button
                    size="sm"
                    onClick={handleBulkEnroll}
                    disabled={loading || (capacity > 0 && enrolled + selectedStudents.size > capacity)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Inscrire les sélectionnés ({selectedStudents.size})
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkUnenroll}
                    disabled={loading}
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    Désinscrire les sélectionnés ({selectedStudents.size})
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedStudents(new Set())}
                >
                  Effacer la sélection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="sm"
              onClick={() => setShowAddStudent(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un étudiant
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAssignGroup(true)}
            >
              <Users className="h-4 w-4 mr-1" />
              Assigner un groupe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Student Dialog - Select from existing students */}
      <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t.addStudent || 'Ajouter Étudiant'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search Bar */}
            <div>
              <Label htmlFor="student-search">{t.searchStudents || 'Rechercher des étudiants'}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="student-search"
                  placeholder="Rechercher par nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Students List */}
            <div className="max-h-[400px] overflow-y-auto border rounded-lg">
              {availableStudents.filter((student: any) =>
                (student.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun étudiant disponible trouvé</p>
                  {searchTerm && (
                    <p className="text-sm mt-2">Essayez de modifier votre recherche</p>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {availableStudents
                    .filter((student: any) =>
                      (student.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                    )
                    .map((student: any) => (
                      <div
                        key={student.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                        onClick={() => {
                          handleEnrollStudent(student.id);
                          setShowAddStudent(false);
                          setSearchTerm("");
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={student.avatar} />
                            <AvatarFallback>
                              {(student.full_name || '').split(' ').map((n: string) => n[0] || '').join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {student.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {student.email}
                                </span>
                              )}
                              {student.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {student.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <UserPlus className="h-4 w-4 mr-1" />
                          {t.enroll || 'Inscrire'}
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddStudent(false);
                setSearchTerm("");
              }}
            >
              {t.cancel || 'Annuler'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Group Dialog */}
      <Dialog open={showAssignGroup} onOpenChange={setShowAssignGroup}>
        <DialogContent>
          <DialogTitle>Assigner un groupe</DialogTitle>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group">Groupe</Label>
              <Select value={selectedGroupToAssign} onValueChange={setSelectedGroupToAssign}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => setShowAssignGroup(false)}>Annuler</Button>
            <Button onClick={handleAssignGroup}>Assigner le groupe</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedAction === "enroll" ? (
              <>
                <UserPlus className="h-5 w-5" />
                Étudiants disponibles ({availableStudents.length})
              </>
            ) : (
              <>
                <UserMinus className="h-5 w-5" />
                Étudiants inscrits ({enrolledStudents.length})
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length}
                    onCheckedChange={toggleSelectAll}
                    indeterminate={selectedStudents.size > 0 && selectedStudents.size < filteredStudents.length}
                  />
                </TableHead>
                <TableHead>{t.student}</TableHead>
                <TableHead>{t.groupContact || 'Contact'}</TableHead>
                {selectedAction === "enroll" && <TableHead>Groupe actuel</TableHead>}
                {selectedAction === "unenroll" && <TableHead>{t.status}</TableHead>}
                <TableHead>{t.actions || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {selectedAction === "enroll" 
                      ? "Aucun étudiant disponible trouvé" 
                      : "Aucun étudiant inscrit trouvé"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={() => toggleStudentSelection(student.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {(student.name || '').split(' ').map(n => n?.[0] || '').join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {student.email || '—'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {student.phone || '—'}
                        </div>
                      </div>
                    </TableCell>
                    {selectedAction === "enroll" && (
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {"currentGroup" in student ? (student.currentGroup || '—') : "—"}
                        </Badge>
                      </TableCell>
                    )}
                    {selectedAction === "unenroll" && (
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {"status" in student ? (student.status || '—') : "—"}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      {selectedAction === "enroll" ? (
                        <Button
                          size="sm"
                          onClick={() => handleEnrollStudent(student.id)}
                          disabled={loading || (capacity > 0 && enrolled >= capacity)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          {t.enroll || 'Inscrire'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUnenrollStudent(student.id)}
                          disabled={loading}
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          {t.unenroll || 'Désinscrire'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Enrollment Capacity Warning */}
      {selectedAction === "enroll" && capacity > 0 && enrolled >= capacity && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <Users className="h-4 w-4" />
              <span className="font-medium">Le cours est complet</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Ce cours a atteint sa capacité maximale de {capacity} étudiants. 
              Vous ne pouvez pas inscrire plus d'étudiants à moins d'augmenter la capacité ou de désinscrire des étudiants existants.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManageInscriptions;
