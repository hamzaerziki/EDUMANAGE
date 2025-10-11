import React, { useState, useEffect } from "react";
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

// Levels Management Component with Full Functionality
const LevelsManagementPage = () => {
  const [categories, setCategories] = useState([
    {
      id: 1,
      name: 'Éducation Standard',
      description: 'Niveaux d\'enseignement traditionnel',
      color: '#3B82F6',
      icon: '📚'
    },
    {
      id: 2,
      name: 'Formation Professionnelle',
      description: 'Formations techniques et professionnelles',
      color: '#10B981',
      icon: '🔧'
    }
  ]);
  
  const [levels, setLevels] = useState([
    { id: 1, name: 'Primaire', categoryId: 1, description: 'Enseignement primaire' },
    { id: 2, name: 'Collège', categoryId: 1, description: 'Enseignement secondaire' },
    { id: 3, name: 'Lycée', categoryId: 1, description: 'Enseignement qualifiant' },
    { id: 4, name: 'Technicien Spécialisé (TS)', categoryId: 2, description: 'Formation spécialisée' },
    { id: 5, name: 'Technicien (T)', categoryId: 2, description: 'Formation technique' },
    { id: 6, name: 'Qualifiant (Q)', categoryId: 2, description: 'Formation qualifiante' }
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('category'); // 'category' or 'level'
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '📚',
    categoryId: ''
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '📚',
      categoryId: ''
    });
  };
  
  const openCategoryModal = () => {
    setModalType('category');
    resetForm();
    setShowModal(true);
  };
  
  const openLevelModal = (categoryId = null) => {
    setModalType('level');
    resetForm();
    if (categoryId) {
      setFormData(prev => ({ ...prev, categoryId: categoryId.toString() }));
    }
    setShowModal(true);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (modalType === 'category') {
      const newCategory = {
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        color: formData.color,
        icon: formData.icon
      };
      setCategories(prev => [...prev, newCategory]);
    } else {
      const newLevel = {
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        categoryId: parseInt(formData.categoryId)
      };
      setLevels(prev => [...prev, newLevel]);
    }
    
    setShowModal(false);
    resetForm();
  };
  
  const deleteCategory = (categoryId) => {
    if (confirm('Supprimer cette catégorie et tous ses niveaux ?')) {
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setLevels(prev => prev.filter(l => l.categoryId !== categoryId));
    }
  };
  
  const deleteLevel = (levelId) => {
    if (confirm('Supprimer ce niveau ?')) {
      setLevels(prev => prev.filter(l => l.id !== levelId));
    }
  };
  
  const getLevelsForCategory = (categoryId) => {
    return levels.filter(level => level.categoryId === categoryId);
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Niveaux</h1>
            <p className="text-gray-600">Créez et organisez vos catégories et niveaux éducatifs</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={openCategoryModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouvelle Catégorie
          </button>
          
          <button
            onClick={() => openLevelModal()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouveau Niveau
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Catégories</p>
              <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Niveaux</p>
              <p className="text-3xl font-bold text-gray-900">{levels.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Moyenne</p>
              <p className="text-3xl font-bold text-gray-900">{categories.length > 0 ? Math.round(levels.length / categories.length * 10) / 10 : 0}</p>
              <p className="text-xs text-gray-500">niveaux par catégorie</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Categories Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Catégories et Niveaux</h2>
        
        {categories.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune catégorie</h3>
            <p className="mt-2 text-gray-500">Commencez par créer votre première catégorie</p>
            <button
              onClick={openCategoryModal}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Créer une catégorie
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const categoryLevels = getLevelsForCategory(category.id);
              return (
                <div key={category.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  {/* Category Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                          <p className="text-sm text-gray-500">{category.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => openLevelModal(category.id)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Ajouter un niveau"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer la catégorie"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Levels List */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-700">Niveaux ({categoryLevels.length})</h4>
                    </div>
                    
                    {categoryLevels.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-sm">Aucun niveau</p>
                        <button
                          onClick={() => openLevelModal(category.id)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          Ajouter le premier niveau
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {categoryLevels.map((level) => (
                          <div key={level.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div>
                              <h5 className="font-medium text-gray-900">{level.name}</h5>
                              <p className="text-sm text-gray-500">{level.description}</p>
                            </div>
                            <button
                              onClick={() => deleteLevel(level.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Supprimer le niveau"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                {modalType === 'category' ? 'Nouvelle Catégorie' : 'Nouveau Niveau'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={modalType === 'category' ? 'ex: Formation Professionnelle' : 'ex: Technicien Spécialisé'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Description optionnelle"
                />
              </div>
              
              {modalType === 'category' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icône (Emoji)
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="📚"
                      maxLength={2}
                    />
                  </div>
                </>
              )}
              
              {modalType === 'level' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

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
