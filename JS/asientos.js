let selectedSeats = [];
let reservedSeats = [];

// Función para obtener los detalles de la función desde la API
async function fetchShowtimeDetails(theatreId, auditoriumId, showtimeId) {
    try {
        const response = await fetch(`https://cinexunidos-production.up.railway.app/theatres/${theatreId}/auditoriums/${auditoriumId}/showtimes/${showtimeId}`);
        if (!response.ok) throw new Error('Error al obtener los detalles de la función');
        const showtimeDetails = await response.json();
        return showtimeDetails;
    } catch (error) {
        console.error('Error al obtener la información:', error);
        return null;
    }
}

// Función para mostrar los detalles de la película en la página
function displayMovieDetails(movieDetails) {
    const movieDetailsSection = document.getElementById('movie-details');
    movieDetailsSection.innerHTML = `
        <h2>${movieDetails.movie.name}</h2>
        <img src="https://cinexunidos-production.up.railway.app/${movieDetails.movie.poster}" alt="${movieDetails.movie.name}" class="movie-poster">
        <p><strong>Duración:</strong> ${movieDetails.movie.runningTime}</p>
        <p><strong>Clasificación:</strong> ${movieDetails.movie.rating}</p>
    `;
}

// Función para mostrar el mapa de asientos en la página
function displaySeatMap(seats) {
    const seatMapSection = document.getElementById('seat-map');
    seatMapSection.innerHTML = '';

    const seatMap = document.createElement('div');
    seatMap.className = 'seat-map';

    const seatLabelsContainer = document.createElement('div');
    seatLabelsContainer.className = 'seat-row seat-labels';

    // Obtener la cantidad máxima de columnas
    const firstRow = Object.keys(seats)[0];
    const numColumns = seats[firstRow].length;

    // Agregar etiquetas de columna
    const columnHeader = document.createElement('span');
    columnHeader.className = 'seat-label';
    columnHeader.textContent = ' ';
    seatLabelsContainer.appendChild(columnHeader);

    for (let i = 0; i < numColumns; i++) {
        const seatLabel = document.createElement('span');
        seatLabel.className = 'seat-label';
        seatLabel.textContent = i;
        seatLabelsContainer.appendChild(seatLabel);
    }

    seatMap.appendChild(seatLabelsContainer);

    // Agregar filas y asientos
    Object.keys(seats).forEach(rowKey => {
        const rowContainer = document.createElement('div');
        rowContainer.className = 'seat-row';

        const rowLabel = document.createElement('span');
        rowLabel.className = 'seat-label';
        rowLabel.textContent = rowKey;
        rowContainer.appendChild(rowLabel);

        seats[rowKey].forEach((seat, index) => {
            const seatElement = document.createElement('div');
            seatElement.className = getSeatClass(seat);
            seatElement.dataset.seatId = `${rowKey}${index}`;
            seatElement.addEventListener('click', () => toggleSeatSelection(seatElement, rowKey, index));

            rowContainer.appendChild(seatElement);
        });

        seatMap.appendChild(rowContainer);
    });

    seatMapSection.appendChild(seatMap);
}

// Función para obtener la clase del asiento basado en su estado
function getSeatClass(seatStatus) {
    switch (seatStatus) {
        case -1:
            return 'seat seat-empty';
        case 0:
            return 'seat seat-free';
        case 1:
            return 'seat seat-preselected';
        case 2:
            return 'seat seat-occupied';
        default:
            return 'seat';
    }
}

