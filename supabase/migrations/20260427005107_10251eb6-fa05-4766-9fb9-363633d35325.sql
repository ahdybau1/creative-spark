-- =========================================================
-- PHASE 2 — STUDENTS & ACADEMIC SETUP
-- =========================================================

-- ---------- ENUMS ----------

-- Étendre school_type avec les 8 types du cahier des charges
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_type') THEN
    CREATE TYPE public.school_type AS ENUM (
      'preschool','primary','middle_school','high_school',
      'university','vocational','driving_school','arts_sports_school'
    );
  ELSE
    BEGIN ALTER TYPE public.school_type ADD VALUE IF NOT EXISTS 'preschool'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE public.school_type ADD VALUE IF NOT EXISTS 'primary'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE public.school_type ADD VALUE IF NOT EXISTS 'middle_school'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE public.school_type ADD VALUE IF NOT EXISTS 'high_school'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE public.school_type ADD VALUE IF NOT EXISTS 'university'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE public.school_type ADD VALUE IF NOT EXISTS 'vocational'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE public.school_type ADD VALUE IF NOT EXISTS 'driving_school'; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER TYPE public.school_type ADD VALUE IF NOT EXISTS 'arts_sports_school'; EXCEPTION WHEN others THEN NULL; END;
  END IF;
END$$;

DO $$ BEGIN
  CREATE TYPE public.gender AS ENUM ('male','female','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.blood_type AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.guardian_type AS ENUM ('father','mother','legal_guardian','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.student_status AS ENUM ('active','suspended','transferred','expelled','graduated','withdrawn','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.enrollment_status AS ENUM ('enrolled','reenrolled','withdrawn','completed','repeating');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.document_type AS ENUM (
    'birth_certificate','id_card','passport','previous_report','medical_certificate',
    'photo','vaccination_record','parent_id','address_proof','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transfer_type AS ENUM ('incoming','outgoing','expulsion','graduation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.calendar_system AS ENUM ('trimester','semester','sequence_6','quarter');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.grading_system AS ENUM ('out_of_20','out_of_100','out_of_10','letter','gpa_4','competency');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- SCHOOLS additions ----------
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS calendar_system public.calendar_system NOT NULL DEFAULT 'trimester',
  ADD COLUMN IF NOT EXISTS grading_system public.grading_system NOT NULL DEFAULT 'out_of_20',
  ADD COLUMN IF NOT EXISTS matricule_format text NOT NULL DEFAULT '{YEAR}-{LEVEL}-{SEQ4}',
  ADD COLUMN IF NOT EXISTS matricule_sequence integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motto text,
  ADD COLUMN IF NOT EXISTS founded_year integer;

-- ---------- ACADEMIC YEARS ----------
CREATE TABLE IF NOT EXISTS public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,                -- ex "2025-2026"
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_academic_years_school ON public.academic_years(school_id);

-- ---------- LEVELS (CP, 6ème, L1...) ----------
CREATE TABLE IF NOT EXISTS public.levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,                -- ex "6ème", "CP", "Terminale S"
  short_code text NOT NULL,          -- ex "6E", "CP", "TS"
  cycle text,                        -- ex "Premier cycle"
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, short_code)
);

CREATE INDEX IF NOT EXISTS idx_levels_school ON public.levels(school_id);

-- ---------- CLASSES ----------
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  level_id uuid REFERENCES public.levels(id) ON DELETE SET NULL,
  name text NOT NULL,                -- ex "6ème A"
  section text,                      -- ex "Sciences", "Lettres"
  capacity integer NOT NULL DEFAULT 30,
  main_teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  room text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, academic_year_id, name)
);

CREATE INDEX IF NOT EXISTS idx_classes_school_year ON public.classes(school_id, academic_year_id);

