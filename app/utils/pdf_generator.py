from datetime import datetime
import os
from typing import Optional, Tuple

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
import matplotlib.pyplot as plt

from ..config import settings


def _header_footer(canvas: Canvas, doc, title: str):
    canvas.saveState()
    width, height = doc.pagesize
    
    # Header
    canvas.setFillColorRGB(0.15, 0.35, 0.85)
    canvas.rect(0, height - 40, width, 40, fill=True, stroke=False)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 14)
    canvas.drawString(20, height - 26, title)
    
    # Generation date
    canvas.setFont("Helvetica", 8)
    gen_text = f"Généré par EduManage - {datetime.now().strftime('%d %B %Y - %H:%M')}"
    canvas.drawRightString(width - 20, height - 26, gen_text)

    canvas.restoreState()


def _ensure_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)


def generate_receipt_pdf(student_name: str, payment: dict) -> str:
    """
    payment = { 'id': int, 'amount': float, 'date': date, 'method': str }
    Returns absolute file path to saved PDF.
    """
    filename = f"receipt_{payment['id']}.pdf"
    filepath = os.path.join(settings.RECEIPTS_DIR, filename)
    _ensure_dir(filepath)

    doc = SimpleDocTemplate(filepath, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=30*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()
    story = []

    story.append(Spacer(1, 20))
    story.append(Paragraph("Payment Receipt", styles['Title']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Student: <b>{student_name}</b>", styles['Normal']))
    story.append(Paragraph(f"Payment ID: <b>{payment['id']}</b>", styles['Normal']))
    story.append(Paragraph(f"Date: <b>{payment['date']}</b>", styles['Normal']))
    story.append(Paragraph(f"Method: <b>{payment.get('method') or '-'} </b>", styles['Normal']))
    story.append(Spacer(1, 12))

    table_data = [["Description", "Amount (MAD)"], ["Tuition/Payment", f"{payment['amount']:.2f}"]]
    table = Table(table_data, colWidths=[120*mm, 40*mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.lightblue),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (1,1), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ]))
    story.append(table)

    story.append(Spacer(1, 20))
    story.append(Paragraph("Signature: ____________________________", styles['Normal']))

    def on_page(canvas, doc):
        _header_footer(canvas, doc, title="Payment Receipt / وصل الأداء")

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    return filepath


def _save_matplotlib_chart(title: str, values: list, labels: Optional[list] = None) -> str:
    plt.figure(figsize=(6, 3))
    if labels:
        plt.plot(values, marker='o')
        plt.xticks(range(len(values)), labels, rotation=45, ha='right')
    else:
        plt.plot(values, marker='o')
    plt.title(title)
    plt.tight_layout()
    img_path = os.path.join(settings.REPORTS_DIR, f"chart_{int(datetime.utcnow().timestamp())}.png")
    _ensure_dir(img_path)
    plt.savefig(img_path)
    plt.close()
    return img_path


def generate_report_pdf(report_type: str, period: Tuple[Optional[str], Optional[str]], options: dict, stats: dict) -> str:
    """
    report_type: student_performance | teacher_performance | course_analytics | attendance_analysis | enrollment | financial
    period: (start_iso, end_iso)
    options: { include_graphs: bool, include_detailed_data: bool, include_advanced_analysis: bool }
    stats: precomputed metrics to render (dict)
    Returns absolute file path.
    """
    filename = f"report_{report_type}_{int(datetime.utcnow().timestamp())}.pdf"
    filepath = os.path.join(settings.REPORTS_DIR, filename)
    _ensure_dir(filepath)

    doc = SimpleDocTemplate(filepath, pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=32*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()
    story = []

    title_map = {
        'student_performance': 'Student Performance Report',
        'teacher_performance': 'Teacher Performance Report',
        'course_analytics': 'Course Analytics Report',
        'attendance_analysis': 'Attendance Analysis Report',
        'enrollment': 'Enrollment Report',
        'financial': 'Financial Overview Report',
    }
    story.append(Spacer(1, 10))
    story.append(Paragraph(title_map.get(report_type, report_type), styles['Title']))
    story.append(Spacer(1, 6))

    start, end = period
    story.append(Paragraph(f"Period: <b>{start or '-'} → {end or '-'}</b>", styles['Normal']))
    story.append(Spacer(1, 10))

    # Key metrics table from stats dict
    if stats:
        data = [["Metric", "Value"]]
        for k, v in stats.items():
            if isinstance(v, (int, float)):
                v = f"{v:,}"
            data.append([k.replace('_', ' ').title(), str(v)])
        t = Table(data, colWidths=[90*mm, 60*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('ALIGN', (1,1), (1,-1), 'RIGHT'),
        ]))
        story.append(t)
        story.append(Spacer(1, 12))

    if options.get('include_graphs'):
        # Example chart
        chart_path = _save_matplotlib_chart("Monthly Trend", [10, 14, 12, 20, 18, 22], labels=["Jan","Feb","Mar","Apr","May","Jun"])
        story.append(Image(chart_path, width=170*mm, height=70*mm))
        story.append(Spacer(1, 8))

    def on_page(canvas, doc):
        _header_footer(canvas, doc, title="EDUMANAGE Report / تقرير")

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    return filepath

def generate_group_timetable_pdf(group_name: str, rows: list[dict]) -> str:
    """Generate a timetable PDF for a single group and return absolute file path.
    rows: list of { 'day': int, 'start': 'HH:MM', 'end': 'HH:MM', 'course': str }
    """
    filename = f"timetable_{int(datetime.utcnow().timestamp())}.pdf"
    filepath = os.path.join(settings.REPORTS_DIR, filename)
    _ensure_dir(filepath)

    doc = SimpleDocTemplate(filepath, pagesize=landscape(A4), leftMargin=5*mm, rightMargin=5*mm, topMargin=15*mm, bottomMargin=10*mm)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"Emploi du temps - {group_name}", styles['Title']))
    story.append(Spacer(1, 5))

    day_map = {1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi', 0: 'Dimanche'}
    day_order = [1, 2, 3, 4, 5, 6, 0]

    time_slots = []
    for hour in range(8, 22):
        time_slots.append(f"{hour:02d}:00")

    data = [['Jour'] + [f"{t.split(':')[0]}h" for t in time_slots]]

    sessions_by_day = {day: [] for day in day_order}
    for r in rows:
        sessions_by_day[int(r.get('day', 0))].append(r)

    for day_index in day_order:
        day_name = day_map[day_index]
        row = [day_name]
        
        day_sessions = sorted(sessions_by_day.get(day_index, []), key=lambda x: x.get('start', ''))
        
        i = 0
        while i < len(time_slots):
            slot_start = time_slots[i]
            session_found = None
            for s in day_sessions:
                if s.get('start') == slot_start:
                    session_found = s
                    break
            
            if session_found:
                start_time = session_found.get('start', '00:00')
                end_time = session_found.get('end', '00:00')
                start_hour = int(start_time.split(':')[0])
                end_hour = int(end_time.split(':')[0])
                duration = end_hour - start_hour
                
                row.append(session_found.get('course', ''))
                if duration > 1:
                    for _ in range(duration - 1):
                        row.append("")
                i += duration
            else:
                row.append("")
                i += 1
        data.append(row)

    col_widths = [20*mm] + [(doc.width - 20*mm) / len(time_slots)] * len(time_slots)

    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 1, colors.red), # Red grid
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTSIZE', (0,0), (-1,-1), 7),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    def on_page(canvas, doc):
        _header_footer(canvas, doc, title=f"Emploi du Temps - {group_name}")

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    return filepath


def generate_document_pdf(doc_type: str, student_name: Optional[str], meta: Optional[str], signed: bool) -> str:
    filename = f"document_{doc_type}_{int(datetime.utcnow().timestamp())}.pdf"
    filepath = os.path.join(settings.DOCUMENTS_DIR, filename)
    _ensure_dir(filepath)

    doc = SimpleDocTemplate(filepath, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=30*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()
    story = []

    title_map = {
        'certificate': 'Certificate',
        'report_card': 'Report Card',
        'absence_excuse': 'Absence Excuse',
    }
    story.append(Spacer(1, 16))
    story.append(Paragraph(title_map.get(doc_type, doc_type), styles['Title']))
    if student_name:
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"Student: <b>{student_name}</b>", styles['Normal']))

    if meta:
        story.append(Spacer(1, 8))
        story.append(Paragraph(meta, styles['Normal']))

    story.append(Spacer(1, 20))
    if signed:
        story.append(Paragraph("Digitally signed", styles['Italic']))
    else:
        story.append(Paragraph("Unsigned", styles['Italic']))

    def on_page(canvas, doc):
        _header_footer(canvas, doc, title="Official Document / وثيقة")

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    return filepath