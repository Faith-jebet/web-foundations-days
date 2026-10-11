-- School database: students, courses and enrolments

DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- 1. Tables
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  credits INTEGER NOT NULL
);

CREATE TABLE enrolments (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  grade INTEGER,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  UNIQUE (student_id, course_id)
);

-- 2. Sample data
INSERT INTO students (id, name, email) VALUES
  (1, 'Amina Otieno', 'amina@example.com'),
  (2, 'Brian Kamau', 'brian@example.com'),
  (3, 'Carol Wanjiru', 'carol@example.com'),
  (4, 'David Mwangi', 'david@example.com');

INSERT INTO courses (id, title, credits) VALUES
  (1, 'Web Development', 4),
  (2, 'Databases', 3),
  (3, 'Data Structures', 4);

INSERT INTO enrolments (student_id, course_id, grade) VALUES
  (1, 1, 85),
  (1, 2, 78),
  (2, 1, 72),
  (2, 3, 90),
  (3, 2, 65);

-- 3. Queries

-- Query 1: all courses for one student (by name)
SELECT c.title, e.grade
FROM students s
JOIN enrolments e ON e.student_id = s.id
JOIN courses c ON c.id = e.course_id
WHERE s.name = 'Amina Otieno';

-- Query 2: all students on one course
SELECT s.name, s.email
FROM courses c
JOIN enrolments e ON e.course_id = c.id
JOIN students s ON s.id = e.student_id
WHERE c.title = 'Web Development';

-- Query 3: number of students per course
SELECT c.title, COUNT(e.id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON e.course_id = c.id
GROUP BY c.id, c.title;

-- Query 4: students who have no enrolments
SELECT s.name, s.email
FROM students s
LEFT JOIN enrolments e ON e.student_id = s.id
WHERE e.id IS NULL;

-- Query 5: update one enrolment's grade (Brian's grade in Web Development)
UPDATE enrolments
SET grade = 80
WHERE student_id = (SELECT id FROM students WHERE name = 'Brian Kamau')
  AND course_id = (SELECT id FROM courses WHERE title = 'Web Development');