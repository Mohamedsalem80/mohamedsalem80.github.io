(function () {
    'use strict';

    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var parallaxElement = document.querySelector('.parallax');
    var year = document.getElementById('currentYear');

    if (year) year.textContent = new Date().getFullYear();

    if (parallaxElement && finePointer && !reducedMotion && typeof window.Parallax === 'function') {
        new window.Parallax(parallaxElement, {
            hoverOnly: true,
            relativeInput: true,
            scalarX: 4,
            scalarY: 4
        });
    }

    var revealItems = Array.from(document.querySelectorAll('.section-heading, .feature-card'));
    if (!reducedMotion && 'IntersectionObserver' in window) {
        document.documentElement.classList.add('motion-ready');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

        revealItems.forEach(function (element, index) {
            element.classList.add('reveal-item');
            element.style.setProperty('--reveal-delay', Math.min(index, 4) * 70 + 'ms');
            observer.observe(element);
        });
    }

    if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js').catch(function () {});
        });
    }
}());