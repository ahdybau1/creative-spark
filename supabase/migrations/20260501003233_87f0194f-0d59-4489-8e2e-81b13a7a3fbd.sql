-- Table des invitations de personnel
CREATE TABLE public.staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  role public.app_role NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | revoked
  temp_password text, -- mot de passe temporaire (visible 1 fois côté UI)
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invitations - directors manage own school"
ON public.staff_invitations
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'director'::app_role) OR has_role(auth.uid(), 'hr_manager'::app_role))
    AND school_id = get_user_school(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'director'::app_role) OR has_role(auth.uid(), 'hr_manager'::app_role))
    AND school_id = get_user_school(auth.uid())
  )
);

CREATE TRIGGER staff_invitations_updated_at
BEFORE UPDATE ON public.staff_invitations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_staff_invitations_school ON public.staff_invitations(school_id);
CREATE INDEX idx_staff_invitations_email ON public.staff_invitations(email);

-- Fonction pour lister le personnel d'une école (profiles + roles agrégés)
CREATE OR REPLACE FUNCTION public.list_school_staff(_school_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  roles app_role[],
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS user_id,
    p.full_name,
    p.email,
    p.phone,
    p.avatar_url,
    COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') AS roles,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id AND ur.school_id = _school_id
  WHERE p.school_id = _school_id
    AND (
      has_role(auth.uid(), 'super_admin'::app_role)
      OR (
        (has_role(auth.uid(), 'director'::app_role) OR has_role(auth.uid(), 'hr_manager'::app_role))
        AND _school_id = get_user_school(auth.uid())
      )
    )
  GROUP BY p.id, p.full_name, p.email, p.phone, p.avatar_url, p.created_at
  ORDER BY p.full_name NULLS LAST;
$$;

REVOKE EXECUTE ON FUNCTION public.list_school_staff(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_school_staff(uuid) TO authenticated;