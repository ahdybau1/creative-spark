CREATE OR REPLACE FUNCTION public.setup_demo_school(
  _name text,
  _school_type public.school_type DEFAULT 'high_school'::public.school_type,
  _country text DEFAULT 'FR',
  _currency text DEFAULT 'EUR',
  _default_language text DEFAULT 'fr',
  _levels jsonb DEFAULT '[]'::jsonb,
  _academic_year_name text DEFAULT NULL,
  _academic_year_start date DEFAULT NULL,
  _academic_year_end date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_school_id uuid;
  level_item jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_role(auth.uid(), 'director'::public.app_role)
     AND NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only directors can create a demo school';
  END IF;

  INSERT INTO public.schools (name, school_type, country, currency, default_language)
  VALUES (_name, _school_type, _country, _currency, _default_language)
  RETURNING id INTO new_school_id;

  UPDATE public.profiles
     SET school_id = new_school_id,
         updated_at = now()
   WHERE id = auth.uid();

  UPDATE public.user_roles
     SET school_id = new_school_id
   WHERE user_id = auth.uid()
     AND role = 'director'::public.app_role;

  INSERT INTO public.user_roles (user_id, school_id, role)
  VALUES (auth.uid(), new_school_id, 'director'::public.app_role)
  ON CONFLICT DO NOTHING;

  IF jsonb_typeof(_levels) = 'array' THEN
    FOR level_item IN SELECT * FROM jsonb_array_elements(_levels)
    LOOP
      INSERT INTO public.levels (school_id, name, short_code, cycle, order_index)
      VALUES (
        new_school_id,
        COALESCE(level_item->>'name', 'Niveau'),
        COALESCE(level_item->>'shortCode', level_item->>'short_code', 'GEN'),
        level_item->>'cycle',
        COALESCE((level_item->>'orderIndex')::integer, (level_item->>'order_index')::integer, 0)
      );
    END LOOP;
  END IF;

  IF _academic_year_name IS NOT NULL THEN
    INSERT INTO public.academic_years (school_id, name, start_date, end_date, is_active)
    VALUES (
      new_school_id,
      _academic_year_name,
      COALESCE(_academic_year_start, make_date(EXTRACT(YEAR FROM now())::int, 9, 1)),
      COALESCE(_academic_year_end, make_date(EXTRACT(YEAR FROM now())::int + 1, 7, 31)),
      true
    );
  END IF;

  RETURN new_school_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.setup_demo_school(text, public.school_type, text, text, text, jsonb, text, date, date) TO authenticated;