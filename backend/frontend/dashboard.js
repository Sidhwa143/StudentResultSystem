// ========================================
// CHECK ADMIN LOGIN
// ========================================

async function checkLogin() {

    try {

        const response = await fetch(
            "/check-login",
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!data.loggedIn) {

            window.location.href =
                "/login.html";

            return false;
        }

        return true;

    } catch (error) {

        console.error(error);

        window.location.href =
            "/login.html";

        return false;
    }
}


// ========================================
// VIEW STUDENTS
// ========================================

async function showStudents() {

    const content =
        document.getElementById("content");

    try {

        const response =
            await fetch(
                "/students",
                {
                    credentials: "include"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            content.innerHTML =
                `<p>${data.message || "Unable to load students"}</p>`;

            return;
        }

        const students = data;

        let html = `

            <h2>Students</h2>

            <input
                type="text"
                id="studentSearch"
                placeholder="Search by Registration No or Name..."
                onkeyup="filterStudents()"
            >

            <br><br>

            <table id="studentsTable">

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Registration No</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Semester</th>
                        <th>Action</th>

                    </tr>

                </thead>

                <tbody id="studentTableBody">

        `;


        if (students.length === 0) {

            html += `
                <tr>
                    <td colspan="7">
                        No students found.
                    </td>
                </tr>
            `;
        }


        students.forEach(student => {

            html += `

                <tr>

                    <td>
                        ${student.student_id}
                    </td>

                    <td>
                        ${student.reg_no}
                    </td>

                    <td>
                        ${student.name}
                    </td>

                    <td>
                        ${student.email}
                    </td>

                    <td>
                        ${student.department}
                    </td>

                    <td>
                        ${student.semester}
                    </td>

                    <td>

                        <button
                            onclick="viewStudentResult('${student.reg_no}')"
                        >
                            View Result
                        </button>

                    </td>

                </tr>

            `;
        });


        html += `

                </tbody>

            </table>

        `;


        content.innerHTML = html;


    } catch (error) {

        console.error(error);

        content.innerHTML =
            "<p>Unable to connect to server</p>";
    }
}


// ========================================
// FILTER STUDENTS
// ========================================

function filterStudents() {

    const search =
        document
            .getElementById("studentSearch")
            .value
            .toLowerCase();


    const rows =
        document.querySelectorAll(
            "#studentTableBody tr"
        );


    rows.forEach(row => {

        const text =
            row.innerText.toLowerCase();


        row.style.display =
            text.includes(search)
                ? ""
                : "none";
    });
}


// ========================================
// VIEW STUDENT RESULT
// ========================================

async function viewStudentResult(regNo) {

    const content =
        document.getElementById("content");

    try {

        const response =
            await fetch(
                `/result/${regNo}`,
                {
                    credentials: "include"
                }
            );

        const data =
            await response.json();


        if (!response.ok) {

            content.innerHTML = `

                <h2>Result Not Found</h2>

                <p>
                    ${data.message || "No result found"}
                </p>

                <button
                    onclick="showStudents()"
                >
                    ← Back to Students
                </button>

            `;

            return;
        }


        const student =
            data.student;

        const results =
            data.results;

        const sgpa =
            data.sgpa;


        let tableRows = "";


        results.forEach(result => {

            tableRows += `

                <tr>

                    <td>
                        ${result.course_code}
                    </td>

                    <td>
                        ${result.course_name}
                    </td>

                    <td>
                        ${result.credits}
                    </td>

                    <td>
                        ${result.marks}
                    </td>

                    <td>
                        ${result.grade}
                    </td>

                    <td>
                        ${Number(
                            result.grade_point
                        ).toFixed(2)}
                    </td>

                </tr>

            `;
        });


        content.innerHTML = `

            <h2>Student Result</h2>

            <div class="student-info">

                <p>
                    <strong>
                        Registration No:
                    </strong>

                    ${student.reg_no}
                </p>

                <p>
                    <strong>
                        Name:
                    </strong>

                    ${student.name}
                </p>

                <p>
                    <strong>
                        Department:
                    </strong>

                    ${student.department}
                </p>

                <p>
                    <strong>
                        Semester:
                    </strong>

                    ${student.semester}
                </p>

            </div>


            <table>

                <thead>

                    <tr>

                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Credits</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Grade Point</th>

                    </tr>

                </thead>

                <tbody>

                    ${tableRows}

                </tbody>

            </table>


            <div class="sgpa">

                SGPA: ${sgpa}

            </div>


            <br>


            <button
                onclick="showStudents()"
            >
                ← Back to Students
            </button>

        `;

    } catch (error) {

        console.error(error);

        content.innerHTML = `

            <h2>Error</h2>

            <p>
                Unable to load student result.
            </p>

            <button
                onclick="showStudents()"
            >
                ← Back to Students
            </button>

        `;
    }
}


// ========================================
// ADD STUDENT FORM
// ========================================

function showAddStudent() {

    const content =
        document.getElementById("content");


    content.innerHTML = `

        <h2>Add Student</h2>

        <input
            type="text"
            id="regNo"
            placeholder="Registration Number"
        >

        <br><br>

        <input
            type="text"
            id="name"
            placeholder="Student Name"
        >

        <br><br>

        <input
            type="email"
            id="email"
            placeholder="Email"
        >

        <br><br>

        <input
            type="text"
            id="department"
            placeholder="Department"
        >

        <br><br>

        <input
            type="number"
            id="semester"
            placeholder="Semester"
            min="1"
            max="8"
        >

        <br><br>

        <button onclick="addStudent()">
            Add Student
        </button>

        <p id="studentMessage"></p>

    `;
}


// ========================================
// ADD STUDENT
// ========================================

async function addStudent() {

    const reg_no =
        document
            .getElementById("regNo")
            .value
            .trim();


    const name =
        document
            .getElementById("name")
            .value
            .trim();


    const email =
        document
            .getElementById("email")
            .value
            .trim();


    const department =
        document
            .getElementById("department")
            .value
            .trim();


    const semester =
        document
            .getElementById("semester")
            .value;


    if (
        !reg_no ||
        !name ||
        !email ||
        !department ||
        !semester
    ) {

        document.getElementById(
            "studentMessage"
        ).innerText =
            "Please fill all fields";

        return;
    }


    try {

        const response =
            await fetch(
                "/students",
                {

                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        reg_no,
                        name,
                        email,
                        department,
                        semester

                    })
                }
            );


        const data =
            await response.json();


        document.getElementById(
            "studentMessage"
        ).innerText =
            data.message;


        if (data.success) {

            document.getElementById(
                "regNo"
            ).value = "";

            document.getElementById(
                "name"
            ).value = "";

            document.getElementById(
                "email"
            ).value = "";

            document.getElementById(
                "department"
            ).value = "";

            document.getElementById(
                "semester"
            ).value = "";
        }


    } catch (error) {

        console.error(error);

        document.getElementById(
            "studentMessage"
        ).innerText =
            "Unable to connect to server";
    }
}


