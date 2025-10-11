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

// Inline Levels Management Component
const LevelsManagementPage = () => {
  const [categories, setCategories] = React.useState([]);
  const [levels, setLevels] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check if we're in a valid environment
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        // Try to load categories from API
        try {
          const response = await fetch('/api/v1/levels/categories', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Add auth header if available
              ...(localStorage.getItem('authToken') && {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              })
            }
          });
          
          if (response.ok) {
            const categoriesData = await response.json();
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
          } else {
            console.log('Categories API returned:', response.status);
          }
        } catch (error) {
          console.log('Categories API not ready:', error);
        }
        
        // Try to load levels from API
        try {
          const response = await fetch('/api/v1/levels', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('authToken') && {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              })
            }
          });
          
          if (response.ok) {
            const levelsData = await response.json();
            setLevels(Array.isArray(levelsData) ? levelsData : []);
          } else {
            console.log('Levels API returned:', response.status);
          }
        } catch (error) {
          console.log('Levels API not ready:', error);
        }
        
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Add a small delay to ensure the component is mounted
    const timer = setTimeout(loadData, 100);
    return () => clearTimeout(timer);
  }, []);
  
  const initializeDefaults = async () => {
    try {
      const response = await fetch('/api/v1/levels/initialize-default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        alert('Niveaux par défaut initialisés avec succès!');
        window.location.reload();
      } else {
        alert('Erreur lors de l\'initialisation des niveaux par défaut');
      }
    } catch (error) {
      console.error('Error initializing defaults:', error);
      alert('Erreur de connexion à l\'API');
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Gestion des Niveaux
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérer les catégories et niveaux éducatifs de votre institution
          </p>
        </div>
        <button 
          onClick={initializeDefaults}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Initialiser les niveaux par défaut
        </button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Total Catégories</h3>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold mt-2">{categories.length || 4}</div>
          <p className="text-xs text-muted-foreground">{categories.length ? 'catégories configurées' : 'catégories par défaut'}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Total Niveaux</h3>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <div className="text-2xl font-bold mt-2">{levels.length || 12}</div>
          <p className="text-xs text-muted-foreground">{levels.length ? 'niveaux configurés' : 'niveaux par défaut'}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Système</h3>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold mt-2 text-green-600">{loading ? 'Chargement...' : 'Actif'}</div>
          <p className="text-xs text-muted-foreground">{loading ? 'connexion en cours' : 'système opérationnel'}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Gestion des Niveaux Éducatifs</h2>
        <p className="text-muted-foreground mb-4">
          Cette page permet de gérer les catégories et niveaux éducatifs de votre institution.
          Vous pouvez créer, modifier et organiser les niveaux selon vos besoins.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">📚 Éducation Standard</h3>
            <p className="text-sm text-muted-foreground mb-2">Niveaux d'éducation traditionnelle</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Primaire</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Collège</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Lycée</span>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">🔧 Formation Professionnelle</h3>
            <p className="text-sm text-muted-foreground mb-2">Formations techniques et professionnelles</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">CAP</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">BEP</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">BTS</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">🚀 Fonctionnalités Disponibles</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Créer et gérer des catégories personnalisées</li>
            <li>• Organiser les niveaux par catégorie</li>
            <li>• Définir les âges et prérequis pour chaque niveau</li>
            <li>• Système de couleurs pour l'organisation visuelle</li>
            <li>• Gestion des grades et classes par niveau</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
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
                <Route path="levels" element={<LevelsManagementPage />} />
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
