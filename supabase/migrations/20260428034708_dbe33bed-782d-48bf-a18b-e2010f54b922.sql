CREATE OR REPLACE FUNCTION public.setup_demo_school(_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_school_id uuid;
  level_item jsonb;
  payload_levels jsonb;
  year_name text;
  year_start date;
  year_end date;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_role(auth.uid(), 'director'::public.app_role)
     AND NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only directors can create a demo school';
  END IF;

  INSERT INTO public.schools (
    name,
    school_type,
    motto,
    founded_year,
    country,
    currency,
    default_language,
    address,
    phone,
    email,
    website,
    calendar_system,
    grading_system
  )
  VALUES (
    COALESCE(NULLIF(_payload->>'name', ''), 'École de démonstration'),
    COALESCE(NULLIF(_payload->>'school_type', ''), 'high_school')::public.school_type,
    NULLIF(_payload->>'motto', ''),
    NULLIF(_payload->>'founded_year', '')::integer,
    COALESCE(NULLIF(_payload->>'country', ''), 'FR'),
    COALESCE(NULLIF(_payload->>'currency', ''), 'EUR'),
    COALESCE(NULLIF(_payload->>'default_language', ''), 'fr'),
    NULLIF(_payload->>'address', ''),
    NULLIF(_payload->>'phone', ''),
    NULLIF(_payload->>'email', ''),
    NULLIF(_payload->>'website', ''),
    COALESCE(NULLIF(_payload->>'calendar_system', ''), 'trimester')::public.calendar_system,
    COALESCE(NULLIF(_payload->>'grading_system', ''), 'out_of_20')::public.grading_system
  )
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

  payload_levels := COALESCE(_payload->'levels', '[]'::jsonb);
  IF jsonb_typeof(payload_levels) = 'array' THEN
    FOR level_item IN SELECT * FROM jsonb_array_elements(payload_levels)
    LOOP
      INSERT INTO public.levels (school_id, name, short_code, cycle, order_index)
      VALUES (
        new_school_id,
        COALESCE(NULLIF(level_item->>'name', ''), 'Niveau'),
        COALESCE(NULLIF(level_item->>'short_code', ''), NULLIF(level_item->>'shortCode', ''), 'GEN'),
        NULLIF(level_item->>'cycle', ''),
        COALESCE(NULLIF(level_item->>'order_index', '')::integer, NULLIF(level_item->>'orderIndex', '')::integer, 0)
      );
    END LOOP;
  END IF;

  year_name := NULLIF(_payload->>'academic_year_name', '');
  year_start := NULLIF(_payload->>'academic_year_start', '')::date;
  year_end := NULLIF(_payload->>'academic_year_end', '')::date;

  IF year_name IS NOT NULL THEN
    INSERT INTO public.academic_years (school_id, name, start_date, end_date, is_active)
    VALUES (
      new_school_id,
      year_name,
      COALESCE(year_start, make_date(EXTRACT(YEAR FROM now())::int, 9, 1)),
      COALESCE(year_end, make_date(EXTRACT(YEAR FROM now())::int + 1, 7, 31)),
      true
    );
  END IF;

  RETURN new_school_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.setup_demo_school(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.setup_demo_school(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.setup_demo_school(jsonb) TO authenticated;