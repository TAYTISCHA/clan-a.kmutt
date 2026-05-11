const user =
    JSON.parse(localStorage.getItem("user"));

if(!user){

    window.location.href = "index.html";
}

function logout(){

    localStorage.removeItem("user");

    window.location.href = "index.html";
}

loadFiles();

async function loadFiles(){

    const response = await fetch(WEBAPP_URL,{

        method:"POST",

        body:JSON.stringify({

            action:"getFiles",

            family:user.family
        })
    });

    const data = await response.json();

    let html = "";

    data.files.forEach(file=>{

        html += `

        <div class="file-card">

            <h3>${file.name}</h3>

            <a href="${file.url}"
               target="_blank">

               เปิดไฟล์

            </a>

        </div>
        `;
    });

    document.getElementById("file-list")
        .innerHTML = html;
}
