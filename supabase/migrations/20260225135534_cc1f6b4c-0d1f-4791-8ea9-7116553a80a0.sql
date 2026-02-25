
-- =====================================================
-- LOCK DOWN ALL RLS POLICIES: require authenticated user
-- =====================================================

-- celulas
DROP POLICY IF EXISTS "Celulas are viewable by everyone" ON public.celulas;
DROP POLICY IF EXISTS "Anyone can manage celulas" ON public.celulas;
CREATE POLICY "Authenticated access celulas" ON public.celulas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- novas_vidas
DROP POLICY IF EXISTS "Novas vidas viewable by everyone" ON public.novas_vidas;
DROP POLICY IF EXISTS "Anyone can manage novas vidas" ON public.novas_vidas;
CREATE POLICY "Authenticated access novas_vidas" ON public.novas_vidas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- seed_runs
DROP POLICY IF EXISTS "Seed runs viewable by everyone" ON public.seed_runs;
DROP POLICY IF EXISTS "Anyone can manage seed runs" ON public.seed_runs;
CREATE POLICY "Authenticated access seed_runs" ON public.seed_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- weekly_reports
DROP POLICY IF EXISTS "Weekly reports are viewable by everyone" ON public.weekly_reports;
DROP POLICY IF EXISTS "Anyone can manage weekly reports" ON public.weekly_reports;
CREATE POLICY "Authenticated access weekly_reports" ON public.weekly_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- encaminhamentos_recomeco
DROP POLICY IF EXISTS "Encaminhamentos viewable by everyone" ON public.encaminhamentos_recomeco;
DROP POLICY IF EXISTS "Anyone can manage encaminhamentos" ON public.encaminhamentos_recomeco;
CREATE POLICY "Authenticated access encaminhamentos_recomeco" ON public.encaminhamentos_recomeco FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- supervision_swaps
DROP POLICY IF EXISTS "Supervision swaps viewable by everyone" ON public.supervision_swaps;
DROP POLICY IF EXISTS "Anyone can manage supervision swaps" ON public.supervision_swaps;
CREATE POLICY "Authenticated access supervision_swaps" ON public.supervision_swaps FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- access_keys
DROP POLICY IF EXISTS "Access keys are viewable by everyone" ON public.access_keys;
DROP POLICY IF EXISTS "Anyone can manage access keys" ON public.access_keys;
CREATE POLICY "Authenticated access access_keys" ON public.access_keys FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- meetings
DROP POLICY IF EXISTS "Meetings are viewable by everyone" ON public.meetings;
DROP POLICY IF EXISTS "Anyone can manage meetings" ON public.meetings;
CREATE POLICY "Authenticated access meetings" ON public.meetings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- user_roles
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can manage user roles" ON public.user_roles;
CREATE POLICY "Authenticated access user_roles" ON public.user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- attendances
DROP POLICY IF EXISTS "Attendances are viewable by everyone" ON public.attendances;
DROP POLICY IF EXISTS "Anyone can manage attendances" ON public.attendances;
CREATE POLICY "Authenticated access attendances" ON public.attendances FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- roteiros_celula
DROP POLICY IF EXISTS "Roteiros viewable by everyone" ON public.roteiros_celula;
DROP POLICY IF EXISTS "Anyone can manage roteiros" ON public.roteiros_celula;
CREATE POLICY "Authenticated access roteiros_celula" ON public.roteiros_celula FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- casais
DROP POLICY IF EXISTS "Casais are viewable by everyone" ON public.casais;
DROP POLICY IF EXISTS "Anyone can manage casais" ON public.casais;
CREATE POLICY "Authenticated access casais" ON public.casais FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- supervisoes
DROP POLICY IF EXISTS "Supervisoes are viewable by everyone" ON public.supervisoes;
DROP POLICY IF EXISTS "Anyone can manage supervisoes" ON public.supervisoes;
CREATE POLICY "Authenticated access supervisoes" ON public.supervisoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- redes
DROP POLICY IF EXISTS "Redes are viewable by everyone" ON public.redes;
DROP POLICY IF EXISTS "Anyone can manage redes" ON public.redes;
CREATE POLICY "Authenticated access redes" ON public.redes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- roteiro_itens
DROP POLICY IF EXISTS "Roteiro itens viewable by everyone" ON public.roteiro_itens;
DROP POLICY IF EXISTS "Anyone can manage roteiro itens" ON public.roteiro_itens;
CREATE POLICY "Authenticated access roteiro_itens" ON public.roteiro_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- visitors
DROP POLICY IF EXISTS "Visitors are viewable by everyone" ON public.visitors;
DROP POLICY IF EXISTS "Anyone can manage visitors" ON public.visitors;
CREATE POLICY "Authenticated access visitors" ON public.visitors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- access_logs (keep INSERT + SELECT only, no UPDATE/DELETE)
DROP POLICY IF EXISTS "Access logs viewable by everyone" ON public.access_logs;
DROP POLICY IF EXISTS "Anyone can insert access logs" ON public.access_logs;
CREATE POLICY "Authenticated select access_logs" ON public.access_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert access_logs" ON public.access_logs FOR INSERT TO authenticated WITH CHECK (true);

-- leadership_couples
DROP POLICY IF EXISTS "Leadership couples are viewable by everyone" ON public.leadership_couples;
DROP POLICY IF EXISTS "Anyone can manage leadership couples" ON public.leadership_couples;
CREATE POLICY "Authenticated access leadership_couples" ON public.leadership_couples FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- coordenacoes
DROP POLICY IF EXISTS "Coordenacoes are viewable by everyone" ON public.coordenacoes;
DROP POLICY IF EXISTS "Anyone can manage coordenacoes" ON public.coordenacoes;
CREATE POLICY "Authenticated access coordenacoes" ON public.coordenacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can delete profiles" ON public.profiles;
CREATE POLICY "Authenticated access profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- multiplicacoes (clean up duplicate policies)
DROP POLICY IF EXISTS "Multiplicacoes are viewable by everyone" ON public.multiplicacoes;
DROP POLICY IF EXISTS "Anyone can manage multiplicacoes" ON public.multiplicacoes;
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.multiplicacoes;
DROP POLICY IF EXISTS "Permitir inserção para logados" ON public.multiplicacoes;
DROP POLICY IF EXISTS "Permitir deleção para logados" ON public.multiplicacoes;
DROP POLICY IF EXISTS "Permitir atualização para logados" ON public.multiplicacoes;
CREATE POLICY "Authenticated access multiplicacoes" ON public.multiplicacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- members
DROP POLICY IF EXISTS "Members are viewable by everyone" ON public.members;
DROP POLICY IF EXISTS "Anyone can manage members" ON public.members;
CREATE POLICY "Authenticated access members" ON public.members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- supervisores
DROP POLICY IF EXISTS "Supervisores are viewable by everyone" ON public.supervisores;
DROP POLICY IF EXISTS "Anyone can manage supervisores" ON public.supervisores;
CREATE POLICY "Authenticated access supervisores" ON public.supervisores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- policy_acceptances (keep SELECT + INSERT only)
DROP POLICY IF EXISTS "Policy acceptances viewable by everyone" ON public.policy_acceptances;
DROP POLICY IF EXISTS "Anyone can insert policy acceptances" ON public.policy_acceptances;
CREATE POLICY "Authenticated select policy_acceptances" ON public.policy_acceptances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert policy_acceptances" ON public.policy_acceptances FOR INSERT TO authenticated WITH CHECK (true);
