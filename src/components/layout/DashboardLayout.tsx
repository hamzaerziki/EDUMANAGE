import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import TranslatedAppSidebar from "./TranslatedAppSidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TranslatedAppSidebar />
        <SidebarInset className="flex-1">
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;