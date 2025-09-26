import { useMemo, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { documentsStore, type DocumentRecord, type DocumentType } from "@/lib/documentsStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Trash2, Upload, BadgeCheck, PenTool } from "lucide-react";

const Documents = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { toast } = useToast();

  const canManage = !!user && (user.role === 'admin' || user.role === 'teacher');

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<'all' | DocumentType>('all');
  const [ownerName, setOwnerName] = useState("");
  const [genType, setGenType] = useState<DocumentType>('certificate');
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceDate, setAbsenceDate] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptCourse, setReceiptCourse] = useState("");
  const [receiptInvoice, setReceiptInvoice] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const docs = useMemo(() => documentsStore.all(), []);
  const [list, setList] = useState<DocumentRecord[]>(docs);

  const typeOptions = useMemo(() => ([
    { key: 'certificate' as DocumentType, label: t.certificateDoc || 'Attestation' },
    { key: 'report_card' as DocumentType, label: t.reportCardDoc || 'Bulletin de notes' },
    { key: 'absence_excuse' as DocumentType, label: t.absenceExcuseDoc || "Justificatif d'absence" },
    { key: 'payment_receipt' as DocumentType, label: (t.paymentReceipt || 'Reçu de Paiement') as string },
    { key: 'other' as DocumentType, label: t.otherLabel || 'Other' },
  ]), [t]);

  const filtered = list.filter(d => {
    const matchType = filterType === 'all' || d.type === filterType;
    const q = search.toLowerCase();
    const matchText = !q || d.title.toLowerCase().includes(q) || d.ownerName.toLowerCase().includes(q);
    if (user?.role === 'student') {
      // Students can only view their own documents (heuristic: match id or name)
      const mine = (d.ownerId && user.id && d.ownerId === user.id) || (!!user.name && d.ownerName.toLowerCase().includes(user.name.toLowerCase()));
      return matchType && matchText && mine;
    }
    return matchType && matchText;
  });

  const refresh = () => setList(documentsStore.all());

  const triggerUpload = () => fileInputRef.current?.click();

  const onUpload = async (file: File, asType: DocumentType = 'other') => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
          documentsStore.add({
            title: file.name,
            type: asType,
            ownerName: ownerName || (user?.name || 'Unknown'),
            createdBy: user?.name,
            fileName: file.name,
            fileType: file.type,
            size: file.size,
            dataUrl: dataUrl || null,
            signed: false,
          });
          toast({ title: t.success, description: t.uploadDocument || 'Upload Document' });
          refresh();
        } catch (e) {
          toast({ title: t.error, description: 'Failed to save document', variant: 'destructive' as any });
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: t.error, description: 'Failed to read file', variant: 'destructive' as any });
    }
  };

  const handleGenerate = () => {
    if (!ownerName.trim()) {
      toast({ title: t.missingInformation || 'Missing Information', description: t.requiredField || 'This field is required' });
      return;
    }
    if (genType === 'certificate') {
      documentsStore.generateCertificate(ownerName, undefined, user?.name);
    } else if (genType === 'report_card') {
      documentsStore.generateReportCard(ownerName, user?.name);
    } else if (genType === 'absence_excuse') {
      documentsStore.generateAbsenceExcuse(ownerName, absenceReason || "Absence justifiée", absenceDate || undefined, user?.name);
    } else if (genType === 'payment_receipt') {
      const amount = parseFloat(receiptAmount || '0') || 0;
      const invoice = receiptInvoice || `INV-${Date.now()}`;
      const course = receiptCourse || (t.course || 'Cours');
      documentsStore.generatePaymentReceipt(ownerName, amount, course, invoice, user?.name);
    } else {
      documentsStore.add({ title: ownerName, type: 'other', ownerName, createdBy: user?.name, signed: false });
    }
    toast({ title: t.success, description: t.generateDocument || 'Generate Document' });
    refresh();
  };

  const download = (doc: DocumentRecord) => {
    if (!doc.dataUrl) {
      toast({ title: t.warning, description: 'Document content not stored. Regenerate or re-upload.' });
      return;
    }
    const a = document.createElement('a');
    a.href = doc.dataUrl;
    a.download = doc.fileName || `${doc.title}`;
    a.click();
  };

  const remove = (doc: DocumentRecord) => {
    documentsStore.remove(doc.id);
    refresh();
  };

  const toggleSign = (doc: DocumentRecord) => {
    documentsStore.sign(doc.id, !doc.signed);
    refresh();
  };

  const typeLabel = (tp: DocumentType) => {
    switch (tp) {
      case 'certificate': return t.certificateDoc || 'Attestation';
      case 'report_card': return t.reportCardDoc || 'Bulletin de notes';
      case 'absence_excuse': return t.absenceExcuseDoc || "Justificatif d'absence";
      case 'payment_receipt': return t.paymentReceipt || 'Reçu de Paiement';
      default: return t.other || 'Other';
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.documents || 'Documents'}</h1>
          <p className="text-muted-foreground">{t.overview}</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Input placeholder={t.documentOwner || 'Owner'} value={ownerName} onChange={(e)=>setOwnerName(e.target.value)} className="w-48" />
            <Select value={genType} onValueChange={(v)=>setGenType(v as DocumentType)}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder={t.documentType || 'Type'} /></SelectTrigger>
              <SelectContent>
                {typeOptions.map(o => (
                  <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Conditional inputs for generation */}
            {genType === 'absence_excuse' && (
              <>
                <Input placeholder={t.reasonLabel || 'Motif'} value={absenceReason} onChange={(e)=>setAbsenceReason(e.target.value)} className="w-44" />
                <Input type="date" value={absenceDate} onChange={(e)=>setAbsenceDate(e.target.value)} className="w-40" />
              </>
            )}
            {genType === 'payment_receipt' && (
              <>
                <Input placeholder={t.courseOrService || 'Cours'} value={receiptCourse} onChange={(e)=>setReceiptCourse(e.target.value)} className="w-40" />
                <Input placeholder="Montant (MAD)" value={receiptAmount} onChange={(e)=>setReceiptAmount(e.target.value)} className="w-36" />
                <Input placeholder={t.invoiceNumber || 'Facture N°'} value={receiptInvoice} onChange={(e)=>setReceiptInvoice(e.target.value)} className="w-40" />
              </>
            )}
            <Button className="bg-primary text-white" onClick={handleGenerate}><PenTool className="h-4 w-4 mr-2" />{t.generateDocument || 'Generate Document'}</Button>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.csv,.txt" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) onUpload(f); e.currentTarget.value=''; }} />
            <Button variant="outline" onClick={triggerUpload}><Upload className="h-4 w-4 mr-2" />{t.uploadDocument || 'Upload Document'}</Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t.filters}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Input placeholder={t.searchPlaceholder} value={search} onChange={(e)=>setSearch(e.target.value)} className="flex-1" />
            <Select value={filterType} onValueChange={(v)=>setFilterType(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.documentType || 'Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allLabel || 'All'}</SelectItem>
                {typeOptions.map(o => (<SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t.documents || 'Documents'} ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name || 'Name'}</TableHead>
                  <TableHead>{t.documentType || 'Type'}</TableHead>
                  <TableHead>{t.documentOwner || 'Owner'}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead className="text-right">{t.actions || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d)=> (
                  <TableRow key={d.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{d.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{typeLabel(d.type)}</Badge>
                    </TableCell>
                    <TableCell>{d.ownerName}</TableCell>
                    <TableCell>{d.signed ? (<span className="flex items-center gap-1 text-green-600"><BadgeCheck className="h-4 w-4" />{t.signed || 'Signé'}</span>) : (<span className="flex items-center gap-1 text-muted-foreground">{t.unsigned || 'Non signé'}</span>)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={()=>download(d)}><Download className="h-4 w-4 mr-1" />{t.download}</Button>
                      {canManage && <Button variant="outline" size="sm" onClick={()=>toggleSign(d)}>{d.signed ? (t.unsign || 'Annuler la signature') : (t.sign || 'Signer')}</Button>}
                      {canManage && <Button variant="destructive" size="sm" onClick={()=>remove(d)}><Trash2 className="h-4 w-4 mr-1" />{t.delete}</Button>}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">{t.noResultsFound}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Documents;
