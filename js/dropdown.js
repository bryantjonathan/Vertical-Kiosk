const toggleButton = document.getElementById('dropdownToggle');
const dropdownMenu = document.getElementById('dropdownMenu');
const arrow = document.getElementById('dropdownArrow');
const wrapper = document.getElementById('dropdownWrapper');

let isOpen = false;

toggleButton.addEventListener('click', () => {
    isOpen = !isOpen;
    dropdownMenu.classList.toggle('opacity-100', isOpen);
    dropdownMenu.classList.toggle('opacity-0', !isOpen);
    dropdownMenu.classList.toggle('translate-y-0', isOpen);
    dropdownMenu.classList.toggle('-translate-y-2', !isOpen);
    dropdownMenu.classList.toggle('visible', isOpen);
    dropdownMenu.classList.toggle('invisible', !isOpen);
    arrow.classList.toggle('rotate-180', isOpen);
});

// Close dropdown if click outside
document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
        isOpen = false;
        dropdownMenu.classList.remove('opacity-100', 'translate-y-0', 'visible');
        dropdownMenu.classList.add('opacity-0', '-translate-y-2', 'invisible');
        arrow.classList.remove('rotate-180');
    }
});