// Función para reservar un asiento
async function reserveSeat(theatreId, auditoriumId, showtimeId, seat) {
    try {
        const response = await fetch(`https://cinexunidos-production.up.railway.app/theatres/${theatreId}/auditoriums/${auditoriumId}/showtimes/${showtimeId}/reserve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ seat })
        });
        if (!response.ok) throw new Error('Error al reservar el asiento');
        return true;
    } catch (error) {
        console.error('Error al reservar el asiento:', error);
        return false;
    }
}

// Función para cancelar la reserva de un asiento
async function cancelReservation(theatreId, auditoriumId, showtimeId, seat) {
    try {
        const response = await fetch(`https://cinexunidos-production.up.railway.app/theatres/${theatreId}/auditoriums/${auditoriumId}/showtimes/${showtimeId}/reserve`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ seat })
        });
        if (!response.ok) throw new Error('Error al cancelar la reservación del asiento');
        return true;
    } catch (error) {
        console.error('Error al cancelar la reservación del asiento:', error);
        return false;
    }
}

async function toggleSeatSelection(seatElement, rowKey, seatIndex) {
    const seatId = `${rowKey}${seatIndex}`;
    const params = new URLSearchParams(window.location.search);
    const theatreId = params.get('theatreId');
    const auditoriumId = params.get('auditoriumId');
    const showtimeId = params.get('showtimeId');

    // Obtener el estado actual del asiento (0, 1, 2, etc.)
    const seatStatus = getSeatStatus(seatElement);

    if (seatStatus === 0) { // Asiento libre y disponible para selección
        seatElement.classList.remove('seat-free');
        seatElement.classList.add('seat-selected');
        selectedSeats.push(seatId);
        updateOtherWindows(seatId, 1); // Notificar a otras ventanas sobre la selección
        saveSelectedSeats(); // Guardar los asientos seleccionados en localStorage
    } else if (seatStatus === 1) { // Asiento preseleccionado, deselección
        seatElement.classList.remove('seat-preselected'); // Cambiar de amarillo a gris
        seatElement.classList.remove('seat-selected'); // Desmarcar el color amarillo si está seleccionado
        seatElement.classList.add('seat-free');
        selectedSeats = selectedSeats.filter(seat => seat !== seatId);
        updateOtherWindows(seatId, 0); // Notificar a otras ventanas sobre la deselección
        saveSelectedSeats(); // Guardar los asientos seleccionados en localStorage
    } else if (seatStatus === 2) { // Asiento ocupado, no se puede seleccionar
        alert('Este asiento está ocupado y no puede ser seleccionado.');
    }
}

// Función para guardar los asientos seleccionados en localStorage
function saveSelectedSeats() {
    localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
}

// Función para obtener el estado del asiento basado en su clase
function getSeatStatus(seatElement) {
    if (seatElement.classList.contains('seat-free')) {
        return 0; // Asiento libre
    } else if (seatElement.classList.contains('seat-preselected') || seatElement.classList.contains('seat-selected')) {
        return 1; // Asiento preseleccionado o seleccionado
    } else if (seatElement.classList.contains('seat-occupied')) {
        return 2; // Asiento ocupado
    } else {
        return -1; // Otro estado desconocido
    }
}

// Función para actualizar la interfaz en otras ventanas
function updateOtherWindows(seatId, status) {
    const message = JSON.stringify({ seatId, status });
    localStorage.setItem('seat-update', message);
}

// Función para recibir actualizaciones de otras ventanas
function receiveSeatUpdates() {
    window.addEventListener('storage', (event) => {
        if (event.key === 'seat-update') {
            const { seatId, status } = JSON.parse(event.newValue);
            const seatElement = document.querySelector(`.seat[data-seat-id="${seatId}"]`);
            if (seatElement) {
                seatElement.className = getSeatClass(status);
            }
        }
    });
}

