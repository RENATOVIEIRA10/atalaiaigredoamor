import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Celulas from "./pages/Celulas";
import Membros from "./pages/Membros";
import Presenca from "./pages/Presenca";
import Redes from "./pages/Redes";
import Coordenacoes from "./pages/Coordenacoes";
import Configuracoes from "./pages/Configuracoes";
import Dados from "./pages/Dados";
import Organograma from "./pages/Organograma";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RoleProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<RoleProtectedRoute><Dashboard /></RoleProtectedRoute>} />
              <Route path="/celulas" element={<RoleProtectedRoute><Celulas /></RoleProtectedRoute>} />
              <Route path="/membros" element={<RoleProtectedRoute><Membros /></RoleProtectedRoute>} />
              <Route path="/presenca" element={<RoleProtectedRoute><Presenca /></RoleProtectedRoute>} />
              <Route path="/redes" element={<RoleProtectedRoute><Redes /></RoleProtectedRoute>} />
              <Route path="/coordenacoes" element={<RoleProtectedRoute><Coordenacoes /></RoleProtectedRoute>} />
              <Route path="/configuracoes" element={<RoleProtectedRoute><Configuracoes /></RoleProtectedRoute>} />
              <Route path="/dados" element={<RoleProtectedRoute><Dados /></RoleProtectedRoute>} />
              <Route path="/organograma" element={<RoleProtectedRoute><Organograma /></RoleProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RoleProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
