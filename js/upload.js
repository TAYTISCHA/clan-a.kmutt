async function uploadFile(){

    const year =
        document.getElementById("year").value;

    const semester =
        document.getElementById("semester").value;

    const subject =
        document.getElementById("subject").value;

    const file =
        document.getElementById("file").files[0];

    if(!file){

        alert("กรุณาเลือกไฟล์");

        return;
    }

    const reader = new FileReader();

    reader.onload = async function(){

        const base64 =
            reader.result.split(",")[1];

        const response = await fetch(
            WEBAPP_URL,
            {
                method:"POST",

                body:JSON.stringify({

                    action:"upload",

                    family:user.family,

                    year,

                    semester,

                    subject,

                    filename:file.name,

                    mimeType:file.type,

                    file:base64
                })
            }
        );

        const data = await response.json();

        alert(data.message);

        loadFiles();
    }

    reader.readAsDataURL(file);
}
