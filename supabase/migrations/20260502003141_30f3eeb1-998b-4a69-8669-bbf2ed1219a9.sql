-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE public.assessment_type AS ENUM ('exam', 'quiz', 'homework', 'project', 'oral', 'continuous');
CREATE TYPE public.fee_periodicity AS ENUM ('yearly', 'termly', 'monthly', 'one_time');
CREATE TYPE public.payment_method AS ENUM ('cash', 'bank_transfer', 'mobile_money', 'check', 'card', 'other');
CREATE TYPE public.weekday AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- ============================================================
-- TABLES
-- ============================================================

-- Subjects (matières)
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  short_code text,
  default_coefficient numeric(4,2) NOT NULL DEFAULT 1,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);
CREATE INDEX idx_subjects_school ON public.subjects(school_id);

-- Class subjects (affectation matière + enseignant à une classe)
CREATE TABLE public.class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  coefficient numeric(4,2) NOT NULL DEFAULT 1,
  weekly_hours numeric(4,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, subject_id)
);
CREATE INDEX idx_class_subjects_class ON public.class_subjects(class_id);
CREATE INDEX idx_class_subjects_subject ON public.class_subjects(subject_id);
CREATE INDEX idx_class_subjects_teacher ON public.class_subjects(teacher_id);

-- Timetable slots
CREATE TABLE public.timetable_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  day weekday NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_timetable_school ON public.timetable_slots(school_id);
CREATE INDEX idx_timetable_class ON public.timetable_slots(class_id);
CREATE INDEX idx_timetable_teacher ON public.timetable_slots(teacher_id);

-- Attendance sessions
CREATE TABLE public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_date date NOT NULL,
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_attsess_school ON public.attendance_sessions(school_id);
CREATE INDEX idx_attsess_class_date ON public.attendance_sessions(class_id, session_date);

-- Attendances (per student)
CREATE TABLE public.attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'present',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);
CREATE INDEX idx_att_student ON public.attendances(student_id);
CREATE INDEX idx_att_session ON public.attendances(session_id);

-- Assessments
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  name text NOT NULL,
  assessment_type assessment_type NOT NULL DEFAULT 'quiz',
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  max_score numeric(6,2) NOT NULL DEFAULT 20,
  coefficient numeric(4,2) NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_assess_school ON public.assessments(school_id);
CREATE INDEX idx_assess_class ON public.assessments(class_id);
CREATE INDEX idx_assess_subject ON public.assessments(subject_id);

-- Grades
CREATE TABLE public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  score numeric(6,2),
  is_absent boolean NOT NULL DEFAULT false,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, student_id)
);
CREATE INDEX idx_grades_student ON public.grades(student_id);
CREATE INDEX idx_grades_assessment ON public.grades(assessment_id);

-- Fee items
CREATE TABLE public.fee_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  level_id uuid REFERENCES public.levels(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  periodicity fee_periodicity NOT NULL DEFAULT 'yearly',
  due_date date,
  is_mandatory boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fee_items_school ON public.fee_items(school_id);
CREATE INDEX idx_fee_items_year ON public.fee_items(academic_year_id);

-- Fee payments
CREATE TABLE public.fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_item_id uuid REFERENCES public.fee_items(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  method payment_method NOT NULL DEFAULT 'cash',
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  receipt_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_fee_payments_student ON public.fee_payments(student_id);
CREATE INDEX idx_fee_payments_school ON public.fee_payments(school_id);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================

CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_class_subjects_updated BEFORE UPDATE ON public.class_subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_timetable_updated BEFORE UPDATE ON public.timetable_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_attendances_updated BEFORE UPDATE ON public.attendances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_assessments_updated BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_grades_updated BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_fee_items_updated BEFORE UPDATE ON public.fee_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES
-- ============================================================

-- SUBJECTS
CREATE POLICY "Subjects - view own school"
  ON public.subjects FOR SELECT
  USING (school_id = public.get_user_school(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Subjects - manage by admin"
  ON public.subjects FOR ALL
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      school_id = public.get_user_school(auth.uid())
      AND (public.has_role(auth.uid(), 'director')
        OR public.has_role(auth.uid(), 'deputy_director')
        OR public.has_role(auth.uid(), 'secretary'))
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      school_id = public.get_user_school(auth.uid())
      AND (public.has_role(auth.uid(), 'director')
        OR public.has_role(auth.uid(), 'deputy_director')
        OR public.has_role(auth.uid(), 'secretary'))
    )
  );

-- CLASS_SUBJECTS
CREATE POLICY "ClassSubjects - view own school"
  ON public.class_subjects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_subjects.class_id
        AND (c.school_id = public.get_user_school(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
    )
  );

CREATE POLICY "ClassSubjects - manage by admin"
  ON public.class_subjects FOR ALL
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_subjects.class_id
        AND c.school_id = public.get_user_school(auth.uid())
        AND (public.has_role(auth.uid(), 'director')
          OR public.has_role(auth.uid(), 'deputy_director')
          OR public.has_role(auth.uid(), 'secretary'))
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_subjects.class_id
        AND c.school_id = public.get_user_school(auth.uid())
        AND (public.has_role(auth.uid(), 'director')
          OR public.has_role(auth.uid(), 'deputy_director')
          OR public.has_role(auth.uid(), 'secretary'))
    )
  );

