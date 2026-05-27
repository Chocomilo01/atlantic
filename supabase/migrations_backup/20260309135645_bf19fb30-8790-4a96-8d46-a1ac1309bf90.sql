
-- Fix: Convert restrictive SELECT policies to permissive so they work as OR instead of AND

-- assignments: drop restrictive SELECT, recreate as permissive
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON public.assignments;
CREATE POLICY "Authenticated users can view assignments"
ON public.assignments FOR SELECT TO authenticated
USING (true);

-- courses: drop restrictive SELECT, recreate as permissive  
DROP POLICY IF EXISTS "Anyone authenticated can view courses" ON public.courses;
CREATE POLICY "Anyone authenticated can view courses"
ON public.courses FOR SELECT TO authenticated
USING (true);

-- departments: same fix
DROP POLICY IF EXISTS "Anyone authenticated can view departments" ON public.departments;
CREATE POLICY "Anyone authenticated can view departments"
ON public.departments FOR SELECT TO authenticated
USING (true);

-- lectures: same fix
DROP POLICY IF EXISTS "Anyone authenticated can view lectures" ON public.lectures;
CREATE POLICY "Anyone authenticated can view lectures"
ON public.lectures FOR SELECT TO authenticated
USING (true);

-- assignment_submissions: fix SELECT
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.assignment_submissions;
CREATE POLICY "Students can view their own submissions"
ON public.assignment_submissions FOR SELECT TO authenticated
USING (auth.uid() = student_id OR has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- assignment_submissions: fix INSERT
DROP POLICY IF EXISTS "Students can submit answers" ON public.assignment_submissions;
CREATE POLICY "Students can submit answers"
ON public.assignment_submissions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = student_id);

-- assignment_submissions: fix UPDATE (grading)
DROP POLICY IF EXISTS "Instructors can grade submissions" ON public.assignment_submissions;
CREATE POLICY "Instructors can grade submissions"
ON public.assignment_submissions FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- assignments: fix INSERT
DROP POLICY IF EXISTS "Instructors can create assignments" ON public.assignments;
CREATE POLICY "Instructors can create assignments"
ON public.assignments FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- assignments: fix UPDATE
DROP POLICY IF EXISTS "Instructors can update their own assignments" ON public.assignments;
CREATE POLICY "Instructors can update their own assignments"
ON public.assignments FOR UPDATE TO authenticated
USING (instructor_id = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role));

-- assignments: fix DELETE
DROP POLICY IF EXISTS "Instructors can delete their own assignments" ON public.assignments;
CREATE POLICY "Instructors can delete their own assignments"
ON public.assignments FOR DELETE TO authenticated
USING (instructor_id = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role));

-- profiles: make SELECT permissive so instructors can see student names
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
CREATE POLICY "Superadmins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Instructors need to view student profiles for submissions
CREATE POLICY "Instructors can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'instructor'::app_role));

-- user_roles: fix policies to be permissive
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Superadmins can view all roles" ON public.user_roles;
CREATE POLICY "Superadmins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Superadmins can insert roles" ON public.user_roles;
CREATE POLICY "Superadmins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Superadmins can update roles" ON public.user_roles;
CREATE POLICY "Superadmins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Users can self-assign student role" ON public.user_roles;
CREATE POLICY "Users can self-assign student role"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'student'::app_role);

-- student_departments: fix
DROP POLICY IF EXISTS "Students can view their own assignments" ON public.student_departments;
CREATE POLICY "Students can view their own dept assignments"
ON public.student_departments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Superadmins can manage student assignments" ON public.student_departments;
CREATE POLICY "Superadmins can manage student depts"
ON public.student_departments FOR ALL TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- video_progress: fix
DROP POLICY IF EXISTS "Students can view their own progress" ON public.video_progress;
CREATE POLICY "Students can view their own progress"
ON public.video_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can upsert their own progress" ON public.video_progress;
CREATE POLICY "Students can upsert their own progress"
ON public.video_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can update their own progress" ON public.video_progress;
CREATE POLICY "Students can update their own progress"
ON public.video_progress FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- profiles: fix INSERT and UPDATE
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Superadmin ALL policies need to be permissive too
DROP POLICY IF EXISTS "Superadmins can manage courses" ON public.courses;
CREATE POLICY "Superadmins can manage courses"
ON public.courses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Superadmins can manage departments" ON public.departments;
CREATE POLICY "Superadmins can manage departments"
ON public.departments FOR ALL TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Superadmins can manage lectures" ON public.lectures;
CREATE POLICY "Superadmins can manage lectures"
ON public.lectures FOR ALL TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));
