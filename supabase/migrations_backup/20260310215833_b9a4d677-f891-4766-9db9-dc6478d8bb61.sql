
-- Allow instructors to view video_progress of their assigned students
CREATE POLICY "Instructors can view assigned students progress"
ON public.video_progress
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.instructor_students
    WHERE instructor_students.instructor_id = auth.uid()
    AND instructor_students.student_id = video_progress.user_id
  )
);
