import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (data: any[], type: string) => void;
}

export const CSVUploadModal = ({ isOpen, onClose, onUploadComplete }: CSVUploadModalProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const uploadTypes = [
    { value: "students", label: t.students || "Students", 
      template: "name,phone,email,grade,level,address", 
      description: "Upload student information with name, phone, email, grade, level, and address" 
    },
    { value: "teachers", label: t.teachers || "Teachers", 
      template: "name,phone,email,subject,qualification,experience", 
      description: "Upload teacher information with name, phone, email, subject specialization, qualification, and experience" 
    },
    { value: "groups", label: t.groups || "Groups", 
      template: "name,level,grade,subject,teacher,classroom,capacity,schedule", 
      description: "Upload group information with all required details" 
    },
    { value: "courses", label: t.courses || "Courses", 
      template: "title,subject,level,teacher,group,date_of_day,start_hour,end_hour,fee", 
      description: "Upload course information with title, subject, level, teacher, assigned group, schedule, and fee" 
    },
    { value: "subjects", label: t.subjects || "Subjects", 
      template: "name,category,description", 
      description: "Upload subjects with name, category, and description" 
    },
    { value: "attendance", label: t.attendance || "Attendance", 
      template: "student_name,group_name,date,status", 
      description: "Upload attendance data with student name, group, date (YYYY-MM-DD), and status (present/absent)" 
    },
    { value: "payments", label: t.payments || "Payments", 
      template: "student_name,amount,date,status,description", 
      description: "Upload payment records with student name, amount, date, status, and description" 
    },
    { value: "schedules", label: t.schedule || "Schedules", 
      template: "course_name,teacher,group,day,start_time,end_time,classroom", 
      description: "Upload schedule information with course, teacher, group, day, time, and classroom" 
    },
    { value: "reports", label: t.reports || "Reports", 
      template: "report_type,student_name,subject,score,grade,date,comments", 
      description: "Upload report data with type, student, subject, score, grade, date, and comments" 
    }
  ];

  const validateCSVData = (data: any[], type: string): string[] => {
    const errors: string[] = [];
    
    if (data.length === 0) {
      errors.push("CSV file is empty");
      return errors;
    }

    const requiredFields: { [key: string]: string[] } = {
      students: ["name", "phone"],
      teachers: ["name", "phone", "email", "subject"],
      groups: ["name", "level", "grade", "subject", "teacher", "classroom", "capacity"],
      courses: ["title", "subject", "level", "teacher", "date_of_day", "start_hour", "end_hour"],
      subjects: ["name"],
      attendance: ["student_name", "group_name", "date", "status"],
      payments: ["student_name", "amount", "date", "status"],
      schedules: ["course_name", "teacher", "group", "day", "start_time", "end_time"],
      reports: ["report_type", "student_name", "subject", "score", "date"]
    };

    const required = requiredFields[type] || [];
    const firstRow = data[0];
    
    // Check if all required fields are present
    required.forEach(field => {
      if (!firstRow.hasOwnProperty(field)) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate specific field types
    data.forEach((row, index) => {
      if (type === "students") {
        if (!row.phone || row.phone.length < 10) {
          errors.push(`Row ${index + 1}: Invalid phone number`);
        }
        if (row.email && !row.email.includes("@")) {
          errors.push(`Row ${index + 1}: Invalid email format`);
        }
      }
      
      if (type === "groups") {
        const capacity = parseInt(row.capacity);
        if (isNaN(capacity) || capacity < 1 || capacity > 50) {
          errors.push(`Row ${index + 1}: Capacity must be between 1 and 50`);
        }
      }
      
      if (type === "attendance") {
        if (!["present", "absent"].includes((row.status || '').toLowerCase())) {
          errors.push(`Row ${index + 1}: Status must be 'present' or 'absent'`);
        }
        if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
          errors.push(`Row ${index + 1}: Date must be in YYYY-MM-DD format`);
        }
      }
      
      if (type === "payments") {
        const amount = parseFloat(row.amount);
        if (isNaN(amount) || amount <= 0) {
          errors.push(`Row ${index + 1}: Amount must be a positive number`);
        }
      }
    });

    return errors.slice(0, 10); // Limit to first 10 errors
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedType) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: t.error || "Invalid file type",
        description: t.csvUpload || "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setValidationErrors([]);
    setUploadSuccess(false);

    try {
      const text = await file.text();
      setUploadProgress(30);

      const data = parseCSV(text);
      setUploadProgress(60);

      const errors = validateCSVData(data, selectedType);
      setUploadProgress(80);

      if (errors.length > 0) {
        setValidationErrors(errors);
        setUploadProgress(100);
        setIsProcessing(false);
        return;
      }

      setUploadProgress(100);
      setUploadSuccess(true);
      
      // Simulate processing delay
      setTimeout(() => {
        onUploadComplete(data, selectedType);
        toast({
          title: t.success || "Upload successful",
          description: `${data.length} ${t.records || 'records'} ${t.uploaded || 'uploaded'} ${t.success?.toLowerCase?.() || 'successfully'}`
        });
        onClose();
        resetForm();
      }, 500);

    } catch (error) {
      toast({
        title: t.error || "Upload failed",
        description: t.failedToProcess || "Failed to process CSV file",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const selectedUploadType = uploadTypes.find(type => type.value === selectedType);
    if (!selectedUploadType) return;

    const csvContent = selectedUploadType.template;
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setSelectedType("");
    setUploadProgress(0);
    setIsProcessing(false);
    setValidationErrors([]);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t.csvUpload || 'CSV Bulk Upload'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Upload Type Selection */}
          <div>
            <Label htmlFor="upload-type">{t.selectDataType || 'Select Data Type'}</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder={t.chooseWhatToUpload || 'Choose what you want to upload'} />
              </SelectTrigger>
              <SelectContent>
                {uploadTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-sm text-muted-foreground mt-2">
                {uploadTypes.find(t => t.value === selectedType)?.description}
              </p>
            )}
          </div>

          {/* Template Download */}
          {selectedType && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{t.downloadTemplate || 'Download the template to ensure correct CSV format'}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadTemplate}
                  className="ml-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t.download || 'Download Template'}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* File Upload */}
          <div>
            <Label htmlFor="csv-file">{t.uploadCSV || 'Upload CSV File'}</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={!selectedType || isProcessing}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Upload Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t.processing || 'Processing...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">{t.validationErrors || 'Validation Errors:'}</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {t.csvValidated || 'CSV file validated successfully! Processing upload...'}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              {t.cancel}
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={!selectedType || isProcessing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t.uploadCSV || 'Upload CSV'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};