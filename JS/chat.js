const $chat = document.getElementById('chat');
const $mensajeAEnviar = document.getElementById('entrada-mensaje');
const $btnEnviar = document.getElementById('boton-enviar');
const $displayUsuario = document.getElementById('usuario-nombre');
const $ultimaConexion = document.getElementById('ultimo-visto');
const $imagenDeUsuario = document.getElementById('usuario-foto');
const feedback = document.getElementById('feedback');


let usuario = '';
let socket;
let identificador = 'chatWeb';

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

    socket.on('online-users', (users) => {
        feedback.innerHTML = `<p>Usuarios en línea: ${users.length}</p>`;
    });
    
}

function enviarMensaje() {
    const mensaje = $mensajeAEnviar.value.trim()+ identificador;
    if (mensaje.length > 0 && mensaje.length <= 255) {
        socket.emit('send-message', mensaje);
        $mensajeAEnviar.value = '';
    } else if (mensaje.length > 255) {
        alert('El mensaje no puede tener más de 255 caracteres.');
    }
}

function mostrarMensaje(payload) {
    const { message, name } = payload;
    // Verifica si el mensaje contiene el identificador
    if (message.includes(identificador)) {
      // Quita el identificador del mensaje
      const mensajeSinIdentificador = message.replace(identificador, '');
      // Crea el elemento HTML para mostrar el mensaje
      const $divElement = document.createElement('div');
      $divElement.classList.add('mensaje');
      $divElement.classList.add(name === usuario ? 'saliente' : 'entrante');
      $divElement.innerHTML = `<small>${name}</small><p>${mensajeSinIdentificador}</p>`;
      $chat.appendChild($divElement);
      $chat.scrollTop = $chat.scrollHeight;
    } else {
      // El mensaje no contiene el identificador
      console.log('Mensaje sin identificador:', message);
    }
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