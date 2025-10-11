import React from "react";
import { 
  Calendar,
  Users, 
  BookOpen, 
  UserCheck, 
  CreditCard,
  FileText,
  Settings,
  BarChart3,
  GraduationCap,
  CalendarDays,
  Building2,
  Home,
  Layers
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LanguageSelector } from "@/components/ui/language-selector";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

const TranslatedAppSidebar = () => {
  const { language, t } = useTranslation();

  // Direct translation mapping to fix missing sidebar titles
  const getMenuItems = () => {
    const translations = {
      en: {
        dashboard: 'Dashboard',
        students: 'Students',
        levels: 'Levels',
        teachers: 'Teachers',
        courses: 'Courses',
        groups: 'Groups',
        subjects: 'Subjects',
        attendance: 'Attendance',
        schedule: 'Schedule',
        payments: 'Payments',
        reports: 'Reports',
        exams: 'Exams',
        settings: 'Settings',
        subscriptions: 'Subscriptions'
      },
      fr: {
        dashboard: 'Tableau de bord',
        students: 'Étudiants',
        levels: 'Niveaux',
        teachers: 'Enseignants',
        courses: 'Cours',
        groups: 'Groupes',
        subjects: 'Matières',
        attendance: 'Présence',
        schedule: 'Horaire',
        payments: 'Paiements',
        reports: 'Rapports',
        exams: 'Examens',
        settings: 'Paramètres',
        subscriptions: 'Abonnements'
      },
      ar: {
        dashboard: 'لوحة التحكم',
        students: 'الطلاب',
        levels: 'المستويات',
        teachers: 'المعلمون',
        courses: 'الدورات',
        groups: 'المجموعات',
        subjects: 'المواد',
        attendance: 'الحضور',
        schedule: 'الجدول',
        payments: 'المدفوعات',
        reports: 'التقارير',
        exams: 'الامتحانات',
        settings: 'الإعدادات',
        subscriptions: 'الاشتراكات'
      }
    };
    
    const currentLang = translations[language] || translations.fr;
    
    return [
      {
        title: currentLang.dashboard,
        url: "/dashboard",
        icon: Home,
      },
      {
        title: currentLang.students,
        url: "/students",
        icon: Users,
      },
      {
        title: currentLang.levels,
        url: "/levels",
        icon: Layers,
      },
      {
        title: currentLang.teachers,
        url: "/teachers", 
        icon: UserCheck,
      },
      {
        title: currentLang.courses,
        url: "/courses",
        icon: BookOpen,
      },
      {
        title: currentLang.groups,
        url: "/groups",
        icon: GraduationCap,
      },
      {
        title: currentLang.subjects,
        url: "/subjects",
        icon: Building2,
      },
      {
        title: currentLang.attendance,
        url: "/attendance",
        icon: Calendar,
      },
      {
        title: currentLang.schedule,
        url: "/schedule",
        icon: CalendarDays,
      },
      {
        title: currentLang.payments,
        url: "/payments",
        icon: CreditCard,
      },
      {
        title: currentLang.reports,
        url: "/reports",
        icon: FileText,
      },
      {
        title: currentLang.exams,
        url: "/exams",
        icon: BarChart3,
      },
      {
        title: currentLang.subscriptions,
        url: "/subscriptions",
        icon: CreditCard,
      },
      {
        title: currentLang.settings,
        url: "/settings",
        icon: Settings,
      }
    ];
  };
  
  const menuItems = getMenuItems();

  return (
    <Sidebar collapsible="none" className="w-64 min-w-64 border-r bg-sidebar flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-muted-foreground" />
          <div className="font-semibold text-base">EduManage</div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
            {language === 'en' ? 'Main Menu' : language === 'fr' ? 'Menu Principal' : 'القائمة الرئيسية'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url} className="flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-accent">
                      <item.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground"> 2024 EduManage</div>
          <LanguageSelector />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default TranslatedAppSidebar;