import { useRef, useEffect, useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface LecturePlayerProps {
  lecture: {
    id: string;
    title: string;
    video_url: string;
    course_id: string;
  };
}

const LecturePlayer = ({ lecture }: LecturePlayerProps) => {
  const { user } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);

  const qc = useQueryClient();

  const saveIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const [maxWatched, setMaxWatched] = useState(0);

  const isSeeking = useRef(false);

  // =========================
  // FETCH EXISTING PROGRESS
  // =========================
  const { data: existingProgress } = useQuery({
    queryKey: ["lecture-progress", user?.id, lecture.id],

    queryFn: async () => {
      const { data } = await supabase
        .from("video_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("lecture_id", lecture.id)
        .maybeSingle();

      return data;
    },

    enabled: !!user,
  });

  // =========================
  // RESTORE VIDEO POSITION
  // =========================
  useEffect(() => {
  const video = videoRef.current;

  if (!video || !existingProgress)
    return;

  const handleLoadedMetadata =
    () => {
      const savedTime = Number(
        existingProgress.progress_seconds || 0
      );

      // resume from saved position
      if (savedTime > 0) {
        video.currentTime =
          savedTime;
      }

      // allow full seek if completed
      if (
        existingProgress.completed
      ) {
        setMaxWatched(
          Infinity
        );
      } else {
        setMaxWatched(
          savedTime
        );
      }
    };

  video.addEventListener(
    "loadedmetadata",
    handleLoadedMetadata
  );

  return () => {
    video.removeEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );
  };
}, [existingProgress, lecture.id]);
  // =========================
  // FORCE VIDEO RELOAD
  // =========================
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.load();
    }
  }, [lecture.video_url]);

  // =========================
  // PREVENT FAST FORWARD
  // =========================
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleSeeking = () => {
      // already completed
      if (maxWatched === Infinity) return;

      // prevent skipping ahead
      if (video.currentTime > maxWatched + 2) {
        isSeeking.current = true;

        video.currentTime = maxWatched;

        toast.error("You can't skip ahead until you finish watching.");

        isSeeking.current = false;
      }
    };

    const handleTimeUpdate = () => {
      if (isSeeking.current) return;

      // update highest watched point
      if (maxWatched !== Infinity && video.currentTime > maxWatched) {
        setMaxWatched(video.currentTime);
      }
    };

    video.addEventListener("seeking", handleSeeking);

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("seeking", handleSeeking);

      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [maxWatched, lecture.id]);

  // =========================
  // OPTIONAL: LIMIT PLAYBACK SPEED
  // =========================
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const limitPlaybackSpeed = () => {
      if (video.playbackRate > 1.25) {
        video.playbackRate = 1.25;

        toast.error("Playback speed limited to 1.25x");
      }
    };

    video.addEventListener("ratechange", limitPlaybackSpeed);

    return () => {
      video.removeEventListener("ratechange", limitPlaybackSpeed);
    };
  }, []);

  // =========================
  // SAVE PROGRESS
  // =========================
  const saveProgress = useCallback(
    async (completed = false) => {
      if (!videoRef.current || !user) return;

      const currentTime = Math.floor(videoRef.current.currentTime);

      const { data: existing } = await supabase
        .from("video_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("lecture_id", lecture.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("video_progress")
          .update({
            progress_seconds: currentTime,

            completed,

            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("video_progress").insert({
          user_id: user.id,

          lecture_id: lecture.id,

          progress_seconds: currentTime,

          completed,
        });
      }

      if (completed) {
        setMaxWatched(Infinity);

        qc.invalidateQueries({
          queryKey: ["video-progress"],
        });

        toast.success("Lecture completed! 🎉");
      }
    },
    [user, lecture.id, qc],
  );

  // =========================
  // AUTO SAVE EVERY 10s
  // =========================
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        saveProgress(false);
      }
    }, 10000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }

      saveProgress(false);
    };
  }, [saveProgress]);

  // =========================
  // VIDEO EVENTS
  // =========================
  const handleEnded = () => {
    saveProgress(true);
  };

  const handlePause = () => {
    saveProgress(false);
  };

  // =========================
  // WATCH PERCENT
  // =========================
  const videoDuration = videoRef.current?.duration || 0;

  const watchPercent =
    videoDuration > 0 && maxWatched !== Infinity
      ? Math.min(100, Math.round((maxWatched / videoDuration) * 100))
      : maxWatched === Infinity
        ? 100
        : 0;

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-4">
      <div className="card-elevated overflow-hidden">
        <video
          key={lecture.id}
          ref={videoRef}
          src={lecture.video_url}
          controls
          controlsList="nodownload"
          className="aspect-video w-full bg-foreground/5"
          onEnded={handleEnded}
          onPause={handlePause}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-display text-foreground">
          {lecture.title}
        </h2>

        {maxWatched !== Infinity && videoDuration > 0 && (
          <span className="text-sm text-muted-foreground">
            {watchPercent}% watched
          </span>
        )}

        {maxWatched === Infinity && (
          <span className="text-sm text-primary font-medium">✓ Completed</span>
        )}
      </div>

      {maxWatched !== Infinity && videoDuration > 0 && (
        <Progress value={watchPercent} className="h-2" />
      )}
    </div>
  );
};

export default LecturePlayer;
