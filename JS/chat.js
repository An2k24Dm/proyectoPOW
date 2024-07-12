const $chat = document.getElementById('chat');
const $mensajeAEnviar = document.getElementById('entrada-mensaje');
const $btnEnviar = document.getElementById('boton-enviar');
const $displayUsuario = document.getElementById('usuario-nombre');
const $ultimaConexion = document.getElementById('ultimo-visto');
const $imagenDeUsuario = document.getElementById('usuario-foto');

let usuario = '';
let socket;

function generarNombre() {
    const numero = Math.floor(Math.random() * 100000);
    return `usuario${numero}`;
}

function obtenerHora() {
    const ahora = new Date();
    const venezuela = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    const format = venezuela.toLocaleTimeString('es-VE', options);
    return `Hoy a las ${format}`;
}

function conectar() {
    usuario = localStorage.getItem('name') || generarNombre();
    localStorage.setItem('name', usuario);
    $displayUsuario.textContent = usuario;
    $ultimaConexion.innerHTML = obtenerHora();
    $imagenDeUsuario.innerHTML = `<img src="https://api.dicebear.com/9.x/initials/svg?seed=${usuario}" alt="${usuario}" />`;

    socket = io('https://cinexunidos-production.up.railway.app', {
        auth: { name: usuario }
    });

    socket.on('connect', () => {
        console.log('Conectado');
    });

    socket.on('disconnect', () => {
        console.log('Desconectado');
    });

    socket.on('new-message', mostrarMensaje);
}

function enviarMensaje() {
    const mensaje = $mensajeAEnviar.value.trim();
    if (mensaje.length > 0 && mensaje.length <= 255) {
        socket.emit('send-message', mensaje);
        $mensajeAEnviar.value = '';
    } else if (mensaje.length > 255) {
        alert('El mensaje no puede tener más de 255 caracteres.');
    }
}

function mostrarMensaje(payload) {
    const { message, name } = payload;
    const $divElement = document.createElement('div');
    $divElement.classList.add('mensaje');
    $divElement.classList.add(name === usuario ? 'saliente' : 'entrante');
    $divElement.innerHTML = `<small>${name}</small><p>${message}</p>`;
    $chat.appendChild($divElement);
    $chat.scrollTop = $chat.scrollHeight;
}

window.addEventListener('beforeunload', () => {
    localStorage.removeItem('name');
    socket.close();
});

$btnEnviar.addEventListener('click', (event) => {
    event.preventDefault();
    enviarMensaje();
});

$mensajeAEnviar.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        enviarMensaje();
    }
});

conectar();