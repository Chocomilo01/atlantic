import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";
import LecturePlayer from "@/components/student/LecturePlayer";
import LectureList from "@/components/student/LectureList";
import CourseAssignments from "@/components/student/CourseAssignments";
import { useState } from "react";

const CourseLectures = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, loading } = useAuth();
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*, departments(name)")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: lectures = [] } = useQuery({
    queryKey: ["lectures", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lectures")
        .select("*")
        .eq("course_id", courseId!)
        .order("level")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["video-progress", user?.id, courseId],
    queryFn: async () => {
      const lectureIds = lectures.map((l) => l.id);
      if (!lectureIds.length) return [];
      const { data, error } = await supabase
        .from("video_progress")
        .select("*")
        .eq("user_id", user!.id)
        .in("lecture_id", lectureIds);
      if (error) throw error;
      return data;
    },
    enabled: !!user && lectures.length > 0,
  });

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const selectedLecture =
  lectures.find((l) => l.id === selectedLectureId) ||
  lectures[0] ||
  null;

  // Determine which lectures are unlocked based on progress
  const getUnlockedLectures = () => {
    const progressMap = new Map(progress.map((p) => [p.lecture_id, p]));
    const unlocked = new Set<string>();

    const levels = [...new Set(lectures.map((l) => l.level))].sort((a, b) => a - b);

    for (const level of levels) {
      const levelLectures = lectures.filter((l) => l.level === level);

      if (level === levels[0]) {
        // First level is always unlocked
        levelLectures.forEach((l) => unlocked.add(l.id));
      } else {
        // Check if all lectures in previous level are completed
        const prevLevel = levels[levels.indexOf(level) - 1];
        const prevLectures = lectures.filter((l) => l.level === prevLevel);
        const allPrevCompleted = prevLectures.every(
          (l) => progressMap.get(l.id)?.completed
        );
        if (allPrevCompleted) {
          levelLectures.forEach((l) => unlocked.add(l.id));
        }
      }
    }

    return unlocked;
  };

 const unlockedLectures =
  lectures.length > 0
    ? getUnlockedLectures()
    : new Set<string>();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">{course?.title}</h1>
          <p className="text-muted-foreground">{(course as any)?.departments?.name}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {selectedLecture ? (
              <LecturePlayer lecture={selectedLecture} />
            ) : (
              <div className="card-elevated flex aspect-video items-center justify-center">
                <p className="text-muted-foreground">Select a lecture to start watching</p>
              </div>
            )}
            <CourseAssignments courseId={courseId!} />
          </div>

          <div>
            <LectureList
              lectures={lectures}
              progress={progress}
              unlockedLectures={unlockedLectures}
              selectedLectureId={selectedLectureId}
              onSelect={setSelectedLectureId}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseLectures;
