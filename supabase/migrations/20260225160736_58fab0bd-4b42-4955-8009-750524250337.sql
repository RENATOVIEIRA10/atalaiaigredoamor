
-- =====================================================
-- Fix overly permissive RLS: split ALL into SELECT + write with auth.uid() check
-- Tables: celulas, coordenacoes, redes, members, profiles, meetings, attendances,
--         supervisoes, supervisores, weekly_reports, novas_vidas, casais,
--         leadership_couples, multiplicacoes, visitors, seed_runs,
--         roteiros_celula, roteiro_itens, supervision_swaps,
--         encaminhamentos_recomeco, access_keys, user_roles
-- Excludes: access_logs, policy_acceptances, user_access_links (already split)
-- =====================================================

-- 1) celulas
DROP POLICY IF EXISTS "Authenticated access celulas" ON public.celulas;
CREATE POLICY "Authenticated read celulas" ON public.celulas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write celulas" ON public.celulas FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update celulas" ON public.celulas FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete celulas" ON public.celulas FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 2) coordenacoes
DROP POLICY IF EXISTS "Authenticated access coordenacoes" ON public.coordenacoes;
CREATE POLICY "Authenticated read coordenacoes" ON public.coordenacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write coordenacoes" ON public.coordenacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update coordenacoes" ON public.coordenacoes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete coordenacoes" ON public.coordenacoes FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 3) redes
DROP POLICY IF EXISTS "Authenticated access redes" ON public.redes;
CREATE POLICY "Authenticated read redes" ON public.redes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write redes" ON public.redes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update redes" ON public.redes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete redes" ON public.redes FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 4) members
DROP POLICY IF EXISTS "Authenticated access members" ON public.members;
CREATE POLICY "Authenticated read members" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write members" ON public.members FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update members" ON public.members FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete members" ON public.members FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 5) profiles
DROP POLICY IF EXISTS "Authenticated access profiles" ON public.profiles;
CREATE POLICY "Authenticated read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update profiles" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete profiles" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 6) meetings
DROP POLICY IF EXISTS "Authenticated access meetings" ON public.meetings;
CREATE POLICY "Authenticated read meetings" ON public.meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write meetings" ON public.meetings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update meetings" ON public.meetings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete meetings" ON public.meetings FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 7) attendances
DROP POLICY IF EXISTS "Authenticated access attendances" ON public.attendances;
CREATE POLICY "Authenticated read attendances" ON public.attendances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write attendances" ON public.attendances FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update attendances" ON public.attendances FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete attendances" ON public.attendances FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 8) supervisoes
DROP POLICY IF EXISTS "Authenticated access supervisoes" ON public.supervisoes;
CREATE POLICY "Authenticated read supervisoes" ON public.supervisoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write supervisoes" ON public.supervisoes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update supervisoes" ON public.supervisoes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete supervisoes" ON public.supervisoes FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 9) supervisores
DROP POLICY IF EXISTS "Authenticated access supervisores" ON public.supervisores;
CREATE POLICY "Authenticated read supervisores" ON public.supervisores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write supervisores" ON public.supervisores FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update supervisores" ON public.supervisores FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete supervisores" ON public.supervisores FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 10) weekly_reports
DROP POLICY IF EXISTS "Authenticated access weekly_reports" ON public.weekly_reports;
CREATE POLICY "Authenticated read weekly_reports" ON public.weekly_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write weekly_reports" ON public.weekly_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update weekly_reports" ON public.weekly_reports FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete weekly_reports" ON public.weekly_reports FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 11) novas_vidas
DROP POLICY IF EXISTS "Authenticated access novas_vidas" ON public.novas_vidas;
CREATE POLICY "Authenticated read novas_vidas" ON public.novas_vidas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write novas_vidas" ON public.novas_vidas FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update novas_vidas" ON public.novas_vidas FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete novas_vidas" ON public.novas_vidas FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 12) casais
DROP POLICY IF EXISTS "Authenticated access casais" ON public.casais;
CREATE POLICY "Authenticated read casais" ON public.casais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write casais" ON public.casais FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update casais" ON public.casais FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete casais" ON public.casais FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 13) leadership_couples
DROP POLICY IF EXISTS "Authenticated access leadership_couples" ON public.leadership_couples;
CREATE POLICY "Authenticated read leadership_couples" ON public.leadership_couples FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write leadership_couples" ON public.leadership_couples FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update leadership_couples" ON public.leadership_couples FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete leadership_couples" ON public.leadership_couples FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 14) multiplicacoes
DROP POLICY IF EXISTS "Authenticated access multiplicacoes" ON public.multiplicacoes;
CREATE POLICY "Authenticated read multiplicacoes" ON public.multiplicacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write multiplicacoes" ON public.multiplicacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update multiplicacoes" ON public.multiplicacoes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete multiplicacoes" ON public.multiplicacoes FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 15) visitors
DROP POLICY IF EXISTS "Authenticated access visitors" ON public.visitors;
CREATE POLICY "Authenticated read visitors" ON public.visitors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write visitors" ON public.visitors FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update visitors" ON public.visitors FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete visitors" ON public.visitors FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 16) seed_runs
DROP POLICY IF EXISTS "Authenticated access seed_runs" ON public.seed_runs;
CREATE POLICY "Authenticated read seed_runs" ON public.seed_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write seed_runs" ON public.seed_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update seed_runs" ON public.seed_runs FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete seed_runs" ON public.seed_runs FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 17) roteiros_celula
DROP POLICY IF EXISTS "Authenticated access roteiros_celula" ON public.roteiros_celula;
CREATE POLICY "Authenticated read roteiros_celula" ON public.roteiros_celula FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write roteiros_celula" ON public.roteiros_celula FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update roteiros_celula" ON public.roteiros_celula FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete roteiros_celula" ON public.roteiros_celula FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 18) roteiro_itens
DROP POLICY IF EXISTS "Authenticated access roteiro_itens" ON public.roteiro_itens;
CREATE POLICY "Authenticated read roteiro_itens" ON public.roteiro_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write roteiro_itens" ON public.roteiro_itens FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update roteiro_itens" ON public.roteiro_itens FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete roteiro_itens" ON public.roteiro_itens FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 19) supervision_swaps
DROP POLICY IF EXISTS "Authenticated access supervision_swaps" ON public.supervision_swaps;
CREATE POLICY "Authenticated read supervision_swaps" ON public.supervision_swaps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write supervision_swaps" ON public.supervision_swaps FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update supervision_swaps" ON public.supervision_swaps FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete supervision_swaps" ON public.supervision_swaps FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 20) encaminhamentos_recomeco
DROP POLICY IF EXISTS "Authenticated access encaminhamentos_recomeco" ON public.encaminhamentos_recomeco;
CREATE POLICY "Authenticated read encaminhamentos_recomeco" ON public.encaminhamentos_recomeco FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write encaminhamentos_recomeco" ON public.encaminhamentos_recomeco FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update encaminhamentos_recomeco" ON public.encaminhamentos_recomeco FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete encaminhamentos_recomeco" ON public.encaminhamentos_recomeco FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 21) access_keys
DROP POLICY IF EXISTS "Authenticated access access_keys" ON public.access_keys;
CREATE POLICY "Authenticated read access_keys" ON public.access_keys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write access_keys" ON public.access_keys FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update access_keys" ON public.access_keys FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete access_keys" ON public.access_keys FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 22) user_roles
DROP POLICY IF EXISTS "Authenticated access user_roles" ON public.user_roles;
CREATE POLICY "Authenticated read user_roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write user_roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update user_roles" ON public.user_roles FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete user_roles" ON public.user_roles FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- 23) Fix access_logs - already has split policies but update INSERT to use auth.uid() check
DROP POLICY IF EXISTS "Authenticated insert access_logs" ON public.access_logs;
CREATE POLICY "Authenticated insert access_logs" ON public.access_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 24) Fix policy_acceptances - already has split policies but update INSERT to use auth.uid() check
DROP POLICY IF EXISTS "Authenticated insert policy_acceptances" ON public.policy_acceptances;
CREATE POLICY "Authenticated insert policy_acceptances" ON public.policy_acceptances FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
