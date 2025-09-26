from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict

from ..database import get_db
from ..models.models import StudentGrade, Student, Group
from ..schemas import StudentGradeRead, StudentGradesBulk, GroupStudentAverage, SubjectAverage
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/subject-grades", tags=["subject_grades"], dependencies=[Depends(get_current_admin)])


@router.post("/bulk", response_model=List[StudentGradeRead])
def bulk_upsert(payload: StudentGradesBulk, db: Session = Depends(get_db)):
    if not payload.grades:
        return []

    saved: List[StudentGrade] = []
    for item in payload.grades:
        # Validate student and group exist (light validation)
        student = db.get(Student, item.student_id)
        if not student:
            raise HTTPException(status_code=400, detail=f"Student {item.student_id} not found")
        group = db.get(Group, item.group_id)
        if not group:
            raise HTTPException(status_code=400, detail=f"Group {item.group_id} not found")

        existing = (
            db.query(StudentGrade)
            .filter(
                StudentGrade.student_id == item.student_id,
                StudentGrade.subject == item.subject,
                StudentGrade.exam_name == item.exam_name,
                StudentGrade.semester == item.semester,
            )
            .first()
        )
        if existing:
            existing.group_id = item.group_id
            existing.grade = item.grade
            existing.coefficient = item.coefficient
            db.add(existing)
            saved.append(existing)
        else:
            row = StudentGrade(
                student_id=item.student_id,
                group_id=item.group_id,
                subject=item.subject,
                exam_name=item.exam_name,
                grade=item.grade,
                coefficient=item.coefficient,
                semester=item.semester,
            )
            db.add(row)
            saved.append(row)

    db.commit()
    for s in saved:
        db.refresh(s)
    return saved


@router.get("/by-group-subject", response_model=List[StudentGradeRead])
def get_by_group_subject(
    group_id: int = Query(...),
    subject: str = Query(...),
    semester: str = Query(...),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(StudentGrade)
        .filter(
            StudentGrade.group_id == group_id,
            StudentGrade.subject == subject,
            StudentGrade.semester == semester,
        )
        .order_by(StudentGrade.student_id.asc(), StudentGrade.exam_name.asc())
        .all()
    )
    return rows


@router.get("/by-student", response_model=List[StudentGradeRead])
def get_by_student(
    student_id: int = Query(...),
    semester: str | None = Query(None),
    group_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    # Validate student exists
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    q = db.query(StudentGrade).filter(StudentGrade.student_id == student_id)
    if semester:
        q = q.filter(StudentGrade.semester == semester)
    if group_id is not None:
        q = q.filter(StudentGrade.group_id == group_id)

    rows = q.order_by(
        StudentGrade.semester.asc(),
        StudentGrade.subject.asc(),
        StudentGrade.exam_name.asc(),
    ).all()
    return rows


@router.get("/averages/by-group", response_model=List[GroupStudentAverage])
def averages_by_group(
    group_id: int = Query(...),
    semester: str = Query(...),
    db: Session = Depends(get_db),
):
    # Load students in the group
    students: List[Student] = (
        db.query(Student)
        .filter(Student.group_id == group_id)
        .order_by(Student.full_name.asc())
        .all()
    )

    # Load all grades for the group and semester
    rows: List[StudentGrade] = (
        db.query(StudentGrade)
        .filter(
            StudentGrade.group_id == group_id,
            StudentGrade.semester == semester,
        )
        .all()
    )

    # Build map: student_id -> subject -> { grades: [], coefficient }
    agg: Dict[int, Dict[str, Dict[str, float | List[float]]]] = {}
    for r in rows:
        sid = int(r.student_id)
        subj = (r.subject or '').strip()
        if not subj:
            continue
        agg.setdefault(sid, {})
        if subj not in agg[sid]:
            agg[sid][subj] = {"grades": [], "coefficient": float(r.coefficient or 1.0)}
        # If coefficient differs across rows we keep the latest non-null
        if r.coefficient is not None:
            agg[sid][subj]["coefficient"] = float(r.coefficient)
        # Append grade
        try:
            g = float(r.grade)
            agg[sid][subj]["grades"].append(g)
        except Exception:
            pass

    result: List[GroupStudentAverage] = []
    for st in students:
        sid = int(st.id)
        subjects_info = agg.get(sid, {})
        subject_entries: List[SubjectAverage] = []
        weighted_sum = 0.0
        sum_coeffs = 0.0
        for subj, info in subjects_info.items():
            grades = info.get("grades", [])  # type: ignore
            coeff = float(info.get("coefficient", 1.0))  # type: ignore
            if not grades:
                continue
            avg = sum(grades) / len(grades)
            subject_entries.append(SubjectAverage(subject=subj, coefficient=coeff, average=avg))
            weighted_sum += avg * coeff
            sum_coeffs += coeff
        avg_val = (weighted_sum / sum_coeffs) if sum_coeffs > 0 else None
        result.append(
            GroupStudentAverage(
                student_id=sid,
                full_name=st.full_name,
                average=avg_val,
                sum_coefficients=sum_coeffs,
                subjects=subject_entries,
            )
        )

    return result
