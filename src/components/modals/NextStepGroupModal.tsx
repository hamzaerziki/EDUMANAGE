import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, BookOpen, Plus } from "lucide-react";
import AddCourseModal from "./AddCourseModal";

interface NextStepGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupData: any;
}

export const NextStepGroupModal = ({ isOpen, onClose, groupData }: NextStepGroupModalProps) => {
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Group Created Successfully!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {groupData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{groupData.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{groupData.level}</Badge>
                    <Badge variant="outline">{groupData.grade}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Subject:</span> {groupData.subject}</p>
                    <p><span className="font-medium">Teacher(s):</span> {groupData.teacher}</p>
                    <p><span className="font-medium">Classroom:</span> {groupData.classroom}</p>
                    <p><span className="font-medium">Capacity:</span> {groupData.capacity} students</p>
                    <p><span className="font-medium">Schedule:</span> {groupData.schedule}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <h3 className="font-medium">Next Steps:</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    setShowAddCourseModal(true);
                  }}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create and Assign Course to This Group
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    onClose();
                    // Navigate to groups page to add students
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Students to This Group
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddCourseModal 
        open={showAddCourseModal} 
        onOpenChange={setShowAddCourseModal}
      />
    </>
  );
};