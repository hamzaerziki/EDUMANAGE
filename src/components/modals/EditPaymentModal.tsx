import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { Edit, Calendar } from "lucide-react";

interface EditPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: any;
  onSave: (updatedPayment: any) => void;
}

const EditPaymentModal = ({ open, onOpenChange, payment, onSave }: EditPaymentModalProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: payment?.amount || "",
    paymentDate: payment?.paidDate || "",
    paymentMonth: payment?.paymentMonth || (payment?.dueDate ? payment.dueDate.slice(0,7) : ""),
    status: payment?.status || "",
    notes: ""
  });

  const statusOptions = [
    { value: "paid", label: t.paid || "Paid" },
    { value: "pending", label: t.pending },
    { value: "overdue", label: t.overdue || "Overdue" },
    { value: "cancelled", label: t.cancelled || "Cancelled" }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const updatedPayment = {
      ...payment,
      amount: parseFloat(formData.amount),
      paidDate: formData.status === 'paid' ? formData.paymentDate : null,
      paymentMonth: formData.paymentMonth,
      status: formData.status
    };

    onSave(updatedPayment);

    toast({
      title: t.paymentUpdated || "Payment Updated",
      description: `${payment.studentName}`,
    });

    setLoading(false);
    onOpenChange(false);
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {t.edit} {t.paymentDetails || 'Payment Details'} - {payment.studentName}
          </DialogTitle>
          <DialogDescription>
            {t.update} {t.paymentDetails || 'Payment Details'} {payment.studentName} ({payment.studentId})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t.paymentDetails || 'Payment Details'}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t.amount || 'Amount'} (MAD) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t.status || 'Status'} *</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.status || 'Status'} />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMonth">{'Payment Month'}</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="paymentMonth"
                    type="month"
                    className="pl-10"
                    value={formData.paymentMonth}
                    onChange={(e) => handleInputChange("paymentMonth", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {formData.status === 'paid' && (
              <div className="space-y-2">
                <Label htmlFor="paymentDate">{t.paymentDate || 'Payment Date'}</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="paymentDate"
                    type="date"
                    className="pl-10"
                    value={formData.paymentDate}
                    onChange={(e) => handleInputChange("paymentDate", e.target.value)}
                  />
                </div>
              </div>
            )}

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

          {/* Course Information (Read-only) */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground">{t.courseInformation || 'Course Information'}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t.course || 'Course'}:</span>
                <p className="font-medium">{payment.course}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t.invoiceNumber || 'Invoice Number'}:</span>
                <p className="font-medium">{payment.invoiceNumber}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t.loading : t.update}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPaymentModal;