import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { CreditCard, DollarSign, Calendar, Eye, Printer } from "lucide-react";
import { getAllCurriculumSubjectsBilingual } from "@/lib/moroccanCurriculum";
import { getCustomSubjects } from "@/lib/subjectStore";
import { paymentsApi, groupsApi, studentsApi } from "@/lib/api";

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialGroupId?: string;
  initialStudentId?: string;
  initialStudentInfo?: { id: string | number; name: string; subjects?: string[] };
  onPaymentRecorded?: (payment: any) => void;
  onRequestViewReceipt?: (payment: any) => void;
  onRequestPrintReceipt?: (payment: any) => void;
}

const RecordPaymentModal = ({ open, onOpenChange, initialGroupId, initialStudentId, initialStudentInfo, onPaymentRecorded, onRequestViewReceipt, onRequestPrintReceipt }: RecordPaymentModalProps) => {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const paymentMonthLabel = language === 'fr' ? 'Mois de paiement' : language === 'ar' ? 'شهر الدفع' : 'Payment Month';
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Group, 2: Select Student, 3: Payment Details, 4: Success
  const [selectedGroup, setSelectedGroup] = useState<string | number>("");
  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    course: "",
    amount: "",
    transactionId: "",
    paymentDate: "",
    paymentMonth: "",
    notes: "",
    subjects: [] as string[]
  });
  const [studentSubjects, setStudentSubjects] = useState<string[]>([]);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [createdPayment, setCreatedPayment] = useState<any | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const allSubjects = Array.from(new Set([
    ...getAllCurriculumSubjectsBilingual(),
    ...getCustomSubjects(),
  ])).sort((a, b) => a.localeCompare(b));

  // Load groups/students from backend
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const [g, s] = await Promise.all([
          groupsApi.list(),
          studentsApi.list().catch(()=>[]),
        ]);
        setGroups(Array.isArray(g) ? g : []);
        setAllStudents(Array.isArray(s) ? s : []);
      } catch {
        setGroups([]);
        setAllStudents([]);
      }
    };
    load();
  }, [open]);

  // Prefill from Payments page when provided
  useEffect(() => {
    if (!open) return;
    if (!initialGroupId) return;
    // Set group and move to student step
    setSelectedGroup(initialGroupId);
    setStep(2);
    if (initialStudentId) {
      // Try to resolve student and auto-fill from backend list
      const students = (allStudents || []).filter((s:any)=> String(s.group_id) === String(initialGroupId));
      const student = students.find((s:any) => String(s.id) === String(initialStudentId));
      if (student) {
        setFormData((prev) => ({
          ...prev,
          studentId: String(student.id),
          studentName: student.full_name || student.name || String(student.id),
          course: prev.course,
        }));
        setStudentSubjects([]);
        setFormData((prev) => ({ ...prev, subjects: [] }));
        setShowAllSubjects(false);
        setStep(3);
      }
    }
  }, [open, initialGroupId, initialStudentId, allStudents]);

  // Prefill directly from student info (bypass group selection)
  useEffect(() => {
    if (!open) return;
    if (!initialStudentInfo) return;
    const { id, name, subjects } = initialStudentInfo;
    setFormData((prev) => ({
      ...prev,
      studentId: String(id),
      studentName: name,
      course: Array.isArray(subjects) && subjects.length > 0 ? subjects[0] : prev.course,
      subjects: [],
    }));
    setStudentSubjects(subjects || []);
    setShowAllSubjects(false);
    setStep(3);
  }, [open, initialStudentInfo]);

  const currentStudents = selectedGroup
    ? (allStudents || [])
        .filter((s:any)=> String(s.group_id) === String(selectedGroup))
        .map((s:any)=> ({ id: String(s.id), name: s.full_name || s.name || String(s.id), subjects: [] as string[], phone: s.phone || '' }))
    : [];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-fill student data when student is selected
    if (field === "studentId") {
      const student = currentStudents.find(s => s.id === value);
      if (student) {
        setFormData(prev => ({
          ...prev,
          studentName: student.name,
          course: (student.subjects && student.subjects[0]) || ""
        }));
        setStudentSubjects(student.subjects || []);
        // reset selected subjects when student changes
        setFormData(prev => ({ ...prev, subjects: [] }));
        setShowAllSubjects(false);
        setStep(3); // Move to payment details
      }
    }
  };

  const handleSubjectToggle = (subject: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjects: checked
        ? [...prev.subjects, subject]
        : prev.subjects.filter(s => s !== subject)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Join selected subjects for compatibility with existing UI fields
    const selectedSubjectsJoined = (formData.subjects || []).join(', ');
    // Keep 'course' field in sync for external consumers
    setFormData(prev => ({ ...prev, course: selectedSubjectsJoined }));

    // Try backend first (requires numeric student ID)
    const studentIdNum = Number(formData.studentId);
    let created: any | null = null;
    try {
      if (!Number.isNaN(studentIdNum) && Number.isFinite(studentIdNum)) {
        created = await paymentsApi.create({
          student_id: studentIdNum,
          amount: Number(formData.amount || 0),
          date: formData.paymentDate || new Date().toISOString().slice(0,10),
          method: null,
          status: 'paid',
        });
      }
    } catch {}

    // Build a payment object for viewing/printing (enriched with backend receipt if available)
    const invoiceSuffix = Math.floor(100 + Math.random() * 900);
    const today = new Date();
    const invoiceNumber = `INV-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${invoiceSuffix}`;
    let receiptPath = '';
    if (created && created.id) {
      try {
        const r = await paymentsApi.receipt(created.id);
        if (r && r.path) receiptPath = r.path;
      } catch {}
    }

    const payment = {
      id: created?.id ?? Date.now(),
      studentName: formData.studentName,
      studentId: formData.studentId,
      course: selectedSubjectsJoined || formData.course,
      amount: Number(formData.amount || 0),
      paymentMonth: formData.paymentMonth || '',
      paidDate: formData.paymentDate || new Date().toISOString().slice(0,10),
      status: 'paid' as const,
      method: null,
      invoiceNumber,
      avatar: '',
      email: '',
      subjects: Array.isArray(formData.subjects) ? formData.subjects : [],
      receiptPath: receiptPath || undefined,
      backendId: created?.id,
    };

    toast({
      title: t.paymentRecordedSuccessfully || "Payment Recorded Successfully",
      description: `${payment.amount} MAD • ${payment.studentName}${selectedSubjectsJoined ? ` • ${selectedSubjectsJoined}` : ''}`,
    });

    // Expose the new payment upward and show success actions
    setCreatedPayment(payment);
    onPaymentRecorded?.(payment);
    setLoading(false);
    setStep(4);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t.recordPayment} {step === 1 ? `- ${t.selectGroup}` : step === 2 ? `- ${t.selectStudent || 'Select Student'}` : `- ${t.paymentDetails || 'Payment Details'}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? (t.selectGroup || 'First, select the group') :
             step === 2 ? (t.selectStudent || 'Select the student from the group') :
             (t.paymentDetails || 'Record payment details for the selected student')}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.selectGroup}</h3>
            <div className="grid gap-3">
              {groups.map((group:any) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent"
                  onClick={() => {
                    setSelectedGroup(group.id);
                    setStep(2);
                  }}
                >
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-muted-foreground">{group.level || ''}</p>
                  </div>
                  <Badge variant="outline">{(allStudents||[]).filter((s:any)=> Number(s.group_id)===Number(group.id)).length} {t.students || 'students'}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
              >
                ← {t.backToGroups}
              </Button>
              <h3 className="text-sm font-medium text-muted-foreground">
                {(t.selectStudent || 'Select Student')} - {groups.find((g:any) => String(g.id) === String(selectedGroup))?.name || ''}
              </h3>
            </div>
            <div className="grid gap-3">
              {currentStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent"
                  onClick={() => handleInputChange("studentId", student.id)}
                >
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(student as any).subjects && (student as any).subjects.length > 0 ? (student as any).subjects.join(', ') : ''}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{(student as any).phone || ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(2)}
                >
                  ← {t.backToStudents || 'Back to Students'}
                </Button>
                <h3 className="text-sm font-medium text-muted-foreground">{t.studentInformation || 'Student Information'}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.student || 'Student'}</Label>
                  <Input value={formData.studentName} disabled />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="course">{t.subjects || 'Subjects'} *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {language === 'fr' ? 'Afficher toutes les matières' : language === 'ar' ? 'عرض جميع المواد' : 'Show all subjects'}
                      </span>
                      <Switch checked={showAllSubjects} onCheckedChange={setShowAllSubjects} />
                    </div>
                  </div>
                  {(showAllSubjects ? allSubjects.length > 0 : studentSubjects.length > 0) ? (
                    <div className="grid grid-cols-2 gap-2">
                      {(showAllSubjects ? allSubjects : studentSubjects).map((subj, idx) => {
                        const id = `subj-${idx}`;
                        const checked = formData.subjects.includes(subj);
                        return (
                          <div key={id} className="flex items-center space-x-2">
                            <Checkbox
                              id={id}
                              checked={checked}
                              onCheckedChange={(checked) => handleSubjectToggle(subj, !!checked)}
                            />
                            <Label htmlFor={id} className="text-sm">{subj}</Label>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Input value={formData.course} disabled />
                  )}
                  {formData.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {formData.subjects.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.paymentDetails || 'Payment Details'}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t.amount || 'Amount'} (MAD) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-10"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transactionId">{t.transactionId || 'Transaction ID'}</Label>
                <Input
                  id="transactionId"
                  value={formData.transactionId}
                  onChange={(e) => handleInputChange("transactionId", e.target.value)}
                  placeholder={t.optional}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">{t.paymentDate || 'Payment Date'} *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="paymentDate"
                    type="date"
                    className="pl-10"
                    value={formData.paymentDate}
                    onChange={(e) => handleInputChange("paymentDate", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMonth">{paymentMonthLabel}</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="paymentMonth"
                    type="month"
                    className="pl-10"
                    value={formData.paymentMonth}
                    onChange={(e) => handleInputChange("paymentMonth", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t.notes || 'Notes'}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder={t.placeholder}
                rows={3}
              />
            </div>
          </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t.loading : t.recordPayment}
              </Button>
            </div>
          </form>
        )}

        {step === 4 && createdPayment && (
          <div className="space-y-6">
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">{t.paymentRecordedSuccessfully || 'Payment Recorded Successfully'}</div>
              <div className="mt-1 text-lg font-semibold">{createdPayment.studentName} — {createdPayment.amount} MAD</div>
              <div className="text-xs text-muted-foreground">{t.invoiceNumber || 'Invoice Number'}: {createdPayment.invoiceNumber}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => { onRequestViewReceipt?.(createdPayment); onOpenChange(false); }}
              >
                <Eye className="h-4 w-4" />
                {'View Receipt'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => { onRequestPrintReceipt?.(createdPayment); onOpenChange(false); }}
              >
                <Printer className="h-4 w-4" />
                {t.printReceipt || 'Print Receipt'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  // Close and reset modal
                  onOpenChange(false);
                  setStep(1);
                  setSelectedGroup("");
                  setCreatedPayment(null);
                  setFormData({
                    studentId: "",
                    studentName: "",
                    course: "",
                    amount: "",
                    transactionId: "",
                    paymentDate: "",
                    paymentMonth: "",
                    notes: "",
                    subjects: []
                  });
                }}
              >
                {t.close || 'Close'}
              </Button>
            </div>
          </div>
        )}

        {(step === 1 || step === 2) && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RecordPaymentModal;