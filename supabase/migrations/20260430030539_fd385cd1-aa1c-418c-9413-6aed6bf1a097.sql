REVOKE EXECUTE ON FUNCTION public.is_guardian_of_student(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_guardian_of_student(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_guardian_of_student(uuid, uuid) TO authenticated;