// ========================================
// SEARCH STUDENT RESULT
// ========================================

async function searchResult() {

    const regNo = document.getElementById("regNo").value.trim();

    const message = document.getElementById("message");
    const resultSection = document.getElementById("resultSection");
    const resultTable = document.getElementById("resultTable");

    // ========================================
    // VALIDATE REGISTRATION NUMBER
    // ========================================

    if (regNo === "") {

        message.innerText =
            "Please enter registration number";

        resultSection.style.display = "none";

        return;
    }


    try {

        // ========================================
        // CALL RESULT API
        // ========================================

        const response = await fetch(
            `http://localhost:5000/result/${encodeURIComponent(regNo)}`,
            {
                credentials: "include"
            }
        );


        const data = await response.json();


        console.log(
            "Result API response:",
            data
        );


        // ========================================
        // CHECK API RESPONSE
        // ========================================

        if (!response.ok || !data.success) {

            message.innerText =
                data.message ||
                "Student result not found";

            resultSection.style.display = "none";

            return;
        }


        // Clear error message

        message.innerText = "";


        // ========================================
        // SHOW RESULT SECTION
        // ========================================

        resultSection.style.display = "block";


        // ========================================
        // STUDENT DETAILS
        // ========================================

        document.getElementById(
            "studentReg"
        ).innerText =
            data.student.reg_no;


        document.getElementById(
            "studentName"
        ).innerText =
            data.student.name;


        document.getElementById(
            "studentDepartment"
        ).innerText =
            data.student.department;


        document.getElementById(
            "studentSemester"
        ).innerText =
            data.student.semester;


        // ========================================
        // CLEAR OLD RESULT TABLE
        // ========================================

        resultTable.innerHTML = "";


        // ========================================
        // DISPLAY COURSE RESULTS
        // ========================================

        data.results.forEach(row => {

            const tr =
                document.createElement("tr");


            tr.innerHTML = `

                <td>
                    ${row.course_code}
                </td>

                <td>
                    ${row.course_name}
                </td>

                <td>
                    ${row.credits}
                </td>

                <td>
                    ${row.marks}
                </td>

                <td>
                    ${row.grade}
                </td>

                <td>
                    ${Number(row.grade_point).toFixed(2)}
                </td>

            `;


            resultTable.appendChild(tr);

        });


        // ========================================
        // DISPLAY SGPA
        // ========================================

        document.getElementById(
            "sgpa"
        ).innerText =
            Number(data.sgpa).toFixed(2);


        // ========================================
        // DISPLAY CGPA
        // ========================================

        const cgpaElement =
            document.getElementById("cgpa");


        if (cgpaElement) {

            cgpaElement.innerText =
                Number(data.cgpa).toFixed(2);

        }


    } catch (error) {

        console.error(
            "Result error:",
            error
        );


        message.innerText =
            "Unable to connect to server";


        resultSection.style.display =
            "none";

    }

}