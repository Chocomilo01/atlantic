
-- Allow instructors to self-assign their role during registration
CREATE POLICY "Users can self-assign instructor role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'instructor'::app_role);

-- Create instructor_students table for superadmin to assign students to instructors
CREATE TABLE public.instructor_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL,
  student_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (instructor_id, student_id)
);

ALTER TABLE public.instructor_students ENABLE ROW LEVEL SECURITY;

-- Superadmins can manage all assignments
CREATE POLICY "Superadmins can manage instructor_students"
ON public.instructor_students
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Instructors can view their own assigned students
CREATE POLICY "Instructors can view their students"
ON public.instructor_students
FOR SELECT
TO authenticated
USING (auth.uid() = instructor_id);

-- Students can view their instructor assignments
CREATE POLICY "Students can view their instructors"
ON public.instructor_students
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);
