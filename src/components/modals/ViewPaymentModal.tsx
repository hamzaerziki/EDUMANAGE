import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  Download, 
  CreditCard, 
  Calendar, 
  User, 
  FileText,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettings } from "@/hooks/useSettings";
import jsPDF from "jspdf";

interface ViewPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: any;
}

const ViewPaymentModal = ({ open, onOpenChange, payment }: ViewPaymentModalProps) => {
  const { t, language } = useTranslation();
  const paymentMonthLabel = language === 'fr' ? 'Mois de paiement' : language === 'ar' ? 'شهر الدفع' : 'Payment Month';
  const subjectsLabel = language === 'fr' ? 'Matières' : language === 'ar' ? 'المواد' : 'Subjects';
  const { institutionSettings } = useSettings();
  if (!payment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green/10 text-green border-green/20";
      case "pending": return "bg-orange/10 text-orange border-orange/20";
      case "overdue": return "bg-red/10 text-red border-red/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "overdue": return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return t.paid || 'Paid';
      case 'pending': return t.pending;
      case 'overdue': return t.overdue || 'Overdue';
      case 'cancelled': return t.cancelled || 'Cancelled';
      default: return status;
    }
  };

  const handleDownloadInvoice = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = margin;
    const locale = language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-MA' : 'en-US';
    const nowDate = new Date().toLocaleDateString(locale);
    const nowTime = new Date().toLocaleTimeString(locale);

    // Top meta row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`${nowDate} ${nowTime}`, margin, y);
    doc.text(`${t.paymentReceipt || 'Payment Receipt'} - ${payment.invoiceNumber}`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Institution block (centered)
    doc.setTextColor(33, 33, 33);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235); // blue name
    doc.text(institutionSettings?.name || 'Institution', pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.setTextColor(90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const addrLine = `${institutionSettings?.address || ''}`.trim();
    const contactLine = `${institutionSettings?.phone || ''}${institutionSettings?.email ? ' | ' + institutionSettings.email : ''}`.trim();
    if (addrLine) { doc.text(addrLine, pageWidth / 2, y, { align: 'center' }); y += 5; }
    if (contactLine) { doc.text(contactLine, pageWidth / 2, y, { align: 'center' }); y += 8; }

    // Blue divider line
    doc.setDrawColor(37, 99, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Section title
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`${t.paymentReceipt || 'Payment Receipt'}`.toUpperCase(), margin, y);
    y += 6;

    // Info grid boxes
    const boxGap = 6;
    const boxWidth = (pageWidth - margin * 2 - boxGap) / 2;
    const boxHeight = 30;
    const leftX = margin;
    const rightX = margin + boxWidth + boxGap;

    doc.setDrawColor(226);
    doc.roundedRect(leftX, y, boxWidth, boxHeight, 3, 3);
    doc.roundedRect(rightX, y, boxWidth, boxHeight, 3, 3);

    // Left box: Student Info
    let ly = y + 7;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(90);
    doc.text(`${t.studentInformation || 'Student Information'}`.toUpperCase(), leftX + 4, ly); ly += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(0);
    doc.text(`${t.name || 'Name'}:`, leftX + 4, ly); doc.setFont('helvetica', 'bold'); doc.text(`${payment.studentName}`, leftX + boxWidth - 4, ly, { align: 'right' });
    doc.setFont('helvetica', 'normal'); ly += 6;
    doc.text(`${t.studentId || 'Student ID'}:`, leftX + 4, ly); doc.setFont('helvetica', 'bold'); doc.text(`${payment.studentId}`, leftX + boxWidth - 4, ly, { align: 'right' });
    doc.setFont('helvetica', 'normal'); ly += 6;
    if (payment.email) {
      doc.text(`${t.email || 'Email'}:`, leftX + 4, ly); doc.setFont('helvetica', 'bold'); doc.text(`${payment.email}`, leftX + boxWidth - 4, ly, { align: 'right' });
    }

    // Right box: Receipt details
    let ry = y + 7;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(90);
    doc.text(`${t.receiptDetails || 'Receipt Details'}`.toUpperCase(), rightX + 4, ry); ry += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(0);
    doc.text(`${t.invoiceNumber || 'Invoice Number'}:`, rightX + 4, ry); doc.setFont('helvetica', 'bold'); doc.text(`${payment.invoiceNumber}`, rightX + boxWidth - 4, ry, { align: 'right' });
    doc.setFont('helvetica', 'normal'); ry += 6;
    doc.text(`${t.issueDate || 'Issue Date'}:`, rightX + 4, ry); doc.setFont('helvetica', 'bold'); doc.text(`${nowDate}`, rightX + boxWidth - 4, ry, { align: 'right' });
    doc.setFont('helvetica', 'normal'); ry += 6;
    doc.text(`${t.paymentDate || 'Payment Date'}:`, rightX + 4, ry); doc.setFont('helvetica', 'bold'); doc.text(`${payment.paidDate || '-'}`, rightX + boxWidth - 4, ry, { align: 'right' });

    y += boxHeight + 10;

    // Course/Service and Status
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
    doc.text(`${t.courseOrService || t.course || 'Course/Service'}:`, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${payment.course}`, pageWidth - margin, y, { align: 'right' });
    y += 8;
    doc.setFont('helvetica', 'bold');
    const statusLabel = payment.status === 'paid' ? (t.paid || 'Paid') : payment.status === 'pending' ? (t.pending || 'Pending') : (t.overdue || 'Overdue');
    const statusColor = payment.status === 'paid' ? [22, 101, 52] : payment.status === 'pending' ? [180, 83, 9] : [153, 27, 27];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(`${(t.status || 'Status').toUpperCase()}: ${statusLabel}`, margin, y);
    doc.setTextColor(0, 0, 0);

    // Big total amount
    y += 14;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
    doc.setTextColor(5, 150, 105); // green
    doc.text(`${(t.totalAmount || 'Total Amount')}: ${payment.amount} MAD`, pageWidth / 2, y, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Footer separator and note
    y += 12;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10);
    doc.text(`${t.thankYouPayment || 'Thank you for your payment!'}`, pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(110);
    doc.text(`${t.receiptDisclaimer || ''}`, pageWidth / 2, y, { align: 'center', maxWidth: pageWidth - margin * 2 });
    y += 8;
    doc.setFontSize(9);
    doc.text(`${t.printReceipt || 'Print Receipt'}: ${nowDate} · ${nowTime}`, pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.text(`${institutionSettings?.name || 'Institution'} - Licence d'enseignement N° EDU2024-001`, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text(`RC: 123456789 | IF: 987654321 | CNSS: 1122334455`, pageWidth / 2, y, { align: 'center' });

    // Stamp removed per request
    doc.save(`invoice-${payment.invoiceNumber}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t.paymentDetails || 'Payment Details'}
          </DialogTitle>
          <DialogDescription>
            {t.studentInformation || 'Student Information'}: {payment.studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={payment.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {payment.studentName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{payment.studentName}</h3>
                <p className="text-sm text-muted-foreground">{t.invoiceNumber || 'Invoice Number'}: {payment.invoiceNumber}</p>
              </div>
            </div>
            <Badge className={`border ${getStatusColor(payment.status)}`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(payment.status)}
                <span className="capitalize">{getStatusLabel(payment.status)}</span>
              </div>
            </Badge>
          </div>

          <Separator />

          {/* Student Information */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              {t.studentInformation || 'Student Information'}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t.student || 'Student'} ID:</span>
                <p className="font-medium">{payment.studentId}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t.email}:</span>
                <p className="font-medium">{payment.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t.paymentDetails || 'Payment Information'}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t.course || 'Course'}:</span>
                <p className="font-medium">{payment.course}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t.amount || 'Amount'}:</span>
                <p className="font-medium text-lg text-green">{payment.amount} MAD</p>
              </div>
              <div>
                <span className="text-muted-foreground">{paymentMonthLabel}:</span>
                <p className="font-medium">{payment.paymentMonth || (payment.dueDate ? payment.dueDate.slice(0,7) : '-')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t.paymentDate || 'Payment Date'}:</span>
                <p className="font-medium">{payment.paidDate || '-'}</p>
              </div>
              {Array.isArray(payment.subjects) && payment.subjects.length > 0 && (
                <div className="col-span-2">
                  <span className="text-muted-foreground mr-2">{subjectsLabel}:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {payment.subjects.map((s: string, idx: number) => (
                      <Badge key={`${s}-${idx}`} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Payment method removed */}
              <div>
                <span className="text-muted-foreground">{t.status || 'Status'}:</span>
                <p className={`font-medium capitalize ${
                  payment.status === 'paid' ? 'text-green' : 
                  payment.status === 'pending' ? 'text-orange' : 'text-red'
                }`}>
                  {getStatusLabel(payment.status)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleDownloadInvoice}>
            <Download className="h-4 w-4 mr-2" />
            {t.downloadInvoice || 'Download Invoice'}
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewPaymentModal;