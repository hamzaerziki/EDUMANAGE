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
  Home
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

  const menuItems = [
    {
      title: t.dashboard,
      url: "/dashboard",
      icon: Home,
    },
    {
      title: t.students,
      url: "/students",
      icon: Users,
    },
    {
      title: t.teachers,
      url: "/teachers", 
      icon: UserCheck,
    },
    {
      title: t.courses,
      url: "/courses",
      icon: BookOpen,
    },
    {
      title: t.groups,
      url: "/groups",
      icon: GraduationCap,
    },
    {
      title: t.subjects,
      url: "/subjects",
      icon: Building2,
    },
    {
      title: t.attendance,
      url: "/attendance",
      icon: Calendar,
    },
    {
      title: t.schedule,
      url: "/schedule",
      icon: CalendarDays,
    },
    {
      title: t.payments,
      url: "/payments",
      icon: CreditCard,
    },
    {
      title: t.reports,
      url: "/reports",
      icon: FileText,
    },
    {
      title: t.exams || 'Exams',
      url: "/exams",
      icon: BarChart3,
    },
    {
      title: t.settings,
      url: "/settings",
      icon: Settings,
    }
  ];

  return (
    <Sidebar className={`border-r bg-sidebar`}>
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
                  <SidebarMenuButton asChild className="rounded-md mb-1 transition-colors hover:bg-accent">
                    <Link to={item.url} className={`flex items-center gap-3 p-3`}>
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.title}</span>
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