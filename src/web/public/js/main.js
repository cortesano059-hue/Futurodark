// Simple counter animation moved from footer partial
document.addEventListener('DOMContentLoaded', () => {
    const counters = document.querySelectorAll('.stat-num');
    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText.replace(/\D/g, '') || 0;
            const speed = 50;
            const inc = Math.max(1, Math.floor(target / speed));

            if (count < target) {
                counter.innerText = (count + inc).toLocaleString();
                setTimeout(updateCount, 25);
            } else {
                counter.innerText = target.toLocaleString();
            }
        };
        updateCount();
    });
});
