import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { eventsStore, type CalendarEvent } from "@/lib/eventsStore";
import { scheduleStore } from "@/lib/scheduleStore";
import { notificationsStore } from "@/lib/notificationsStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Clock, MapPin, Plus, AlertTriangle, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { eventsApi } from "@/lib/api";

function toISODate(d: Date) { return d.toISOString().slice(0,10); }
function sameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function pad2(n: number) { return n < 10 ? `0${n}` : String(n); }
function combineDateTime(dateISO: string, time: string) { return `${dateISO}T${time}:00`; }

const EventsCalendar = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const canManage = !!user && (user.role === 'admin' || user.role === 'teacher');

  const [today] = useState(new Date());
  const [current, setCurrent] = useState(new Date());
  const [tab, setTab] = useState<'month'|'week'|'day'>('month');

  // Create event form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<'school_event'|'holiday'|'meeting'>('school_event');
  const [location, setLocation] = useState("");
  const [dateISO, setDateISO] = useState(toISODate(new Date()));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const allEvents = useMemo(() => eventsStore.all(), []);
  const [events, setEvents] = useState<CalendarEvent[]>(allEvents);

  const loadEvents = async () => {
    // Backend-first; fallback to local store
    try {
      const data = await eventsApi.feed();
      const mapped = (Array.isArray(data) ? data : []).map((ev: any) => ({
        id: ev.id,
        title: ev.title,
        start: ev.start,
        end: ev.end || ev.start,
        location: ev.extendedProps?.location || '',
      })) as unknown as CalendarEvent[];
      setEvents(mapped);
    } catch {
      setEvents(eventsStore.all());
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const refresh = () => { void loadEvents(); };

  // Derived ranges
  const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
  const endOfMonth = new Date(current.getFullYear(), current.getMonth()+1, 0);
  const startOfWeek = new Date(current);
  startOfWeek.setDate(current.getDate() - ((current.getDay()+6)%7)); // Monday as first day
  const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate()+6);

  const monthDays: Date[] = useMemo(() => {
    const firstDayOfGrid = new Date(startOfMonth);
    const pad = (firstDayOfGrid.getDay()+6)%7; // 0..6 with Monday start
    firstDayOfGrid.setDate(1 - pad);
    const days: Date[] = [];
    for (let i=0;i<42;i++) { const d = new Date(firstDayOfGrid); d.setDate(firstDayOfGrid.getDate()+i); days.push(d); }
    return days;
  }, [current.getFullYear(), current.getMonth()]);

  const eventsForDay = (d: Date) => events.filter(ev => sameDay(new Date(ev.start), d));
  const weekEvents = events.filter(ev => new Date(ev.start) <= endOfWeek && new Date(ev.end) >= startOfWeek);
  const dayEvents = eventsForDay(current);

  const addEvent = async () => {
    if (!canManage) return;
    if (!title.trim()) { toast({ title: t.missingInformation || 'Missing Information', description: t.requiredField || 'Required' }); return; }
    const start = combineDateTime(dateISO, startTime);
    const end = combineDateTime(dateISO, endTime);
    if (new Date(end) <= new Date(start)) { toast({ title: t.invalidTimeRange || 'Invalid time range', variant: 'destructive' as any }); return; }

    // conflict check with schedule
    const sessions = scheduleStore.getAll();
    const sTs = new Date(start).getTime();
    const eTs = new Date(end).getTime();
    const conflicts = sessions.filter(s => {
      // Map schedule session (day + HH:mm) to nearest dateISO using selected date's week day
      const dayIdx = new Date(dateISO).getDay();
      if (s.day !== dayIdx) return false;
      const sStart = new Date(`${dateISO}T${s.startTime}:00`).getTime();
      const sEnd = new Date(`${dateISO}T${s.endTime}:00`).getTime();
      return sEnd > sTs && sStart < eTs;
    });

    try {
      await eventsApi.create({ title, description, type, location, start, end });
      await loadEvents();
    } catch (e: any) {
      toast({ title: t.error, description: e?.message || 'Failed to create event', variant: 'destructive' as any });
      return;
    }

    if (conflicts.length) {
      toast({ title: t.warning, description: `${conflicts.length} ${t.schedule || 'Schedule'} conflict(s) detected` });
    } else {
      toast({ title: t.success, description: t.createEvent || 'Create Event' });
    }

    // Reminder notification (simple immediate add)
    notificationsStore.add({ id: `${title}-notif`, title: title, message: `${t.events || 'Event'} • ${new Date(start).toLocaleString()}`, type: 'info', timestamp: Date.now(), read: false });
    // reset form
    setTitle(""); setDescription(""); setLocation("");
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.eventsCalendar || 'Événements & Calendrier'}</h1>
          <p className="text-muted-foreground">{t.overview}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>setCurrent(new Date())}>{t.today || 'Today'}</Button>
          <Button variant="outline" onClick={()=>{ const d = new Date(current); d.setMonth(current.getMonth()-1); setCurrent(d); }}>{t.previous || 'Previous'}</Button>
          <Button variant="outline" onClick={()=>{ const d = new Date(current); d.setMonth(current.getMonth()+1); setCurrent(d); }}>{t.next || 'Next'}</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v)=>setTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="month">{t.monthlyView || 'Monthly'}</TabsTrigger>
          <TabsTrigger value="week">{t.weeklyView || 'Weekly'}</TabsTrigger>
          <TabsTrigger value="day">{t.dailyView || 'Daily'}</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><CalendarDays className="h-5 w-5" />{current.toLocaleDateString(undefined, { month:'long', year:'numeric' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-xs mb-2 text-muted-foreground">
                <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((d, idx) => {
                  const isCurrentMonth = d.getMonth() === current.getMonth();
                  const isToday = sameDay(d, today);
                  const items = eventsForDay(d);
                  return (
                    <div key={idx} className={`min-h-[90px] p-2 rounded border ${isCurrentMonth ? '' : 'opacity-50'} ${isToday ? 'ring-2 ring-primary' : ''}`}>
                      <div className="text-xs font-medium mb-1">{d.getDate()}</div>
                      <div className="space-y-1">
                        {items.slice(0,3).map(ev => (
                          <div key={ev.id} className="text-[11px] p-1 rounded bg-primary/10 truncate">{ev.title}</div>
                        ))}
                        {items.length > 3 && <div className="text-[11px] text-muted-foreground">+{items.length-3} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t.weeklyView || 'Weekly'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {weekEvents.length === 0 && <div className="text-sm text-muted-foreground">{t.noResultsFound}</div>}
                {weekEvents.map(ev => (
                  <div key={ev.id} className="p-3 rounded border flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{ev.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />{new Date(ev.start).toLocaleString()} — {new Date(ev.end).toLocaleString()}
                        {ev.location && (<><MapPin className="h-3 w-3" />{ev.location}</>)}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={async ()=>{
                          const idStr = String((ev as any).id || '');
                          if (idStr.startsWith('evt-')) {
                            const nid = parseInt(idStr.split('-')[1]);
                            if (!Number.isNaN(nid)) {
                              try { await eventsApi.remove(nid); } catch {}
                            }
                          }
                          refresh();
                        }}>{t.delete}</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="day" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{new Date(current).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dayEvents.length === 0 && <div className="text-sm text-muted-foreground">{t.noResultsFound}</div>}
                {dayEvents.map(ev => (
                  <div key={ev.id} className="p-3 rounded border flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{ev.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />{new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })} — {new Date(ev.end).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                        {ev.location && (<><MapPin className="h-3 w-3" />{ev.location}</>)}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={async ()=>{
                          const idStr = String((ev as any).id || '');
                          if (idStr.startsWith('evt-')) {
                            const nid = parseInt(idStr.split('-')[1]);
                            if (!Number.isNaN(nid)) {
                              try { await eventsApi.remove(nid); } catch {}
                            }
                          }
                          refresh();
                        }}>{t.delete}</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create event */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" />{t.createEvent || 'Create Event'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder={t.eventTitle || 'Title'} value={title} onChange={(e)=>setTitle(e.target.value)} />
              <Input placeholder={t.eventDescription || 'Description'} value={description} onChange={(e)=>setDescription(e.target.value)} />
              <Input type="date" value={dateISO} onChange={(e)=>setDateISO(e.target.value)} />
              <div className="flex gap-2">
                <Input type="time" value={startTime} onChange={(e)=>setStartTime(e.target.value)} />
                <Input type="time" value={endTime} onChange={(e)=>setEndTime(e.target.value)} />
              </div>
              <Input placeholder={t.eventLocation || 'Location'} value={location} onChange={(e)=>setLocation(e.target.value)} />
              <Select value={type} onValueChange={(v)=>setType(v as any)}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school_event">School Event</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-end mt-3 gap-2">
              <Button onClick={addEvent} className="bg-primary text-white"><Plus className="h-4 w-4 mr-1" />{t.create || 'Create'}</Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{t.integration || 'Sync with timetable (conflict warnings).'} <Bell className="h-3 w-3" /></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventsCalendar;
