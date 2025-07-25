// Enhanced Fullscreen functionality dengan seamless page navigation
class FullscreenManager {
    constructor() {
        this.isFullscreenRequested = false;
        this.toggleButton = null;
        this.autoRestoreAttempted = false;
        this.blurOverlay = null;
        this.init();
    }
    
    init() {
        this.toggleButton = document.getElementById('fullscreen-toggle');
        this.bindEvents();
        this.updateButtonIcon();
        
        // Cek dan restore fullscreen secara otomatis
        this.attemptAutoRestore();
    }
    
    // Method untuk menyimpan status fullscreen dengan informasi tambahan
    saveFullscreenState() {
        const fullscreenData = {
            wasFullscreen: this.isFullscreen(),
            timestamp: Date.now(),
            currentPage: window.location.pathname,
            userAgent: navigator.userAgent
        };
        
        sessionStorage.setItem('fullscreenState', JSON.stringify(fullscreenData));
    }
    
    // Method untuk mendapatkan status fullscreen tersimpan
    getFullscreenState() {
        try {
            const data = sessionStorage.getItem('fullscreenState');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Failed to parse fullscreen state:', error);
            return null;
        }
    }
    
    // Method untuk membuat blur overlay
    createBlurOverlay() {
        if (this.blurOverlay) return;
        
        this.blurOverlay = document.createElement('div');
        this.blurOverlay.id = 'fullscreen-blur-overlay';
        this.blurOverlay.className = 'fixed inset-0 z-40 transition-all duration-300';
        this.blurOverlay.style.cssText = `
            backdrop-filter: blur(8px);
            background: rgba(0, 0, 0, 0.3);
            opacity: 0;
        `;
        
        document.body.appendChild(this.blurOverlay);
        
        // Animate in
        setTimeout(() => {
            this.blurOverlay.style.opacity = '1';
        }, 10);
    }
    
    // Method untuk menghapus blur overlay
    removeBlurOverlay() {
        if (this.blurOverlay) {
            this.blurOverlay.style.opacity = '0';
            setTimeout(() => {
                if (this.blurOverlay) {
                    this.blurOverlay.remove();
                    this.blurOverlay = null;
                }
            }, 300);
        }
    }
    
    // Attempt auto restore dengan fallback ke prompt
    async attemptAutoRestore() {
        if (this.autoRestoreAttempted) return;
        this.autoRestoreAttempted = true;
        
        const state = this.getFullscreenState();
        if (!state || !state.wasFullscreen) return;
        
        const timeDiff = Date.now() - state.timestamp;
        // Hanya restore jika navigasi baru-baru ini (dalam 15 detik)
        if (timeDiff > 15000) {
            this.clearFullscreenState();
            return;
        }
        
        // Tampilkan loading indicator
        this.showLoadingIndicator();
        
        // Coba restore otomatis dengan delay untuk memastikan DOM ready
        setTimeout(async () => {
            try {
                await this.requestFullscreen();
                this.hideLoadingIndicator();
                this.showSuccessMessage();
            } catch (error) {
                console.warn('Auto fullscreen restore failed:', error);
                this.hideLoadingIndicator();
                this.showRestorePrompt();
            }
        }, 500);
    }
    
    // Tampilkan indikator loading
    showLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'fullscreen-loading';
        indicator.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white px-6 py-3 rounded-lg shadow-lg z-50 backdrop-blur-sm border border-white border-opacity-20';
        indicator.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span class="text-sm">Memulihkan mode fullscreen...</span>
            </div>
        `;
        document.body.appendChild(indicator);
    }
    
    // Sembunyikan indikator loading
    hideLoadingIndicator() {
        const indicator = document.getElementById('fullscreen-loading');
        if (indicator) {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
        }
    }
    
    // Tampilkan pesan sukses
    showSuccessMessage() {
        const message = document.createElement('div');
        message.id = 'fullscreen-success';
        message.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 bg-opacity-90 text-white px-6 py-3 rounded-lg shadow-lg z-50 backdrop-blur-sm border border-green-400 border-opacity-30';
        message.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fas fa-check-circle text-green-300"></i>
                <span class="text-sm">Mode fullscreen dipulihkan</span>
            </div>
        `;
        document.body.appendChild(message);
        
