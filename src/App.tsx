import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Onboarding from "./pages/app/Onboarding";
import Placeholder from "./pages/app/Placeholder";
import SchoolSetupWizard from "./pages/app/SchoolSetupWizard";
import SchoolSettings from "./pages/app/SchoolSettings";
import AcademicYears from "./pages/app/AcademicYears";
import ClassesPage from "./pages/app/Classes";
import StudentsList from "./pages/app/StudentsList";
import StudentRegistration from "./pages/app/StudentRegistration";
import StudentDetail from "./pages/app/StudentDetail";
import Staff from "./pages/app/Staff";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Setup wizard (protected mais hors layout pour pleine page) */}
              <Route path="/app/school-setup" element={<SchoolSetupWizard />} />

              {/* App (protected via AppLayout) */}
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="onboarding" element={<Onboarding />} />
                <Route path="school" element={<SchoolSettings />} />
                <Route path="academic-years" element={<AcademicYears />} />
                <Route path="classes" element={<ClassesPage />} />
                <Route path="students" element={<StudentsList />} />
                <Route path="students/new" element={<StudentRegistration />} />
                <Route path="students/:id" element={<StudentDetail />} />
                <Route path="staff" element={<Staff />} />
                {/* Catch-all inside /app → Placeholder for not-yet-built modules */}
                <Route path="*" element={<Placeholder />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
