class ChakraSoundHealer {
    constructor() {
        this.audioContext = null;
        this.oscillators = {};
        this.gainNodes = {};
        this.masterGain = null;
        this.isInitialized = false;
        this.currentModalChakra = null;
        this.modalOpen = false;
        // Estado para arrastre vertical en el modal
        this.isDragging = false;
        this.dragStartY = 0;
        this.dragStartSliderValue = 0;
        // Estado de frecuencia sin input
        this.currentFrequencyOffset = 0; // en Hz relativos (-5..5)
        this.frequencyOffsetMin = -5;
        this.frequencyOffsetMax = 5;
        this.frequencyOffsetStep = 0.1;
        
        this.chakraData = {
            'crown': { frequency: 963, name: 'Corona', color: '#9B59B6' },
            'third-eye': { frequency: 852, name: 'Tercer Ojo', color: '#3498DB' },
            'throat': { frequency: 741, name: 'Garganta', color: '#2980B9' },
            'heart': { frequency: 639, name: 'Corazón', color: '#27AE60' },
            'solar-plexus': { frequency: 528, name: 'Plexo Solar', color: '#F1C40F' },
            'sacral': { frequency: 417, name: 'Sacro', color: '#E67E22' },
            'root': { frequency: 396, name: 'Raíz', color: '#E74C3C' }
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Inicializar Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Crear nodo de ganancia maestro
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.5; // Volumen inicial del 50%
            
            this.isInitialized = true;
            this.setupEventListeners();
            this.updateMasterVolume();
            
            console.log('Chakra Sound Healer inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar el audio:', error);
            this.showError('Error al inicializar el audio. Asegúrate de que tu navegador soporte Web Audio API.');
        }
    }
    
