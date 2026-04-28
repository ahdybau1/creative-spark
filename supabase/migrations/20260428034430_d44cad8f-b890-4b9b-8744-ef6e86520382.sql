-- 1) Étendre handle_new_user pour assigner automatiquement le rôle "director"
-- (mode démo : chaque nouveau compte démarre comme directeur sans école).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  -- Attribuer le rôle "director" par défaut (mode démo / onboarding)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'director')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 2) Brancher le trigger sur auth.users (s'il n'existe pas déjà)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3) Rétroactif : donner le rôle "director" aux comptes existants qui n'en ont aucun
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'director'::app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id
);

-- 4) Garantir que les profils existants existent (sécurité)
INSERT INTO public.profiles (id, full_name, email)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.email), u.email
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- 5) Permettre à un "director" sans école de créer son établissement
-- (la policy existante ne couvrait que UPDATE)
DROP POLICY IF EXISTS "Directors can create their school" ON public.schools;
CREATE POLICY "Directors can create their school"
  ON public.schools
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'director'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 6) Permettre à un utilisateur de mettre à jour son propre profile.school_id
-- (le wizard a besoin d'attacher l'école au profil après création)
-- La policy "Users can update their own profile" couvre déjà ce cas, on s'assure juste qu'elle existe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;