document.querySelector('.boton.reservar').addEventListener('click', async (event) => {
    event.preventDefault();
    if (selectedSeats.length === 0) {
        alert('Por favor, seleccione al menos un asiento.');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const theatreId = params.get('theatreId');
    const auditoriumId = params.get('auditoriumId');
    const showtimeId = params.get('showtimeId');

    let allSuccessful = true;
    for (const seat of selectedSeats) {
        const success = await reserveSeat(theatreId, auditoriumId, showtimeId, seat);
        if (!success) {
            allSuccessful = false;
            break;
        }
        reservedSeats.push(seat);
    }

    if (allSuccessful) {
        alert('Asientos reservados exitosamente.');
        selectedSeats = [];
        // Redirigir a index.html
        window.location.href = 'index.html';
    } else {
        alert('Hubo un problema al reservar uno o más asientos.');
        const showtimeDetails = await fetchShowtimeDetails(theatreId, auditoriumId, showtimeId);
        if (showtimeDetails) {
            displaySeatMap(showtimeDetails.seats);
            selectedSeats = [];
        }
    }
});
/*
document.querySelector('.boton.cancelar').addEventListener('click', async (event) => {
    event.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const theatreId = params.get('theatreId');
    const auditoriumId = params.get('auditoriumId');
    const showtimeId = params.get('showtimeId');

    let allSuccessful = true;
    for (const seat of reservedSeats) {
        const success = await cancelReservation(theatreId, auditoriumId, showtimeId, seat);
        if (!success) {
            allSuccessful = false;
            break;
        }
    }

    if (allSuccessful) {
        alert('Reservación cancelada exitosamente.');
        reservedSeats = [];
        localStorage.removeItem('selectedSeats'); // Eliminar los asientos seleccionados del localStorage
        const showtimeDetails = await fetchShowtimeDetails(theatreId, auditoriumId, showtimeId);
        if (showtimeDetails) {
            displaySeatMap(showtimeDetails.seats);
        }
    } else {
        alert('Hubo un problema al cancelar la reservación.');
        const showtimeDetails = await fetchShowtimeDetails(theatreId, auditoriumId, showtimeId);
        if (showtimeDetails) {
            displaySeatMap(showtimeDetails.seats);
            reservedSeats = [];
        }
    }
});
*/

function initSSE(theatreId, auditoriumId, showtimeId) {
    const eventSource = new EventSource(`https://cinexunidos-production.up.railway.app/theatres/${theatreId}/auditoriums/${auditoriumId}/showtimes/${showtimeId}/reservation-updates`);

    eventSource.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.result === 'SEAT_RESERVED' || data.result === 'SEAT_RELEASED') {
            const showtimeDetails = await fetchShowtimeDetails(theatreId, auditoriumId, showtimeId);
            if (showtimeDetails) {
                displaySeatMap(showtimeDetails.seats);
            }
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        setTimeout(() => initSSE(theatreId, auditoriumId, showtimeId), 5000);
    };
}

// Función de inicialización
async function init() {
    const params = new URLSearchParams(window.location.search);
    const theatreId = params.get('theatreId');
    const auditoriumId = params.get('auditoriumId');
    const showtimeId = params.get('showtimeId');

    if (!theatreId || !auditoriumId || !showtimeId) {
        console.error('No se proporcionaron todos los parámetros necesarios');
        return;
    }

    const showtimeDetails = await fetchShowtimeDetails(theatreId, auditoriumId, showtimeId);
    if (showtimeDetails) {
        displayMovieDetails(showtimeDetails);
        displaySeatMap(showtimeDetails.seats);
        initSSE(theatreId, auditoriumId, showtimeId);

        // Restaurar los asientos seleccionados desde localStorage
        const savedSeats = localStorage.getItem('selectedSeats');
        if (savedSeats) {
            selectedSeats = JSON.parse(savedSeats);
            selectedSeats.forEach(seatId => {
                const seatElement = document.querySelector(`.seat[data-seat-id="${seatId}"]`);
                if (seatElement) {
                    const seatStatus = getSeatStatus(seatElement);
                    // Dependiendo de si el asiento fue seleccionado en esta ventana o no
                    if (seatStatus === 1) {
                        seatElement.classList.add('seat-selected');
                    } else if (seatStatus === 0) {
                        seatElement.classList.add('seat-preselected');
                    }
                }
            });
        }
    }

    receiveSeatUpdates(); // Configurar el escuchador para actualizaciones de asientos de otras ventanas
}

// Evento que se ejecuta cuando el DOM se carga completamente
document.addEventListener('DOMContentLoaded', init);