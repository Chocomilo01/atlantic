import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";

const LecturesTab = () => {
  const qc = useQueryClient();

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("1");
  const [sortOrder, setSortOrder] = useState("0");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // =========================
  // COURSES
  // =========================

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("title");

      if (error) throw error;

      return data;
    },
  });

  // =========================
  // LECTURES
  // =========================

  const { data: lectures = [], isLoading } = useQuery({
    queryKey: ["lectures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lectures")
        .select(`
          *,
          courses(title)
        `)
        .order("level")
        .order("sort_order");

      if (error) throw error;

      return data;
    },
  });

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile || !courseId) return;

    setUploading(true);

    try {
      const fileExt = videoFile.name.split(".").pop();

      const filePath = `${courseId}/${Date.now()}.${fileExt}`;

      // upload video
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, videoFile);

      if (uploadError) {
        throw uploadError;
      }

      // get public url
      const { data: urlData } = supabase.storage
        .from("videos")
        .getPublicUrl(filePath);

      // insert lecture
      const { error } = await supabase.from("lectures").insert({
        course_id: courseId,
        title,
        description: description || null,
        level: Number(level),
        sort_order: Number(sortOrder),
        video_url: urlData.publicUrl,
      });

      if (error) {
        throw error;
      }

      toast.success("Lecture uploaded successfully");

      qc.invalidateQueries({
        queryKey: ["lectures"],
      });

      // reset form
      setCourseId("");
      setTitle("");
      setDescription("");
      setLevel("1");
      setSortOrder("0");
      setVideoFile(null);
    } catch (error: any) {
      toast.error(error.message);
    }

    setUploading(false);
  };

  // =========================
  // DELETE
  // =========================

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lectures")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["lectures"],
      });

      toast.success("Lecture deleted");
    },

    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  return (
    <div className="space-y-6">

      {/* ========================= */}
      {/* ADD LECTURE */}
      {/* ========================= */}

      <div className="card-elevated p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Add Video Lecture
        </h3>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <Label>Course</Label>

            <Select
              value={courseId}
              onValueChange={setCourseId}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>

              <SelectContent>
                {courses.map((course: any) => (
                  <SelectItem
                    key={course.id}
                    value={course.id}
                  >
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title</Label>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lecture title"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description</Label>

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Level</Label>

              <Input
                type="number"
                min="1"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Sort Order</Label>

              <Input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Video File</Label>

            <Input
              type="file"
              accept="video/*"
              required
              className="mt-1"
              onChange={(e) =>
                setVideoFile(e.target.files?.[0] || null)
              }
            />
          </div>

          <Button
            type="submit"
            className="btn-primary"
            disabled={
              uploading ||
              !courseId ||
              !videoFile
            }
          >
            <Upload className="mr-2 h-4 w-4" />

            {uploading
              ? "Uploading..."
              : "Upload Lecture"}
          </Button>
        </form>
      </div>

      {/* ========================= */}
      {/* LECTURES LIST */}
      {/* ========================= */}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          Uploaded Lectures
        </h3>

        {isLoading ? (
          <p className="text-muted-foreground">
            Loading...
          </p>
        ) : lectures.length === 0 ? (
          <p className="text-muted-foreground">
            No lectures yet.
          </p>
        ) : (
          lectures.map((lecture: any) => (
            <div
              key={lecture.id}
              className="card-elevated flex items-center justify-between p-4"
            >
              <div>
                <p className="font-semibold">
                  {lecture.title}
                </p>

                <p className="text-sm text-muted-foreground">
                  Level {lecture.level} •{" "}
                  {lecture.courses?.title}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  deleteMutation.mutate(lecture.id)
                }
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LecturesTab;