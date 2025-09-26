import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  Mail, 
  Phone, 
  Printer,
  School,
  User,
  MapPin
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettings } from "@/hooks/useSettings";

interface PrintReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: any;
}

const PrintReceiptModal = ({ open, onOpenChange, payment }: PrintReceiptModalProps) => {
  const { t, language } = useTranslation();
  const paymentMonthLabel = language === 'fr' ? 'Mois de paiement' : language === 'ar' ? 'شهر الدفع' : 'Payment Month';
  const subjectsLabel = language === 'fr' ? 'Matières' : language === 'ar' ? 'المواد' : 'Subjects';
  const { institutionSettings } = useSettings();
  const [printing, setPrinting] = useState(false);

  if (!payment) return null;

  const handlePrint = () => {
    setPrinting(true);
    const locale = language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-MA' : 'en-US';
    const statusLabel = (status: string) => {
      switch (status) {
        case 'paid': return t.paid || 'Paid';
        case 'pending': return t.pending;
        case 'overdue': return t.overdue || 'Overdue';
        case 'cancelled': return t.cancelled || 'Cancelled';
        default: return status;
      }
    };
    const statusCls = payment.status === 'paid' ? 'status-paid' : payment.status === 'pending' ? 'status-pending' : 'status-overdue';
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const centerName = institutionSettings.name || 'Institution';
      const phoneEmail = [institutionSettings.phone, institutionSettings.email].filter(Boolean).join(' • ');
      const address = institutionSettings.address || '';
      const bottomLbl = language === 'fr' ? 'CACHET OFFICIEL' : language === 'ar' ? 'ختم رسمي' : 'OFFICIAL STAMP';
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${t.paymentReceipt} - ${payment.invoiceNumber}</title>
          <style>
            @media print {
              body { margin: 0; font-family: Arial, sans-serif; }
              .no-print { display: none; }
            }
            body {
              padding: 20px;
              font-family: Arial, sans-serif;
              line-height: 1.4;
              color: #333;
            }
            .meta {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .meta .center {
              text-align: center;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 10px;
              margin-bottom: 16px;
            }
            .school-name {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            .receipt-title {
              font-size: 18px;
              font-weight: bold;
              margin: 14px 0;
              color: #1f2937;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 20px 0;
            }
            .info-section {
              border: 1px solid #e5e7eb;
              padding: 15px;
              border-radius: 8px;
              background: #fff;
            }
            .info-section h3 {
              font-size: 14px;
              font-weight: bold;
              color: #6b7280;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            .info-item {
              margin-bottom: 8px;
              display: flex;
              justify-content: space-between;
            }
            .info-label {
              font-weight: 500;
              color: #6b7280;
            }
            .info-value {
              font-weight: bold;
              color: #1f2937;
            }
            .summary {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
              margin: 10px 0 16px 0;
              background: #fff;
            }
            .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
            .chip { display: inline-block; padding: 3px 8px; font-size: 12px; border: 1px solid #e5e7eb; border-radius: 9999px; background: #f9fafb; color: #374151; }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .summary-row .label { color: #6b7280; }
            .summary-row .value { font-weight: 700; }
            .amount {
              font-size: 28px;
              font-weight: bold;
              color: #059669;
              text-align: center;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
              font-size: 12px;
              color: #6b7280;
            }
            .status-text { font-weight: bold; text-align: center; margin: 5px 0; }
            .status-paid { color: #166534; }
            .status-pending { color: #b45309; }
            .status-overdue { color: #991b1b; }
            .divider {
              height: 1px; background: #2563eb; margin: 6px 0 12px 0;
            }
            /* Stamp styles */
            .stamp {
              position: fixed; bottom: 24px; right: 24px; width: 120px; height: 120px;
              border: 2px solid #2563eb; border-radius: 9999px; display: flex; align-items: center; justify-content: center;
              text-align: center; padding: 8px; box-sizing: border-box; font-family: Arial, sans-serif;
            }
            .stamp::before { content: ""; position: absolute; inset: 8px; border: 1.5px solid #2563eb; border-radius: 9999px; }
            .stamp-dot { position: absolute; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; background: #2563eb; border-radius: 50%; }
            .stamp-dot.left { left: 6px; } .stamp-dot.right { right: 6px; }
            .stamp-top { position: absolute; top: 6px; font-weight: 700; font-size: 10px; color: #2563eb; width: 100%; }
            .stamp-center-name { font-weight: 700; font-size: 10px; color: #2563eb; line-height: 1.1; }
            .stamp-center-contact { font-size: 9px; color: #374151; margin-top: 2px; }
            .stamp-center-address { font-size: 9px; color: #374151; margin-top: 2px; }
            .stamp-date { font-size: 9px; color: #6b7280; margin-top: 2px; }
          </style>
        </head>
        <body>
          <div class="meta">
            <div>${new Date().toLocaleDateString(locale)} ${new Date().toLocaleTimeString(locale)}</div>
            <div class="center">${t.paymentReceipt} - ${payment.invoiceNumber}</div>
            <div></div>
          </div>
          <div class="header">
            <div class="school-name">${institutionSettings.name}</div>
            <div style="color: #6b7280; margin-top: 5px;">${institutionSettings.address}</div>
            <div style="color: #6b7280;">${institutionSettings.phone} | ${institutionSettings.email}</div>
          </div>
          <div class="divider"></div>
          <div class="receipt-title">${(t.paymentReceipt || 'Payment Receipt').toUpperCase()}</div>
          
          <div class="info-grid">
            <div class="info-section">
              <h3>${t.studentInformation}</h3>
              <div class="info-item">
                <span class="info-label">${t.name}:</span>
                <span class="info-value">${payment.studentName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${t.studentId}:</span>
                <span class="info-value">${payment.studentId}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${t.email}:</span>
                <span class="info-value">${payment.email}</span>
              </div>
            </div>

            <div class="info-section">
              <h3>${t.receiptDetails}</h3>
              <div class="info-item">
                <span class="info-label">${t.invoiceNumber}:</span>
                <span class="info-value">${payment.invoiceNumber}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${paymentMonthLabel}:</span>
                <span class="info-value">${payment.paymentMonth || (payment.dueDate ? payment.dueDate.slice(0,7) : '')}</span>
              </div>
              <div class="info-item">
                <span class="info-label">${t.paymentDate}:</span>
                <span class="info-value">${payment.paidDate || '-'}</span>
              </div>
            </div>
          </div>

          <div class="summary">
            <div class="summary-row">
              <span class="label">${t.courseOrService}:</span>
              <span class="value">${payment.course}</span>
            </div>
            <div class="status-text ${statusCls}">${(t.status || 'Status').toUpperCase()}: ${statusLabel(payment.status)}</div>
          </div>

          ${(Array.isArray(payment.subjects) && payment.subjects.length > 0) ? `
          <div class="info-section">
            <h3>${subjectsLabel}</h3>
            <div class="chips">
              ${payment.subjects.map((s) => `<span class=\"chip\">${s}</span>`).join('')}
            </div>
          </div>
          ` : ''}

          <div class="amount">${t.totalAmount || 'Total Amount'}: ${payment.amount} MAD</div>

          <div class="footer">
            <p><strong>${t.thankYouPayment}</strong></p>
            <p>${t.receiptDisclaimer}</p>
            <p>${t.printReceipt}: ${new Date().toLocaleDateString(locale)} · ${new Date().toLocaleTimeString(locale)}</p>
            <p style="margin-top: 15px; font-size: 10px;">
              ${institutionSettings.name} - Licence d'enseignement N° EDU2024-001<br>
              RC: 123456789 | IF: 987654321 | CNSS: 1122334455
            </p>
          </div>

          <!-- Visual Stamp at bottom-right -->
          <div class="stamp">
            <div class="stamp-top">${bottomLbl}</div>
            <div class="stamp-dot left"></div>
            <div class="stamp-dot right"></div>
            <div>
              <div class="stamp-center-name">${centerName.toUpperCase().slice(0, 28)}</div>
              ${phoneEmail ? `<div class="stamp-center-contact">${phoneEmail}</div>` : ''}
              ${address ? `<div class="stamp-center-address">${address.length > 34 ? address.slice(0, 32) + '…' : address}</div>` : ''}
              <div class="stamp-date">${new Date().toLocaleDateString(locale)}</div>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        setPrinting(false);
      }, 250);
    } else {
      setPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.paymentReceipt}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* School Header */}
          <div className="text-center border-b-2 border-primary pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <School className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-primary">{institutionSettings.name}</h1>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center justify-center gap-1">
                <MapPin className="h-3 w-3" />
                {institutionSettings.address}
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {institutionSettings.phone}
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {institutionSettings.email}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold">{t.paymentReceipt}</h2>
            <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-2">
              <Calendar className="h-3 w-3" />
              {t.issueDate}: {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-MA' : 'en-US')}
            </p>
          </div>

          {/* Student and Receipt Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t.studentInformation}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t.name}:</span>
                    <span className="font-medium">{payment.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t.studentId}:</span>
                    <span className="font-medium">{payment.studentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t.email}:</span>
                    <span className="font-medium text-xs">{payment.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t.receiptDetails}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t.invoiceNumber}:</span>
                    <span className="font-medium">{payment.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{paymentMonthLabel}:</span>
                    <span className="font-medium">{payment.paymentMonth || (payment.dueDate ? payment.dueDate.slice(0,7) : '')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t.paymentDate}:</span>
                    <span className="font-medium">{payment.paidDate || 'En attente'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Details */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">{t.courseOrService}:</span>
                  <span className="font-bold">{payment.course}</span>
                </div>
                {Array.isArray(payment.subjects) && payment.subjects.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{subjectsLabel}</div>
                    <div className="flex flex-wrap gap-1">
                      {payment.subjects.map((s: string, idx: number) => (
                        <Badge key={`${s}-${idx}`} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                {/* Payment method removed */}

                <div className="text-center py-4">
                  <div className="text-xs text-muted-foreground mb-1">{t.status}</div>
                  <div className={`inline-block px-4 py-2 rounded-full font-bold text-sm ${
                    payment.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : payment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {payment.status.toUpperCase()}
                  </div>
                </div>

                <Separator />

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-3xl font-bold text-primary">
                    <DollarSign className="h-8 w-8" />
                    {payment.amount} MAD
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{t.totalAmount?.toUpperCase?.() || t.totalAmount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center space-y-2 border-t pt-4">
            <p className="font-semibold">{t.thankYouPayment}</p>
            <p className="text-sm text-muted-foreground">
              {t.receiptDisclaimer}
            </p>
            <p className="text-xs text-muted-foreground">
              {institutionSettings.name} — {institutionSettings.phone} • {institutionSettings.email}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handlePrint} 
              disabled={printing}
              className="flex-1"
            >
              <Printer className="h-4 w-4 mr-2" />
              {printing ? t.printing : t.printReceipt}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintReceiptModal;