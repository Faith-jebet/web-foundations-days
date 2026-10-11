# School Database Design

## Tables

- **students** stores one row per student: an `id` (primary key), their `name` and their `email`. The email is `UNIQUE` so two students cannot share one.
- **courses** stores one row per course: an `id` (primary key), the `title` and the number of `credits`.
- **enrolments** records the fact that a student is enrolled on a course. Each row has its own `id`, a `student_id` and a `course_id` (both foreign keys, both `NOT NULL`) and a `grade` that stays empty until the student is graded. A `UNIQUE (student_id, course_id)` rule stops the same student enrolling on the same course twice.

## Relationships

- **students to enrolments is one-to-many.** One student can have many enrolments, but each enrolment belongs to exactly one student.
- **courses to enrolments is one-to-many.** One course can have many enrolments, but each enrolment belongs to exactly one course.
- **students to courses is many-to-many.** A student can take many courses and a course has many students. A relational database cannot store this directly in two tables, so the `enrolments` table acts as a join table. It turns the many-to-many relationship into two one-to-many relationships. It is also the natural place to keep the grade, because the grade belongs to the student and the course together, not to either one alone.

## Index

I would add an index on `enrolments(course_id)`:

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);
```

Queries such as "all students on a course" and "number of students per course" look up enrolments by course. Without an index the database must scan every enrolment row. The `UNIQUE (student_id, course_id)` rule already creates an index that helps lookups by student, but it does not help lookups by course alone, so this index fills that gap.

## SQL or NoSQL?

I would choose SQL for this system. The data is highly structured and clearly related: students, courses and enrolments link to each other, and queries such as joining students to courses or counting students per course are exactly what SQL is built for. A relational database also enforces the rules that matter here, such as foreign keys, unique emails and no double enrolment, so bad data is rejected instead of silently stored. A NoSQL document database would suit data with a flexible or changing shape, but here the shape is fixed and the relationships are the whole point.