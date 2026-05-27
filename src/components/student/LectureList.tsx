import { CheckCircle2, Lock, PlayCircle } from "lucide-react";

interface Lecture {
  id: string;
  title: string;
  level: number;
  sort_order: number;
}

interface Progress {
  lecture_id: string;
  completed: boolean;
  progress_seconds: number;
}

interface LectureListProps {
  lectures: Lecture[];
  progress: Progress[];
  unlockedLectures: Set<string>;
  selectedLectureId: string | null;
  onSelect: (id: string) => void;
}

const LectureList = ({ lectures, progress, unlockedLectures, selectedLectureId, onSelect }: LectureListProps) => {
  const progressMap = new Map(progress.map((p) => [p.lecture_id, p]));
  const levels = [...new Set(lectures.map((l) => l.level))].sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {levels.map((level) => (
        <div key={level}>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Level {level}
          </h4>
          <div className="space-y-1">
            {lectures
              .filter((l) => l.level === level)
              .map((lecture) => {
                const isUnlocked =
  unlockedLectures.size === 0
    ? true
    : unlockedLectures.has(lecture.id);
                const p = progressMap.get(lecture.id);
                const isCompleted = p?.completed;
                const isSelected = lecture.id === selectedLectureId;

                return (
                 <button
  key={lecture.id}
  onClick={() => isUnlocked && onSelect(lecture.id)}
  disabled={!isUnlocked}
  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
    isSelected
      ? "bg-primary/10 border border-primary/30"
      : isUnlocked
      ? "hover:bg-muted"
      : "opacity-50 cursor-not-allowed"
  }`}
>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    ) : isUnlocked ? (
                      <PlayCircle className="h-5 w-5 shrink-0 text-primary" />
                    ) : (
                      <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">{lecture.title}</span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LectureList;
