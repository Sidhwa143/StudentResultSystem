const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const pool = require("./db");

const app = express();
const PORT = 5000;


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors({
    origin: "http://localhost:5000",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ========================================
// SESSION
// ========================================

app.use(session({
    secret: "student-result-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 60 * 60 * 1000
    }
}));


// ========================================
// SERVE FRONTEND
// ========================================

const frontendPath = path.join(__dirname, "frontend");

console.log("Frontend path:", frontendPath);

app.use(express.static(frontendPath));


// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(frontendPath, "index.html")
    );

});


// ========================================
// LOGIN PAGE
// ========================================

app.get("/login.html", (req, res) => {

    res.sendFile(
        path.join(frontendPath, "login.html")
    );

});


// ========================================
// ADMIN LOGIN
// ========================================

app.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {

            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });

        }

        const result = await pool.query(
            `
            SELECT *
            FROM admins
            WHERE username = $1
            AND password = $2
            `,
            [username, password]
        );

        if (result.rows.length === 0) {

            return res.json({
                success: false,
                message: "Invalid username or password"
            });

        }

        req.session.admin = {
            username: result.rows[0].username
        };

        res.json({
            success: true,
            message: "Login successful"
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ========================================
// CHECK LOGIN
// ========================================

app.get("/check-login", (req, res) => {

    if (req.session.admin) {

        return res.json({
            loggedIn: true,
            username: req.session.admin.username
        });

    }

    res.json({
        loggedIn: false
    });

});


// ========================================
// LOGOUT
// ========================================

app.post("/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {

            console.error("Logout error:", error);

            return res.status(500).json({
                success: false,
                message: "Logout failed"
            });

        }

        res.json({
            success: true,
            message: "Logged out successfully"
        });

    });

});


// ========================================
// ADMIN AUTHENTICATION
// ========================================

function requireAdmin(req, res, next) {

    if (!req.session.admin) {

        return res.status(401).json({
            success: false,
            message: "Unauthorized. Please login."
        });

    }

    next();

}


// ========================================
// GET ALL STUDENTS
// ========================================

app.get("/students", requireAdmin, async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                student_id,
                reg_no,
                name,
                email,
                department,
                semester
            FROM students
            ORDER BY student_id ASC
            `
        );

        res.json(result.rows);

    } catch (error) {

        console.error("Students error:", error);

        res.status(500).json({
            success: false,
            message: "Database error"
        });

    }

});


// ========================================
// ADD STUDENT
// ========================================

app.post("/students", requireAdmin, async (req, res) => {

    try {

        const {
            reg_no,
            name,
            email,
            department,
            semester
        } = req.body;

        if (
            !reg_no ||
            !name ||
            !email ||
            !department ||
            !semester
        ) {

            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });

        }

        // Check duplicate registration number

        const existingStudent = await pool.query(
            `
            SELECT student_id
            FROM students
            WHERE reg_no = $1
            `,
            [reg_no]
        );

        if (existingStudent.rows.length > 0) {

            return res.status(400).json({
                success: false,
                message: "Registration number already exists"
            });

        }

        const result = await pool.query(
            `
            INSERT INTO students
            (
                reg_no,
                name,
                email,
                department,
                semester
            )
            VALUES
            ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                reg_no,
                name,
                email,
                department,
                semester
            ]
        );

        res.json({
            success: true,
            message: "Student added successfully",
            student: result.rows[0]
        });

    } catch (error) {

        console.error("Add student error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to add student"
        });

    }


});


// ========================================
// GET RESULT BY REGISTRATION NUMBER
// ========================================

