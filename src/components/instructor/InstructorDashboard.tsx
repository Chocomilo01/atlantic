import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudentProgressTab from "./StudentProgressTab";
import AssignmentsTab from "./AssignmentsTab";

const InstructorDashboard = () => {
  const [activeTab, setActiveTab] = useState("progress");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">Instructor Dashboard</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="progress">Student Progress</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>
          <TabsContent value="progress"><StudentProgressTab /></TabsContent>
          <TabsContent value="assignments"><AssignmentsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default InstructorDashboard;