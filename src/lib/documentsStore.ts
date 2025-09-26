import jsPDF from 'jspdf';
import { beginDoc, footer, type PdfLang, addSubtitle } from './pdfUtils';

export type DocumentType = 'certificate' | 'report_card' | 'absence_excuse' | 'payment_receipt' | 'other';

export interface DocumentRecord {
  id: string;
  title: string;
  type: DocumentType;
  ownerName: string;
  ownerId?: string;
  role?: 'student' | 'parent' | 'teacher' | 'admin';
  createdBy?: string;
  createdAt: number;
  fileName?: string;
  fileType?: string;
  size?: number;
  dataUrl?: string | null; // may be truncated or null if too large for localStorage
  signed?: boolean;
  signedBy?: string;
  signedAt?: number;
}

const KEY = 'documents';

function read(): DocumentRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list: DocumentRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

function toId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const documentsStore = {
  all(): DocumentRecord[] {
    return read().sort((a, b) => b.createdAt - a.createdAt);
  },
  add(doc: Omit<DocumentRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: number }): DocumentRecord {
    const list = read();
    const rec: DocumentRecord = {
      id: doc.id || toId(),
      createdAt: doc.createdAt || Date.now(),
      signed: !!doc.signed,
      ...doc,
    } as DocumentRecord;
    list.unshift(rec);
    write(list);
    return rec;
  },
  update(id: string, patch: Partial<DocumentRecord>) {
    const list = read();
    const idx = list.findIndex(d => d.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch };
      write(list);
    }
  },
  remove(id: string) {
    write(read().filter(d => d.id !== id));
  },
  byOwner(owner: string) {
    const term = owner.toLowerCase();
    return read().filter(d => d.ownerName.toLowerCase().includes(term) || (d.ownerId || '').toLowerCase().includes(term));
  },
  sign(id: string, signed: boolean) {
    const list = read();
    const idx = list.findIndex(d => d.id === id);
    if (idx >= 0) {
      const rec = list[idx];
      rec.signed = signed;
      rec.signedAt = signed ? Date.now() : undefined as any;
      rec.signedBy = signed ? (rec.signedBy || (() => { try { return JSON.parse(localStorage.getItem('institution-settings') || '{}').name || ''; } catch { return ''; } })()) : undefined;
      try {
        // For system-generated PDFs, re-render a stamped PDF (bottom-right) with center name
        const supported: DocumentType[] = ['certificate','report_card','absence_excuse','payment_receipt'];
        if (signed && supported.includes(rec.type)) {
          const settings = (() => { try { return JSON.parse(localStorage.getItem('institution-settings') || '{}'); } catch { return {}; } })();
          const centerName = settings.name || 'Établissement';
          const lang = (localStorage.getItem('app-language') as PdfLang) || 'fr';
          const { doc, y } = beginDoc(String(rec.title || 'Document'), centerName, lang);
          let yy = y;
          doc.setFont('helvetica','');
          doc.setTextColor(30);
          doc.setFontSize(12);
          yy = addSubtitle(doc, `${lang==='fr' ? 'Propriétaire' : 'Owner'}: ${rec.ownerName || ''}`, yy);
          if (rec.createdBy) {
            yy = addSubtitle(doc, `${lang==='fr' ? 'Créé par' : 'Created by'}: ${rec.createdBy}`, yy);
          }
          yy = addSubtitle(doc, `${lang==='fr' ? 'Date de signature' : 'Signed on'}: ${new Date(rec.signedAt!).toLocaleString(lang==='fr'?'fr-FR':'en-US')}`, yy);

          footer(doc, lang, rec.createdBy);
          const dataUrl = doc.output('datauristring');
          rec.dataUrl = dataUrl;
          rec.fileType = 'application/pdf';
          rec.fileName = (rec.fileName?.endsWith('.pdf') ? rec.fileName : `${(rec.title || 'document').replace(/\s+/g,'_').toLowerCase()}.pdf`);
          rec.size = dataUrl.length;
        }
      } catch {}
      write(list);
    }
  },
  // Helpers to generate simple documents from system data without external libs
  generateCertificate(ownerName: string, groupName?: string, createdBy?: string): DocumentRecord {
    const settings = (() => { try { return JSON.parse(localStorage.getItem('institution-settings') || '{}'); } catch { return {}; } })();
    const doc = new jsPDF();
    doc.setFont('helvetica','bold');
    doc.setFontSize(20);
    doc.text('Attestation de Scolarité', 105, 20, { align: 'center' });
    doc.setFont('helvetica','');
    doc.setFontSize(12);
    doc.text(`${settings.name || 'Établissement'}`, 105, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Certifie que ${ownerName}`, 20, 60);
    doc.text(`est régulièrement inscrit${groupName ? ` au groupe/classe ${groupName}` : ''}.`, 20, 70);
    doc.setFontSize(11);
    doc.text(`Fait le ${new Date().toLocaleDateString()}`, 20, 90);
    doc.setFontSize(10);
    doc.text(`${settings.address || ''}`, 20, 100);
    const dataUrl = doc.output('datauristring');
    return this.add({
      title: 'Attestation de Scolarité',
      type: 'certificate',
      ownerName,
      createdBy,
      fileName: `${ownerName.replace(/\s+/g, '_').toLowerCase()}_attestation.pdf`,
      fileType: 'application/pdf',
      size: dataUrl.length,
      dataUrl,
      signed: false,
    } as any);
  },
  generateReportCard(ownerName: string, createdBy?: string): DocumentRecord {
    const settings = (() => { try { return JSON.parse(localStorage.getItem('institution-settings') || '{}'); } catch { return {}; } })();
    const doc = new jsPDF();
    doc.setFont('helvetica','bold');
    doc.setFontSize(18);
    doc.text('Bulletin de Notes', 105, 20, { align: 'center' });
    doc.setFont('helvetica','');
    doc.setFontSize(12);
    doc.text(`${settings.name || ''}`, 105, 28, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Élève: ${ownerName}`, 14, 40);
    const rows = [
      ['Mathématiques', '15.6/20'],
      ['Physique', '14.8/20'],
      ['Chimie', '16.1/20'],
      ['SVT', '15.2/20'],
      ['Français', '14.5/20'],
      ['Arabe', '16.0/20']
    ];
    let y = 55;
    doc.setFontSize(11);
    doc.text('Matière', 14, y); doc.text('Moyenne', 160, y);
    y += 6;
    rows.forEach(r => { doc.text(r[0], 14, y); doc.text(r[1], 160, y, { align: 'right' }); y += 6; });
    doc.setFontSize(12);
    doc.text('Moyenne Générale: 15.4/20', 14, y + 6);
    const dataUrl = doc.output('datauristring');
    return this.add({
      title: 'Bulletin de Notes',
      type: 'report_card',
      ownerName,
      createdBy,
      fileName: `${ownerName.replace(/\s+/g, '_').toLowerCase()}_bulletin.pdf`,
      fileType: 'application/pdf',
      size: dataUrl.length,
      dataUrl,
      signed: false,
    } as any);
  },
  generateAbsenceExcuse(ownerName: string, reason: string, dateStr?: string, createdBy?: string): DocumentRecord {
    const settings = (() => { try { return JSON.parse(localStorage.getItem('institution-settings') || '{}'); } catch { return {}; } })();
    const doc = new jsPDF();
    doc.setFont('helvetica','bold');
    doc.setFontSize(18);
    doc.text("Justificatif d'Absence", 105, 20, { align: 'center' });
    doc.setFont('helvetica','');
    doc.setFontSize(12);
    doc.text(`${settings.name || ''}`, 105, 28, { align: 'center' });
    doc.text(`Élève: ${ownerName}`, 14, 45);
    doc.text(`Date d'absence: ${dateStr || new Date().toLocaleDateString()}`, 14, 55);
    doc.text(`Motif: ${reason}`, 14, 65);
    doc.text('Vu et approuvé par la direction.', 14, 85);
    const dataUrl = doc.output('datauristring');
    return this.add({
      title: "Justificatif d'Absence",
      type: 'absence_excuse',
      ownerName,
      createdBy,
      fileName: `${ownerName.replace(/\s+/g, '_').toLowerCase()}_absence.pdf`,
      fileType: 'application/pdf',
      size: dataUrl.length,
      dataUrl,
      signed: false,
    } as any);
  },
  generatePaymentReceipt(ownerName: string, amount: number, course: string, invoiceNumber: string, createdBy?: string): DocumentRecord {
    const settings = (() => { try { return JSON.parse(localStorage.getItem('institution-settings') || '{}'); } catch { return {}; } })();
    const doc = new jsPDF();
    doc.setFont('helvetica','bold');
    doc.setFontSize(18);
    doc.text('Reçu de Paiement', 105, 20, { align: 'center' });
    doc.setFont('helvetica','');
    doc.setFontSize(12);
    doc.text(`${settings.name || ''}`, 105, 28, { align: 'center' });
    doc.text(`Bénéficiaire: ${ownerName}`, 14, 45);
    doc.text(`Cours/Service: ${course}`, 14, 55);
    doc.text(`Montant: ${amount} MAD`, 14, 65);
    doc.text(`Facture N°: ${invoiceNumber}`, 14, 75);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 85);
    const dataUrl = doc.output('datauristring');
    return this.add({
      title: 'Reçu de Paiement',
      type: 'payment_receipt',
      ownerName,
      createdBy,
      fileName: `${ownerName.replace(/\s+/g, '_').toLowerCase()}_recu.pdf`,
      fileType: 'application/pdf',
      size: dataUrl.length,
      dataUrl,
      signed: false,
    } as any);
  }
};