-- TIMETABLE_SLOTS
CREATE POLICY "Timetable - view own school"
  ON public.timetable_slots FOR SELECT
  USING (school_id = public.get_user_school(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Timetable - manage by admin"
  ON public.timetable_slots FOR ALL
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      school_id = public.get_user_school(auth.uid())
      AND (public.has_role(auth.uid(), 'director')
        OR public.has_role(auth.uid(), 'deputy_director')
        OR public.has_role(auth.uid(), 'secretary'))
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      school_id = public.get_user_school(auth.uid())
      AND (public.has_role(auth.uid(), 'director')
        OR public.has_role(auth.uid(), 'deputy_director')
        OR public.has_role(auth.uid(), 'secretary'))
    )
  );

-- ATTENDANCE_SESSIONS
CREATE POLICY "AttSessions - view own school"
  ON public.attendance_sessions FOR SELECT
  USING (school_id = public.get_user_school(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "AttSessions - manage by staff"
  ON public.attendance_sessions FOR ALL
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      school_id = public.get_user_school(auth.uid())
      AND (public.has_role(auth.uid(), 'director')
        OR public.has_role(auth.uid(), 'deputy_director')
        OR public.has_role(auth.uid(), 'secretary')
        OR public.has_role(auth.uid(), 'teacher')
        OR public.has_role(auth.uid(), 'main_teacher')
        OR public.has_role(auth.uid(), 'supervisor'))
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      school_id = public.get_user_school(auth.uid())
      AND (public.has_role(auth.uid(), 'director')
        OR public.has_role(auth.uid(), 'deputy_director')
        OR public.has_role(auth.uid(), 'secretary')
        OR public.has_role(auth.uid(), 'teacher')
        OR public.has_role(auth.uid(), 'main_teacher')
        OR public.has_role(auth.uid(), 'supervisor'))
    )
  );

-- ATTENDANCES
CREATE POLICY "Attendances - view by school staff"
  ON public.attendances FOR SELECT
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = attendances.session_id
        AND s.school_id = public.get_user_school(auth.uid())
    )
  );

CREATE POLICY "Attendances - own student view"
  ON public.attendances FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.students st WHERE st.id = attendances.student_id AND st.user_id = auth.uid())
    OR public.is_guardian_of_student(auth.uid(), attendances.student_id)
  );

CREATE POLICY "Attendances - manage by staff"
  ON public.attendances FOR ALL
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = attendances.session_id
        AND s.school_id = public.get_user_school(auth.uid())
        AND (public.has_role(auth.uid(), 'director')
          OR public.has_role(auth.uid(), 'deputy_director')
          OR public.has_role(auth.uid(), 'secretary')
          OR public.has_role(auth.uid(), 'teacher')
          OR public.has_role(auth.uid(), 'main_teacher')
          OR public.has_role(auth.uid(), 'supervisor'))
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = attendances.session_id
        AND s.school_id = public.get_user_school(auth.uid())
        AND (public.has_role(auth.uid(), 'director')
          OR public.has_role(auth.uid(), 'deputy_director')
          OR public.has_role(auth.uid(), 'secretary')
          OR public.has_role(auth.uid(), 'teacher')
          OR public.has_role(auth.uid(), 'main_teacher')
          OR public.has_role(auth.uid(), 'supervisor'))
    )
  );

