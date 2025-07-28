class VoiceChatbotApp {
    constructor() {
        this.videoElement = document.getElementById('videoElement');
        this.micButton = document.getElementById('micButton');
        this.statusText = document.getElementById('statusText');
        this.volumeBar = document.getElementById('volumeBar');
        this.transcriptContent = document.getElementById('transcriptContent');
        this.transcriptInput = document.getElementById('transcriptInput');
        this.chatMessages = document.getElementById('chatMessages');
        this.permissionStatus = document.getElementById('permissionStatus');

        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.recognition = null;
        this.currentTranscript = '';
        this.finalTranscript = '';
        this.autoSendTimeout = null;
        this.audioStream = null;
        this.microphonePermissionGranted = false;
        this.recognitionRestartCount = 0;
        this.maxRestartAttempts = 3;

        // Video toggle properties
        this.videoToggle = null;

        this.init();
        this.setupEventListeners();
    }

    init() {
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'id-ID';

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                // Reset restart count on successful result
                this.recognitionRestartCount = 0;

                // Process all results from the beginning to get complete transcript
                for (let i = 0; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                // Update accumulated final transcript
                if (finalTranscript.trim()) {
                    const newFinalText = finalTranscript.trim();
                    if (!this.finalTranscript.includes(newFinalText)) {
                        this.finalTranscript += (this.finalTranscript ? ' ' : '') + newFinalText;
                    }
                }

                // Display accumulated final transcript + current interim
                const displayText = this.finalTranscript + 
                    (this.finalTranscript && interimTranscript ? ' ' : '') +
                    (interimTranscript ? '<span style="color: #666; font-style: italic;">' + interimTranscript + '</span>' : '');
                
                if (displayText.trim()) {
                    this.transcriptContent.innerHTML = displayText;
                    this.transcriptContent.classList.remove('empty');
                    this.transcriptInput.classList.add('has-content');
                    document.getElementById('sendTranscript').disabled = false;
                } else {
                    this.transcriptContent.innerHTML = 'Mendengarkan...';
                    this.transcriptContent.classList.add('empty');
                }
            };

            this.recognition.onstart = () => {
                this.statusText.textContent = 'Mendengarkan...';
                this.transcriptInput.classList.add('listening');
                this.micButton.disabled = false;
            };

            this.recognition.onend = () => {
                this.transcriptInput.classList.remove('listening');
                
                if (this.isRecording && this.recognitionRestartCount < this.maxRestartAttempts) {
                    // Only restart if we're still supposed to be recording
                    this.recognitionRestartCount++;
                    setTimeout(() => {
                        if (this.isRecording && this.recognition) {
                            try {
                                this.recognition.start();
                            } catch (error) {
                                console.log('Recognition restart error:', error);
                                if (this.recognitionRestartCount >= this.maxRestartAttempts) {
                                    this.stopRecording();
                                    this.showError('Speech recognition stopped after multiple attempts. Please try again.');
                                }
                            }
                        }
                    }, 100);
                } else if (this.recognitionRestartCount >= this.maxRestartAttempts) {
                    this.statusText.textContent = 'Recognition limit reached. Please restart.';
                    this.stopRecording();
                } else {
                    this.statusText.textContent = 'Berhenti mendengarkan';
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                
                // Handle different types of errors
                switch(event.error) {
                    case 'not-allowed':
                        this.statusText.textContent = 'Mikrofon ditolak. Silakan berikan izin.';
                        this.microphonePermissionGranted = false;
                        break;
                    case 'no-speech':
                        this.statusText.textContent = 'Tidak ada suara terdeteksi';
                        break;
                    case 'audio-capture':
                        this.statusText.textContent = 'Audio tidak dapat diakses';
                        break;
                    case 'network':
                        this.statusText.textContent = 'Error jaringan';
                        break;
                    default:
                        this.statusText.textContent = 'Error: ' + event.error;
                }
                
                // Stop recording on critical errors
                if (['not-allowed', 'audio-capture'].includes(event.error)) {
                    this.stopRecording();
                }
            };
        } else {
            this.statusText.textContent = 'Speech Recognition tidak didukung browser ini';
            this.micButton.disabled = true;
        }
    }

    setupEventListeners() {
        // Initialize video toggle
        this.videoToggle = new VideoToggle('videoElement', 'videoToggle');

        // Microphone controls
        this.micButton.addEventListener('click', () => this.toggleRecording());

        // Transcript controls
        document.getElementById('clearTranscript').addEventListener('click', () => this.clearTranscript());
        document.getElementById('sendTranscript').addEventListener('click', () => this.sendCurrentTranscript());

        // Chat controls
        document.getElementById('clearChat').addEventListener('click', () => this.clearChat());
        document.getElementById('sendManual').addEventListener('click', () => this.sendManualMessage());
    }

    async requestMicrophonePermission() {
        try {
            // First, check if we already have a stream
            if (this.audioStream) {
                return true;
            }

            this.statusText.textContent = 'Meminta izin mikrofon...';
            this.micButton.disabled = true;

            // Request microphone access
            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });

            // Setup audio analysis for volume indicator
            this.setupAudioAnalysis();
            
            this.microphonePermissionGranted = true;
            this.permissionStatus.textContent = '✅ Mikrofon siap digunakan';
            this.permissionStatus.style.display = 'block';
            this.statusText.textContent = 'Mikrofon siap. Klik untuk mulai merekam.';
            this.micButton.disabled = false;
            
            return true;
        } catch (error) {
            console.error('Microphone permission error:', error);
            this.microphonePermissionGranted = false;
            this.micButton.disabled = false;
            
            if (error.name === 'NotAllowedError') {
                this.statusText.textContent = 'Izin mikrofon ditolak. Refresh halaman dan coba lagi.';
                this.showError('Mikrofon ditolak. Silakan refresh halaman dan berikan izin mikrofon.');
            } else {
                this.statusText.textContent = 'Error mengakses mikrofon: ' + error.message;
                this.showError('Gagal mengakses mikrofon: ' + error.message);
            }
            
            return false;
        }
    }

    setupAudioAnalysis() {
        if (!this.audioStream) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(this.audioStream);
            this.microphone.connect(this.analyser);
            this.analyser.fftSize = 256;
        } catch (error) {
            console.error('Audio analysis setup error:', error);
        }
    }

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    async startRecording() {
        // Request microphone permission if not already granted
        if (!this.microphonePermissionGranted || !this.audioStream) {
            const permissionGranted = await this.requestMicrophonePermission();
            if (!permissionGranted) {
                return;
            }
        }

        try {
            // Resume audio context if suspended
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.isRecording = true;
            this.recognitionRestartCount = 0;
            this.micButton.classList.add('recording');
            this.micButton.textContent = '🔴';
            this.statusText.textContent = 'Merekam...';

            // Start speech recognition
            if (this.recognition) {
                try {
                    this.recognition.start();
                } catch (error) {
                    if (error.name !== 'InvalidStateError') {
                        console.error('Speech recognition start error:', error);
                        this.showError('Gagal memulai speech recognition: ' + error.message);
                    }
                }
            }

            // Start volume monitoring
            this.monitorVolume();

        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Gagal memulai perekaman: ' + error.message);
            this.stopRecording();
        }
    }

    stopRecording() {
        this.isRecording = false;
        this.recognitionRestartCount = 0;
        this.micButton.classList.remove('recording');
        this.micButton.textContent = '🎤';
        this.statusText.textContent = 'Berhenti merekam';

        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.log('Recognition stop error (normal):', error);
            }
        }

        // Reset volume indicator
        this.volumeBar.style.width = '0%';

        // Clear any pending auto-send timeout
        if (this.autoSendTimeout) {
            clearTimeout(this.autoSendTimeout);
            this.autoSendTimeout = null;
        }
    }

    monitorVolume() {
        if (!this.isRecording || !this.analyser) return;

        try {
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            this.analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const volume = Math.min((average / 255) * 100, 100);

            this.volumeBar.style.width = volume + '%';

            if (this.isRecording) {
                requestAnimationFrame(() => this.monitorVolume());
            }
        } catch (error) {
            console.error('Volume monitoring error:', error);
        }
    }

    resetTranscript() {
        this.finalTranscript = '';
        this.currentTranscript = '';
        this.transcriptContent.innerHTML = 'Mulai berbicara untuk melihat transcript di sini...';
        this.transcriptContent.classList.add('empty');
        this.transcriptInput.classList.remove('has-content');
        document.getElementById('sendTranscript').disabled = true;
        if (this.autoSendTimeout) {
            clearTimeout(this.autoSendTimeout);
            this.autoSendTimeout = null;
        }
    }

    clearTranscript() {
        this.resetTranscript();
    }

    sendCurrentTranscript() {
        // Ambil teks dari transcript content dan bersihkan dari HTML tags
        const transcriptText = this.transcriptContent.textContent || this.transcriptContent.innerText || '';
        const cleanText = transcriptText.trim();
        
        // Jika ada teks yang valid, kirim ke chatbot
        if (cleanText && cleanText !== 'Mulai berbicara untuk melihat transcript di sini...' && cleanText !== 'Mendengarkan...') {
            console.log('Sending transcript:', cleanText); // Debug log
            this.sendToChatbot(cleanText);
        } else {
            // Jika tidak ada teks valid, coba kirim finalTranscript
            if (this.finalTranscript.trim()) {
                console.log('Sending final transcript:', this.finalTranscript.trim()); // Debug log
                this.sendToChatbot(this.finalTranscript.trim());
            } else {
                this.showError('Tidak ada teks untuk dikirim. Silakan rekam pesan terlebih dahulu.');
                return;
            }
        }
    }

    async sendToChatbot(message) {
        if (!message.trim()) {
            this.showError('Pesan tidak boleh kosong.');
            return;
        }

        console.log('Sending message to chatbot:', message); // Debug log

        // Tambahkan pesan user ke chat
        const userMessageId = this.addMessage(message, 'user');

        // Tampilkan indikator "bot sedang mengetik..."
        const typingId = this.addMessage('Bot sedang mengetik...', 'bot typing');

        try {
            // Dapatkan respons dari Flowise atau fallback
            // FIXED: Changed from generateBotMessage(message) to this.generateBotMessage(message)
            const response = await this.generateBotMessage(message);

            // Hapus indikator mengetik
            this.removeMessage(typingId);

            // Tambahkan pesan bot ke chat
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error("Gagal mengirim pesan ke chatbot:", error);
            this.removeMessage(typingId);
            this.addMessage("Terjadi kesalahan saat menghubungi chatbot.", 'bot');
        }

        // Kosongkan input/area transcript setelah mengirim
        this.resetTranscript();
    }

    async generateBotMessage(userMessage) {
        const fallbackResponse = `Mohon maaf saya tidak mengerti maksud Anda: "${userMessage}". Silahkan coba lagi.`;

        try {
            const response = await fetch(
                "https://cloud.flowiseai.com/api/v1/prediction/dd37bb27-a373-4d36-8be7-96b2e6744357",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                        // Tambahkan Authorization jika API kamu butuh: 
                        // "Authorization": "Bearer YOUR_API_KEY"
                    },
                    body: JSON.stringify({ question: userMessage })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Flowise API response:', result); // Debug log

            // Pastikan sesuai dengan format hasil API kamu
            // Check multiple possible response formats
            if (result.text) {
                return result.text;
            } else if (result.answer) {
                return result.answer;
            } else if (result.response) {
                return result.response;
            } else if (typeof result === 'string') {
                return result;
            } else {
                console.warn('Unexpected API response format:', result);
                return JSON.stringify(result);
            }
        } catch (error) {
            console.warn("Gagal menghubungi Flowise:", error);
            return fallbackResponse;
        }
    }

    addMessage(text, type) {
        // Create unique ID with timestamp and random number to avoid collisions
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.id = messageId;
        messageDiv.innerHTML = text;
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        console.log('Added message with ID:', messageId, 'Type:', type); // Debug log
        
        return messageId;
    }

    removeMessage(messageId) {
        console.log('Attempting to remove message with ID:', messageId); // Debug log
        const element = document.getElementById(messageId);
        if (element) {
            console.log('Removing element:', element.textContent); // Debug log
            element.remove();
        } else {
            console.log('Element not found for ID:', messageId); // Debug log
        }
    }

    clearChat() {
        this.chatMessages.innerHTML = `
            <div class="message bot">
                Chat telah dibersihkan. Ayo mulai percakapan baru!
            </div>
        `;
    }

    sendManualMessage() {
        const message = prompt('Masukkan pesan manual:');
        if (message && message.trim()) {
            this.sendToChatbot(message.trim());
        }
    }

    showError(message) {
        console.error('Error:', message); // Debug log
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.media-section'));
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Cleanup method for when page is unloaded
    cleanup() {
        this.isRecording = false;
        
        // Cleanup video toggle
        if (this.videoToggle) {
            this.videoToggle.cleanup();
        }
        
        if (this.recognition) {
            try {
                this.recognition.stop();
                this.recognition = null;
            } catch (error) {
                console.log('Recognition cleanup error:', error);
            }
        }
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => {
                track.stop();
            });
            this.audioStream = null;
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
            } catch (error) {
                console.log('AudioContext cleanup error:', error);
            }
        }
        
        if (this.autoSendTimeout) {
            clearTimeout(this.autoSendTimeout);
        }
    }
}

