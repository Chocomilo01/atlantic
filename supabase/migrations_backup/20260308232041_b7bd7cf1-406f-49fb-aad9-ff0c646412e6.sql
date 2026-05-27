
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('superadmin', 'student');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Superadmins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view departments" ON public.departments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmins can manage departments" ON public.departments
  FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view courses" ON public.courses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmins can manage courses" ON public.courses
  FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));

-- Lectures table (video lectures with levels)
CREATE TABLE public.lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  video_url TEXT NOT NULL,
  duration_seconds INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view lectures" ON public.lectures
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmins can manage lectures" ON public.lectures
  FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));

-- Student department assignments (admin assigns students)
CREATE TABLE public.student_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, department_id)
);
ALTER TABLE public.student_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own assignments" ON public.student_departments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Superadmins can manage student assignments" ON public.student_departments
  FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));

-- Video progress tracking
CREATE TABLE public.video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE NOT NULL,
  progress_seconds NUMERIC NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lecture_id)
);
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own progress" ON public.video_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can upsert their own progress" ON public.video_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can update their own progress" ON public.video_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Superadmins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'superadmin'));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for videos
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

CREATE POLICY "Anyone can view videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Superadmins can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmins can delete videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'superadmin'));

-- Function for first superadmin registration
CREATE OR REPLACE FUNCTION public.register_first_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'superadmin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'superadmin');
  RETURN true;
END;
$$;
