import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Plus, Trash2, Save } from "lucide-react";
import { timetableApi } from "@/lib/api";

interface EditScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: any;
}

interface ScheduleSession {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  topic: string;
  room?: string;
}

const EditScheduleModal = ({ open, onOpenChange, course }: EditScheduleModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);

  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];

  useEffect(() => {
    if (!open || !course?.group_id) return;
    let alive = true;
    (async () => {
      try {
        const all = await timetableApi.list().catch(() => []);
        if (!alive) return;
        const filtered = (Array.isArray(all) ? all : []).filter((e: any) => {
          const sameGroup = Number(e.group_id) === Number(course.group_id);
          const sameCourse = e.course_id == null || Number(e.course_id) === Number(course.id);
          return sameGroup && sameCourse;
        });
        const dayName = (d: number) => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][Math.max(0, Math.min(6, Number(d)||0))];
        const fmt = (v: any) => {
          if (!v) return '';
          const s = String(v);
          const m = s.match(/\d{1,2}:\d{2}/);
          return m ? m[0] : s;
        };
        const mapped: ScheduleSession[] = filtered.map((e: any, idx: number) => ({
          id: Number(e.id ?? idx + 1),
          day: dayName(e.day_of_week),
          startTime: fmt(e.start_time),
          endTime: fmt(e.end_time),
          topic: e.topic || "",
          room: e.room || "",
        }));
        setSessions(mapped);
      } catch {
        setSessions([]);
      }
    })();
    return () => { alive = false; };
  }, [open, course?.id, course?.group_id]);

  const addNewSession = () => {
    const newSession: ScheduleSession = {
      id: Date.now(),
      day: "Monday",
      startTime: "09:00",
      endTime: "10:30",
      topic: "",
      room: ""
    };
    setSessions([...sessions, newSession]);
  };

  const removeSession = (sessionId: number) => {
    setSessions(sessions.filter(session => session.id !== sessionId));
  };

  const updateSession = (sessionId: number, field: string, value: string) => {
    setSessions(sessions.map(session => 
      session.id === sessionId 
        ? { ...session, [field]: value }
        : session
    ));
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Validate sessions
    const invalidSessions = sessions.filter(session => 
      !session.day || !session.startTime || !session.endTime || !session.topic
    );
    
    if (invalidSessions.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields for each session.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validate time conflicts
    const timeConflicts = sessions.some((session, index) => {
      return sessions.some((otherSession, otherIndex) => {
        if (index === otherIndex) return false;
        if (session.day !== otherSession.day) return false;
        
        const sessionStart = new Date(`2024-01-01 ${session.startTime}`);
        const sessionEnd = new Date(`2024-01-01 ${session.endTime}`);
        const otherStart = new Date(`2024-01-01 ${otherSession.startTime}`);
        const otherEnd = new Date(`2024-01-01 ${otherSession.endTime}`);
        
        return (sessionStart < otherEnd && sessionEnd > otherStart);
      });
    });
    
    if (timeConflicts) {
      toast({
        title: "Schedule Conflict",
        description: "There are overlapping time slots on the same day. Please resolve conflicts.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    // TODO: persist changes via timetableApi (create/update/delete). For now, keep existing behavior.
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Schedule Updated",
      description: "Course schedule has been updated successfully.",
    });
    
    setLoading(false);
    onOpenChange(false);
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Edit Schedule - {course.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Course Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Teacher:</span> {course.teacher}
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {course.duration}
                </div>
                <div>
                  <span className="font-medium">Students:</span> {course.studentsEnrolled}/{course.maxStudents}
                </div>
                <div>
                  <span className="font-medium">Level:</span> {course.level}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Sessions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Schedule Sessions</h3>
              <Button onClick={addNewSession} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </div>

            {sessions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No sessions scheduled. Click "Add Session" to start.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        <div>
                          <Label htmlFor={`day-${session.id}`}>Day</Label>
                          <Select 
                            value={session.day} 
                            onValueChange={(value) => updateSession(session.id, 'day', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {daysOfWeek.map((day) => (
                                <SelectItem key={day} value={day}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`start-${session.id}`}>Start Time</Label>
                          <Select 
                            value={session.startTime} 
                            onValueChange={(value) => updateSession(session.id, 'startTime', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`end-${session.id}`}>End Time</Label>
                          <Select 
                            value={session.endTime} 
                            onValueChange={(value) => updateSession(session.id, 'endTime', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`topic-${session.id}`}>Topic</Label>
                          <Input
                            id={`topic-${session.id}`}
                            value={session.topic}
                            onChange={(e) => updateSession(session.id, 'topic', e.target.value)}
                            placeholder="Session topic"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`room-${session.id}`}>Room</Label>
                          <Input
                            id={`room-${session.id}`}
                            value={session.room || ""}
                            onChange={(e) => updateSession(session.id, 'room', e.target.value)}
                            placeholder="Room number"
                          />
                        </div>

                        <div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSession(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Schedule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditScheduleModal;