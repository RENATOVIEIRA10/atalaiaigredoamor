
-- ============================================================
-- SECURITY FIX: Restrict overly permissive RLS policies
-- Focus: privilege escalation, write restrictions, ownership
-- ============================================================

-- =============================================
-- 1. FIX user_roles (CRITICAL - privilege escalation)
-- =============================================
DROP POLICY IF EXISTS "Authenticated read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated write user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated delete user_roles" ON public.user_roles;

-- Users can read their own roles
CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all roles
CREATE POLICY "Admins read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert roles
CREATE POLICY "Admins insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update roles
CREATE POLICY "Admins update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete roles
CREATE POLICY "Admins delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. FIX access_keys (admin-only management)
-- =============================================
DROP POLICY IF EXISTS "Authenticated read access_keys" ON public.access_keys;
DROP POLICY IF EXISTS "Authenticated write access_keys" ON public.access_keys;
DROP POLICY IF EXISTS "Authenticated update access_keys" ON public.access_keys;
DROP POLICY IF EXISTS "Authenticated delete access_keys" ON public.access_keys;

-- All authenticated can read (needed for login flow to validate codes)
CREATE POLICY "Authenticated read access_keys"
  ON public.access_keys FOR SELECT TO authenticated
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins insert access_keys"
  ON public.access_keys FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update access_keys"
  ON public.access_keys FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete access_keys"
  ON public.access_keys FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 3. FIX profiles (ownership-based updates)
-- =============================================
DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated write profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated delete profiles" ON public.profiles;

-- All authenticated can read profiles (needed for display names, avatars etc.)
CREATE POLICY "Authenticated read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Profile insert is handled by trigger (handle_new_user), allow for own user_id
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins can delete profiles
CREATE POLICY "Admins delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. FIX seed_runs (admin-only management)
-- =============================================
DROP POLICY IF EXISTS "Authenticated read seed_runs" ON public.seed_runs;
DROP POLICY IF EXISTS "Authenticated write seed_runs" ON public.seed_runs;
DROP POLICY IF EXISTS "Authenticated update seed_runs" ON public.seed_runs;
DROP POLICY IF EXISTS "Authenticated delete seed_runs" ON public.seed_runs;

CREATE POLICY "Authenticated read seed_runs"
  ON public.seed_runs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage seed_runs"
  ON public.seed_runs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update seed_runs"
  ON public.seed_runs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete seed_runs"
  ON public.seed_runs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 5. FIX events_spiritual (admin-only management)
-- =============================================
DROP POLICY IF EXISTS "Authenticated read events_spiritual" ON public.events_spiritual;
DROP POLICY IF EXISTS "Authenticated write events_spiritual" ON public.events_spiritual;
DROP POLICY IF EXISTS "Authenticated update events_spiritual" ON public.events_spiritual;
DROP POLICY IF EXISTS "Authenticated delete events_spiritual" ON public.events_spiritual;

CREATE POLICY "Authenticated read events_spiritual"
  ON public.events_spiritual FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins insert events_spiritual"
  ON public.events_spiritual FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update events_spiritual"
  ON public.events_spiritual FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete events_spiritual"
  ON public.events_spiritual FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 6. Helper: function to check if user has any active scope
-- =============================================
CREATE OR REPLACE FUNCTION public.has_any_active_scope(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_access_links
    WHERE user_id = _user_id
      AND active = true
  )
$$;

-- =============================================
-- 7. FIX write policies for data tables
-- Require user to have an active access scope for writes
-- =============================================

-- celulas
DROP POLICY IF EXISTS "Authenticated write celulas" ON public.celulas;
DROP POLICY IF EXISTS "Authenticated update celulas" ON public.celulas;
DROP POLICY IF EXISTS "Authenticated delete celulas" ON public.celulas;

CREATE POLICY "Scoped write celulas"
  ON public.celulas FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update celulas"
  ON public.celulas FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete celulas"
  ON public.celulas FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- members
DROP POLICY IF EXISTS "Authenticated write members" ON public.members;
DROP POLICY IF EXISTS "Authenticated update members" ON public.members;
DROP POLICY IF EXISTS "Authenticated delete members" ON public.members;

CREATE POLICY "Scoped write members"
  ON public.members FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update members"
  ON public.members FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete members"
  ON public.members FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- weekly_reports
DROP POLICY IF EXISTS "Authenticated write weekly_reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Authenticated update weekly_reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Authenticated delete weekly_reports" ON public.weekly_reports;

CREATE POLICY "Scoped write weekly_reports"
  ON public.weekly_reports FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update weekly_reports"
  ON public.weekly_reports FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete weekly_reports"
  ON public.weekly_reports FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- coordenacoes
DROP POLICY IF EXISTS "Authenticated write coordenacoes" ON public.coordenacoes;
DROP POLICY IF EXISTS "Authenticated update coordenacoes" ON public.coordenacoes;
DROP POLICY IF EXISTS "Authenticated delete coordenacoes" ON public.coordenacoes;

CREATE POLICY "Scoped write coordenacoes"
  ON public.coordenacoes FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update coordenacoes"
  ON public.coordenacoes FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete coordenacoes"
  ON public.coordenacoes FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- redes
DROP POLICY IF EXISTS "Authenticated write redes" ON public.redes;
DROP POLICY IF EXISTS "Authenticated update redes" ON public.redes;
DROP POLICY IF EXISTS "Authenticated delete redes" ON public.redes;

CREATE POLICY "Scoped write redes"
  ON public.redes FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update redes"
  ON public.redes FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete redes"
  ON public.redes FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- supervisoes
DROP POLICY IF EXISTS "Authenticated write supervisoes" ON public.supervisoes;
DROP POLICY IF EXISTS "Authenticated update supervisoes" ON public.supervisoes;
DROP POLICY IF EXISTS "Authenticated delete supervisoes" ON public.supervisoes;

CREATE POLICY "Scoped write supervisoes"
  ON public.supervisoes FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update supervisoes"
  ON public.supervisoes FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete supervisoes"
  ON public.supervisoes FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- novas_vidas
DROP POLICY IF EXISTS "Authenticated write novas_vidas" ON public.novas_vidas;
DROP POLICY IF EXISTS "Authenticated update novas_vidas" ON public.novas_vidas;
DROP POLICY IF EXISTS "Authenticated delete novas_vidas" ON public.novas_vidas;

CREATE POLICY "Scoped write novas_vidas"
  ON public.novas_vidas FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update novas_vidas"
  ON public.novas_vidas FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete novas_vidas"
  ON public.novas_vidas FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- encaminhamentos_recomeco
DROP POLICY IF EXISTS "Authenticated write encaminhamentos_recomeco" ON public.encaminhamentos_recomeco;
DROP POLICY IF EXISTS "Authenticated update encaminhamentos_recomeco" ON public.encaminhamentos_recomeco;
DROP POLICY IF EXISTS "Authenticated delete encaminhamentos_recomeco" ON public.encaminhamentos_recomeco;

CREATE POLICY "Scoped write encaminhamentos_recomeco"
  ON public.encaminhamentos_recomeco FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update encaminhamentos_recomeco"
  ON public.encaminhamentos_recomeco FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete encaminhamentos_recomeco"
  ON public.encaminhamentos_recomeco FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- meetings
DROP POLICY IF EXISTS "Authenticated write meetings" ON public.meetings;
DROP POLICY IF EXISTS "Authenticated update meetings" ON public.meetings;
DROP POLICY IF EXISTS "Authenticated delete meetings" ON public.meetings;

CREATE POLICY "Scoped write meetings"
  ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update meetings"
  ON public.meetings FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete meetings"
  ON public.meetings FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- attendances
DROP POLICY IF EXISTS "Authenticated write attendances" ON public.attendances;
DROP POLICY IF EXISTS "Authenticated update attendances" ON public.attendances;
DROP POLICY IF EXISTS "Authenticated delete attendances" ON public.attendances;

CREATE POLICY "Scoped write attendances"
  ON public.attendances FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update attendances"
  ON public.attendances FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete attendances"
  ON public.attendances FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- casais
DROP POLICY IF EXISTS "Authenticated write casais" ON public.casais;
DROP POLICY IF EXISTS "Authenticated update casais" ON public.casais;
DROP POLICY IF EXISTS "Authenticated delete casais" ON public.casais;

CREATE POLICY "Scoped write casais"
  ON public.casais FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update casais"
  ON public.casais FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete casais"
  ON public.casais FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- multiplicacoes
DROP POLICY IF EXISTS "Authenticated write multiplicacoes" ON public.multiplicacoes;
DROP POLICY IF EXISTS "Authenticated update multiplicacoes" ON public.multiplicacoes;
DROP POLICY IF EXISTS "Authenticated delete multiplicacoes" ON public.multiplicacoes;

CREATE POLICY "Scoped write multiplicacoes"
  ON public.multiplicacoes FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update multiplicacoes"
  ON public.multiplicacoes FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete multiplicacoes"
  ON public.multiplicacoes FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- visitors
DROP POLICY IF EXISTS "Authenticated write visitors" ON public.visitors;
DROP POLICY IF EXISTS "Authenticated update visitors" ON public.visitors;
DROP POLICY IF EXISTS "Authenticated delete visitors" ON public.visitors;

CREATE POLICY "Scoped write visitors"
  ON public.visitors FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update visitors"
  ON public.visitors FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete visitors"
  ON public.visitors FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- leadership_couples
DROP POLICY IF EXISTS "Authenticated write leadership_couples" ON public.leadership_couples;
DROP POLICY IF EXISTS "Authenticated update leadership_couples" ON public.leadership_couples;
DROP POLICY IF EXISTS "Authenticated delete leadership_couples" ON public.leadership_couples;

CREATE POLICY "Scoped write leadership_couples"
  ON public.leadership_couples FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update leadership_couples"
  ON public.leadership_couples FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete leadership_couples"
  ON public.leadership_couples FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- supervision_swaps
DROP POLICY IF EXISTS "Authenticated write supervision_swaps" ON public.supervision_swaps;
DROP POLICY IF EXISTS "Authenticated update supervision_swaps" ON public.supervision_swaps;
DROP POLICY IF EXISTS "Authenticated delete supervision_swaps" ON public.supervision_swaps;

CREATE POLICY "Scoped write supervision_swaps"
  ON public.supervision_swaps FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update supervision_swaps"
  ON public.supervision_swaps FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete supervision_swaps"
  ON public.supervision_swaps FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- roteiros_celula
DROP POLICY IF EXISTS "Authenticated write roteiros_celula" ON public.roteiros_celula;
DROP POLICY IF EXISTS "Authenticated update roteiros_celula" ON public.roteiros_celula;
DROP POLICY IF EXISTS "Authenticated delete roteiros_celula" ON public.roteiros_celula;

CREATE POLICY "Scoped write roteiros_celula"
  ON public.roteiros_celula FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update roteiros_celula"
  ON public.roteiros_celula FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete roteiros_celula"
  ON public.roteiros_celula FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- roteiro_itens
DROP POLICY IF EXISTS "Authenticated write roteiro_itens" ON public.roteiro_itens;
DROP POLICY IF EXISTS "Authenticated update roteiro_itens" ON public.roteiro_itens;
DROP POLICY IF EXISTS "Authenticated delete roteiro_itens" ON public.roteiro_itens;

CREATE POLICY "Scoped write roteiro_itens"
  ON public.roteiro_itens FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update roteiro_itens"
  ON public.roteiro_itens FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete roteiro_itens"
  ON public.roteiro_itens FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- event_registrations
DROP POLICY IF EXISTS "Authenticated write event_registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Authenticated update event_registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Authenticated delete event_registrations" ON public.event_registrations;

CREATE POLICY "Scoped write event_registrations"
  ON public.event_registrations FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update event_registrations"
  ON public.event_registrations FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete event_registrations"
  ON public.event_registrations FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- discipulado_encontros
DROP POLICY IF EXISTS "Authenticated write discipulado_encontros" ON public.discipulado_encontros;
DROP POLICY IF EXISTS "Authenticated update discipulado_encontros" ON public.discipulado_encontros;
DROP POLICY IF EXISTS "Authenticated delete discipulado_encontros" ON public.discipulado_encontros;

CREATE POLICY "Scoped write discipulado_encontros"
  ON public.discipulado_encontros FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update discipulado_encontros"
  ON public.discipulado_encontros FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete discipulado_encontros"
  ON public.discipulado_encontros FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- discipulado_presencas
DROP POLICY IF EXISTS "Authenticated write discipulado_presencas" ON public.discipulado_presencas;
DROP POLICY IF EXISTS "Authenticated update discipulado_presencas" ON public.discipulado_presencas;
DROP POLICY IF EXISTS "Authenticated delete discipulado_presencas" ON public.discipulado_presencas;

CREATE POLICY "Scoped write discipulado_presencas"
  ON public.discipulado_presencas FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update discipulado_presencas"
  ON public.discipulado_presencas FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete discipulado_presencas"
  ON public.discipulado_presencas FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- supervisores
DROP POLICY IF EXISTS "Authenticated write supervisores" ON public.supervisores;
DROP POLICY IF EXISTS "Authenticated update supervisores" ON public.supervisores;
DROP POLICY IF EXISTS "Authenticated delete supervisores" ON public.supervisores;

CREATE POLICY "Scoped write supervisores"
  ON public.supervisores FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update supervisores"
  ON public.supervisores FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete supervisores"
  ON public.supervisores FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- =============================================
-- 8. FIX storage bucket policies
-- Restrict uploads/deletes to authenticated users
-- =============================================

-- Drop overly permissive storage policies and recreate
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete avatars" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view celula photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload celula photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update celula photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete celula photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read celula-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload celula-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update celula-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete celula-photos" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view casais photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload casais photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update casais photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete casais photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read casais-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload casais-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update casais-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete casais-photos" ON storage.objects;

-- Avatars: public read, authenticated write
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated upload avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated update avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated delete avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

-- Celula photos: public read, authenticated write
CREATE POLICY "Public read celula-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'celula-photos');

CREATE POLICY "Authenticated upload celula-photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'celula-photos');

CREATE POLICY "Authenticated update celula-photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'celula-photos');

CREATE POLICY "Authenticated delete celula-photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'celula-photos');

-- Casais photos: public read, authenticated write
CREATE POLICY "Public read casais-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'casais-photos');

CREATE POLICY "Authenticated upload casais-photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'casais-photos');

CREATE POLICY "Authenticated update casais-photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'casais-photos');

CREATE POLICY "Authenticated delete casais-photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'casais-photos');
