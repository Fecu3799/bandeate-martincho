const barra = document.querySelector(".navbar-collapse");
const cierre = new bootstrap.Collapse(barra, {
    toggle: false
});
const botones = document.querySelectorAll("a[data-ancla]");
const navegar = function (evento) {
    evento.preventDefault();
    let freno = this.getAttribute("data-ancla");
    freno = parseInt(freno);
    const seccionApuntada = this.hash;
    if (barra.classList.contains('show')) {
        cierre.toggle()
        barra.addEventListener("hidden.bs.collapse", function () {        
            let distancia = document.querySelector(seccionApuntada).offsetTop;
            if (isNaN(freno)) {
                freno = parseInt(0);
            };
            if (seccionApuntada.length != 0) {
                distancia = distancia - freno;
                scroll({
                    top: distancia,
                    behavior: "smooth"
                });
            }
        });
    }else{
        let distancia = document.querySelector(seccionApuntada).offsetTop;
        if (isNaN(freno)) {
            freno = parseInt(0);
        };
        if (seccionApuntada.length != 0) {
            distancia = distancia - freno;
            scroll({
                top: distancia,
                behavior: "smooth"
            });
        }
    }    
}
botones.forEach(boton => {
    boton.addEventListener("click", navegar);
});