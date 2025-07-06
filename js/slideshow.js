// Slideshow functionality
class Slideshow {
    constructor(config = {}) {
        this.numSlides = config.numSlides || 5;
        this.autoSlideInterval = config.autoSlideInterval || 5000;
        this.pauseDuration = config.pauseDuration || 5000;
        
        this.slidesContainer = document.getElementById('slides');
        this.dotsContainer = document.getElementById('dots');
        this.slideshowContainer = document.getElementById('slideshow-container');
        
        this.currentSlide = 0;
        this.autoSlideTimer = null;
        this.isAutoPlayActive = true;
        this.pauseTimeout = null;
        
        // Touch handling variables
        this.startX = 0;
        this.isSwiping = false;
        
        this.init();
    }
    
    init() {
        this.createSlides();
        this.createDots();
        this.bindEvents();
        this.startAutoSlide();
    }
    
    createSlides() {
        for (let i = 0; i < this.numSlides; i++) {
            const slide = document.createElement('div');
            slide.className = 'flex-shrink-0 w-full h-full bg-white flex items-center justify-center';
            slide.innerHTML = `<img src="https://picsum.photos/1920/1080?random=${i}" alt="Image ${i + 1}" class="w-full h-full object-cover" />`;
            this.slidesContainer.appendChild(slide);
        }
    }
    
    createDots() {
        for (let i = 0; i < this.numSlides; i++) {
            const dot = document.createElement('div');
            dot.className = `w-3.5 h-3.5 rounded-full cursor-pointer transition-colors duration-300 ${i === 0 ? 'bg-white' : 'bg-white bg-opacity-50'}`;
            dot.addEventListener('click', () => {
                this.pauseAutoSlide();
                this.showSlide(i);
            });
            this.dotsContainer.appendChild(dot);
        }
    }
    
    showSlide(index) {
        this.currentSlide = index;
        const slideWidth = this.slideshowContainer.clientWidth;
        const offset = -index * slideWidth;
        this.slidesContainer.style.transform = `translateX(${offset}px)`;
        this.updateDots();
    }
    
    updateDots() {
        document.querySelectorAll('#dots > div').forEach((dot, i) => {
            if (i === this.currentSlide) {
                dot.className = 'w-3.5 h-3.5 rounded-full cursor-pointer transition-colors duration-300 bg-white';
            } else {
                dot.className = 'w-3.5 h-3.5 rounded-full cursor-pointer transition-colors duration-300 bg-white bg-opacity-50';
            }
        });
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.numSlides;
        this.showSlide(this.currentSlide);
    }
    
    prevSlide() {
        this.currentSlide = this.currentSlide > 0 ? this.currentSlide - 1 : this.numSlides - 1;
        this.showSlide(this.currentSlide);
    }
    
    startAutoSlide() {
        if (this.autoSlideTimer) {
            clearInterval(this.autoSlideTimer);
        }
        
        this.autoSlideTimer = setInterval(() => {
            if (this.isAutoPlayActive) {
                this.nextSlide();
            }
        }, this.autoSlideInterval);
    }
    
    pauseAutoSlide() {
        this.isAutoPlayActive = false;
        
        if (this.pauseTimeout) {
            clearTimeout(this.pauseTimeout);
        }
        
        this.pauseTimeout = setTimeout(() => {
            this.isAutoPlayActive = true;
        }, this.pauseDuration);
    }
    
    bindEvents() {
        // Handle resize window
        window.addEventListener('resize', () => {
            this.showSlide(this.currentSlide);
        });
        
        // Touch events for swipe
        this.slideshowContainer.addEventListener('touchstart', (e) => {
            this.startX = e.touches[0].clientX;
            this.isSwiping = true;
        });
        
        this.slideshowContainer.addEventListener('touchmove', (e) => {
            if (!this.isSwiping) return;
            e.preventDefault();
        });
        
        this.slideshowContainer.addEventListener('touchend', (e) => {
            if (!this.isSwiping) return;
            
            const endX = e.changedTouches[0].clientX;
            const deltaX = endX - this.startX;
            
            if (Math.abs(deltaX) > 50) {
                this.pauseAutoSlide();
                
                if (deltaX > 0) {
                    this.prevSlide();
                } else {
                    this.nextSlide();
                }
            }
            
            this.isSwiping = false;
        });
    }
    
    destroy() {
        if (this.autoSlideTimer) {
            clearInterval(this.autoSlideTimer);
        }
        if (this.pauseTimeout) {
            clearTimeout(this.pauseTimeout);
        }
    }
}

// Initialize slideshow when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.slideshow = new Slideshow({
        numSlides: 5,
        autoSlideInterval: 5000,
        pauseDuration: 5000
    });
});