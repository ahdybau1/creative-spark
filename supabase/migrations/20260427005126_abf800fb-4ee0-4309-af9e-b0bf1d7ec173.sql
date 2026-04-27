-- Remplacer la lecture publique trop large par une lecture sans listing
-- Les images restent accessibles via leur URL directe (Supabase signe en HEAD/GET pour les buckets publics)
-- mais on n'autorise plus le SELECT * (listing)

DROP POLICY IF EXISTS "Public read student photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read school logos" ON storage.objects;

-- Pour les buckets publics, l'accès via URL fonctionne sans politique SELECT.
-- Si un utilisateur authentifié doit lister les fichiers, on l'autorise explicitement.

CREATE POLICY "Authenticated list student photos of own school"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-photos'
  AND (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'director')
    OR public.has_role(auth.uid(),'deputy_director')
    OR public.has_role(auth.uid(),'secretary')
    OR public.has_role(auth.uid(),'teacher')
    OR public.has_role(auth.uid(),'main_teacher')
    OR public.has_role(auth.uid(),'supervisor')
  )
);

CREATE POLICY "Authenticated list school logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'school-logos'
  AND auth.uid() IS NOT NULL
);