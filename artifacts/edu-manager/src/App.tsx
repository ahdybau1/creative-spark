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
import Subjects from "./pages/app/Subjects";
import ClassGroups from "./pages/app/ClassGroups";
import Timetable from "./pages/app/Timetable";
import Attendance from "./pages/app/Attendance";
import Grades from "./pages/app/Grades";
import Finance from "./pages/app/Finance";
import Notifications from "./pages/app/Notifications";
import Messages from "./pages/app/Messages";
import Stats from "./pages/app/Stats";
import Users from "./pages/app/Users";
import Audit from "./pages/app/Audit";
import Integrations from "./pages/app/Integrations";
import Settings from "./pages/app/Settings";
import MyClasses from "./pages/app/MyClasses";
import MyTimetable from "./pages/app/MyTimetable";
import MyGrades from "./pages/app/MyGrades";
import Children from "./pages/app/Children";
import ChildrenGrades from "./pages/app/ChildrenGrades";
import ChildrenAbsences from "./pages/app/ChildrenAbsences";
import Payments from "./pages/app/Payments";
import Bulletins from "./pages/app/Bulletins";
import Reports from "./pages/app/Reports";
import Profile from "./pages/app/Profile";
import Homework from "./pages/app/Homework";
import MyHomework from "./pages/app/MyHomework";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
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
                <Route path="subjects" element={<Subjects />} />
                <Route path="class-groups" element={<ClassGroups />} />
                <Route path="timetable" element={<Timetable />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="grades" element={<Grades />} />
                <Route path="finance" element={<Finance />} />
                <Route path="fees" element={<Finance />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="messages" element={<Messages />} />
                <Route path="stats" element={<Stats />} />
                <Route path="users" element={<Users />} />
                <Route path="audit" element={<Audit />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="settings" element={<Settings />} />
                <Route path="school-settings" element={<SchoolSettings />} />

                {/* Espace enseignant */}
                <Route path="my-classes" element={<MyClasses />} />
                <Route path="homework" element={<Homework />} />
                <Route path="my-homework" element={<MyHomework />} />


                {/* Espace élève */}
                <Route path="my-timetable" element={<MyTimetable />} />
                <Route path="my-grades" element={<MyGrades />} />

                {/* Espace parent */}
                <Route path="children" element={<Children />} />
                <Route path="children-grades" element={<ChildrenGrades />} />
                <Route path="children-absences" element={<ChildrenAbsences />} />
                <Route path="payments" element={<Payments />} />
                <Route path="bulletins" element={<Bulletins />} />
                <Route path="reports" element={<Reports />} />
                <Route path="profile" element={<Profile />} />

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
