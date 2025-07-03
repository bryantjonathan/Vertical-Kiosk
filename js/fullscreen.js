// fullscreen.js - Fullscreen functionality
class FullscreenManager {
    constructor() {
        this.isFullscreenRequested = false;
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    async requestFullscreen() {
        if (this.isFullscreenRequested) return;
        
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                await document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                await document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                await document.documentElement.msRequestFullscreen();
            }
            this.isFullscreenRequested = true;
        } catch (error) {
            console.warn('Fullscreen request failed:', error);
        }
    }
    
    exitFullscreen() {
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
    }
    
    toggleFullscreen() {
        if (this.isFullscreen()) {
            this.exitFullscreen();
        } else {
            this.requestFullscreen();
        }
    }
    
    isFullscreen() {
        return !!(document.fullscreenElement || 
                 document.mozFullScreenElement || 
                 document.webkitFullscreenElement || 
                 document.msFullscreenElement);
    }
    
    bindEvents() {
        // Request fullscreen on first user interaction
        document.addEventListener('click', () => {
            this.requestFullscreen();
        }, { once: true });
        
        // Handle fullscreen change events
        document.addEventListener('fullscreenchange', () => {
            if (!this.isFullscreen()) {
                this.isFullscreenRequested = false;
            }
        });
        
        // Handle escape key to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen()) {
                this.exitFullscreen();
            }
        });
    }
}

// Initialize fullscreen manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fullscreenManager = new FullscreenManager();
});