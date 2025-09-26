class ChakraSoundHealer {
    constructor() {
        this.audioContext = null;
        this.oscillators = {};
        this.gainNodes = {};
        this.masterGain = null;
        this.isInitialized = false;
        
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
                this.toggleChakra(chakra);
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