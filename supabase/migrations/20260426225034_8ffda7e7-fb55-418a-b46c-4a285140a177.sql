-- =========================================
-- 1. ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'director',
  'deputy_director',
  'secretary',
  'accountant',
  'teacher',
  'main_teacher',
  'supervisor',
  'librarian',
  'nurse',
  'transport_manager',
  'canteen_manager',
  'student',
  'parent',
  'driver',
  'hr_manager',
  'alumni_manager',
  'security_agent'
);

CREATE TYPE public.school_type AS ENUM (
  'kindergarten',
  'primary',
  'middle_school',
  'high_school',
  'university',
  'driving_school',
  'art_school',
  'sport_school',
  'professional_school'
);

CREATE TYPE public.theme_mode AS ENUM ('light', 'dark', 'system');

-- =========================================
-- 2. SCHOOLS TABLE
-- =========================================
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  school_type public.school_type NOT NULL DEFAULT 'high_school',
  country TEXT NOT NULL DEFAULT 'FR',
  currency TEXT NOT NULL DEFAULT 'EUR',
  default_language TEXT NOT NULL DEFAULT 'fr',
  logo_url TEXT,
  -- Personnalisable palette (HSL strings, e.g. "215 80% 45%")
  primary_color TEXT NOT NULL DEFAULT '215 80% 45%',
  accent_color TEXT NOT NULL DEFAULT '160 70% 40%',
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 3. PROFILES TABLE
-- =========================================
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 4. USER_ROLES TABLE (separate, anti-escalation)
-- =========================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, school_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 5. USER_PREFERENCES TABLE
-- =========================================
CREATE TABLE public.user_preferences (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_mode public.theme_mode NOT NULL DEFAULT 'system',
  custom_primary_color TEXT,
  custom_accent_color TEXT,
  language TEXT NOT NULL DEFAULT 'fr',
  use_school_palette BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 6. SECURITY DEFINER FUNCTION (anti-recursion)
-- =========================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_school(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- =========================================
-- 7. TRIGGER: auto-create profile + preferences on signup
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- 8. TRIGGER: updated_at auto
-- =========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- 9. RLS POLICIES
-- =========================================

-- profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in their school"
  ON public.profiles FOR SELECT
  USING (school_id IS NOT NULL AND school_id = public.get_user_school(auth.uid()));

CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Directors can update profiles in their school"
  ON public.profiles FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'director')
    AND school_id = public.get_user_school(auth.uid())
  );

CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- user_roles (CRITICAL: users CANNOT modify their own roles)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Directors can view roles in their school"
  ON public.user_roles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'director')
    AND school_id = public.get_user_school(auth.uid())
  );

CREATE POLICY "Super admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Directors can assign roles in their school"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'director')
    AND school_id = public.get_user_school(auth.uid())
    AND role <> 'super_admin'
  );

CREATE POLICY "Directors can remove non-super-admin roles in their school"
  ON public.user_roles FOR DELETE
  USING (
    public.has_role(auth.uid(), 'director')
    AND school_id = public.get_user_school(auth.uid())
    AND role <> 'super_admin'
  );

-- schools
CREATE POLICY "Anyone authenticated can view their school"
  ON public.schools FOR SELECT
  TO authenticated
  USING (id = public.get_user_school(auth.uid()));

CREATE POLICY "Super admins can view all schools"
  ON public.schools FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all schools"
  ON public.schools FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Directors can update their school"
  ON public.schools FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'director')
    AND id = public.get_user_school(auth.uid())
  );

-- user_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- =========================================
-- 10. INDEXES
-- =========================================
CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_school_id ON public.user_roles(school_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);