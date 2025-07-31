// Enhanced Fullscreen functionality dengan seamless page navigation
class FullscreenManager {
    constructor() {
        this.isFullscreenRequested = false;
        this.toggleButton = null;
        this.autoRestoreAttempted = false;
        this.blurOverlay = null;
        this.navigationTimestamp = Date.now();
        this.init();
    }
    
    init() {
        this.toggleButton = document.getElementById('fullscreen-toggle');
        this.bindEvents();
        this.updateButtonIcon();
        
        // Delay untuk memastikan DOM fully loaded
        setTimeout(() => {
            this.attemptAutoRestore();
        }, 100);
    }
    
    // Method untuk menyimpan status fullscreen dengan informasi tambahan
    saveFullscreenState() {
        const fullscreenData = {
            wasFullscreen: this.isFullscreen(),
            timestamp: Date.now(),
            currentPage: window.location.pathname,
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId(),
            navigationCount: this.getNavigationCount() + 1
        };
        
        sessionStorage.setItem('fullscreenState', JSON.stringify(fullscreenData));
        sessionStorage.setItem('fullscreenNavigationCount', fullscreenData.navigationCount.toString());
        
        // Backup ke localStorage untuk kasus tertentu
        localStorage.setItem('fullscreenStateBackup', JSON.stringify(fullscreenData));
        
        console.log('Fullscreen state saved:', fullscreenData);
    }
    
    // Method untuk mendapatkan session ID yang konsisten
    getSessionId() {
        let sessionId = sessionStorage.getItem('fullscreenSessionId');
        if (!sessionId) {
            sessionId = 'fs_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('fullscreenSessionId', sessionId);
        }
        return sessionId;
    }
    
    // Method untuk mendapatkan jumlah navigasi
    getNavigationCount() {
        const count = sessionStorage.getItem('fullscreenNavigationCount');
        return count ? parseInt(count, 10) : 0;
    }
    
