async function login(){

    const student_id =
        document.getElementById("student_id").value;

    const family =
        document.getElementById("family").value;

    const secret_code =
        document.getElementById("secret_code").value;

    const response = await fetch(WEBAPP_URL,{

        method:"POST",

        body:JSON.stringify({

            action:"login",

            student_id,

            family,

            secret_code
        })
    });

    const data = await response.json();

    if(data.status === "success"){

        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );

        window.location.href =
            "dashboard.html";

    }else{

        alert("ข้อมูลไม่ถูกต้อง");
    }
}
