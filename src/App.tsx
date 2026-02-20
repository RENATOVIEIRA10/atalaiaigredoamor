import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";

// Eager: landing + onboarding (first paint)
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

// Lazy: all authenticated pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Celulas = lazy(() => import("./pages/Celulas"));
const Membros = lazy(() => import("./pages/Membros"));
const Presenca = lazy(() => import("./pages/Presenca"));
const Redes = lazy(() => import("./pages/Redes"));
const Coordenacoes = lazy(() => import("./pages/Coordenacoes"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Dados = lazy(() => import("./pages/Dados"));
const Organograma = lazy(() => import("./pages/Organograma"));
const PerfilCasal = lazy(() => import("./pages/PerfilCasal"));
const PerfilMembro = lazy(() => import("./pages/PerfilMembro"));
const FerramentasTeste = lazy(() => import("./pages/FerramentasTeste"));
const MaterialInstitucional = lazy(() => import("./pages/MaterialInstitucional"));
const FaqInstitucional = lazy(() => import("./pages/FaqInstitucional"));
const ManualLiderCelula = lazy(() => import("./pages/ManualLiderCelula"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="animate-pulse text-muted-foreground text-sm">Carregando…</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RoleProvider>
            <DemoModeProvider>
              <DemoModeBanner />
              <Suspense fallback={<LazyFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/dashboard" element={<RoleProtectedRoute><Dashboard /></RoleProtectedRoute>} />
                  <Route path="/celulas" element={<RoleProtectedRoute><Celulas /></RoleProtectedRoute>} />
                  <Route path="/membros" element={<RoleProtectedRoute><Membros /></RoleProtectedRoute>} />
                  <Route path="/presenca" element={<RoleProtectedRoute><Presenca /></RoleProtectedRoute>} />
                  <Route path="/redes" element={<RoleProtectedRoute><Redes /></RoleProtectedRoute>} />
                  <Route path="/coordenacoes" element={<RoleProtectedRoute><Coordenacoes /></RoleProtectedRoute>} />
                  <Route path="/configuracoes" element={<RoleProtectedRoute><Configuracoes /></RoleProtectedRoute>} />
                  <Route path="/dados" element={<RoleProtectedRoute><Dados /></RoleProtectedRoute>} />
                  <Route path="/organograma" element={<RoleProtectedRoute><Organograma /></RoleProtectedRoute>} />
                  <Route path="/perfil/casal/:coupleId" element={<RoleProtectedRoute><PerfilCasal /></RoleProtectedRoute>} />
                  <Route path="/perfil/membro/:memberId" element={<RoleProtectedRoute><PerfilMembro /></RoleProtectedRoute>} />
                  <Route path="/ferramentas-teste" element={<RoleProtectedRoute><FerramentasTeste /></RoleProtectedRoute>} />
                  <Route path="/material" element={<MaterialInstitucional />} />
                  <Route path="/faq" element={<FaqInstitucional />} />
                  <Route path="/manual-lider" element={<ManualLiderCelula />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </DemoModeProvider>
          </RoleProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
