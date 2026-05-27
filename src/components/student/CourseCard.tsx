import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    departments: {
      name: string;
    } | null;
  };
}

const CourseCard = ({ course }: CourseCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() =>
        navigate(`/course/${course.id}`)
      }
      className="card-elevated cursor-pointer p-6 transition-all hover:scale-[1.02]"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <BookOpen className="h-6 w-6 text-primary" />
      </div>

      <h3 className="text-lg font-bold">
        {course.title}
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        {course.departments?.name}
      </p>

      {course.description && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {course.description}
        </p>
      )}
    </div>
  );
};

export default CourseCard;




// import { useNavigate } from "react-router-dom";
// import { BookOpen } from "lucide-react";

// interface CourseCardProps {
//   course: {
//     id: string;
//     title: string;
//     description: string | null;
//     departments: { name: string } | null;
//   };
// }

// const CourseCard = ({ course }: CourseCardProps) => {
//   const navigate = useNavigate();

//   return (
//     <div
//       className="card-elevated cursor-pointer p-6 transition-all duration-200 hover:scale-[1.02]"
//       onClick={() => navigate(`/course/${course.id}`)}
//     >
//       <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
//         <BookOpen className="h-6 w-6 text-primary" />
//       </div>
//       <h3 className="text-lg font-bold font-display text-foreground">{course.title}</h3>
//       <p className="mt-1 text-sm text-muted-foreground">{(course as any).departments?.name}</p>
//       {course.description && (
//         <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{course.description}</p>
//       )}
//     </div>
//   );
// };

// export default CourseCard;
