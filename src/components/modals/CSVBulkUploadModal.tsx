import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { CSVUploadModal } from "./CSVUploadModal";

interface CSVBulkUploadModalProps {
  onUploadComplete: (data: any[], type: string) => void;
}

export const CSVBulkUploadModal = ({ onUploadComplete }: CSVBulkUploadModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            CSV Upload
          </Button>
        </DialogTrigger>
      </Dialog>
      
      <CSVUploadModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onUploadComplete={onUploadComplete}
      />
    </>
  );
};