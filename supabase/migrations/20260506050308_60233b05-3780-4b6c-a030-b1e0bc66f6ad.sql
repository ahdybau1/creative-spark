
-- 1. Groupes/jumelages de classes
CREATE TABLE public.class_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.class_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.class_groups(id) ON DELETE CASCADE,
  class_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, class_id)
);

CREATE INDEX idx_class_group_members_class ON public.class_group_members(class_id);

ALTER TABLE public.class_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ClassGroups - view own school" ON public.class_groups
  FOR SELECT USING (school_id = get_user_school(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "ClassGroups - manage by admin" ON public.class_groups
  FOR ALL USING (
    has_role(auth.uid(), 'super_admin') OR
    (school_id = get_user_school(auth.uid()) AND
     (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'deputy_director') OR has_role(auth.uid(), 'secretary')))
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin') OR
    (school_id = get_user_school(auth.uid()) AND
     (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'deputy_director') OR has_role(auth.uid(), 'secretary')))
  );

CREATE POLICY "ClassGroupMembers - view own school" ON public.class_group_members
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.class_groups g WHERE g.id = group_id
    AND (g.school_id = get_user_school(auth.uid()) OR has_role(auth.uid(), 'super_admin'))
  ));

CREATE POLICY "ClassGroupMembers - manage by admin" ON public.class_group_members
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.class_groups g WHERE g.id = group_id
    AND (has_role(auth.uid(), 'super_admin') OR
      (g.school_id = get_user_school(auth.uid()) AND
       (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'deputy_director') OR has_role(auth.uid(), 'secretary'))))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.class_groups g WHERE g.id = group_id
    AND (has_role(auth.uid(), 'super_admin') OR
      (g.school_id = get_user_school(auth.uid()) AND
       (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'deputy_director') OR has_role(auth.uid(), 'secretary'))))
  ));

CREATE TRIGGER trg_class_groups_updated
  BEFORE UPDATE ON public.class_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Helper : deux classes sont-elles jumelées ?
CREATE OR REPLACE FUNCTION public.classes_share_group(_class_a uuid, _class_b uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _class_a = _class_b OR EXISTS (
    SELECT 1
    FROM public.class_group_members a
    JOIN public.class_group_members b ON a.group_id = b.group_id
    WHERE a.class_id = _class_a AND b.class_id = _class_b
  );
$$;

-- 3. Trigger anti-conflit timetable_slots
CREATE OR REPLACE FUNCTION public.check_timetable_slot_conflict()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  conflict_record record;
BEGIN
  -- Conflit enseignant
  IF NEW.teacher_id IS NOT NULL THEN
    FOR conflict_record IN
      SELECT s.id, s.class_id, c.name AS class_name
      FROM public.timetable_slots s
      JOIN public.classes c ON c.id = s.class_id
      WHERE s.teacher_id = NEW.teacher_id
        AND s.day = NEW.day
        AND s.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND s.start_time < NEW.end_time
        AND s.end_time > NEW.start_time
    LOOP
      IF NOT public.classes_share_group(conflict_record.class_id, NEW.class_id) THEN
        RAISE EXCEPTION 'Conflit enseignant : déjà affecté à la classe % sur ce créneau (jumelez les classes pour autoriser).', conflict_record.class_name
          USING ERRCODE = 'check_violation';
      END IF;
    END LOOP;
  END IF;

  -- Conflit salle
  IF NEW.room IS NOT NULL AND length(trim(NEW.room)) > 0 THEN
    FOR conflict_record IN
      SELECT s.id, s.class_id, c.name AS class_name
      FROM public.timetable_slots s
      JOIN public.classes c ON c.id = s.class_id
      WHERE s.school_id = NEW.school_id
        AND lower(trim(s.room)) = lower(trim(NEW.room))
        AND s.day = NEW.day
        AND s.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND s.start_time < NEW.end_time
        AND s.end_time > NEW.start_time
    LOOP
      IF NOT public.classes_share_group(conflict_record.class_id, NEW.class_id) THEN
        RAISE EXCEPTION 'Conflit salle : la salle "%" est déjà occupée par la classe % sur ce créneau.', NEW.room, conflict_record.class_name
          USING ERRCODE = 'check_violation';
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_timetable_slot_conflict
  BEFORE INSERT OR UPDATE ON public.timetable_slots
  FOR EACH ROW EXECUTE FUNCTION public.check_timetable_slot_conflict();

-- 4. Trigger anti-conflit attendance_sessions (un prof, un créneau)
CREATE OR REPLACE FUNCTION public.check_attendance_session_conflict()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  conflict_record record;
BEGIN
  IF NEW.teacher_id IS NULL OR NEW.start_time IS NULL OR NEW.end_time IS NULL THEN
    RETURN NEW;
  END IF;

  FOR conflict_record IN
    SELECT s.id, s.class_id, c.name AS class_name
    FROM public.attendance_sessions s
    JOIN public.classes c ON c.id = s.class_id
    WHERE s.teacher_id = NEW.teacher_id
      AND s.session_date = NEW.session_date
      AND s.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND s.start_time IS NOT NULL AND s.end_time IS NOT NULL
      AND s.start_time < NEW.end_time
      AND s.end_time > NEW.start_time
  LOOP
    IF NOT public.classes_share_group(conflict_record.class_id, NEW.class_id) THEN
      RAISE EXCEPTION 'Conflit enseignant : session déjà existante avec la classe % sur ce créneau.', conflict_record.class_name
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_attendance_session_conflict
  BEFORE INSERT OR UPDATE ON public.attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION public.check_attendance_session_conflict();
