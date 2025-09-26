from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from ..models.models import Teacher, TeacherStatistics, Course, Student, Feedback
from ..database import SessionLocal


class TeacherStatsService:
    """Service to calculate and update teacher statistics"""
    
    @staticmethod
    def calculate_teacher_stats(db: Session, teacher_id: int) -> dict:
        """Calculate all statistics for a teacher"""
        print(f"Calculating stats for teacher ID: {teacher_id}")
        
        # Get teacher
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            return None
        
        # Get courses taught by this teacher
        courses = db.query(Course).filter(Course.teacher_id == teacher_id).all()
        total_subjects = len(courses)
        
        # Get group IDs from courses
        group_ids = [c.group_id for c in courses if c.group_id]
        
        # Get students in these groups
        total_students = 0
        if group_ids:
            total_students = db.query(Student).filter(Student.group_id.in_(group_ids)).count()
        
        # Calculate experience (years since joining)
        join_date = teacher.created_at or datetime.utcnow()
        years_experience = max(0, datetime.utcnow().year - join_date.year)
        
        # Get feedback statistics
        feedback_stats = db.query(
            func.avg(Feedback.rating).label('avg_rating'),
            func.count(Feedback.id).label('total_feedbacks'),
            func.avg(Feedback.satisfaction_score).label('avg_satisfaction'),
            func.avg(Feedback.teaching_quality).label('avg_teaching_quality'),
            func.avg(Feedback.course_content).label('avg_course_content'),
            func.avg(Feedback.communication).label('avg_communication'),
            func.avg(Feedback.helpfulness).label('avg_helpfulness')
        ).filter(Feedback.teacher_id == teacher_id).first()
        
        # Calculate satisfaction percentage (1-10 scale to 0-100%)
        satisfaction_score = 0.0
        if feedback_stats.avg_satisfaction:
            satisfaction_score = (float(feedback_stats.avg_satisfaction) / 10.0) * 100
        
        # Calculate grade improvement from teaching quality (1-5 scale to percentage)
        grade_improvement = 0.0
        if feedback_stats.avg_teaching_quality:
            grade_improvement = (float(feedback_stats.avg_teaching_quality) / 5.0) * 100
        
        stats = {
            'total_students': total_students,
            'total_subjects': total_subjects,
            'years_experience': years_experience,
            'satisfaction_score': round(satisfaction_score, 2),
            'average_rating': round(float(feedback_stats.avg_rating or 0), 2),
            'total_feedback_count': int(feedback_stats.total_feedbacks or 0),
            'teaching_quality': round(float(feedback_stats.avg_teaching_quality or 0), 2),
            'course_content_rating': round(float(feedback_stats.avg_course_content or 0), 2),
            'communication_rating': round(float(feedback_stats.avg_communication or 0), 2),
            'helpfulness_rating': round(float(feedback_stats.avg_helpfulness or 0), 2),
            'attendance_rate': 85.0,  # Default - would come from attendance system
            'grade_improvement': round(grade_improvement, 2)
        }
        
        print(f"Calculated stats for {teacher.full_name}: {stats}")
        return stats
    
    @staticmethod
    def update_teacher_statistics(db: Session, teacher_id: int):
        """Update or create teacher statistics in database"""
        try:
            # Calculate new stats
            stats = TeacherStatsService.calculate_teacher_stats(db, teacher_id)
            if not stats:
                return False
            
            # Get or create teacher statistics record
            teacher_stats = db.query(TeacherStatistics).filter(
                TeacherStatistics.teacher_id == teacher_id
            ).first()
            
            if teacher_stats:
                # Update existing record
                for key, value in stats.items():
                    setattr(teacher_stats, key, value)
                teacher_stats.updated_at = datetime.utcnow()
                print(f"Updated existing stats for teacher {teacher_id}")
            else:
                # Create new record
                teacher_stats = TeacherStatistics(
                    teacher_id=teacher_id,
                    **stats
                )
                db.add(teacher_stats)
                print(f"Created new stats record for teacher {teacher_id}")
            
            db.commit()
            return True
            
        except Exception as e:
            print(f"Error updating teacher statistics: {e}")
            db.rollback()
            return False
    
    @staticmethod
    def update_all_teacher_statistics(db: Session = None):
        """Update statistics for all teachers"""
        if db is None:
            db = SessionLocal()
            should_close = True
        else:
            should_close = False
        
        try:
            teachers = db.query(Teacher).all()
            updated_count = 0
            
            for teacher in teachers:
                if TeacherStatsService.update_teacher_statistics(db, teacher.id):
                    updated_count += 1
            
            print(f"Updated statistics for {updated_count}/{len(teachers)} teachers")
            return updated_count
            
        except Exception as e:
            print(f"Error updating all teacher statistics: {e}")
            return 0
        finally:
            if should_close:
                db.close()
    
    @staticmethod
    def get_teacher_statistics(db: Session, teacher_id: int) -> dict:
        """Get teacher statistics from database"""
        teacher_stats = db.query(TeacherStatistics).filter(
            TeacherStatistics.teacher_id == teacher_id
        ).first()
        
        if not teacher_stats:
            # If no stats exist, calculate and save them
            TeacherStatsService.update_teacher_statistics(db, teacher_id)
            teacher_stats = db.query(TeacherStatistics).filter(
                TeacherStatistics.teacher_id == teacher_id
            ).first()
        
        if teacher_stats:
            return {
                'students': teacher_stats.total_students,
                'subjects': teacher_stats.total_subjects,
                'experience': teacher_stats.years_experience,
                'satisfaction': teacher_stats.satisfaction_score,
                'attendance': teacher_stats.attendance_rate,
                'gradeImprovement': teacher_stats.grade_improvement,
                'feedbackCount': teacher_stats.total_feedback_count,
                'averageRating': teacher_stats.average_rating,
                'teachingQuality': teacher_stats.teaching_quality,
                'courseContent': teacher_stats.course_content_rating,
                'communication': teacher_stats.communication_rating,
                'helpfulness': teacher_stats.helpfulness_rating
            }
        
        return {
            'students': 0,
            'subjects': 0,
            'experience': 0,
            'satisfaction': 0,
            'attendance': 85,
            'gradeImprovement': 0,
            'feedbackCount': 0,
            'averageRating': 0,
            'teachingQuality': 0,
            'courseContent': 0,
            'communication': 0,
            'helpfulness': 0
        }
