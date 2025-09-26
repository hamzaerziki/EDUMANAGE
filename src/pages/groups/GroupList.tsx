import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Users, 
  GraduationCap, 
  BookOpen,
  Plus,
  Eye,
  Edit,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Trash2
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { AddGroupModal } from "@/components/modals/AddGroupModal";
import { GroupDetailsModal } from "@/components/modals/GroupDetailsModal";
import { EditGroupModal } from "@/components/modals/EditGroupModal";
import { AddStudentToGroupModal } from "@/components/modals/AddStudentToGroupModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { groupsApi, studentsApi } from "@/lib/api";

const GroupList = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [groups, setGroups] = useState<any[]>([]);

  // State for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [gData, sData] = await Promise.all([
          groupsApi.list(),
          studentsApi.list().catch(()=>[]),
        ]);
        if (Array.isArray(gData)) {
          const adapted = gData.map((g:any) => ({
            id: g.id,
            name: g.name,
            level: g.level || '',
            grade: '',
            subject: '',
            teacher: '',
            schedule: '',
            classroom: '',
            capacity: Number(g.capacity) || 0,
            enrolled: Array.isArray(sData) ? (sData as any[]).filter((s:any)=> Number(s.group_id)===Number(g.id)).length : 0,
            students: [],
          }));
          setGroups(adapted);
        } else {
          setGroups([]);
        }
      } catch {
        setGroups([]);
      }
    };
    load();
  }, []);

  const getStatusColor = (enrolled: number, capacity: number) => {
    if (!capacity || capacity <= 0) return "bg-gray-100 text-gray-800 border-gray-200";
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) return "bg-red-100 text-red-800 border-red-200";
    if (percentage >= 75) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getStatusText = (enrolled: number, capacity: number) => {
    if (!capacity || capacity <= 0) return t.availableSpots;
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) return t.groupFull;
    if (percentage >= 75) return t.almostFull;
    return t.availableSpots;
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || group.level === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  // Group by level
  const groupedByLevel = filteredGroups.reduce((acc, group) => {
    if (!acc[group.level]) {
      acc[group.level] = [];
    }
    acc[group.level].push(group);
    return acc;
  }, {} as Record<string, any[]>);

  const totalStudents = groups.reduce((sum, group) => sum + (Number(group.enrolled) || 0), 0);
  const totalCapacity = groups.reduce((sum, group) => sum + (Number(group.capacity) || 0), 0);
  const occupancy = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  // Modal handlers
  const handleAddGroup = async (newGroup: any) => {
    try {
      const created = await groupsApi.create({
        name: newGroup.name,
        level: newGroup.level || '',
        year: new Date().getFullYear(),
        capacity: typeof newGroup.capacity === 'number' ? newGroup.capacity : (parseInt(String(newGroup.capacity || 0)) || 0),
      });
      const adapted = {
        id: created.id,
        name: created.name,
        level: created.level || newGroup.level || '',
        grade: newGroup.grade || '',
        subject: newGroup.subject || '',
        teacher: newGroup.teacher || (Array.isArray(newGroup.teachers) ? newGroup.teachers.join(', ') : ''),
        schedule: newGroup.schedule || '',
        classroom: newGroup.classroom || '',
        capacity: (typeof newGroup.capacity === 'number' ? newGroup.capacity : parseInt(String(newGroup.capacity || 0))) || 0,
        enrolled: 0,
        students: [],
      };
      setGroups([...groups, adapted]);
    } catch {
      // Do not add phantom groups if backend fails
      // You may show a toast here if desired
    }
  };

  const handleEditGroup = async (updatedGroup: any) => {
    try {
      await groupsApi.update(updatedGroup.id, {
        name: updatedGroup.name,
        level: updatedGroup.level,
        capacity: typeof updatedGroup.capacity === 'number' ? updatedGroup.capacity : (parseInt(String(updatedGroup.capacity || 0)) || 0),
      });
    } catch {}
    setGroups(groups.map(g => g.id === updatedGroup.id ? { ...g, ...updatedGroup, capacity: (typeof updatedGroup.capacity === 'number' ? updatedGroup.capacity : parseInt(String(updatedGroup.capacity || 0)) || 0) } : g));
  };

  const handleAddStudentsToGroup = async (studentsToAdd: any[]) => {
    if (!selectedGroup || !Array.isArray(studentsToAdd) || studentsToAdd.length === 0) return;
    try {
      await Promise.all(
        studentsToAdd
          .map((s:any)=> s?.id)
          .filter((id:any)=> typeof id === 'number')
          .map((id:number)=> studentsApi.update(id, { group_id: selectedGroup.id }))
      );
    } catch {}
    // Refresh enrolled counts from backend
    try {
      const [gData, sData] = await Promise.all([
        groupsApi.list(),
        studentsApi.list().catch(()=>[]),
      ]);
      if (Array.isArray(gData)) {
        const adapted = gData.map((g:any) => ({
          id: g.id,
          name: g.name,
          level: g.level || '',
          grade: '',
          subject: '',
          teacher: '',
          schedule: '',
          classroom: '',
          capacity: Number(g.capacity) || 0,
          enrolled: Array.isArray(sData) ? (sData as any[]).filter((s:any)=> Number(s.group_id)===Number(g.id)).length : 0,
          students: [],
        }));
        setGroups(adapted);
        setSelectedGroup(prev => prev ? { ...prev, enrolled: adapted.find(a=>a.id===prev.id)?.enrolled || 0 } : null);
      }
    } catch {}
  };

  const openDetailsModal = (group: any) => {
    setSelectedGroup(group);
    setShowDetailsModal(true);
  };

  const openEditModal = (group: any) => {
    setSelectedGroup(group);
    setShowEditModal(true);
  };

  const openAddStudentModal = (group: any) => {
    setSelectedGroup(group);
    setShowAddStudentModal(true);
  };

  const openDeleteModal = (group: any) => {
    setGroupToDelete(group);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    setDeleting(true);
    try {
      await groupsApi.remove(groupToDelete.id);
    } catch {}
    setGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
    setDeleting(false);
    setDeleteModalOpen(false);
    setGroupToDelete(null);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.groupsAndClasses}</h1>
          <p className="text-muted-foreground">
            {t.manageGroupsDesc}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.newGroup}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalGroups}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">{t.activeClasses}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.groupEnrolledStudents}</CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Sur {totalCapacity || '—'} places</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.occupancyRate}</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{occupancy}%</div>
            <p className="text-xs text-muted-foreground">{t.capacityUsed}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.groupLevels}</CardTitle>
            <div className="h-4 w-4 rounded-full bg-primary"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">{t.primaryMiddleHigh}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t.searchGroupsPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.studyLevel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allLevels}</SelectItem>
                <SelectItem value="Primaire">{t.groupPrimary}</SelectItem>
                <SelectItem value="Collège">{t.groupMiddle}</SelectItem>
                <SelectItem value="Lycée">{t.groupHigh}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Groups organized by level - Compact Grid Layout */}
      <div className="space-y-6">
        {Object.entries(groupedByLevel).map(([level, levelGroups]) => {
          const groupArray = levelGroups as any[];
          return (
          <Card key={level}>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                <GraduationCap className="h-6 w-6" />
                {level}
              </CardTitle>
              <p className="text-muted-foreground">
                {groupArray.length} {t.groupsCount} • {groupArray.reduce((sum, g) => sum + g.enrolled, 0)} {t.groupStudentsCount}
              </p>
            </CardHeader>
            <CardContent>
              {/* Compact Grid of Group Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupArray.map((group) => (
                  <Card key={group.id} className="hover:shadow-md transition-shadow border border-muted">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate mb-1">{group.name}</h3>
                          <Badge className={`text-xs border ${getStatusColor(group.enrolled, group.capacity)}`}>
                            {getStatusText(group.enrolled, group.capacity)}
                          </Badge>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-lg font-bold text-primary">
                            {group.enrolled}/{(Number(group.capacity) || 0) > 0 ? group.capacity : '—'}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 space-y-2">
                      <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 truncate">
                          <BookOpen className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{group.subject}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <Users className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{group.teacher}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{group.schedule}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{group.classroom}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-1 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => openDetailsModal(group)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {t.groupDetails}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => openEditModal(group)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {t.groupModify}
                        </Button>
                        <Button 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => openAddStudentModal(group)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {t.groupAddStudent}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full text-xs"
                          onClick={() => openDeleteModal(group)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {t.delete}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )})}
      </div>

      {/* Modals */}
      <AddGroupModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddGroup}
      />

      <GroupDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        group={selectedGroup}
      />

      <EditGroupModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onEdit={handleEditGroup}
        group={selectedGroup}
      />

      <AddStudentToGroupModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onAddStudents={handleAddStudentsToGroup}
        group={selectedGroup}
      />

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title={t.confirmDelete}
        description={t.areYouSure}
        itemName={groupToDelete?.name || ''}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </div>
  );
};

export default GroupList;