    // Method untuk mendapatkan status fullscreen tersimpan dengan fallback
    getFullscreenState() {
        try {
            // Coba dari sessionStorage dulu
            let data = sessionStorage.getItem('fullscreenState');
            let state = data ? JSON.parse(data) : null;
            
            // Jika tidak ada di sessionStorage, coba dari localStorage
            if (!state) {
                data = localStorage.getItem('fullscreenStateBackup');
                state = data ? JSON.parse(data) : null;
                
                // Jika ada di localStorage, copy ke sessionStorage
                if (state) {
                    sessionStorage.setItem('fullscreenState', JSON.stringify(state));
                }
            }
            
            return state;
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
    
    // Enhanced attempt auto restore dengan multiple checks
    async attemptAutoRestore() {
        if (this.autoRestoreAttempted) return;
        this.autoRestoreAttempted = true;
        
        console.log('Attempting auto restore...');
        
        const state = this.getFullscreenState();
        console.log('Retrieved state:', state);
        
        if (!state) {
            console.log('No fullscreen state found');
            return;
        }
        
        // Check jika sudah dalam fullscreen
        if (this.isFullscreen()) {
            console.log('Already in fullscreen, updating state');
            this.saveFullscreenState();
            return;
        }
        
        if (!state.wasFullscreen) {
            console.log('Previous state was not fullscreen');
            return;
        }
        
        const timeDiff = Date.now() - state.timestamp;
        console.log('Time difference:', timeDiff, 'ms');
        
        // Perpanjang waktu restore menjadi 30 detik
        if (timeDiff > 30000) {
            console.log('State too old, clearing');
            this.clearFullscreenState();
            return;
        }
        
        // Check if same session
        const currentSessionId = this.getSessionId();
        if (state.sessionId && state.sessionId !== currentSessionId) {
            console.log('Different session detected');
            // Jangan langsung clear, mungkin ini valid navigation
        }
        
        // Multiple restore strategies
        await this.tryMultipleRestoreStrategies(state, timeDiff);
    }
    
    // Multiple restore strategies untuk meningkatkan success rate
    async tryMultipleRestoreStrategies(state, timeDiff) {
        console.log('Trying multiple restore strategies...');
        
        // Strategy 1: Immediate auto restore untuk navigasi sangat cepat (< 3 detik)
        if (timeDiff < 3000) {
            console.log('Strategy 1: Immediate auto restore');
            this.showLoadingIndicator();
            
            setTimeout(async () => {
                try {
                    await this.requestFullscreen();
                    this.hideLoadingIndicator();
                    this.showSuccessMessage();
                    return;
                } catch (error) {
                    console.warn('Strategy 1 failed:', error);
                    this.hideLoadingIndicator();
                    this.tryStrategy2(state, timeDiff);
                }
            }, 200);
            return;
        }
        
        // Strategy 2: Quick auto restore untuk navigasi cepat (< 10 detik)
        if (timeDiff < 10000) {
            console.log('Strategy 2: Quick auto restore');
            this.tryStrategy2(state, timeDiff);
            return;
        }
        
        // Strategy 3: Prompt untuk navigasi yang lebih lama
        console.log('Strategy 3: Show restore prompt');
        this.showRestorePrompt();
    }
    
    async tryStrategy2(state, timeDiff) {
        this.showLoadingIndicator();
        
        setTimeout(async () => {
            try {
                await this.requestFullscreen();
                this.hideLoadingIndicator();
                this.showSuccessMessage();
            } catch (error) {
                console.warn('Strategy 2 failed:', error);
                this.hideLoadingIndicator();
                // Fallback ke prompt
                setTimeout(() => {
                    this.showRestorePrompt();
                }, 500);
            }
        }, 800);
    }
    
    // Tampilkan indikator loading
    showLoadingIndicator() {
        // Remove existing indicator
        this.hideLoadingIndicator();
        
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
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 300);
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
            if (message.parentNode) {
                message.style.opacity = '0';
                message.style.transform = 'translate(-50%, -100%)';
                setTimeout(() => {
                    if (message.parentNode) {
                        message.remove();
                    }
                }, 300);
            }
        }, 3000);
    }
    
    // Enhanced restore prompt dengan better detection info
    showRestorePrompt() {
        // Hapus prompt yang sudah ada jika ada
        this.removeRestorePrompt();
        
        // Tampilkan blur overlay
        this.createBlurOverlay();
        
        const state = this.getFullscreenState();
        const timeDiff = state ? Math.round((Date.now() - state.timestamp) / 1000) : 0;
        
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
                    Tekan Escape kapan saja untuk keluar dari fullscreen
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Event listener untuk prompt
        const restoreBtn = document.getElementById('restore-fullscreen-btn');
        restoreBtn.addEventListener('click', async () => {
            try {
                await this.requestFullscreen();
                this.removeRestorePrompt();
                this.showSuccessMessage();
            } catch (error) {
                console.warn('Manual fullscreen restore failed:', error);
                this.showErrorMessage();
            }
        });
        
        // Prevent clicking outside to close
        this.blurOverlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            notification.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                notification.style.animation = '';
            }, 500);
        });
        
        // Focus pada button untuk accessibility
        setTimeout(() => {
            restoreBtn.focus();
        }, 100);
        
        // Handle keyboard navigation
        const keydownHandler = (e) => {
            if (!document.getElementById('fullscreen-restore-prompt')) {
                document.removeEventListener('keydown', keydownHandler);
                return;
            }
            
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                restoreBtn.click();
            }
            
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        document.addEventListener('keydown', keydownHandler);
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
            if (message.parentNode) {
                message.style.opacity = '0';
                setTimeout(() => {
                    if (message.parentNode) {
                        message.remove();
                    }
                }, 300);
            }
        }, 4000);
    }
    
    // Hapus notifikasi restore
    removeRestorePrompt() {
        const prompt = document.getElementById('fullscreen-restore-prompt');
        if (prompt) {
            prompt.style.opacity = '0';
            prompt.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                if (prompt.parentNode) {
                    prompt.remove();
                }
            }, 300);
        }
        
        // Remove blur overlay
        this.removeBlurOverlay();
    }
    
    // Enhanced clear state dengan cleanup
    clearFullscreenState() {
        sessionStorage.removeItem('fullscreenState');
        sessionStorage.removeItem('fullscreenNavigationCount');
        localStorage.removeItem('fullscreenStateBackup');
        console.log('Fullscreen state cleared');
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
            this.clearFullscreenState(); // Clear state ketika user exit manual
            
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
    
    // Enhanced event binding dengan better navigation detection
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
            console.log('Fullscreen change detected:', this.isFullscreen());
            
            if (!this.isFullscreen()) {
                this.isFullscreenRequested = false;
                // Jangan langsung clear state, mungkin ini karena navigasi
                setTimeout(() => {
                    if (!this.isFullscreen()) {
                        console.log('Fullscreen definitively exited');
                    }
                }, 1000);
            } else {
                // User berhasil masuk fullscreen
                this.isFullscreenRequested = true;
                this.saveFullscreenState();
            }
            
            this.updateButtonIcon();
        };
        
        // Event listeners untuk semua browser
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);
        
        // Enhanced navigation detection
        this.setupNavigationDetection();
        
        // Handle escape key untuk exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen() && !document.getElementById('fullscreen-restore-prompt')) {
                // User explicitly pressing escape
                console.log('User pressed escape to exit fullscreen');
                this.exitFullscreen();
            }
        });
        
        // Cleanup saat window akan ditutup
        window.addEventListener('beforeunload', () => {
            console.log('Window unloading, saving state:', this.isFullscreen());
            if (this.isFullscreen()) {
                this.saveFullscreenState();
            }
        });
        
        // Handle page show/hide untuk better detection
        window.addEventListener('pageshow', (e) => {
            console.log('Page show event', e.persisted);
            // Delay check untuk memberikan waktu browser restore state
            setTimeout(() => {
                if (!this.autoRestoreAttempted) {
                    this.attemptAutoRestore();
                }
            }, 200);
        });
        
        window.addEventListener('pagehide', () => {
            console.log('Page hide event');
            if (this.isFullscreen()) {
                this.saveFullscreenState();
            }
        });
        
        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isFullscreen()) {
                console.log('Tab became visible, saving state');
                this.saveFullscreenState();
            }
        });
    }
    
    // Enhanced navigation detection
    setupNavigationDetection() {
        // Intercept all forms of navigation
        const saveStateBeforeNavigation = () => {
            if (this.isFullscreen()) {
                console.log('Navigation detected, saving fullscreen state');
                this.saveFullscreenState();
            }
        };
        
        // Link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                const href = link.getAttribute('href');
                // Check for internal navigation
                if (href && (href.includes('.html') || href.startsWith('/') || href.startsWith('#')) && 
                    !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                    saveStateBeforeNavigation();
                }
            }
        });
        
        // Form submissions
        document.addEventListener('submit', saveStateBeforeNavigation);
        
        // Browser back/forward buttons
        window.addEventListener('popstate', saveStateBeforeNavigation);
        
        // Programmatic navigation (pushState/replaceState)
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function(...args) {
            saveStateBeforeNavigation();
            return originalPushState.apply(this, args);
        };
        
        history.replaceState = function(...args) {
            saveStateBeforeNavigation();
            return originalReplaceState.apply(this, args);
        };
    }
    
    // Public method untuk manual state cleanup
    cleanup() {
        this.clearFullscreenState();
        this.removeRestorePrompt();
        this.hideLoadingIndicator();
        this.removeBlurOverlay();
    }
    
    // Debug method untuk troubleshooting
    getDebugInfo() {
        return {
            isFullscreen: this.isFullscreen(),
            isFullscreenRequested: this.isFullscreenRequested,
            savedState: this.getFullscreenState(),
            currentPage: window.location.pathname,
            sessionId: this.getSessionId(),
            navigationCount: this.getNavigationCount(),
            autoRestoreAttempted: this.autoRestoreAttempted
        };
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
    
    // Debug info
    console.log('Fullscreen Manager initialized', window.fullscreenManager.getDebugInfo());
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