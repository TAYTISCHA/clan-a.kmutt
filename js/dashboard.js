function toggleSidebar(){

    document
      .getElementById("sidebar")
      .classList
      .toggle("active");
}

function logout(){

    localStorage.clear();

    window.location.href =
      "index.html";
}
