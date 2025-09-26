import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";
import { scheduleStore, type ScheduleSession } from "@/lib/scheduleStore";
import { Calendar, Search, Layers } from "lucide-react";
import { groupsApi } from "@/lib/api";

const GroupSchedulePicker = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [search, setSearch] = useState("");
  const [allGroups, setAllGroups] = useState<any[]>([]);

  useEffect(() => {
    const data = scheduleStore.getAll();
    setSessions(data);
    const load = async () => {
      try {
        const g = await groupsApi.list();
        const adapted = Array.isArray(g) ? g.map((x:any)=>({ id: x.id, name: x.name, level: x.level || '', grade: '' })) : [];
        setAllGroups(adapted);
      } catch { setAllGroups([]); }
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'schedule-sessions') {
        setSessions(scheduleStore.getAll());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Build stats by group name from schedule sessions
  const sessionStats = useMemo(() => {
    const map = new Map<string, { count: number; days: Set<number> }>();
    sessions.forEach(s => {
      const key = (s.group || '—').trim();
      if (!key || key === '—') return;
      if (!map.has(key)) map.set(key, { count: 0, days: new Set() });
      const it = map.get(key)!;
      it.count += 1;
      it.days.add(s.day);
    });
    return map;
  }, [sessions]);

  // Merge stored groups + stats
  const groups = useMemo(() => {
    const list = allGroups.map(g => {
      const name = (g.name || '').trim();
      const stat = sessionStats.get(name);
      return {
        ...g,
        stats: {
          count: stat?.count || 0,
          days: stat?.days ? stat.days.size : 0,
        }
      };
    });
    return list.sort((a:any,b:any)=> String(a.name).localeCompare(String(b.name)));
  }, [allGroups, sessionStats]);

  const filtered = groups.filter(g => (g.name || '').toLowerCase().includes(search.toLowerCase()));

  const categories: { key: string; title: string; gradient: string; badge: string }[] = [
    { key: 'Primaire', title: 'Primaire', gradient: 'from-amber-100 to-amber-50', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
    { key: 'Collège',  title: 'Collège',  gradient: 'from-sky-100 to-sky-50',   badge: 'bg-sky-100 text-sky-700 border-sky-200' },
    { key: 'Lycée',    title: 'Lycée',    gradient: 'from-violet-100 to-violet-50', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.schedule} - Groupes</h1>
          <p className="text-muted-foreground">Choisissez un groupe pour gérer son emploi du temps</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              className="pl-10"
              placeholder="Rechercher un groupe..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {categories.map(cat => {
          const items = filtered.filter(g => (g.level || '').toLowerCase() === cat.key.toLowerCase());
          if (!items.length) return null;
          return (
            <div key={cat.key} className="space-y-3">
              <div className={`rounded-xl p-4 bg-gradient-to-r ${cat.gradient} border` }>
                <div className="text-lg font-semibold">{cat.title}</div>
                <div className="text-xs text-muted-foreground">Sélectionnez un groupe de {cat.title.toLowerCase()}</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((g:any) => (
                  <Card key={g.id || g.name} className="hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer border border-muted/60" onClick={()=>navigate(`/schedule/group/${encodeURIComponent(g.name)}`)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Layers className="h-5 w-5" />
                        <span className="truncate">{g.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-muted-foreground truncate mb-2">{g.grade}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`px-2 py-0.5 rounded-full border text-xs ${cat.badge}`}>{g.level}</div>
                        <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                          <Calendar className="h-4 w-4" />
                          <span>{g.stats.count} séance(s)</span>
                          <Badge variant="outline" className="ml-2">{g.stats.days} jour(s)</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground">Aucun groupe trouvé. Créez des séances depuis la vue globale, puis revenez ici.</div>
        )}
      </div>
    </div>
  );
};

export default GroupSchedulePicker;
