async function login() {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value.trim();

    const message =
        document.getElementById("message");


    if (username === "" || password === "") {

        message.innerText =
            "Please enter username and password";

        return;

    }


    try {

        const response = await fetch(
            "/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({

                    username: username,

                    password: password

                })
            }
        );


        const data =
            await response.json();


        if (data.success) {

            message.innerText =
                "Login successful!";


            setTimeout(() => {

                window.location.href =
                    "/dashboard.html";

            }, 500);


        } else {

            message.innerText =
                data.message;

        }


    } catch (error) {

        console.error(error);

        message.innerText =
            "Unable to connect to server";

    }

}