-- ---------- STUDENTS ----------
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- compte élève (peut être null si trop jeune)
  matricule text NOT NULL,
  -- Identité
  first_name text NOT NULL,
  last_name text NOT NULL,
  middle_name text,
  preferred_name text,
  date_of_birth date NOT NULL,
  place_of_birth text,
  nationality text,
  gender public.gender NOT NULL,
  religion text,
  mother_tongue text,
  photo_url text,
  -- Adresse
  address text,
  city text,
  region text,
  country text,
  -- Médical
  blood_type public.blood_type DEFAULT 'unknown',
  allergies text,
  chronic_conditions text,
  disability text,
  treating_doctor_name text,
  treating_doctor_phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  -- Antécédents scolaires
  previous_school text,
  previous_class text,
  previous_results text,
  -- Statut
  status public.student_status NOT NULL DEFAULT 'active',
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (school_id, matricule)
);

CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(school_id, status);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students(school_id, last_name, first_name);

-- ---------- STUDENT GUARDIANS ----------
CREATE TABLE IF NOT EXISTS public.student_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  guardian_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guardian_type public.guardian_type NOT NULL,
  full_name text NOT NULL,
  occupation text,
  phone text,
  email text,
  address text,
  is_primary boolean NOT NULL DEFAULT false,
  is_pickup_authorized boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guardians_student ON public.student_guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_guardians_user ON public.student_guardians(guardian_user_id);

-- ---------- ENROLLMENTS ----------
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  status public.enrollment_status NOT NULL DEFAULT 'enrolled',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);

-- ---------- STUDENT DOCUMENTS ----------
CREATE TABLE IF NOT EXISTS public.student_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type public.document_type NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,           -- chemin dans le bucket
  file_size integer,
  mime_type text,
  description text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_student ON public.student_documents(student_id);

-- ---------- STUDENT TRANSFERS ----------
CREATE TABLE IF NOT EXISTS public.student_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  transfer_type public.transfer_type NOT NULL,
  destination_school text,
  origin_school text,
  reason text NOT NULL,
  effective_date date NOT NULL,
  certificate_number text,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfers_student ON public.student_transfers(student_id);

-- =========================================================
-- TRIGGERS updated_at
-- =========================================================
DO $$ BEGIN
  CREATE TRIGGER trg_academic_years_updated BEFORE UPDATE ON public.academic_years
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_classes_updated BEFORE UPDATE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_guardians_updated BEFORE UPDATE ON public.student_guardians
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- HELPER : générer le matricule selon le format de l'école
-- =========================================================
CREATE OR REPLACE FUNCTION public.generate_matricule(_school_id uuid, _level_code text DEFAULT 'GEN')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fmt text;
  next_seq integer;
  result text;
  current_year text;
BEGIN
  UPDATE public.schools
     SET matricule_sequence = matricule_sequence + 1
   WHERE id = _school_id
   RETURNING matricule_format, matricule_sequence INTO fmt, next_seq;

  IF fmt IS NULL THEN
    RAISE EXCEPTION 'School not found: %', _school_id;
  END IF;

  current_year := to_char(CURRENT_DATE, 'YYYY');
  result := fmt;
  result := replace(result, '{YEAR}', current_year);
  result := replace(result, '{YY}', to_char(CURRENT_DATE, 'YY'));
  result := replace(result, '{LEVEL}', upper(coalesce(_level_code, 'GEN')));
  result := replace(result, '{SEQ4}', lpad(next_seq::text, 4, '0'));
  result := replace(result, '{SEQ5}', lpad(next_seq::text, 5, '0'));
  result := replace(result, '{SEQ6}', lpad(next_seq::text, 6, '0'));

  RETURN result;
END;
$$;

-- =========================================================
-- HELPER : récupérer les écoles dont je suis tuteur d'un élève
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_guardian_of_school(_user_id uuid, _school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_guardians g
    JOIN public.students s ON s.id = g.student_id
    WHERE g.guardian_user_id = _user_id
      AND s.school_id = _school_id
  );
$$;

