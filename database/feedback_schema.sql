-- Feedback/Reviews Table for Student Satisfaction System
-- This table stores student feedback and ratings for teachers and courses

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    
    -- Rating scales
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- Overall rating 1-5
    satisfaction_score INTEGER NOT NULL CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10), -- Satisfaction 1-10
    teaching_quality INTEGER NOT NULL CHECK (teaching_quality >= 1 AND teaching_quality <= 5), -- Teaching quality 1-5
    course_content INTEGER NOT NULL CHECK (course_content >= 1 AND course_content <= 5), -- Course content 1-5
    communication INTEGER NOT NULL CHECK (communication >= 1 AND communication <= 5), -- Communication 1-5
    helpfulness INTEGER NOT NULL CHECK (helpfulness >= 1 AND helpfulness <= 5), -- Helpfulness 1-5
    
    -- Optional comments
    comments TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints (uncomment if you have these tables with proper references)
    -- FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    -- FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    -- FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Ensure one feedback per student per course per teacher
    UNIQUE(student_id, teacher_id, course_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_teacher ON feedback(teacher_id);
CREATE INDEX IF NOT EXISTS idx_feedback_course ON feedback(course_id);
CREATE INDEX IF NOT EXISTS idx_feedback_student ON feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- View for teacher statistics (optional - for easier querying)
CREATE OR REPLACE VIEW teacher_feedback_stats AS
SELECT 
    teacher_id,
    COUNT(*) as total_feedbacks,
    ROUND(AVG(rating::numeric), 2) as average_rating,
    ROUND(AVG(satisfaction_score::numeric), 2) as avg_satisfaction_score,
    ROUND(AVG(teaching_quality::numeric), 2) as avg_teaching_quality,
    ROUND(AVG(course_content::numeric), 2) as avg_course_content,
    ROUND(AVG(communication::numeric), 2) as avg_communication,
    ROUND(AVG(helpfulness::numeric), 2) as avg_helpfulness,
    -- Convert satisfaction score (1-10) to percentage for display
    ROUND((AVG(satisfaction_score::numeric) / 10.0) * 100, 0) as satisfaction_percentage,
    -- Convert teaching quality (1-5) to percentage for grade improvement metric
    ROUND((AVG(teaching_quality::numeric) / 5.0) * 100, 0) as grade_improvement_percentage
FROM feedback 
GROUP BY teacher_id;

-- Sample data for testing (optional)
-- INSERT INTO feedback (student_id, teacher_id, course_id, rating, satisfaction_score, teaching_quality, course_content, communication, helpfulness, comments) VALUES
-- (1, 1, 1, 5, 9, 5, 4, 5, 5, 'Excellent teacher, very helpful and clear explanations'),
-- (2, 1, 1, 4, 8, 4, 4, 4, 4, 'Good teaching style, could improve course materials'),
-- (3, 1, 1, 5, 10, 5, 5, 5, 5, 'Outstanding teacher! Highly recommend');

-- Query examples:
-- Get all feedback for a teacher: SELECT * FROM feedback WHERE teacher_id = 1;
-- Get teacher stats: SELECT * FROM teacher_feedback_stats WHERE teacher_id = 1;
-- Get feedback for a course: SELECT * FROM feedback WHERE course_id = 1;