app.get("/result/:reg_no", requireAdmin, async (req, res) => {

    try {

        const { reg_no } = req.params;

        const result = await pool.query(
            `
            SELECT
                s.reg_no,
                s.name,
                s.department,
                s.semester,
                c.course_code,
                c.course_name,
                c.credits,
                r.marks,
                r.grade,
                r.grade_point

            FROM students s

            JOIN results r
                ON s.student_id = r.student_id

            JOIN courses c
                ON r.course_id = c.course_id

            WHERE s.reg_no = $1

            ORDER BY c.course_code
            `,
            [reg_no]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Student result not found"
            });

        }


        // ========================================
        // CALCULATE SGPA
        // ========================================

        let totalCredits = 0;
        let totalPoints = 0;

        result.rows.forEach(row => {

            totalCredits += Number(row.credits);

            totalPoints +=
                Number(row.credits) *
                Number(row.grade_point);

        });

        // ========================================
// CALCULATE SGPA
// ========================================

const sgpa =
    totalCredits > 0
        ? (totalPoints / totalCredits).toFixed(2)
        : "0.00";

// ========================================
// CALCULATE CGPA
// ========================================
// Currently CGPA = SGPA for the available semester.
// Later, when multiple semesters are stored,
// this can be changed to calculate cumulative CGPA.

const cgpa = sgpa;
        // ========================================
        // RESPONSE
        // ========================================

    res.json({

    success: true,

    student: {
        reg_no: result.rows[0].reg_no,
        name: result.rows[0].name,
        department: result.rows[0].department,
        semester: result.rows[0].semester
    },

    results: result.rows,

    sgpa: sgpa,

    cgpa: cgpa

});

    } catch (error) {

        console.error("Result error:", error);

        res.status(500).json({
            success: false,
            message: "Database error"
        });

    }

});


// ========================================
// GET ALL COURSES
// ========================================

app.get("/courses", requireAdmin, async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                course_id,
                course_code,
                course_name,
                credits
            FROM courses
            ORDER BY course_code
            `
        );

        res.json(result.rows);

    } catch (error) {

        console.error("Courses error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load courses"
        });

    }

});


// ========================================
// GET ALL RESULTS
// ========================================

app.get("/results", requireAdmin, async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                r.result_id,
                s.reg_no,
                s.name,
                c.course_id,
                c.course_code,
                c.course_name,
                c.credits,
                r.marks,
                r.grade,
                r.grade_point

            FROM results r

            JOIN students s
                ON r.student_id = s.student_id

            JOIN courses c
                ON r.course_id = c.course_id

            ORDER BY s.reg_no, c.course_code
            `
        );

        res.json(result.rows);

    } catch (error) {

        console.error("Results error:", error);

        res.status(500).json({
            success: false,
            message: "Database error"
        });

    }

});


// ========================================
// ADD RESULT
// ========================================

