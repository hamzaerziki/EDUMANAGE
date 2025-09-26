import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Printer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RecordPaymentModal from "@/components/modals/RecordPaymentModal";
import ViewPaymentModal from "@/components/modals/ViewPaymentModal";
import EditPaymentModal from "@/components/modals/EditPaymentModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import PrintReceiptModal from "@/components/modals/PrintReceiptModal";
import { exportReportPdf } from "@/lib/pdfUtils";
import { useSettings } from "@/hooks/useSettings";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { groupsApi, studentsApi, paymentsApi } from "@/lib/api";

const PaymentList = () => {
  const { t, language } = useTranslation();
  const paymentMonthLabel = language === 'fr' ? 'Mois de paiement' : language === 'ar' ? 'شهر الدفع' : 'Payment Month';
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [viewPaymentOpen, setViewPaymentOpen] = useState(false);
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [deletePaymentOpen, setDeletePaymentOpen] = useState(false);
  const [printReceiptOpen, setPrintReceiptOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [recordContextStudent, setRecordContextStudent] = useState<{ id: string | number; name: string; subjects?: string[] } | null>(null);
  const { institutionSettings } = useSettings();
  const { user } = useAuthContext();

  useEffect(() => {
    const load = async () => {
      try {
        const [g, s, p] = await Promise.all([
          groupsApi.list(),
          studentsApi.list().catch(()=>[]),
          paymentsApi.list().catch(()=>[]),
        ]);
        const adaptedGroups = Array.isArray(g) ? g.map((x:any)=>({ id: x.id, name: x.name, level: x.level || '', grade: '', capacity: 0 })) : [];
        setGroups(adaptedGroups);
        setStudents(Array.isArray(s) ? s : []);
        setPayments(Array.isArray(p) ? p : []);
      } catch {
        setGroups([]); setStudents([]); setPayments([]);
      }
    };
    load();
  }, []);

  const refreshPayments = async () => {
    try {
      const p = await paymentsApi.list();
      setPayments(Array.isArray(p) ? p : []);
    } catch { setPayments([]); }
  };

  const paymentStats = useMemo(() => {
    const paid = payments.filter((p:any)=> p.status === 'paid');
    const totalRevenue = paid.reduce((sum:number,p:any)=> sum + (Number(p.amount)||0), 0);
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const monthlyRevenue = paid
      .filter((p:any)=> String(p.date || '').startsWith(ym))
      .reduce((sum:number,p:any)=> sum + (Number(p.amount)||0), 0);
    const collectionRate = payments.length ? Math.round((paid.length / payments.length) * 1000)/10 : 0;
    return { totalRevenue, monthlyRevenue, paidStudents: paid.length, pendingPayments: payments.length - paid.length, collectionRate };
  }, [payments]);

  const isStudentPaid = (studentId: number) => payments.some((p:any) => Number(p.student_id) === Number(studentId) && p.status === 'paid');

  const findLatestPaymentById = (studentId: number) => {
    const list = payments.filter((p:any) => Number(p.student_id) === Number(studentId));
    if (!list.length) return null;
    return list.sort((a:any, b:any) => new Date(String(b.date || b.paidDate || b.dueDate)).getTime() - new Date(String(a.date || a.paidDate || a.dueDate)).getTime())[0];
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

  const filteredPayments = payments.filter((payment:any) => {
    const term = searchTerm.toLowerCase();
    const student = students.find((s:any) => Number(s.id) === Number(payment.student_id));
    const name = String(student?.full_name || student?.name || '').toLowerCase();
    const idStr = String(payment.student_id || '').toLowerCase();
    const courseStr = String(payment.course || '').toLowerCase();
    const matchesSearch = name.includes(term) || idStr.includes(term) || courseStr.includes(term);
    const matchesStatus =
      statusFilter === 'all' ||
      payment.status === statusFilter ||
      (statusFilter === 'unpaid' && (payment.status === 'pending' || payment.status === 'overdue'));
    // Optional month filter (expects YYYY-MM)
    const matchesMonth = monthFilter === 'all' || String(payment.date || '').startsWith(monthFilter);
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const handleExportReport = async () => {
    const langPdf = (language === 'fr' ? 'fr' : language === 'ar' ? 'ar' : 'en') as 'fr'|'en'|'ar';
    const columns = [
      t.student || 'Student Name',
      t.studentId || 'Student ID',
      t.course || 'Course',
      `${t.amount || 'Amount'} (MAD)`,
      t.dueDate || 'Due Date',
      t.status || 'Status',
      t.invoiceNumber || 'Invoice Number'
    ];
    const rows: string[][] = filteredPayments.map((payment:any) => {
      const st = students.find((s:any)=> Number(s.id)===Number(payment.student_id));
      const studentName = String(st?.full_name || st?.name || '');
      const studentId = String(payment.student_id || '');
      const course = String(payment.course || '');
      const amount = String(payment.amount ?? '');
      const dueDate = String(payment.date || payment.dueDate || '');
      const status = getStatusLabel(payment.status);
      const invoice = String(payment.invoiceNumber || payment.invoice || '');
      return [studentName, studentId, course, amount, dueDate, status, invoice];
    });
    const filters = [
      { label: t.status || 'Status', value: statusFilter },
      { label: t.month || 'Month', value: monthFilter }
    ];
    const notes = [
      language === 'fr' ? 'Montants en MAD (DH).' : language === 'ar' ? 'المبالغ بالدرهم المغربي (MAD).' : 'Amounts in MAD (DH).'
    ];
    await exportReportPdf({
      lang: langPdf,
      centerName: institutionSettings.name,
      title: t.financialOverview || 'Financial Overview',
      author: user?.name,
      subtitle: t.paymentManagement || 'Payment Management',
      tables: [{ columns, rows }],
      filters,
      notes,
      branding: {
        logoDataUrl: institutionSettings.logoDataUrl,
        address: institutionSettings.address,
        phone: institutionSettings.phone,
        email: institutionSettings.email,
        location: (institutionSettings as any).location,
        timeZone: institutionSettings.timeZone,
      },
    });
  };

  const handlePaymentAction = (action: string, payment: any) => {
    setSelectedPayment(payment);
    switch (action) {
      case 'view':
        setViewPaymentOpen(true);
        break;
      case 'edit':
        setEditPaymentOpen(true);
        break;
      case 'delete':
        setDeletePaymentOpen(true);
        break;
      case 'print':
        setPrintReceiptOpen(true);
        break;
    }
  };

  const handleSavePayment = (updatedPayment: any) => {
    // In a real app, this would update the database
    // For now, we'll just show a success message
    console.log('Updated payment:', updatedPayment);
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    
    setDeletingPayment(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Payment Deleted",
      description: `Payment record for ${selectedPayment.studentName} has been removed.`,
      variant: "destructive",
    });
    
    setDeletingPayment(false);
    setDeletePaymentOpen(false);
    setSelectedPayment(null);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.paymentManagement}</h1>
          <p className="text-muted-foreground">{t.overview}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            {t.export}
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setRecordPaymentOpen(true)}>
            <Plus className="h-4 w-4" />
            {t.recordPayment}
          </Button>
        </div>
      </div>

      

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalRevenue || 'Total Revenue'}</CardTitle>
            <DollarSign className="h-4 w-4 text-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green">{paymentStats.totalRevenue.toLocaleString()} MAD</div>
            <p className="text-xs text-muted-foreground">{t.overview}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.monthlyRevenue}</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue">{paymentStats.monthlyRevenue.toLocaleString()} MAD</div>
            <p className="text-xs text-muted-foreground">{t.thisMonth}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.paidStudents || 'Paid Students'}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green">{paymentStats.paidStudents}</div>
            <p className="text-xs text-muted-foreground">{t.paymentsReceived || t.success}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.pending}</CardTitle>
            <Clock className="h-4 w-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange">{paymentStats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">{t.awaitingPayment || t.pending}</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.collectionRate}</CardTitle>
            <CreditCard className="h-4 w-4 text-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple">{paymentStats.collectionRate}%</div>
            <Progress value={paymentStats.collectionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      

      {/* Payment Status Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green">{t.paidPaymentsTitle || t.paidPayments || 'Paid Payments'}</p>
                <p className="text-2xl font-bold">{paymentStats.paidStudents}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange">{t.pendingPaymentsTitle || t.pendingPayments || 'Pending Payments'}</p>
                <p className="text-2xl font-bold">{paymentStats.pendingPayments}</p>
              </div>
              <Clock className="h-8 w-8 text-orange" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red">{t.overduePaymentsTitle || t.overduePayments || 'Overdue Payments'}</p>
                <p className="text-2xl font-bold">{payments.filter(p => p.status === 'overdue').length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Section (below status summary + filters) */}
      {!selectedGroup ? (
        <div className="space-y-6">
          {['Primaire', 'Collège', 'Lycée'].map((level) => {
            const levelGroups = groups.filter(g => g.level === level);
            if (!levelGroups.length) return null;
            const enrolled = levelGroups.reduce((sum, g) => sum + students.filter(s => Number(s.group_id) === Number(g.id)).length, 0);
            const capacity = levelGroups.reduce((sum, g) => sum + (g.capacity || 0), 0);
            return (
              <Card key={level}>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                    {level}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {levelGroups.length} groupes • {enrolled} élèves{capacity ? ` / ${capacity}` : ''}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {levelGroups.map((g:any) => (
                      <Card key={g.id} className="hover-scale transition cursor-pointer" onClick={() => setSelectedGroup(g)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm truncate mb-1">{g.name}</h3>
                              <Badge variant="outline" className="text-xs">{students.filter(s => Number(s.group_id) === Number(g.id)).length} / {g.capacity || '-'} élèves</Badge>
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-lg font-bold text-primary">{students.filter(s => Number(s.group_id) === Number(g.id)).length}</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                            <div className="truncate">{g.level} • {g.grade}</div>
                            <div className="truncate">{g.subject}</div>
                            <div className="truncate">{g.teacher}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!groups.length && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">{'Aucun groupe trouvé.'}</CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{'Group: '}{selectedGroup.name}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedGroup(null)}>{'Retour aux groupes'}</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.student || 'Student'}</TableHead>
                    <TableHead>{t.status || 'Status'}</TableHead>
                    <TableHead>{t.amount || 'Amount'}</TableHead>
                    <TableHead>{paymentMonthLabel}</TableHead>
                    <TableHead className="text-right">{'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.filter(s => Number(s.group_id) === Number(selectedGroup.id)).map((st:any, idx:number) => {
                    const paid = isStudentPaid(st.id);
                    const latest = findLatestPaymentById(st.id);
                    return (
                      <TableRow key={st.id ?? idx}>
                        <TableCell>
                          <div className={`font-medium ${paid ? 'text-green' : 'text-red'}`}>{st.full_name || st.name}</div>
                          <div className="text-xs text-muted-foreground">{selectedGroup.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`border ${paid ? 'bg-green/10 text-green border-green/20' : 'bg-red/10 text-red border-red/20'}`}>
                            {paid ? (t.paid || 'Paid') : (t.pending || 'Pending')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{latest ? `${latest.amount || latest.total || ''} MAD` : '—'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">{latest ? (latest.paymentMonth || (latest.date ? String(latest.date).slice(0,7) : (latest.dueDate ? String(latest.dueDate).slice(0,7) : '—'))) : '—'}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRecordContextStudent({ id: st.id, name: st.full_name || st.name });
                                setRecordPaymentOpen(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                            {latest && (
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedPayment(latest); setViewPaymentOpen(true); }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {latest && (
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedPayment(latest); setEditPaymentOpen(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {latest && latest.status === 'paid' && (
                              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => { setSelectedPayment(latest); setPrintReceiptOpen(true); }}>
                                <Printer className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {students.filter(s => Number(s.group_id) === Number(selectedGroup.id)).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">{'No students in this group.'}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <RecordPaymentModal 
        open={recordPaymentOpen}
        onOpenChange={setRecordPaymentOpen}
        initialStudentInfo={recordContextStudent || undefined}
        onPaymentRecorded={async (p) => { await refreshPayments(); setSelectedPayment(p); }}
        onRequestViewReceipt={(p) => { setSelectedPayment(p); setViewPaymentOpen(true); }}
        onRequestPrintReceipt={(p) => { setSelectedPayment(p); setPrintReceiptOpen(true); }}
      />
      <ViewPaymentModal
        open={viewPaymentOpen}
        onOpenChange={setViewPaymentOpen}
        payment={selectedPayment}
      />
      <EditPaymentModal
        open={editPaymentOpen}
        onOpenChange={setEditPaymentOpen}
        payment={selectedPayment}
        onSave={handleSavePayment}
      />
      <DeleteConfirmationModal
        open={deletePaymentOpen}
        onOpenChange={setDeletePaymentOpen}
        title={t.confirmDelete}
        description={t.areYouSure}
        itemName={selectedPayment?.studentName || ""}
        onConfirm={handleDeletePayment}
        loading={deletingPayment}
      />
      <PrintReceiptModal
        open={printReceiptOpen}
        onOpenChange={setPrintReceiptOpen}
        payment={selectedPayment}
      />
    </div>
  );
};

export default PaymentList;