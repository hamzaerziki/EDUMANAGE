from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from ..database import get_db
from ..models.models import Report, Payment, ExamResult, Attendance
from ..schemas import ReportCreate, ReportRead
from ..utils.auth import get_current_admin
from ..utils.pdf_generator import generate_report_pdf

router = APIRouter(prefix="/reports", tags=["reports"], dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=List[ReportRead])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.id.desc()).all()


class GenerateReportRequest(ReportCreate):
    include_graphs: Optional[bool] = True
    include_detailed_data: Optional[bool] = False
    include_advanced_analysis: Optional[bool] = False


@router.post("/generate", response_model=ReportRead)
def generate_report(payload: GenerateReportRequest, db: Session = Depends(get_db)):
    # Compute simple stats from DB as a placeholder
    stats = {}
    if payload.type == 'financial':
        paid_total = (db.query(Payment).filter(Payment.status == 'paid')
                      .with_entities(Payment.amount).all())
        paid_sum = sum(a[0] for a in paid_total) if paid_total else 0
        unpaid_total = (db.query(Payment).filter(Payment.status == 'unpaid')
                        .with_entities(Payment.amount).all())
        unpaid_sum = sum(a[0] for a in unpaid_total) if unpaid_total else 0
        recovery_rate = (paid_sum / (paid_sum + unpaid_sum) * 100) if (paid_sum + unpaid_sum) else 0
        stats = {
            'total_revenue': round(paid_sum, 2),
            'outstanding_balances': round(unpaid_sum, 2),
            'recovery_rate_percent': round(recovery_rate, 1),
        }
    elif payload.type == 'attendance_analysis':
        total = db.query(Attendance).count()
        present = db.query(Attendance).filter(Attendance.status == 'present').count()
        rate = (present / total * 100) if total else 0
        stats = {'attendance_records': total, 'present_rate_percent': round(rate, 1)}
    elif payload.type == 'student_performance':
        scores = db.query(ExamResult).with_entities(ExamResult.score).all()
        avg = sum(s[0] for s in scores) / len(scores) if scores else 0
        stats = {'avg_score': round(avg, 2), 'results_count': len(scores)}
    else:
        stats = {'note': 'Basic report generated'}

    options = {
        'include_graphs': payload.include_graphs,
        'include_detailed_data': payload.include_detailed_data,
        'include_advanced_analysis': payload.include_advanced_analysis,
    }
    file_path = generate_report_pdf(payload.type, (payload.period_start.isoformat() if payload.period_start else None,
                                                  payload.period_end.isoformat() if payload.period_end else None),
                                    options, stats)

    record = Report(
        type=payload.type,
        period_start=payload.period_start,
        period_end=payload.period_end,
        file_path=file_path,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