-- =========================================================
-- RLS
-- =========================================================
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transfers ENABLE ROW LEVEL SECURITY;

-- ----- ACADEMIC YEARS -----
CREATE POLICY "View academic years of own school" ON public.academic_years
  FOR SELECT USING (school_id = public.get_user_school(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Manage academic years (director/secretary/super_admin)" ON public.academic_years
  FOR ALL USING (
    public.has_role(auth.uid(),'super_admin')
    OR ((public.has_role(auth.uid(),'director') OR public.has_role(auth.uid(),'secretary'))
        AND school_id = public.get_user_school(auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin')
    OR ((public.has_role(auth.uid(),'director') OR public.has_role(auth.uid(),'secretary'))
        AND school_id = public.get_user_school(auth.uid()))
  );

-- ----- LEVELS -----
CREATE POLICY "View levels of own school" ON public.levels
  FOR SELECT USING (school_id = public.get_user_school(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Manage levels (director/secretary/super_admin)" ON public.levels
  FOR ALL USING (
    public.has_role(auth.uid(),'super_admin')
    OR ((public.has_role(auth.uid(),'director') OR public.has_role(auth.uid(),'secretary'))
        AND school_id = public.get_user_school(auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin')
    OR ((public.has_role(auth.uid(),'director') OR public.has_role(auth.uid(),'secretary'))
        AND school_id = public.get_user_school(auth.uid()))
  );

-- ----- CLASSES -----
CREATE POLICY "View classes of own school" ON public.classes
  FOR SELECT USING (school_id = public.get_user_school(auth.uid()) OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Manage classes (director/secretary/super_admin)" ON public.classes
  FOR ALL USING (
    public.has_role(auth.uid(),'super_admin')
    OR ((public.has_role(auth.uid(),'director') OR public.has_role(auth.uid(),'secretary'))
        AND school_id = public.get_user_school(auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin')
    OR ((public.has_role(auth.uid(),'director') OR public.has_role(auth.uid(),'secretary'))
        AND school_id = public.get_user_school(auth.uid()))
  );

-- ----- STUDENTS -----
CREATE POLICY "Students - super admin" ON public.students
  FOR ALL USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Students - school staff view" ON public.students
  FOR SELECT USING (
    school_id = public.get_user_school(auth.uid())
    AND (
      public.has_role(auth.uid(),'director')
      OR public.has_role(auth.uid(),'deputy_director')
      OR public.has_role(auth.uid(),'secretary')
      OR public.has_role(auth.uid(),'accountant')
      OR public.has_role(auth.uid(),'teacher')
      OR public.has_role(auth.uid(),'main_teacher')
      OR public.has_role(auth.uid(),'supervisor')
      OR public.has_role(auth.uid(),'nurse')
      OR public.has_role(auth.uid(),'librarian')
      OR public.has_role(auth.uid(),'transport_manager')
      OR public.has_role(auth.uid(),'canteen_manager')
      OR public.has_role(auth.uid(),'hr_manager')
      OR public.has_role(auth.uid(),'security_agent')
    )
  );

CREATE POLICY "Students - own profile" ON public.students
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Students - parent of student" ON public.students
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.student_guardians g
            WHERE g.student_id = students.id AND g.guardian_user_id = auth.uid())
  );

CREATE POLICY "Students - manage by admin staff" ON public.students
  FOR ALL USING (
    school_id = public.get_user_school(auth.uid())
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary'))
  )
  WITH CHECK (
    school_id = public.get_user_school(auth.uid())
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary'))
  );

-- ----- STUDENT GUARDIANS -----
CREATE POLICY "Guardians - super admin" ON public.student_guardians
  FOR ALL USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Guardians - school staff view" ON public.student_guardians
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_guardians.student_id
              AND s.school_id = public.get_user_school(auth.uid()))
  );

CREATE POLICY "Guardians - own access" ON public.student_guardians
  FOR SELECT USING (guardian_user_id = auth.uid());

CREATE POLICY "Guardians - manage by admin staff" ON public.student_guardians
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_guardians.student_id
              AND s.school_id = public.get_user_school(auth.uid()))
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_guardians.student_id
              AND s.school_id = public.get_user_school(auth.uid()))
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary'))
  );

-- ----- ENROLLMENTS -----
CREATE POLICY "Enrollments - super admin" ON public.enrollments
  FOR ALL USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Enrollments - school staff view" ON public.enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = enrollments.student_id
              AND s.school_id = public.get_user_school(auth.uid()))
  );

CREATE POLICY "Enrollments - own student" ON public.enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = enrollments.student_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Enrollments - parent" ON public.enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.student_guardians g
            WHERE g.student_id = enrollments.student_id
              AND g.guardian_user_id = auth.uid())
  );

