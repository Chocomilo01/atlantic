import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DepartmentsTab from "./DepartmentsTab";
import CoursesTab from "./CoursesTab";
import LecturesTab from "./LecturesTab";
import StudentsTab from "./StudentsTab";
import InstructorStudentsTab from "./InstructorStudentsTab";
import InvitationsTab from "./InvitationsTab";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("departments");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full grid-cols-6">
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="lectures">Lectures</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="assign">Assign to Instructor</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
          </TabsList>
          <TabsContent value="departments"><DepartmentsTab /></TabsContent>
          <TabsContent value="courses"><CoursesTab /></TabsContent>
          <TabsContent value="lectures"><LecturesTab /></TabsContent>
          <TabsContent value="students"><StudentsTab /></TabsContent>
          <TabsContent value="assign"><InstructorStudentsTab /></TabsContent>
          <TabsContent value="invitations"><InvitationsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
