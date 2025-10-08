import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import DashboardLayout from "./components/layout/DashboardLayout";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AttendanceOverview from "./pages/attendance/AttendanceOverview";
import StudentList from "./pages/students/StudentList";
import GroupList from "./pages/groups/GroupList";
import TeacherList from "./pages/teachers/TeacherList";
import CourseList from "./pages/courses/CourseList";
import CourseDetails from "./pages/courses/CourseDetails";
import StudentEvaluations from "./pages/courses/StudentEvaluations";
import ManageInscriptions from "./pages/courses/ManageInscriptions";
import PaymentList from "./pages/payments/PaymentList";
import PaymentHistory from "./pages/payments/PaymentHistory";
import ReportList from "./pages/reports/ReportList";
import SubjectList from "./pages/subjects/SubjectList";
import CourseSchedule from "./pages/schedule/CourseSchedule";
import GroupSchedulePicker from "./pages/schedule/GroupSchedulePicker";
import GroupSchedule from "./pages/schedule/GroupSchedule";
import Settings from "./pages/settings/Settings";
import Exams from "./pages/exams/Exams";
import { SubscriptionPage } from "./pages/subscriptions/SubscriptionPage";
import NotFound from "./pages/NotFound";
import { TranslationProvider } from "./components/providers/TranslationProvider";
import { AuthProvider } from "./components/providers/AuthProvider";
import RequireAuth from "./components/providers/RequireAuth";
import ErrorBoundary from "./components/ui/error-boundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <TooltipProvider delayDuration={200}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
            <Routes>
              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/auth/login" replace />} />
              
              {/* Auth Routes */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              
              {/* Dashboard Routes */}
              <Route path="/" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="students" element={<StudentList />} />
                <Route path="groups" element={<GroupList />} />
                <Route path="attendance" element={<AttendanceOverview />} />
                <Route path="teachers" element={<TeacherList />} />
                <Route path="courses" element={<CourseList />} />
                <Route path="courses/:id" element={<CourseDetails />} />
                <Route path="courses/:id/evaluations" element={<StudentEvaluations />} />
                <Route path="courses/:id/inscriptions" element={<ManageInscriptions />} />
                <Route path="payments" element={<PaymentList />} />
                <Route path="payments/history" element={<PaymentHistory />} />
                <Route path="subjects" element={<SubjectList />} />
                <Route path="reports" element={<ReportList />} />
                <Route path="schedule" element={<GroupSchedulePicker />} />
                <Route path="schedule/groups" element={<GroupSchedulePicker />} />
                <Route path="schedule/group/:groupId" element={<GroupSchedule />} />
                <Route path="exams" element={<Exams />} />
                <Route path="settings" element={<Settings />} />
                <Route path="subscriptions" element={<SubscriptionPage />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </AuthProvider>
        </BrowserRouter>
        </TooltipProvider>
      </TranslationProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
