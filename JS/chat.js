const $chatElement = document.getElementById('chat');
const $messageInput = document.getElementById('messageInput');

let usuario = '';
let socket;

function generarNombre() {
    const numero = Math.floor(Math.random() * 100000);
    return `usuario${numero}`;
}

function conectar() {
    usuario = localStorage.getItem('name') || generarNombre();
    localStorage.setItem('name', usuario);

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
    const mensaje = $messageInput.value.trim();
    if (mensaje.length > 0 && mensaje.length <= 255) {
        socket.emit('send-message', mensaje);
        $messageInput.value = '';
    } else if (mensaje.length > 255) {
        alert('El mensaje no puede tener más de 255 caracteres.');
    }
}

function mostrarMensaje(payload) {
    const { message, name } = payload;
    const $divElement = document.createElement('div');
    $divElement.classList.add('message');
    $divElement.classList.add(name === usuario ? 'outgoing' : 'incoming');
    $divElement.innerHTML = `<small>${name}</small><p>${message}</p>`;
    $chatElement.appendChild($divElement);
    $chatElement.scrollTop = $chatElement.scrollHeight;
}

window.addEventListener('beforeunload', () => {
    localStorage.removeItem('name');
    socket.close();
});

document.querySelector('button[onclick="sendMessage()"]').addEventListener('click', enviarMensaje);

$messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        enviarMensaje();
    }
});

conectar();