// ========================================
// ADD RESULT FORM
// ========================================

async function showAddResult() {

    const content =
        document.getElementById("content");


    content.innerHTML = `

        <h2>Add Student Result</h2>


        <input
            type="text"
            id="resultRegNo"
            placeholder="Registration Number"
        >

        <br><br>


        <select id="course">

            <option value="">
                Select Course
            </option>

        </select>

        <br><br>


        <input
            type="number"
            id="marks"
            placeholder="Marks"
            min="0"
            max="100"
        >

        <br><br>


        <select id="grade">

            <option value="">
                Select Grade
            </option>

            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>

        </select>

        <br><br>


        <button onclick="addResult()">
            Add Result
        </button>


        <p id="resultMessage"></p>

    `;


    await loadCourses();
}


// ========================================
// LOAD COURSES
// ========================================

async function loadCourses() {

    try {

        const response =
            await fetch(
                "/courses",
                {
                    credentials: "include"
                }
            );


        const courses =
            await response.json();


        if (!response.ok) {

            throw new Error(
                "Unable to load courses"
            );
        }


        const select =
            document.getElementById(
                "course"
            );


        courses.forEach(course => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                course.course_id;


            option.textContent =
                `${course.course_code} - ${course.course_name}`;


            select.appendChild(option);
        });


    } catch (error) {

        console.error(error);


        const message =
            document.getElementById(
                "resultMessage"
            );


        if (message) {

            message.innerText =
                "Unable to load courses";
        }
    }
}


// ========================================
// ADD RESULT
// ========================================

async function addResult() {

    const reg_no =
        document
            .getElementById("resultRegNo")
            .value
            .trim();


    const course_id =
        document
            .getElementById("course")
            .value;


    const marks =
        document
            .getElementById("marks")
            .value;


    const grade =
        document
            .getElementById("grade")
            .value;


    if (
        !reg_no ||
        !course_id ||
        marks === "" ||
        !grade
    ) {

        document.getElementById(
            "resultMessage"
        ).innerText =
            "Please fill all fields";

        return;
    }


    try {

        const response =
            await fetch(
                "/results",
                {

                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        reg_no,
                        course_id,
                        marks,
                        grade

                    })
                }
            );


        const data =
            await response.json();


        document.getElementById(
            "resultMessage"
        ).innerText =
            data.message;


        if (data.success) {

            document.getElementById(
                "resultRegNo"
            ).value = "";

            document.getElementById(
                "course"
            ).value = "";

            document.getElementById(
                "marks"
            ).value = "";

            document.getElementById(
                "grade"
            ).value = "";
        }


    } catch (error) {

        console.error(error);

        document.getElementById(
            "resultMessage"
        ).innerText =
            "Unable to connect to server";
    }
}


// ========================================
// MANAGE RESULTS
// ========================================

