CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO anon, authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Anyone can add departments" ON public.departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update departments" ON public.departments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete departments" ON public.departments FOR DELETE USING (true);

CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO anon, authenticated;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Anyone can add roles" ON public.roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update roles" ON public.roles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete roles" ON public.roles FOR DELETE USING (true);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Anyone can add projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update projects" ON public.projects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete projects" ON public.projects FOR DELETE USING (true);

CREATE TABLE public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people TO anon, authenticated;
GRANT ALL ON public.people TO service_role;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view people" ON public.people FOR SELECT USING (true);
CREATE POLICY "Anyone can add people" ON public.people FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update people" ON public.people FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete people" ON public.people FOR DELETE USING (true);

CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO anon, authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view modules" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Anyone can add modules" ON public.modules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update modules" ON public.modules FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete modules" ON public.modules FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON public.people FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tasks
  ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN assignee_id uuid REFERENCES public.people(id) ON DELETE SET NULL;

ALTER TABLE public.departments REPLICA IDENTITY FULL;
ALTER TABLE public.roles REPLICA IDENTITY FULL;
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.people REPLICA IDENTITY FULL;
ALTER TABLE public.modules REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.people;
ALTER PUBLICATION supabase_realtime ADD TABLE public.modules;

INSERT INTO public.projects (name, code, description) VALUES
  ('LSEA Platform', 'LSEA', 'Licensing, membership and review platform for LSEA.');

INSERT INTO public.departments (name) VALUES
  ('Engineering'), ('Quality Assurance'), ('Product'), ('Operations');

INSERT INTO public.roles (name) VALUES
  ('Project Manager'), ('Developer'), ('QA Engineer'), ('Business Analyst'), ('Admin');

INSERT INTO public.modules (name, project_id, sort_order)
SELECT m.name, p.id, m.ord
FROM public.projects p,
  (VALUES ('Admin',1),('License',2),('Review',3),('System',4),('Upload',5),('Quota',6)) AS m(name, ord)
WHERE p.code = 'LSEA';

INSERT INTO public.people (name, email, role_id, department_id)
SELECT v.name, v.email,
  (SELECT id FROM public.roles WHERE name = v.role),
  (SELECT id FROM public.departments WHERE name = v.dept)
FROM (VALUES
  ('Amara K.', 'amara@lsea.example', 'Project Manager', 'Product'),
  ('Ravi S.', 'ravi@lsea.example', 'Developer', 'Engineering'),
  ('Daw Nu', 'dawnu@lsea.example', 'QA Engineer', 'Quality Assurance')
) AS v(name, email, role, dept);

UPDATE public.tasks t
SET project_id = (SELECT id FROM public.projects WHERE code = 'LSEA'),
    assignee_id = (SELECT id FROM public.people p WHERE p.name = t.assignee);