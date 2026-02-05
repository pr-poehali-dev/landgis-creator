
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import MapSettings from "./pages/MapSettings";
import PolygonStyleSettings from "./pages/PolygonStyleSettings";
import Companies from "./pages/Companies";
import Users from "./pages/Users";
import AdminFilterSettings from "./pages/AdminFilterSettings";
import AdminVisibilitySettings from "./pages/AdminVisibilitySettings";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { migrateAttributeConfigsToGlobal, forceResetAttributeConfigs } from "./utils/migrateAttributeConfigs";

const queryClient = new QueryClient();

// Выполняем одноразовую миграцию настроек атрибутов
migrateAttributeConfigsToGlobal();

// Делаем функцию сброса доступной глобально для отладки
(window as any).resetAttributeConfigs = forceResetAttributeConfigs;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/admin/map-settings" element={
              <ProtectedRoute requireAdmin>
                <MapSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/companies" element={
              <ProtectedRoute requireAdmin>
                <Companies />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/admin/filter-settings" element={
              <ProtectedRoute requireAdmin>
                <AdminFilterSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/polygon-styles" element={
              <ProtectedRoute requireAdmin>
                <PolygonStyleSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/visibility" element={
              <ProtectedRoute requireAdmin>
                <AdminVisibilitySettings />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;