app.post("/results", requireAdmin, async (req, res) => {

    try {

        const {
            reg_no,
            course_id,
            marks,
            grade
        } = req.body;

        if (
            !reg_no ||
            !course_id ||
            marks === undefined ||
            marks === "" ||
            !grade
        ) {

            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });

        }

        const numericMarks = Number(marks);

        if (
            isNaN(numericMarks) ||
            numericMarks < 0 ||
            numericMarks > 100
        ) {

            return res.status(400).json({
                success: false,
                message: "Marks must be between 0 and 100"
            });

        }


        // Find student

        const studentResult = await pool.query(
            `
            SELECT student_id
            FROM students
            WHERE reg_no = $1
            `,
            [reg_no]
        );

        if (studentResult.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }

        const studentId =
            studentResult.rows[0].student_id;


        // Check course

        const courseResult = await pool.query(
            `
            SELECT course_id
            FROM courses
            WHERE course_id = $1
            `,
            [course_id]
        );

        if (courseResult.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Course not found"
            });

        }


        // ========================================
        // CALCULATE GRADE POINT
        // ========================================

        let gradePoint;

        switch (grade.toUpperCase()) {

            case "A+":
                gradePoint = 10;
                break;

            case "A":
                gradePoint = 9;
                break;

            case "B":
                gradePoint = 8;
                break;

            case "C":
                gradePoint = 7;
                break;

            case "D":
                gradePoint = 6;
                break;

            case "E":
                gradePoint = 5;
                break;

            case "F":
                gradePoint = 0;
                break;

            default:

                return res.status(400).json({
                    success: false,
                    message: "Invalid grade"
                });

        }


        // Check duplicate result

        const duplicate = await pool.query(
            `
            SELECT result_id
            FROM results
            WHERE student_id = $1
            AND course_id = $2
            `,
            [
                studentId,
                course_id
            ]
        );

        if (duplicate.rows.length > 0) {

            return res.status(400).json({
                success: false,
                message: "Result already exists for this student and course"
            });

        }


        // Insert result

        const result = await pool.query(
            `
            INSERT INTO results
            (
                student_id,
                course_id,
                marks,
                grade,
                grade_point
            )
            VALUES
            ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                studentId,
                course_id,
                numericMarks,
                grade.toUpperCase(),
                gradePoint
            ]
        );


        res.json({

            success: true,

            message: "Result added successfully",

            result: result.rows[0]

        });

    } catch (error) {

        console.error("Add result error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to add result"
        });

    }

});


// ========================================
// UPDATE RESULT
// ========================================

app.put("/results/:result_id", requireAdmin, async (req, res) => {

    try {

        const { result_id } = req.params;

        const { marks, grade } = req.body;

        const numericMarks = Number(marks);

        if (
            isNaN(numericMarks) ||
            numericMarks < 0 ||
            numericMarks > 100
        ) {

            return res.status(400).json({
                success: false,
                message: "Marks must be between 0 and 100"
            });

        }

        let gradePoint;

        switch (grade.toUpperCase()) {

            case "A+":
                gradePoint = 10;
                break;

            case "A":
                gradePoint = 9;
                break;

            case "B":
                gradePoint = 8;
                break;

            case "C":
                gradePoint = 7;
                break;

            case "D":
                gradePoint = 6;
                break;

            case "E":
                gradePoint = 5;
                break;

            case "F":
                gradePoint = 0;
                break;

            default:

                return res.status(400).json({
                    success: false,
                    message: "Invalid grade"
                });

        }


        const result = await pool.query(
            `
            UPDATE results

            SET
                marks = $1,
                grade = $2,
                grade_point = $3

            WHERE result_id = $4

            RETURNING *
            `,
            [
                numericMarks,
                grade.toUpperCase(),
                gradePoint,
                result_id
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Result not found"
            });

        }


        res.json({

            success: true,

            message: "Result updated successfully",

            result: result.rows[0]

        });

    } catch (error) {

        console.error("Update result error:", error);

        res.status(500).json({
            success: false,
            message: "Database error"
        });

    }

});


// ========================================
// DELETE RESULT
// ========================================

app.delete("/results/:result_id", requireAdmin, async (req, res) => {

    try {

        const { result_id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM results

            WHERE result_id = $1

            RETURNING *
            `,
            [result_id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Result not found"
            });

        }

        res.json({

            success: true,

            message: "Result deleted successfully"

        });

    } catch (error) {

        console.error("Delete result error:", error);

        res.status(500).json({
            success: false,
            message: "Database error"
        });

    }

});


// ========================================
// DASHBOARD STATISTICS
// ========================================

app.get("/statistics", requireAdmin, async (req, res) => {

    try {

        const studentsResult = await pool.query(
            `SELECT COUNT(*) AS count FROM students`
        );

        const coursesResult = await pool.query(
            `SELECT COUNT(*) AS count FROM courses`
        );

        const resultsResult = await pool.query(
            `SELECT COUNT(*) AS count FROM results`
        );

        res.json({

            success: true,

            students: Number(
                studentsResult.rows[0].count
            ),

            courses: Number(
                coursesResult.rows[0].count
            ),

            results: Number(
                resultsResult.rows[0].count
            )

        });

    } catch (error) {

        console.error("Statistics error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load statistics"
        });

    }

});


// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log("==============================");

    console.log(
        `Server running on port ${PORT}`
    );

    console.log(
        "Login: http://localhost:5000/login.html"
    );

    console.log("==============================");

});