CREATE TABLE public.project_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, person_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view project members" ON public.project_members FOR SELECT USING (true);
CREATE POLICY "Anyone can add project members" ON public.project_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update project members" ON public.project_members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete project members" ON public.project_members FOR DELETE USING (true);

ALTER TABLE public.project_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;

INSERT INTO public.project_members (project_id, person_id)
SELECT p.id, pe.id FROM public.projects p CROSS JOIN public.people pe
ON CONFLICT DO NOTHING;