    setupEventListeners() {
        // Manejar clics en los iconos de chakras
        document.querySelectorAll('.chakra-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const chakra = e.currentTarget.dataset.chakra;
                this.openFrequencyModal(chakra);
            });
        });
        
        // Control de volumen maestro
        const masterVolumeSlider = document.querySelector('.master-volume-slider');
        masterVolumeSlider.addEventListener('input', (e) => {
            this.updateMasterVolume(e.target.value);
        });
        
        // Botón detener todo
        document.querySelector('.stop-all-btn').addEventListener('click', () => {
            this.stopAllChakras();
        });
        
        // Event listeners del modal
        this.setupModalEventListeners();
    }
    
    async toggleChakra(chakra) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        if (this.oscillators[chakra]) {
            this.stopChakra(chakra);
        } else {
            this.playChakra(chakra);
        }
    }
    
    playChakra(chakra) {
        if (!this.isInitialized || this.oscillators[chakra]) return;
        
        try {
            const frequency = this.chakraData[chakra].frequency;
            
            // Crear oscilador
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine'; // Onda senoidal suave
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // Crear nodo de ganancia para este chakra
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0.3; // Volumen inicial suave
            
            // Conectar: oscilador -> ganancia -> ganancia maestro -> salida
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            // Aplicar fade-in suave
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.5);
            
            // Iniciar oscilador
            oscillator.start();
            
            // Guardar referencias
            this.oscillators[chakra] = oscillator;
            this.gainNodes[chakra] = gainNode;
            
            // Actualizar UI
            this.updateChakraUI(chakra, true);
            
            console.log(`Reproduciendo chakra ${chakra} a ${frequency} Hz`);
            
        } catch (error) {
            console.error(`Error al reproducir chakra ${chakra}:`, error);
        }
    }
    
    stopChakra(chakra) {
        if (!this.oscillators[chakra]) return;
        
        try {
            const oscillator = this.oscillators[chakra];
            const gainNode = this.gainNodes[chakra];
            
            // Fade-out suave
            const currentTime = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.5);
            
            // Detener oscilador después del fade-out
            setTimeout(() => {
                oscillator.stop();
                oscillator.disconnect();
                gainNode.disconnect();
                
                delete this.oscillators[chakra];
                delete this.gainNodes[chakra];
            }, 500);
            
            // Actualizar UI
            this.updateChakraUI(chakra, false);
            
            console.log(`Deteniendo chakra ${chakra}`);
            
        } catch (error) {
            console.error(`Error al detener chakra ${chakra}:`, error);
        }
    }
    
    stopAllChakras() {
        Object.keys(this.oscillators).forEach(chakra => {
            this.stopChakra(chakra);
        });
    }
    
    
    updateMasterVolume(volume = null) {
        if (volume === null) {
            volume = document.querySelector('.master-volume-slider').value;
        }
        
        const normalizedVolume = volume / 100;
        this.masterGain.gain.setValueAtTime(normalizedVolume, this.audioContext.currentTime);
    }
    
    updateChakraUI(chakra, isPlaying) {
        const icon = document.querySelector(`[data-chakra="${chakra}"]`);
        
        if (isPlaying) {
            icon.classList.add('playing');
        } else {
            icon.classList.remove('playing');
        }
    }
    
    showError(message) {
        // Crear elemento de error temporal
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 1000;
            max-width: 300px;
            font-family: 'Inter', sans-serif;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    // Método para obtener información del estado actual
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            activeChakras: Object.keys(this.oscillators),
            masterVolume: this.masterGain ? this.masterGain.gain.value : 0
        };
    }
    
    // Métodos del modal
    setupModalEventListeners() {
        const modal = document.getElementById('frequencyModal');
        const modalContent = document.querySelector('.modal-content');
        
        // Cerrar modal al hacer clic fuera del contenido
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeFrequencyModal();
            }
        });
        
        // Cerrar modal con tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalOpen) {
                this.closeFrequencyModal();
            }
        });
        
        // (El control de frecuencia ahora se hace solo por arrastre vertical)
        
        // Botón done (Listo)
        const doneBtn = document.getElementById('doneBtn');
        doneBtn.addEventListener('click', () => {
            this.closeFrequencyModal();
        });

        // Arrastre vertical en modal-body para cambiar frecuencia
        const startDrag = (clientY) => {
            if (!this.modalOpen) return;
            this.isDragging = true;
            this.dragStartY = clientY;
            this.dragStartSliderValue = this.currentFrequencyOffset;
            if (modalContent) {
                modalContent.style.cursor = 'ns-resize';
                modalContent.style.userSelect = 'none';
            }
            // Iniciar sonido al mantener presionado
            this.playModalChakra();
        };

        const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

        const onMove = (clientY) => {
            if (!this.isDragging) return;
            const deltaY = this.dragStartY - clientY; // subir = positivo
            const sensitivity = 0.02; // ~0.02 Hz por px -> 50px = 1Hz
            const min = this.frequencyOffsetMin;
            const max = this.frequencyOffsetMax;
            let next = this.dragStartSliderValue + deltaY * sensitivity;
            // Respetar step 0.1 del slider
            next = Math.round(next * 10) / 10;
            next = clamp(next, min, max);
            if (this.oscillators[this.currentModalChakra]) {
                this.updateOscillatorFrequency(next);
            }
        };

        const endDrag = () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            if (modalContent) {
                modalContent.style.cursor = '';
                modalContent.style.userSelect = '';
            }
            // Detener sonido al soltar
            this.stopModalChakra();
        };

        if (modalContent) {
            // Mouse
            modalContent.addEventListener('mousedown', (e) => {
                const target = e.target;
                if (target && (target.id === 'doneBtn' || (target.closest && target.closest('#doneBtn')))) {
                    return; // No iniciar arrastre al hacer click en "Listo"
                }
                e.preventDefault();
                startDrag(e.clientY);
            });
            window.addEventListener('mousemove', (e) => onMove(e.clientY), { passive: true });
            window.addEventListener('mouseup', endDrag);

            // Touch
            modalContent.addEventListener('touchstart', (e) => {
                const target = e.target;
                if (target && (target.id === 'doneBtn' || (target.closest && target.closest('#doneBtn')))) {
                    return;
                }
                if (e.touches && e.touches.length > 0) {
                    startDrag(e.touches[0].clientY);
                }
            }, { passive: true });
            window.addEventListener('touchmove', (e) => {
                if (e.touches && e.touches.length > 0) {
                    // Evitar scroll durante el arrastre
                    if (this.isDragging) e.preventDefault();
                    onMove(e.touches[0].clientY);
                }
            }, { passive: false });
            window.addEventListener('touchend', endDrag);
            window.addEventListener('touchcancel', endDrag);
        }
    }
    
    openFrequencyModal(chakra) {
        this.currentModalChakra = chakra;
        this.modalOpen = true;
        
        const modal = document.getElementById('frequencyModal');
        
        // Configurar el contenido del modal
        this.currentFrequencyOffset = 0;
        
        // Aplicar tema del chakra
        modal.className = `frequency-modal show ${chakra}-theme`;
        
        // Mostrar modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    closeFrequencyModal() {
        const modal = document.getElementById('frequencyModal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
        this.modalOpen = false;
        this.currentModalChakra = null;
    }
    
    updateOscillatorFrequency(sliderValue) {
        const chakra = this.currentModalChakra;
        if (this.oscillators[chakra]) {
            const baseFrequency = this.chakraData[chakra].frequency;
            const newFrequency = baseFrequency + parseFloat(sliderValue);
            
            this.oscillators[chakra].frequency.setValueAtTime(
                newFrequency, 
                this.audioContext.currentTime
            );
            this.currentFrequencyOffset = parseFloat(sliderValue);
        }
    }
    
    toggleModalChakra() {
        if (!this.isInitialized) {
            this.init().then(() => {
                this.toggleModalChakra();
            });
            return;
        }
        
        const chakra = this.currentModalChakra;
        if (this.oscillators[chakra]) {
            this.stopChakra(chakra);
        } else {
            this.playModalChakra();
        }
    }
    
    playModalChakra() {
        const chakra = this.currentModalChakra;
        if (!this.isInitialized || this.oscillators[chakra]) return;
        
        try {
            const baseFrequency = this.chakraData[chakra].frequency;
            const frequency = baseFrequency + this.currentFrequencyOffset;
            
            // Crear oscilador
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // Crear nodo de ganancia
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0.3;
            
            // Conectar
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            // Fade-in suave
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.5);
            
            // Iniciar
            oscillator.start();
            
            // Guardar referencias
            this.oscillators[chakra] = oscillator;
            this.gainNodes[chakra] = gainNode;
            
            // Actualizar UI
            this.updateChakraUI(chakra, true);
            
            console.log(`Reproduciendo chakra ${chakra} a ${frequency} Hz`);
            
        } catch (error) {
            console.error(`Error al reproducir chakra ${chakra}:`, error);
        }
    }
    
    stopModalChakra() {
        const chakra = this.currentModalChakra;
        if (this.oscillators[chakra]) {
            this.stopChakra(chakra);
        }
    }
    
    updatePlayPauseButton(isPlaying) {
        // Eliminado: ya no hay botón de play/pause en el modal
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia global
    window.chakraHealer = new ChakraSoundHealer();
    
    // Agregar efectos visuales adicionales
    addVisualEffects();
});

// Función para agregar efectos visuales adicionales
function addVisualEffects() {
    // Efecto de partículas flotantes en el fondo
    createFloatingParticles();
    
    // Efecto de respiración en las tarjetas
    addBreathingEffect();
}

function createFloatingParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
    `;
    
    document.body.appendChild(particleContainer);
    
    // Crear partículas
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            animation: float ${5 + Math.random() * 10}s infinite linear;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
        `;
        
        particleContainer.appendChild(particle);
    }
    
    // Agregar animación CSS para las partículas
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

function addBreathingEffect() {
    const style = document.createElement('style');
    style.textContent = `
        .chakra-icon {
            animation: breathe 6s ease-in-out infinite;
        }
        
        @keyframes breathe {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.02);
            }
        }
        
        .chakra-icon.playing {
            animation: breathe 3s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);
}

// Función para manejar la interacción del usuario (requerida por algunos navegadores)
function enableAudio() {
    if (window.chakraHealer && !window.chakraHealer.isInitialized) {
        window.chakraHealer.init();
    }
}

// Agregar listener para el primer clic del usuario
document.addEventListener('click', enableAudio, { once: true });
document.addEventListener('touchstart', enableAudio, { once: true });