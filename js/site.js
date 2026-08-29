(function () {
	'use strict';

	const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	const year = document.querySelector('#current-year');
	if (year) {
		year.textContent = new Date().getFullYear();
	}

	const progressBar = document.querySelector('.scroll-progress span');
	let scrollFrame = 0;

	function updateScrollProgress() {
		const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
		const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;

		if (progressBar) {
			progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
		}

		scrollFrame = 0;
	}

	function queueScrollProgress() {
		if (!scrollFrame) {
			scrollFrame = window.requestAnimationFrame(updateScrollProgress);
		}
	}

	window.addEventListener('scroll', queueScrollProgress, { passive: true });
	window.addEventListener('resize', queueScrollProgress);
	updateScrollProgress();

	const revealGroups = [
		'.section-heading',
		'#hero .hero-left > *',
		'.image-comparison',
		'.project',
		'.service',
		'.stack-track',
		'.contact-quote',
		'.contact-item'
	];
	const revealItems = [];

	revealGroups.forEach((selector) => {
		document.querySelectorAll(selector).forEach((element, index) => {
			element.classList.add('reveal-item');
			element.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 70}ms`);
			revealItems.push(element);
		});
	});

	if (!reducedMotion && 'IntersectionObserver' in window) {
		document.documentElement.classList.add('motion-ready');

		const revealObserver = new IntersectionObserver((entries, observer) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) {
					return;
				}

				entry.target.classList.add('is-visible');
				entry.target.addEventListener('transitionend', () => {
					entry.target.classList.add('reveal-done');
				}, { once: true });
				observer.unobserve(entry.target);
			});
		}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

		revealItems.forEach((element) => revealObserver.observe(element));
	}

	if (finePointer && !reducedMotion) {
		document.querySelectorAll('.project, .service').forEach((card) => {
			card.addEventListener('pointermove', (event) => {
				const bounds = card.getBoundingClientRect();
				card.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
				card.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
			});

			card.addEventListener('pointerleave', () => {
				card.style.setProperty('--pointer-x', '50%');
				card.style.setProperty('--pointer-y', '50%');
			});
		});

		const intro = document.querySelector('#second-quote .jarallax');
		if (intro) {
			intro.addEventListener('pointermove', (event) => {
				const bounds = intro.getBoundingClientRect();
				const offsetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 14;
				const offsetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 14;
				intro.style.setProperty('--grid-x', `${offsetX}px`);
				intro.style.setProperty('--grid-y', `${offsetY}px`);
			});
		}
	}

	const comparison = document.querySelector('.image-comparison');
	const comparisonSection = document.querySelector('#hero');
	const slider = comparison && comparison.querySelector('.slider');
	const oldImage = comparison && comparison.querySelector('.image-old');
	let comparisonFrame = 0;
	let comparisonTimer = 0;

	function updateComparison(value) {
		const safeValue = Math.min(100, Math.max(0, Number(value)));
		slider.value = safeValue;
		oldImage.style.clipPath = `inset(0 ${100 - safeValue}% 0 0)`;
		comparison.style.setProperty('--slider-position', `${safeValue}%`);
	}

	function stopComparisonAnimation() {
		window.clearTimeout(comparisonTimer);
		window.cancelAnimationFrame(comparisonFrame);
	}

	function animateComparison(from, to, duration, onComplete) {
		const start = performance.now();

		function frame(now) {
			const elapsed = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - elapsed, 3);
			updateComparison(from + ((to - from) * eased));

			if (elapsed < 1) {
				comparisonFrame = window.requestAnimationFrame(frame);
			} else if (onComplete) {
				onComplete();
			}
		}

		comparisonFrame = window.requestAnimationFrame(frame);
	}

	function playComparison() {
		updateComparison(100);
		comparisonTimer = window.setTimeout(() => {
			animateComparison(100, 0, 1100, () => {
				comparisonTimer = window.setTimeout(() => animateComparison(0, 50, 700), 180);
			});
		}, 300);
	}

	if (comparison && comparisonSection && slider && oldImage) {
		updateComparison(reducedMotion ? 50 : 100);

		slider.addEventListener('input', (event) => {
			stopComparisonAnimation();
			updateComparison(event.target.value);
		});

		if (!reducedMotion && 'IntersectionObserver' in window) {
			const comparisonObserver = new IntersectionObserver((entries, observer) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					playComparison();
					observer.disconnect();
				}
			}, { threshold: 0.35 });

			comparisonObserver.observe(comparisonSection);
		}
	}

	if (typeof window.jarallax === 'function') {
		window.jarallax(document.querySelectorAll('.jarallax'), {
			speed: reducedMotion ? 0 : 0.14
		});
	}

	const parallaxElement = document.querySelector('.parallax');
	if (parallaxElement && finePointer && !reducedMotion && typeof window.Parallax === 'function') {
		new window.Parallax(parallaxElement, {
			hoverOnly: true,
			relativeInput: true,
			scalarX: 7,
			scalarY: 7
		});
	}
}());