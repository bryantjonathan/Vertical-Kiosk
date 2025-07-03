// Fullscreen (triggered oleh user action)
document.addEventListener('click', function() {
    document.documentElement.requestFullscreen();
});

const numSlides = 5;
const slidesContainer = document.getElementById('slides');
const dotsContainer = document.getElementById('dots');
const slideshowContainer = document.getElementById('slideshow-container');

// Membuat slides dan dots
for (let i = 0; i < numSlides; i++) {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.innerHTML = `<img src="https://picsum.photos/1920/1080?random=${i}" alt="Image ${i + 1}" />`;
    slidesContainer.appendChild(slide);
     
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
        pauseAutoSlide(); // Pause auto slide selama 5 detik
        showSlide(i);
    });
    dotsContainer.appendChild(dot);
}

let currentSlide = 0;
let autoSlideInterval;
let isAutoPlayActive = true;
let pauseTimeout;
 
function showSlide(index) {
    currentSlide = index;
    const offset = -index * window.innerWidth;
    slidesContainer.style.transform = `translateX(${offset}px)`;
    
    // Update dots
    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function startAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
    }
    autoSlideInterval = setInterval(() => {
        if (isAutoPlayActive) {
            currentSlide = (currentSlide + 1) % numSlides;
            showSlide(currentSlide);
        }
    }, 5000);
}

function pauseAutoSlide() {
    isAutoPlayActive = false;
    
    // Clear timeout yang sudah ada untuk mencegah multiple timer
    if (pauseTimeout) {
        clearTimeout(pauseTimeout);
    }
    
    // Set timeout baru untuk mengaktifkan kembali auto-play setelah 5 detik
    pauseTimeout = setTimeout(() => {
        isAutoPlayActive = true;
    }, 5000);
}
 
// Handle resize window
window.addEventListener('resize', () => {
    showSlide(currentSlide);
});

// Touch handling untuk swipe
let startX = 0;
let isSwiping = false;

slideshowContainer.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    isSwiping = true;
});

slideshowContainer.addEventListener('touchmove', e => {
    if (!isSwiping) return;
    e.preventDefault();
});

slideshowContainer.addEventListener('touchend', e => {
    if (!isSwiping) return;
    
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - startX;
    
    if (Math.abs(deltaX) > 50) {
        pauseAutoSlide(); // Pause auto slide selama 5 detik
        
        if (deltaX > 0) {
            // Swipe ke kanan - slide sebelumnya
            currentSlide = currentSlide > 0 ? currentSlide - 1 : numSlides - 1;
        } else {
            // Swipe ke kiri - slide berikutnya
            currentSlide = currentSlide < numSlides - 1 ? currentSlide + 1 : 0;
        }
        showSlide(currentSlide);
    }
    
    isSwiping = false;
});

// Mulai auto slideshow
startAutoSlide();