-- ASSESSMENTS
CREATE POLICY "Assessments - view own school"
  ON public.assessments FOR SELECT
  USING (school_id = public.get_user_school(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Assessments - manage by staff"
  ON public.assessments FOR ALL
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      school_id = public.get_user_school(auth.uid())
      AND (public.has_role(auth.uid(), 'director')
        OR public.has_role(auth.uid(), 'deputy_director')
        OR public.has_role(auth.uid(), 'secretary')
        OR public.has_role(auth.uid(), 'teacher')
        OR public.has_role(auth.uid(), 'main_teacher'))
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      school_id = public.get_user_school(auth.uid())
      AND (public.has_role(auth.uid(), 'director')
        OR public.has_role(auth.uid(), 'deputy_director')
        OR public.has_role(auth.uid(), 'secretary')
        OR public.has_role(auth.uid(), 'teacher')
        OR public.has_role(auth.uid(), 'main_teacher'))
    )
  );

-- GRADES
CREATE POLICY "Grades - view by school staff"
  ON public.grades FOR SELECT
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = grades.assessment_id
        AND a.school_id = public.get_user_school(auth.uid())
    )
  );

CREATE POLICY "Grades - own student view"
  ON public.grades FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.students st WHERE st.id = grades.student_id AND st.user_id = auth.uid())
    OR public.is_guardian_of_student(auth.uid(), grades.student_id)
  );

CREATE POLICY "Grades - manage by staff"
  ON public.grades FOR ALL
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = grades.assessment_id
        AND a.school_id = public.get_user_school(auth.uid())
        AND (public.has_role(auth.uid(), 'director')
          OR public.has_role(auth.uid(), 'deputy_director')
          OR public.has_role(auth.uid(), 'secretary')
          OR public.has_role(auth.uid(), 'teacher')
          OR public.has_role(auth.uid(), 'main_teacher'))
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = grades.assessment_id
        AND a.school_id = public.get_user_school(auth.uid())
        AND (public.has_role(auth.uid(), 'director')
          OR public.has_role(auth.uid(), 'deputy_director')
          OR public.has_role(auth.uid(), 'secretary')
          OR public.has_role(auth.uid(), 'teacher')
          OR public.has_role(auth.uid(), 'main_teacher'))
    )
  );

-- FEE_ITEMS
CREATE POLICY "FeeItems - view own school"
  ON public.fee_items FOR SELECT
  USING (school_id = public.get_user_school(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "FeeItems - manage by admin"
  ON public.fee_items FOR ALL
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      school_id = public.get_user_school(auth.uid())
      AND (public.has_role(auth.uid(), 'director')
        OR public.has_role(auth.uid(), 'accountant')
        OR public.has_role(auth.uid(), 'secretary'))
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      school_id = public.get_user_school(auth.uid())
      AND (public.has_role(auth.uid(), 'director')
        OR public.has_role(auth.uid(), 'accountant')
        OR public.has_role(auth.uid(), 'secretary'))
    )
  );

-- FEE_PAYMENTS
CREATE POLICY "FeePayments - view by staff"
  ON public.fee_payments FOR SELECT
  USING (school_id = public.get_user_school(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "FeePayments - own student view"
  ON public.fee_payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.students st WHERE st.id = fee_payments.student_id AND st.user_id = auth.uid())
    OR public.is_guardian_of_student(auth.uid(), fee_payments.student_id)
  );

CREATE POLICY "FeePayments - manage by admin"
  ON public.fee_payments FOR ALL
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      school_id = public.get_user_school(auth.uid())
      AND (public.has_role(auth.uid(), 'director')
        OR public.has_role(auth.uid(), 'accountant')
        OR public.has_role(auth.uid(), 'secretary'))
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      school_id = public.get_user_school(auth.uid())
      AND (public.has_role(auth.uid(), 'director')
        OR public.has_role(auth.uid(), 'accountant')
        OR public.has_role(auth.uid(), 'secretary'))
    )
  );