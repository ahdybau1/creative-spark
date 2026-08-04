CREATE OR REPLACE FUNCTION public.is_guardian_of_student(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_guardians g
    WHERE g.guardian_user_id = _user_id
      AND g.student_id = _student_id
  )
$$;

DROP POLICY IF EXISTS "Students - parent of student" ON public.students;

CREATE POLICY "Students - parent of student"
ON public.students
FOR SELECT
USING (public.is_guardian_of_student(auth.uid(), id));