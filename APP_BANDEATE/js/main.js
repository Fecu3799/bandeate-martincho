(() => {
    'use strict';

    const onReady = (callback) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
            callback();
        }
    };

    const createScrollCoordinator = () => {
        const tasks = new Set();
        let frameRequested = false;

        const render = () => {
            frameRequested = false;
            tasks.forEach((task) => task());
        };

        const requestRender = () => {
            if (frameRequested) return;
            frameRequested = true;
            requestAnimationFrame(render);
        };

        window.addEventListener('scroll', requestRender, { passive: true });
        window.addEventListener('resize', requestRender);
        window.addEventListener('load', requestRender, { once: true });

        return {
            add(task) {
                tasks.add(task);
                requestRender();
            },
            request: requestRender
        };
    };

    const initNavigation = (scrollCoordinator) => {
        const header = document.querySelector('.site-header');
        const collapseElement = document.querySelector('#barra');
        const links = [...document.querySelectorAll('.nav-link[data-ancla]')];
        const hero = document.querySelector('#banner');

        if (!header || !collapseElement || !links.length || !hero) return;

        const collapse = bootstrap.Collapse.getInstance(collapseElement)
            || new bootstrap.Collapse(collapseElement, { toggle: false });
        const inicioLink = links.find((link) => link.getAttribute('href') === '#inicio');
        const sectionLinks = links.filter((link) => link !== inicioLink);
        const targets = sectionLinks
            .map((link) => document.querySelector(link.getAttribute('href')))
            .filter(Boolean);

        const setActive = (id) => {
            links.forEach((link) => {
                const active = link.getAttribute('href') === `#${id}`;
                link.classList.toggle('active', active);
                active
                    ? link.setAttribute('aria-current', 'page')
                    : link.removeAttribute('aria-current');
            });
        };

        links.forEach((link) => {
            link.addEventListener('click', (event) => {
                const target = document.querySelector(link.getAttribute('href'));
                if (!target) return;

                event.preventDefault();
                const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
                window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });

                if (collapseElement.classList.contains('show')) collapse.hide();
                setActive(target.id);
            });
        });

        scrollCoordinator.add(() => {
            const scrollY = window.scrollY;
            const activationPoint = scrollY + header.offsetHeight + 16;
            const heroBottom = hero.getBoundingClientRect().bottom + scrollY;

            if (scrollY <= 8 || activationPoint < heroBottom) {
                setActive('inicio');
                return;
            }

            const current = targets.reduce((activeTarget, target) => {
                const targetTop = target.getBoundingClientRect().top + scrollY;
                return targetTop <= activationPoint ? target : activeTarget;
            }, null);

            setActive(current ? current.id : 'inicio');
        });
    };

    const initScreensCarousel = () => {
        const viewport = document.querySelector('#galeria.screens-viewport');
        if (!viewport) return;

        const carousel = viewport.closest('.screens-carousel');
        const previous = carousel?.querySelector('.screens-arrow-prev');
        const next = carousel?.querySelector('.screens-arrow-next');
        if (!carousel || !previous || !next) return;

        const edgeSize = 76;
        let direction = 0;
        let speed = 0;
        let frame = null;

        const updateArrows = () => {
            const maxScroll = viewport.scrollWidth - viewport.clientWidth;
            previous.classList.toggle('is-muted', viewport.scrollLeft <= 2);
            next.classList.toggle('is-muted', viewport.scrollLeft >= maxScroll - 2);
        };

        const move = () => {
            if (!direction) {
                frame = null;
                return;
            }

            const limit = viewport.scrollWidth - viewport.clientWidth;
            const nextPosition = viewport.scrollLeft + direction * speed;
            viewport.scrollLeft = Math.max(0, Math.min(limit, nextPosition));
            updateArrows();

            const reachedStart = direction < 0 && viewport.scrollLeft <= 0;
            const reachedEnd = direction > 0 && viewport.scrollLeft >= limit;
            if (reachedStart || reachedEnd) {
                direction = 0;
                frame = null;
                return;
            }

            frame = requestAnimationFrame(move);
        };

        viewport.addEventListener('mousemove', (event) => {
            const bounds = viewport.getBoundingClientRect();
            const distanceFromLeft = event.clientX - bounds.left;
            const distanceFromRight = bounds.right - event.clientX;

            if (distanceFromLeft < edgeSize) {
                direction = -1;
                speed = Math.max(1, (edgeSize - distanceFromLeft) / 9);
            } else if (distanceFromRight < edgeSize) {
                direction = 1;
                speed = Math.max(1, (edgeSize - distanceFromRight) / 9);
            } else {
                direction = 0;
            }

            if (direction && frame === null) frame = requestAnimationFrame(move);
        });

        viewport.addEventListener('mouseleave', () => {
            direction = 0;
        });
        viewport.addEventListener('scroll', updateArrows, { passive: true });
        window.addEventListener('resize', updateArrows);

        previous.addEventListener('click', () => {
            viewport.scrollBy({ left: -viewport.clientWidth * .8, behavior: 'smooth' });
        });
        next.addEventListener('click', () => {
            viewport.scrollBy({ left: viewport.clientWidth * .8, behavior: 'smooth' });
        });

        updateArrows();
    };

    onReady(() => {
        const scrollCoordinator = createScrollCoordinator();
        initNavigation(scrollCoordinator);
        initScreensCarousel();
    });
})();
