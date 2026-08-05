-- helper: est-ce que l'utilisateur (élève ou parent) est rattaché à une classe donnée
CREATE OR REPLACE FUNCTION public.is_linked_to_class(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments e
    JOIN public.students s ON s.id = e.student_id
    WHERE e.class_id = _class_id
      AND e.status IN ('enrolled', 'reenrolled', 'repeating')
      AND (
        s.user_id = _user_id
        OR public.is_guardian_of_student(_user_id, s.id)
      )
  )
$$;

-- 1. Cahier de textes
CREATE TABLE public.lesson_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  lesson_date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  content text,
  homework_note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_entries TO authenticated;
GRANT ALL ON public.lesson_entries TO service_role;
ALTER TABLE public.lesson_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School staff manage lesson entries"
ON public.lesson_entries FOR ALL TO authenticated
USING (school_id = public.get_user_school(auth.uid()))
WITH CHECK (school_id = public.get_user_school(auth.uid()));

CREATE POLICY "Students and parents read lesson entries"
ON public.lesson_entries FOR SELECT TO authenticated
USING (public.is_linked_to_class(auth.uid(), class_id));

CREATE TRIGGER lesson_entries_set_updated_at
BEFORE UPDATE ON public.lesson_entries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Devoirs
CREATE TABLE public.homeworks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  instructions text,
  due_date date NOT NULL,
  attachment_url text,
  attachment_name text,
  max_score numeric,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homeworks TO authenticated;
GRANT ALL ON public.homeworks TO service_role;
ALTER TABLE public.homeworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School staff manage homeworks"
ON public.homeworks FOR ALL TO authenticated
USING (school_id = public.get_user_school(auth.uid()))
WITH CHECK (school_id = public.get_user_school(auth.uid()));

CREATE POLICY "Students and parents read published homeworks"
ON public.homeworks FOR SELECT TO authenticated
USING (is_published AND public.is_linked_to_class(auth.uid(), class_id));

CREATE TRIGGER homeworks_set_updated_at
BEFORE UPDATE ON public.homeworks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Remises des élèves
CREATE TABLE public.homework_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homework_id uuid NOT NULL REFERENCES public.homeworks(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content text,
  file_url text,
  file_name text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  score numeric,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (homework_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_submissions TO authenticated;
GRANT ALL ON public.homework_submissions TO service_role;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School staff manage submissions"
ON public.homework_submissions FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.homeworks h
  WHERE h.id = homework_id AND h.school_id = public.get_user_school(auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.homeworks h
  WHERE h.id = homework_id AND h.school_id = public.get_user_school(auth.uid())
));

CREATE POLICY "Students manage their own submission"
ON public.homework_submissions FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = student_id AND s.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = student_id AND s.user_id = auth.uid()
));

CREATE POLICY "Guardians read their child submissions"
ON public.homework_submissions FOR SELECT TO authenticated
USING (public.is_guardian_of_student(auth.uid(), student_id));

CREATE TRIGGER homework_submissions_set_updated_at
BEFORE UPDATE ON public.homework_submissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_lesson_entries_class_date ON public.lesson_entries(class_id, lesson_date DESC);
CREATE INDEX idx_homeworks_class_due ON public.homeworks(class_id, due_date DESC);
CREATE INDEX idx_homework_submissions_hw ON public.homework_submissions(homework_id);