// Video Toggle Class
class VideoToggle {
    constructor(videoElementId = 'videoElement', toggleButtonId = 'videoToggle') {
        this.videoElement = document.getElementById(videoElementId);
        this.toggleButton = document.getElementById(toggleButtonId);
        this.videoOnIcon = this.toggleButton.querySelector('.video-on-icon');
        this.videoOffIcon = this.toggleButton.querySelector('.video-off-icon');
        this.currentStream = null;
        this.isVideoOn = false;
        
        this.init();
    }
    
    init() {
        // Event listener untuk toggle button
        this.toggleButton.addEventListener('click', () => this.toggleVideo());
        
        // Update initial state
        this.updateButtonAppearance();
    }
    
    async toggleVideo() {
        if (this.isVideoOn) {
            this.stopVideo();
        } else {
            await this.startVideo();
        }
    }
    
    async startVideo() {
        try {
            // Disable button while processing
            this.toggleButton.disabled = true;
            
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 }, 
                    height: { ideal: 480 } 
                }, 
                audio: false 
            });
            
            // Set video source
            this.videoElement.srcObject = stream;
            this.currentStream = stream;
            this.isVideoOn = true;
            
            // Update button appearance
            this.updateButtonAppearance();
            
            console.log('Video started successfully');
            
        } catch (error) {
            console.error('Error starting video:', error);
            this.showError('Gagal mengakses kamera: ' + error.message);
            this.isVideoOn = false;
        } finally {
            // Re-enable button
            this.toggleButton.disabled = false;
        }
    }
    
    stopVideo() {
        try {
            // Stop all tracks
            if (this.currentStream) {
                const tracks = this.currentStream.getTracks();
                tracks.forEach(track => {
                    track.stop();
                    console.log('Stopped track:', track.kind);
                });
            }
            
            // Clear video element
            this.videoElement.srcObject = null;
            this.currentStream = null;
            this.isVideoOn = false;
            
            // Update button appearance
            this.updateButtonAppearance();
            
            console.log('Video stopped successfully');
            
        } catch (error) {
            console.error('Error stopping video:', error);
        }
    }
    
    updateButtonAppearance() {
        if (this.isVideoOn) {
            // Video is on - show stop icon and update styling
            this.videoOnIcon.classList.add('hidden');
            this.videoOffIcon.classList.remove('hidden');
            this.toggleButton.classList.remove('bg-black', 'bg-opacity-60');
            this.toggleButton.classList.add('bg-red-500', 'bg-opacity-80');
            this.toggleButton.title = 'Stop Kamera';
        } else {
            // Video is off - show start icon and update styling
            this.videoOnIcon.classList.remove('hidden');
            this.videoOffIcon.classList.add('hidden');
            this.toggleButton.classList.remove('bg-red-500', 'bg-opacity-80');
            this.toggleButton.classList.add('bg-black', 'bg-opacity-60');
            this.toggleButton.title = 'Mulai Kamera';
        }
    }
    
    showError(message) {
        console.error('Video Error:', message);
        
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    // Method to get current state
    getState() {
        return {
            isVideoOn: this.isVideoOn,
            hasStream: !!this.currentStream
        };
    }
    
    // Cleanup method
    cleanup() {
        if (this.currentStream) {
            this.stopVideo();
        }
    }
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', () => {
    const app = new VoiceChatbotApp();
    
    // Cleanup when page is unloaded
    window.addEventListener('beforeunload', () => {
        app.cleanup();
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && app.isRecording) {
            // Stop recording when page becomes hidden
            app.stopRecording();
        }
    });
});