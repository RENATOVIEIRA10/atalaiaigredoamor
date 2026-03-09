import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import { TorreControleProvider } from "@/contexts/TorreControleContext";
import { RedeProvider } from "@/contexts/RedeContext";
import { CampoProvider } from "@/contexts/CampoContext";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DemoBar } from "@/components/demo/DemoBar";
import { UpdateBanner } from "@/components/pwa/UpdateBanner";
import { TorreControlePanel } from "@/components/torre/TorreControlePanel";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { useVersionGate } from "@/hooks/useVersionGate";

// Eager: landing + onboarding + auth (first paint)
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

// Lazy: auth + all authenticated pages
const Auth = lazy(() => import("./pages/Auth"));
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
const ManualUsuario = lazy(() => import("./pages/ManualUsuario"));
const TestemunhoAtalaia = lazy(() => import("./pages/TestemunhoAtalaia"));

const TrocarFuncao = lazy(() => import("./pages/TrocarFuncao"));
const RecomecoCadastro = lazy(() => import("./pages/RecomecoCadastro"));
const CentralCelulas = lazy(() => import("./pages/CentralCelulas"));
const DemoPastoral = lazy(() => import("./pages/DemoPastoral"));
const HomeConcierge = lazy(() => import("./pages/HomeConcierge"));
const Radar = lazy(() => import("./pages/Radar"));
const Glossario = lazy(() => import("./pages/Glossario"));
const GuiaAdmin = lazy(() => import("./pages/GuiaAdmin"));
const PulsoVivo = lazy(() => import("./pages/PulsoVivo"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="animate-pulse text-muted-foreground text-sm">Carregando…</div>
  </div>
);

function AppInner() {
  useVersionGate();
  useVersionCheck();
  return (
    <>
      <UpdateBanner />
      <DemoBar />
      <TorreControlePanel />
      <Suspense fallback={<LazyFallback />}>
        <Routes>
          {/* Auth page (no protection) */}
          <Route path="/auth" element={<Auth />} />

          {/* Home = code entry (requires Supabase Auth, no role) */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/trocar-funcao" element={<ProtectedRoute><TrocarFuncao /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* Internal routes (require Supabase Auth + access code role) */}
          <Route path="/home" element={<RoleProtectedRoute><HomeConcierge /></RoleProtectedRoute>} />
          <Route path="/radar" element={<RoleProtectedRoute><Radar /></RoleProtectedRoute>} />
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
          <Route path="/recomeco" element={<Navigate to="/recomeco-cadastro" replace />} />
          <Route path="/recomeco-cadastro" element={<ProtectedRoute><RecomecoCadastro /></ProtectedRoute>} />
          <Route path="/central-celulas" element={<ProtectedRoute><CentralCelulas /></ProtectedRoute>} />

          {/* Public institutional pages (no auth required) */}
          <Route path="/material" element={<MaterialInstitucional />} />
          <Route path="/faq" element={<FaqInstitucional />} />
          <Route path="/manual-lider" element={<ManualLiderCelula />} />
          <Route path="/manual-usuario" element={<ManualUsuario />} />
          <Route path="/testemunho" element={<TestemunhoAtalaia />} />
          <Route path="/demo-pastoral" element={<DemoPastoral />} />
          <Route path="/glossario" element={<RoleProtectedRoute><Glossario /></RoleProtectedRoute>} />
          <Route path="/guia-admin" element={<RoleProtectedRoute><GuiaAdmin /></RoleProtectedRoute>} />
          <Route path="/pulso-vivo" element={<RoleProtectedRoute><PulsoVivo /></RoleProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <RoleProvider>
              <CampoProvider>
                <RedeProvider>
                  <DemoModeProvider>
                    <TorreControleProvider>
                      <AppInner />
                    </TorreControleProvider>
                  </DemoModeProvider>
                </RedeProvider>
              </CampoProvider>
            </RoleProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
