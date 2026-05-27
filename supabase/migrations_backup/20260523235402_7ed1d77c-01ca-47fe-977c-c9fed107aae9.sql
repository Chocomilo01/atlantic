-- Invitations table
CREATE TABLE public.registration_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  role public.app_role NOT NULL,
  email TEXT,
  created_by UUID NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_invitations ENABLE ROW LEVEL SECURITY;

-- Constrain role to student or instructor only
CREATE OR REPLACE FUNCTION public.validate_invitation_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role NOT IN ('student', 'instructor') THEN
    RAISE EXCEPTION 'Invitations can only be for student or instructor roles';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_invitation_role_trg
BEFORE INSERT OR UPDATE ON public.registration_invitations
FOR EACH ROW EXECUTE FUNCTION public.validate_invitation_role();

-- Super admins manage invitations
CREATE POLICY "Super admins can view invitations"
ON public.registration_invitations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Super admins can create invitations"
ON public.registration_invitations FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin') AND created_by = auth.uid());

CREATE POLICY "Super admins can delete invitations"
ON public.registration_invitations FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Anyone (including anon) can look up an invitation by token to validate it
CREATE POLICY "Public can read invitations by token"
ON public.registration_invitations FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can mark an invitation as used (only when token is unused and not expired)
CREATE POLICY "Public can mark invitation used"
ON public.registration_invitations FOR UPDATE
TO anon, authenticated
USING (used_at IS NULL AND expires_at > now())
WITH CHECK (used_at IS NOT NULL);