async function showResults() {

    const content =
        document.getElementById("content");


    try {

        const response =
            await fetch(
                "/results",
                {
                    credentials: "include"
                }
            );


        const results =
            await response.json();


        if (!response.ok) {

            content.innerHTML =
                `<p>${results.message || "Unable to load results"}</p>`;

            return;
        }


        let html = `

            <h2>Manage Results</h2>

            <table>

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Reg No</th>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Grade Point</th>
                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

        `;


        if (results.length === 0) {

            html += `
                <tr>
                    <td colspan="8">
                        No results found.
                    </td>
                </tr>
            `;
        }


        results.forEach(result => {

            html += `

                <tr>

                    <td>
                        ${result.result_id}
                    </td>

                    <td>
                        ${result.reg_no}
                    </td>

                    <td>
                        ${result.name}
                    </td>

                    <td>
                        ${result.course_code}
                    </td>

                    <td>

                        <input
                            type="number"
                            id="marks-${result.result_id}"
                            value="${result.marks}"
                            min="0"
                            max="100"
                            style="width:70px;"
                        >

                    </td>


                    <td>

                        <select
                            id="grade-${result.result_id}"
                        >

                            <option value="A+"
                                ${
                                    result.grade === "A+"
                                        ? "selected"
                                        : ""
                                }>
                                A+
                            </option>

                            <option value="A"
                                ${
                                    result.grade === "A"
                                        ? "selected"
                                        : ""
                                }>
                                A
                            </option>

                            <option value="B"
                                ${
                                    result.grade === "B"
                                        ? "selected"
                                        : ""
                                }>
                                B
                            </option>

                            <option value="C"
                                ${
                                    result.grade === "C"
                                        ? "selected"
                                        : ""
                                }>
                                C
                            </option>

                            <option value="D"
                                ${
                                    result.grade === "D"
                                        ? "selected"
                                        : ""
                                }>
                                D
                            </option>

                            <option value="E"
                                ${
                                    result.grade === "E"
                                        ? "selected"
                                        : ""
                                }>
                                E
                            </option>

                            <option value="F"
                                ${
                                    result.grade === "F"
                                        ? "selected"
                                        : ""
                                }>
                                F
                            </option>

                        </select>

                    </td>


                    <td>
                        ${Number(
                            result.grade_point
                        ).toFixed(2)}
                    </td>


                    <td>

                        <button
                            onclick="updateResult(${result.result_id})"
                        >
                            Update
                        </button>


                        <button
                            onclick="deleteResult(${result.result_id})"
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `;
        });


        html += `

                </tbody>

            </table>


            <p id="manageMessage"></p>

        `;


        content.innerHTML = html;


    } catch (error) {

        console.error(error);

        content.innerHTML =
            "<p>Unable to connect to server</p>";
    }
}


// ========================================
// UPDATE RESULT
// ========================================

async function updateResult(resultId) {

    const marks =
        document.getElementById(
            `marks-${resultId}`
        ).value;


    const grade =
        document.getElementById(
            `grade-${resultId}`
        ).value;


    try {

        const response =
            await fetch(
                `/results/${resultId}`,
                {

                    method: "PUT",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        marks,
                        grade
                    })
                }
            );


        const data =
            await response.json();


        const message =
            document.getElementById(
                "manageMessage"
            );


        message.innerText =
            data.message;


        if (data.success) {

            setTimeout(() => {
                showResults();
            }, 700);
        }


    } catch (error) {

        console.error(error);

        document.getElementById(
            "manageMessage"
        ).innerText =
            "Unable to connect to server";
    }
}


// ========================================
// DELETE RESULT
// ========================================

async function deleteResult(resultId) {

    if (
        !confirm(
            "Are you sure you want to delete this result?"
        )
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                `/results/${resultId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        alert(data.message);


        if (data.success) {

            showResults();

            loadStatistics();
        }


    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to server"
        );
    }
}


// ========================================
// LOGOUT
// ========================================

async function logout() {

    try {

        const response =
            await fetch(
                "/logout",
                {
                    method: "POST",
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (data.success) {

            window.location.href =
                "/login.html";
        }


    } catch (error) {

        console.error(error);

        alert("Logout failed");
    }
}


// ========================================
// LOAD DASHBOARD STATISTICS
// ========================================

async function loadStatistics() {

    try {

        const response =
            await fetch(
                "/statistics",
                {
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {
            return;
        }


        const studentCount =
            document.getElementById(
                "studentCount"
            );


        const resultCount =
            document.getElementById(
                "resultCount"
            );


        const courseCount =
            document.getElementById(
                "courseCount"
            );


        if (studentCount) {

            studentCount.innerText =
                data.students;
        }


        if (resultCount) {

            resultCount.innerText =
                data.results;
        }


        if (courseCount) {

            courseCount.innerText =
                data.courses;
        }


    } catch (error) {

        console.error(
            "Statistics error:",
            error
        );
    }
}


// ========================================
// START
// ========================================

checkLogin().then(loggedIn => {

    if (loggedIn) {
        loadStatistics();
    }

});