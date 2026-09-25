CREATE TABLE public.tasks (
  id text PRIMARY KEY,
  code text NOT NULL,
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  module text NOT NULL,
  status text NOT NULL DEFAULT 'backlog',
  priority text NOT NULL DEFAULT 'P2',
  updated text NOT NULL DEFAULT 'now',
  assignee text NOT NULL DEFAULT 'Unassigned',
  notes text NOT NULL DEFAULT '',
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  activity jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can add tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON public.tasks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete tasks" ON public.tasks FOR DELETE USING (true);

ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

INSERT INTO public.tasks (id, code, title, detail, module, status, priority, updated, assignee, sort_order) VALUES
('t1','LSEA-101','Admin can edit member personal info + notify member','Admin edits a member''s personal information. On save, notify the associated member or account and write a field-level entry to the audit trail.','Admin','progress','P1','2h','Amara K.',1),
('t2','LSEA-102','Show local & foreign bank fields in License Form','Remove the local/foreign toggle and render both bank field sets inline in the License Form.','License','progress','P1','5h','Ravi S.',2),
('t3','LSEA-103','Cover letter upload: accept PDF / JPG / PNG','Cover letter is currently DOCX only. Change the output format to PDF and allow uploads of PDF / JPG / PNG, matching the other upload fields.','Upload','progress','P1','1d','Daw Nu',3),
('t4','LSEA-104','Add Excel Import Template in Company Quota','Provide a downloadable Excel import template for Company Quota. Period Sep 1 2026 – Aug 31 2027, to be confirmed by LSEA.','Quota','review','P2','1d','Amara K.',4),
('t5','LSEA-105','Align button + Member Start Date (Admin approve stage)','Adjust the UI alignment of the action button and the Member Start Date field in the admin approve stage.','Admin','backlog','P3','3d','Ravi S.',5),
('t6','LSEA-106','Notification panel: scrollbar, search & read-all','Add a scrollbar, a search function and a mark-all-as-read action to the notification panel.','System','progress','P1','4h','Daw Nu',6),
('t7','LSEA-107','Show notification center in menu','Surface the notification center in the main menu. It is already included in the Admin view.','System','backlog','P2','2d','Ravi S.',7),
('t8','LSEA-108','Letter batches form: redesign PPRD & MOC code entry','Change the UI design of the letter batches form for adding PPRD code and MOC code.','License','review','P2','6h','Amara K.',8),
('t9','LSEA-109','Adjust SignalR to refresh user active pages','Tune the SignalR connection so a user''s currently active pages refresh when related data changes.','System','progress','P1','3h','Ravi S.',9),
('t10','LSEA-110','Audit Trail: remove User column, add User Name + Email','Update the Audit Trail table: drop the User column and add User Name and Email columns.','Admin','done','P3','4d','Daw Nu',10),
('t11','LSEA-111','Application Review: filter side panel','Add a filter side panel to Application Review. Default filter excludes active members'' applications.','Review','progress','P2','8h','Amara K.',11),
('t12','LSEA-112','License Review: filter panel, default incomplete only','Add a filter side panel to License Review with a default filter showing incomplete licenses only. Note: two letter numbers assigned and admin approved = completed stage.','Review','backlog','P2','5d','Ravi S.',12),
('t13','LSEA-113','Persist filters in cookies / session','Filtering state must be saved in cookies or session so it survives navigation and reload.','System','progress','P1','7h','Daw Nu',13),
('t14','LSEA-114','Export Certificate + Member card as Word & PDF','Certificate and Member card must be exportable as both Word and PDF documents.','License','review','P2','1d','Amara K.',14);