CREATE POLICY "Enrollments - manage by admin staff" ON public.enrollments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = enrollments.student_id
              AND s.school_id = public.get_user_school(auth.uid()))
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = enrollments.student_id
              AND s.school_id = public.get_user_school(auth.uid()))
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary'))
  );

-- ----- STUDENT DOCUMENTS -----
CREATE POLICY "Documents - super admin" ON public.student_documents
  FOR ALL USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Documents - school staff view" ON public.student_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_documents.student_id
              AND s.school_id = public.get_user_school(auth.uid()))
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary')
         OR public.has_role(auth.uid(),'nurse'))
  );

CREATE POLICY "Documents - own student" ON public.student_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_documents.student_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Documents - parent" ON public.student_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.student_guardians g
            WHERE g.student_id = student_documents.student_id
              AND g.guardian_user_id = auth.uid())
  );

CREATE POLICY "Documents - manage by admin staff" ON public.student_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_documents.student_id
              AND s.school_id = public.get_user_school(auth.uid()))
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_documents.student_id
              AND s.school_id = public.get_user_school(auth.uid()))
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary'))
  );

-- ----- STUDENT TRANSFERS -----
CREATE POLICY "Transfers - super admin" ON public.student_transfers
  FOR ALL USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Transfers - school staff view" ON public.student_transfers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_transfers.student_id
              AND s.school_id = public.get_user_school(auth.uid()))
  );

CREATE POLICY "Transfers - manage by directors" ON public.student_transfers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_transfers.student_id
              AND s.school_id = public.get_user_school(auth.uid()))
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.students s
            WHERE s.id = student_transfers.student_id
              AND s.school_id = public.get_user_school(auth.uid()))
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary'))
  );

-- =========================================================
-- STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('school-logos', 'school-logos', true)
ON CONFLICT (id) DO NOTHING;

-- ---- student-photos (publiques en lecture, écriture restreinte) ----
CREATE POLICY "Public read student photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'student-photos');

CREATE POLICY "Staff upload student photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'student-photos'
    AND auth.uid() IS NOT NULL
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary')
         OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "Staff update student photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'student-photos'
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary')
         OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "Staff delete student photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'student-photos'
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'secretary')
         OR public.has_role(auth.uid(),'super_admin'))
  );

-- ---- student-documents (privé) ----
CREATE POLICY "Staff read student documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'student-documents'
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary')
         OR public.has_role(auth.uid(),'nurse')
         OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "Staff upload student documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'student-documents'
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'deputy_director')
         OR public.has_role(auth.uid(),'secretary')
         OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "Staff delete student documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'student-documents'
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'secretary')
         OR public.has_role(auth.uid(),'super_admin'))
  );

-- ---- school-logos (public read, gestion par directeur) ----
CREATE POLICY "Public read school logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'school-logos');

CREATE POLICY "Director manage school logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'school-logos'
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "Director update school logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'school-logos'
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "Director delete school logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'school-logos'
    AND (public.has_role(auth.uid(),'director')
         OR public.has_role(auth.uid(),'super_admin'))
  );