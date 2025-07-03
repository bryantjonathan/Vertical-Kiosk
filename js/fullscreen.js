// Fullscreen functionality
class FullscreenManager {
    constructor() {
        this.isFullscreenRequested = false;
        this.toggleButton = null;
        this.init();
    }
    
    init() {
        this.toggleButton = document.getElementById('fullscreen-toggle');
        this.bindEvents();
        this.updateButtonIcon();
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
    
    updateButtonIcon() {
        if (!this.toggleButton) return;
        
        const icon = this.toggleButton.querySelector('i');
        if (this.isFullscreen()) {
            icon.className = 'fas fa-compress text-lg';
            this.toggleButton.title = 'Exit Fullscreen';
        } else {
            icon.className = 'fas fa-expand text-lg';
            this.toggleButton.title = 'Enter Fullscreen';
        }
    }
    
    bindEvents() {
        // Toggle fullscreen on button click
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                this.toggleFullscreen();
            });
        }
        
        // Handle fullscreen change events
        document.addEventListener('fullscreenchange', () => {
            if (!this.isFullscreen()) {
                this.isFullscreenRequested = false;
            }
            this.updateButtonIcon();
        });
        
        // Handle escape key to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen()) {
                this.exitFullscreen();
            }
        });
        
        // Handle different fullscreen change events for cross-browser compatibility
        document.addEventListener('mozfullscreenchange', () => {
            this.updateButtonIcon();
        });
        
        document.addEventListener('webkitfullscreenchange', () => {
            this.updateButtonIcon();
        });
        
        document.addEventListener('msfullscreenchange', () => {
            this.updateButtonIcon();
        });
    }
}

// Initialize fullscreen manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fullscreenManager = new FullscreenManager();
});