        // Auto remove setelah 3 detik
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translate(-50%, -100%)';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }
    
    // Tampilkan prompt restore dengan design yang lebih baik (tanpa opsi batalkan)
    showRestorePrompt() {
        // Hapus prompt yang sudah ada jika ada
        this.removeRestorePrompt();
        
        // Tampilkan blur overlay
        this.createBlurOverlay();
        
        const notification = document.createElement('div');
        notification.id = 'fullscreen-restore-prompt';
        notification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-95 text-white px-8 py-6 rounded-xl shadow-2xl z-50 backdrop-blur-sm border border-white border-opacity-20 max-w-md';
        notification.innerHTML = `
            <div class="flex flex-col gap-4 text-center">
                <div class="flex flex-col items-center gap-3">
                    <div class="bg-blue-600 bg-opacity-20 p-4 rounded-full">
                        <i class="fas fa-expand text-blue-400 text-2xl"></i>
                    </div>
                    <div>
                        <div class="text-lg font-medium mb-2">Mode Fullscreen Terdeteksi</div>
                        <div class="text-sm text-gray-300 leading-relaxed">
                            Aplikasi sebelumnya dalam mode fullscreen.<br>
                            Klik tombol di bawah untuk melanjutkan.
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-center">
                    <button id="restore-fullscreen-btn" class="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg text-sm transition-all duration-200 hover:scale-105 font-medium shadow-lg">
                        <i class="fas fa-expand mr-2"></i>
                        Aktifkan Fullscreen
                    </button>
                </div>
                
                <div class="text-xs text-gray-400 text-center">
                    <i class="fas fa-info-circle mr-1"></i>
                    Tekan button kapan saja untuk keluar dari fullscreen
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Event listener untuk prompt (hanya tombol aktifkan)
        document.getElementById('restore-fullscreen-btn').addEventListener('click', async () => {
            try {
                await this.requestFullscreen();
                this.removeRestorePrompt();
                this.showSuccessMessage();
            } catch (error) {
                console.warn('Manual fullscreen restore failed:', error);
                this.showErrorMessage();
            }
        });
        
        // Prevent clicking outside to close (karena blur overlay)
        this.blurOverlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Optional: bisa tambahkan animation shake untuk memberi feedback
            notification.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                notification.style.animation = '';
            }, 500);
        });
        
        // Focus pada button untuk accessibility
        setTimeout(() => {
            const button = document.getElementById('restore-fullscreen-btn');
            if (button) {
                button.focus();
            }
        }, 100);
        
        // Handle keyboard navigation
        document.addEventListener('keydown', this.handlePromptKeydown.bind(this));
    }
    
    // Handle keyboard events pada prompt
    handlePromptKeydown(e) {
        const prompt = document.getElementById('fullscreen-restore-prompt');
        if (!prompt) return;
        
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const button = document.getElementById('restore-fullscreen-btn');
            if (button) {
                button.click();
            }
        }
        
        // Prevent escape key dari menutup prompt (karena kita ingin force fullscreen)
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
        }
    }
    
    // Tampilkan pesan error
    showErrorMessage() {
        const message = document.createElement('div');
        message.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 bg-opacity-90 text-white px-6 py-3 rounded-lg shadow-lg z-50 backdrop-blur-sm';
        message.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fas fa-exclamation-triangle text-red-300"></i>
                <span class="text-sm">Gagal mengaktifkan fullscreen</span>
            </div>
        `;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 300);
        }, 4000);
    }
    
    // Hapus notifikasi restore
    removeRestorePrompt() {
        // Remove keyboard event listener
        document.removeEventListener('keydown', this.handlePromptKeydown.bind(this));
        
        const prompt = document.getElementById('fullscreen-restore-prompt');
        if (prompt) {
            prompt.style.opacity = '0';
            prompt.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                prompt.remove();
            }, 300);
        }
        
        // Remove blur overlay
        this.removeBlurOverlay();
    }
    
    // Bersihkan state fullscreen
    clearFullscreenState() {
        sessionStorage.removeItem('fullscreenState');
    }
    
    async requestFullscreen() {
        if (this.isFullscreenRequested || this.isFullscreen()) return;
        
        try {
            const element = document.documentElement;
            
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                await element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                await element.msRequestFullscreen();
            } else {
                throw new Error('Fullscreen API not supported');
            }
            
            this.isFullscreenRequested = true;
            this.saveFullscreenState();
            
        } catch (error) {
            console.warn('Fullscreen request failed:', error);
            throw error;
        }
    }
    
    exitFullscreen() {
        try {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            this.isFullscreenRequested = false;
            this.saveFullscreenState();
            
        } catch (error) {
            console.warn('Exit fullscreen failed:', error);
        }
    }
    
    toggleFullscreen() {
        if (this.isFullscreen()) {
            this.exitFullscreen();
        } else {
            this.requestFullscreen().catch(error => {
                console.warn('Toggle fullscreen failed:', error);
            });
        }
    }
    
    isFullscreen() {
        return !!(document.fullscreenElement || 
                 document.mozFullScreenElement || 
                 document.webkitFullscreenElement || 
                 document.msFullscreenElement);
    }
    
    updateButtonIcon() {
        if (!this.toggleButton) return;
        
        const icon = this.toggleButton.querySelector('i');
        if (icon) {
            if (this.isFullscreen()) {
                icon.className = 'fas fa-compress text-lg';
                this.toggleButton.title = 'Exit Fullscreen';
            } else {
                icon.className = 'fas fa-expand text-lg';
                this.toggleButton.title = 'Enter Fullscreen';
            }
        }
    }
    
    bindEvents() {
        // Toggle fullscreen on button click
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                try {
                    await this.toggleFullscreen();
                } catch (error) {
                    console.warn('Button toggle fullscreen failed:', error);
                }
            });
        }
        
        // Handle fullscreen change events
        const handleFullscreenChange = () => {
            if (!this.isFullscreen()) {
                this.isFullscreenRequested = false;
            }
            this.updateButtonIcon();
            this.saveFullscreenState();
        };
        
        // Event listeners untuk semua browser
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);
        
        // Handle escape key untuk exit fullscreen (tapi tidak untuk close prompt)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen() && !document.getElementById('fullscreen-restore-prompt')) {
                this.exitFullscreen();
            }
        });
        
        // Intercept navigation untuk menyimpan state
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && this.isFullscreen()) {
                const href = link.getAttribute('href');
                // Cek apakah ini navigasi internal
                if (href && (href.includes('.html') || href.startsWith('/')) && 
                    !href.startsWith('http') && !href.startsWith('https://')) {
                    this.saveFullscreenState();
                }
            }
        });
        
        // Handle form submissions jika ada
        document.addEventListener('submit', () => {
            if (this.isFullscreen()) {
                this.saveFullscreenState();
            }
        });
        
        // Cleanup saat window akan ditutup
        window.addEventListener('beforeunload', () => {
            if (!this.isFullscreen()) {
                this.clearFullscreenState();
            }
        });
        
        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isFullscreen()) {
                this.saveFullscreenState();
            }
        });
    }
    
    // Public method untuk manual state cleanup
    cleanup() {
        this.clearFullscreenState();
        this.removeRestorePrompt();
        this.hideLoadingIndicator();
        this.removeBlurOverlay();
    }
}

// Initialize fullscreen manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Cleanup any existing instances
    if (window.fullscreenManager) {
        window.fullscreenManager.cleanup();
    }
    
    // Create new instance
    window.fullscreenManager = new FullscreenManager();
    
    // Debug info (bisa dihapus di production)
    if (window.location.search.includes('debug=1')) {
        console.log('Fullscreen Manager initialized', {
            currentPage: window.location.pathname,
            isFullscreen: window.fullscreenManager.isFullscreen(),
            savedState: window.fullscreenManager.getFullscreenState()
        });
    }
});

// Add CSS untuk shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translate(-50%, -50%) translateX(0); }
        25% { transform: translate(-50%, -50%) translateX(-5px); }
        75% { transform: translate(-50%, -50%) translateX(5px); }
    }
`;
document.head.appendChild(style);