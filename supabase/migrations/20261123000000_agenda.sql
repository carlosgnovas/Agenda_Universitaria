-- Ejecutar una vez desde el SQL Editor de tu proyecto Supabase.
-- NO colocar nunca una service_role key en la aplicación.
CREATE TABLE IF NOT EXISTS public.agenda_entries (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('year','subject','category','gradeGroup','gradeItem','event','task')),
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,id)
);

CREATE INDEX IF NOT EXISTS agenda_entries_owner_kind_idx ON public.agenda_entries (user_id,kind);
ALTER TABLE public.agenda_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_agenda_entries" ON public.agenda_entries
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "insert_own_agenda_entries" ON public.agenda_entries
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "update_own_agenda_entries" ON public.agenda_entries
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "delete_own_agenda_entries" ON public.agenda_entries
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- La sincronización funciona consultando la API y refrescando periódicamente.
-- Activar Postgres Changes para agenda_entries desde la sección Realtime de
-- Supabase es opcional (permitirá actualización casi instantánea).
