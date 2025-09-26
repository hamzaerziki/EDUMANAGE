import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Edit,
  Trash2,
  Printer,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import ViewPaymentModal from "@/components/modals/ViewPaymentModal";
import EditPaymentModal from "@/components/modals/EditPaymentModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import PrintReceiptModal from "@/components/modals/PrintReceiptModal";

const PaymentHistory = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  const [viewPaymentOpen, setViewPaymentOpen] = useState(false);
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [deletePaymentOpen, setDeletePaymentOpen] = useState(false);
  const [printReceiptOpen, setPrintReceiptOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  // For demo purposes, use same mock shape as PaymentList
  const payments = [
    { id: 1, studentName: "John Doe", studentId: "STU001", course: "Advanced Mathematics", amount: 299, dueDate: "2024-01-15", paidDate: "2024-01-10", status: "paid", method: "Credit Card", invoiceNumber: "INV-2024-001", avatar: "", email: "john.doe@email.com" },
    { id: 2, studentName: "Sarah Wilson", studentId: "STU002", course: "Physics Fundamentals", amount: 249, dueDate: "2024-01-20", paidDate: null, status: "pending", method: null, invoiceNumber: "INV-2024-002", avatar: "", email: "sarah.wilson@email.com" },
    { id: 3, studentName: "Mike Johnson", studentId: "STU003", course: "Organic Chemistry", amount: 279, dueDate: "2024-01-18", paidDate: null, status: "overdue", method: null, invoiceNumber: "INV-2024-003", avatar: "", email: "mike.johnson@email.com" },
    { id: 4, studentName: "Emily Brown", studentId: "STU004", course: "Biology Basics", amount: 199, dueDate: "2024-01-25", paidDate: "2024-01-24", status: "paid", method: "Bank Transfer", invoiceNumber: "INV-2024-004", avatar: "", email: "emily.brown@email.com" },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return t.paid || 'Paid';
      case 'pending': return t.pending;
      case 'overdue': return t.overdue || 'Overdue';
      case 'cancelled': return t.cancelled || 'Cancelled';
      default: return status;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green/10 text-green border-green/20";
      case "pending": return "bg-orange/10 text-orange border-orange/20";
      case "overdue": return "bg-red/10 text-red border-red/20";
      case "cancelled": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      payment.status === statusFilter ||
      (statusFilter === 'unpaid' && (payment.status === 'pending' || payment.status === 'overdue'));
    
    return matchesSearch && matchesStatus;
  });

  const handlePaymentAction = (action: string, payment: any) => {
    setSelectedPayment(payment);
    switch (action) {
      case 'view': setViewPaymentOpen(true); break;
      case 'edit': setEditPaymentOpen(true); break;
      case 'delete': setDeletePaymentOpen(true); break;
      case 'print': setPrintReceiptOpen(true); break;
    }
  };

  const handleSavePayment = (updatedPayment: any) => {
    // In a real app, this would update the database
    console.log('Updated payment:', updatedPayment);
    setEditPaymentOpen(false);
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    setDeletingPayment(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    toast({ title: 'Payment Deleted', description: `Payment record for ${selectedPayment.studentName} has been removed.`, variant: 'destructive' });
    setDeletingPayment(false);
    setDeletePaymentOpen(false);
    setSelectedPayment(null);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{'Historique des Paiements'}</h1>
          <p className="text-muted-foreground">{t.overview}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/payments')}>{'Retour'}</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t.allStatus || t.status || 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatus || 'All Status'}</SelectItem>
                <SelectItem value="paid">{t.paid || 'Paid'}</SelectItem>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="overdue">{t.overdue || 'Overdue'}</SelectItem>
                <SelectItem value="unpaid">{'Unpaid (Pending/Overdue)'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t.month || 'Month'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allMonths || 'All Months'}</SelectItem>
                <SelectItem value="january">{t.january || 'January'}</SelectItem>
                <SelectItem value="february">{t.february || 'February'}</SelectItem>
                <SelectItem value="march">{t.march || 'March'}</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              {t.filters}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>{'Historique des Paiements'} ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.student || 'Student'}</TableHead>
                  <TableHead>{t.course || 'Course'}</TableHead>
                  <TableHead>{t.amount || 'Amount'}</TableHead>
                  <TableHead>{'Payment Month'}</TableHead>
                  <TableHead>{t.status || 'Status'}</TableHead>
                  <TableHead className="text-right">{t.actions || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={payment.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {payment.studentName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{payment.studentName}</div>
                          <div className="text-sm text-muted-foreground">
                            {payment.studentId} • {payment.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{payment.course}</div>
                      <div className="text-xs text-muted-foreground">{payment.invoiceNumber}</div>
                    </TableCell>
                    <TableCell className="font-medium">{payment.amount} MAD</TableCell>
                    <TableCell>{payment.paymentMonth || (payment.dueDate ? payment.dueDate.slice(0,7) : '')}</TableCell>
                    <TableCell>
                      <Badge className={`border ${getStatusColor(payment.status)}`}>
                        <span className="flex items-center gap-1">{getStatusIcon(payment.status)} {getStatusLabel(payment.status)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handlePaymentAction('view', payment)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handlePaymentAction('edit', payment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handlePaymentAction('print', payment)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handlePaymentAction('delete', payment)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ViewPaymentModal open={viewPaymentOpen} onOpenChange={setViewPaymentOpen} payment={selectedPayment} />
      <EditPaymentModal open={editPaymentOpen} onOpenChange={setEditPaymentOpen} payment={selectedPayment} onSave={handleSavePayment} />
      <DeleteConfirmationModal
        open={deletePaymentOpen}
        onOpenChange={setDeletePaymentOpen}
        title={t.confirmDelete}
        description={t.areYouSure}
        itemName={selectedPayment?.studentName || ""}
        onConfirm={handleDeletePayment}
        loading={deletingPayment}
      />
      <PrintReceiptModal open={printReceiptOpen} onOpenChange={setPrintReceiptOpen} payment={selectedPayment} />
    </div>
  );
};

export default PaymentHistory;
