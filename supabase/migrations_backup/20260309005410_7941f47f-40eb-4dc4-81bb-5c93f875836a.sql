-- Allow users to self-assign ONLY the 'student' role on first signup
-- (prevents privilege escalation while unblocking student registration + role bootstrap)

CREATE POLICY "Users can self-assign student role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'student'::public.app_role
);
