// Hide Pre-loader when page is fully loaded
window.addEventListener('load', () => {
    // Initialize Lenis Smooth Scroll (Standard for Premium Websites)
    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('fade-out');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1000);
    }


    // Top-tier Touch: Fetch REAL dynamic weather for Matara, SL
    const tempElement = document.getElementById('current-temp');
    if (tempElement) {
        // Matara coords: 5.9485, 80.5353
        fetch('https://api.open-meteo.com/v1/forecast?latitude=5.9485&longitude=80.5353&current_weather=true')
            .then(response => response.json())
            .then(data => {
                if (data && data.current_weather) {
                    const temp = Math.round(data.current_weather.temperature);
                    tempElement.innerText = `${temp}°C`;
                }
            })
            .catch(err => {
                console.log("Weather fetch error:", err);
                // Fallback to a sensible default if API fails
                tempElement.innerText = '29°C';
            });
    }

    // Tracking Visit for Dashboard Analytics
    trackVisit();
});

// Firebase is already initialized by firebase-config.js, which is loaded before script.js in index.html
// The 'db' variable is already globally available.
let analytics;
if (typeof firebase !== 'undefined' && typeof firebase.analytics === 'function') {
    try {
        analytics = firebase.analytics();
    } catch (e) { }
}
// Security Utility: Sanitize inputs to prevent XSS (Hacking) attacks
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Security Utility: Strip all HTML Tags before saving to Database (Sanitization)
function stripHTML(html) {
    let doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

// Security Utility: Check for URLs or Links (Spam Prevention)
function containsURL(text) {
    const urlPattern = new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?");
    return urlPattern.test(text);
}

// Analytics: Track Page Visit in Firestore
function trackVisit() {
    if (typeof db === 'undefined' || !db) return;
    try {
        const dateISO = new Date().toISOString().split('T')[0];
        const docRef = db.collection("analytics").doc(dateISO);
        docRef.set({
            hits: firebase.firestore.FieldValue.increment(1),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(err => console.log("Analytics error:", err));
    } catch (e) {
        console.log("Tracking failed:", e);
    }
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navItems = document.querySelectorAll('.nav-links a');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = hamburger.querySelector('i');
    if (navLinks.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
        document.body.style.overflow = 'hidden'; // Stop scrolling when menu open
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
        document.body.style.overflow = 'auto'; // allow scrolling again
    }
});

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const ls = document.querySelector('.lang-switcher');
        if (ls) ls.classList.remove('active');
        const icon = hamburger.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
        document.body.style.overflow = 'auto';
    });
});

// Intersection Observer for scroll flow animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Add visible class to trigger animation
            entry.target.classList.add('visible');
            // Unobserve after animating once
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Check for saved language globally
const savedLang = localStorage.getItem('selected_lang') || 'en';

// Observe all animatable elements
document.addEventListener('DOMContentLoaded', () => {
    // 1. Visit Tracker (Analytics)
    if (typeof db !== 'undefined') {
        const today = new Date().toISOString().split('T')[0];
        const visitRef = db.collection("analytics").doc(today);

        // Increment the visit count for today
        visitRef.set({
            hits: firebase.firestore.FieldValue.increment(1)
        }, { merge: true }).catch(err => console.error("Analytics Error:", err));
    }

    // 2. Secret Access (Security Enhancement)
    // Press Ctrl + Alt + Shift + X to access the secret management portal
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.shiftKey && e.code === 'KeyX') {
            window.location.href = 'nilwala-river-management-access.html';
        }
    });

    const animatables = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .zoom-in, .fade-up, .slide-up');

    animatables.forEach(el => {
        // Exclude hero animations from scroll observer as they trigger on load
        if (!el.closest('.hero') && !el.closest('.page-header')) {
            observer.observe(el);
        }
    });

    // Trigger intro animations on page load (support both main hero and subpage header)
    setTimeout(() => {
        const intros = document.querySelectorAll('.hero .fade-in, .hero .slide-in-left, .hero .slide-in-right, .hero .zoom-in, .page-header .fade-in, .page-header .slide-up');
        intros.forEach(el => {
            el.classList.add('visible');
        });
    }, 100);
});

// Smooth scrolling for all hash links with an offset for the fixed header
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            const navbarHeight = document.getElementById('navbar').offsetHeight;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - Math.min(navbarHeight, 80);

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// FAQ Accordion functionality
document.addEventListener('DOMContentLoaded', () => {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    // Open the first item by default
    if (accordionHeaders.length > 0) {
        accordionHeaders[0].parentElement.classList.add('active');
    }

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.parentElement;

            // Close all other items
            const allItems = document.querySelectorAll('.accordion-item');
            allItems.forEach(item => {
                if (item !== accordionItem) {
                    item.classList.remove('active');
                }
            });

            // Toggle current item
            accordionItem.classList.toggle('active');
        });
    });
});

// Initialize 3D Vanilla-Tilt on elements
document.addEventListener('DOMContentLoaded', () => {
    if (typeof VanillaTilt !== 'undefined') {
        // Initialize cards for 3D tilt
        VanillaTilt.init(document.querySelectorAll(".package-card, .testimonial-card, .glass-panel"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.15,
            scale: 1.02
        });

        // Initialize gallery items for 3D tilt with less scale so it doesn't break grid too much
        VanillaTilt.init(document.querySelectorAll(".gallery-item"), {
            max: 10,
            speed: 300,
            glare: true,
            "max-glare": 0.2
        });
    }
});

// Auto horizontal scroll for sections on mobile (Reviews & Packages & Guides)
document.addEventListener('DOMContentLoaded', () => {
    // Select the grids
    const autoScrollContainers = document.querySelectorAll('.testimonials-grid, .packages-grid, .guides-grid, #dynamic-gallery');

    autoScrollContainers.forEach(container => {
        let isDown = false;
        let slideTimer;

        const startAutoScroll = () => {
            slideTimer = setInterval(() => {
                // Only auto-scroll when on mobile/tablet widths
                if (window.innerWidth <= 992 && !isDown) {
                    const firstCard = container.firstElementChild;
                    if (firstCard) {
                        const cardWidth = firstCard.offsetWidth;
                        const gap = parseFloat(window.getComputedStyle(container).gap) || 0;
                        const scrollAmount = cardWidth + gap;

                        // Loop back to start if we reached the end
                        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
                            container.scrollTo({ left: 0, behavior: 'smooth' });
                        } else {
                            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                        }
                    }
                }
            }, 3000); // Slide every 3 seconds
        };

        // Initialize auto scroll
        startAutoScroll();

        // Pause auto scroll when user touches/intersects with the container
        container.addEventListener('touchstart', () => {
            isDown = true;
            clearInterval(slideTimer);
        }, { passive: true });

        container.addEventListener('touchend', () => {
            isDown = false;
            // Restart after a small delay
            setTimeout(() => {
                if (!isDown) {
                    clearInterval(slideTimer);
                    startAutoScroll();
                }
            }, 3000);
        }, { passive: true });

        // Pause on mouse hover (for desktop/tablet testing)
        container.addEventListener('mouseenter', () => {
            isDown = true;
            clearInterval(slideTimer);
        });

        container.addEventListener('mouseleave', () => {
            isDown = false;
            clearInterval(slideTimer);
            startAutoScroll();
        });
    });
});

// Interactive Star Rating for Reviews
document.addEventListener('DOMContentLoaded', () => {
    const starContainer = document.getElementById('star-rating');
    if (!starContainer) return;

    const stars = starContainer.querySelectorAll('i');
    const ratingInput = document.getElementById('rating-value');

    stars.forEach(star => {
        // Hover effect
        star.addEventListener('mouseover', function () {
            const value = this.getAttribute('data-value');
            stars.forEach(s => {
                if (s.getAttribute('data-value') <= value) {
                    s.classList.add('hover');
                } else {
                    s.classList.remove('hover');
                }
            });
        });

        // Remove hover effect when mouse leaves
        star.addEventListener('mouseout', function () {
            stars.forEach(s => s.classList.remove('hover'));
        });

        // Click to set rating
        star.addEventListener('click', function () {
            const value = this.getAttribute('data-value');
            ratingInput.value = value;

            // Set active class
            stars.forEach(s => {
                if (s.getAttribute('data-value') <= value) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // Handle Review Form Submission
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let rawRating = ratingInput.value;
            let name = stripHTML(document.getElementById('reviewer-name').value.trim());
            let country = stripHTML(document.getElementById('reviewer-country').value.trim()) || "New Explorer";
            let comment = stripHTML(document.getElementById('reviewer-comment').value.trim());

            // Check if comment contains links/urls (Hacking/Spam Prevention)
            if (containsURL(comment)) {
                alert("For security reasons, links or URLs are not allowed in reviews.");
                return;
            }

            // Setup basic rate limiting (Prevent Spamming Attacks)
            const lastReviewTime = localStorage.getItem('last_review_time');
            if (lastReviewTime) {
                const timePassed = new Date().getTime() - parseInt(lastReviewTime);
                // Require at least 5 minutes between reviews
                if (timePassed < 5 * 60 * 1000) {
                    alert("Please wait a few minutes before submitting another review to prevent spam.");
                    return;
                }
            }

            // Input Validation (Length limitation)
            if (name.length > 50) {
                name = name.substring(0, 50) + "...";
            }
            if (country.length > 50) {
                country = country.substring(0, 50) + "...";
            }
            if (comment.length > 500) {
                alert("Your review is too long! Please keep it under 500 characters.");
                return;
            }

            if (!rawRating) {
                alert('Please select a star rating for your safari experience.');
                return;
            }

            // Validate Rating is specifically between 1 and 5
            const rating = parseInt(rawRating);
            if (isNaN(rating) || rating < 1 || rating > 5) {
                alert('Error: Invalid rating value detected.');
                return;
            }

            // Generate Stars HTML
            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                if (i < rating) {
                    starsHtml += '<i class="fas fa-star" style="color:#FFD700; margin-right:2px;"></i>';
                } else {
                    starsHtml += '<i class="far fa-star" style="color:#FFD700; margin-right:2px;"></i>';
                }
            }

            // Create New Review Element
            const newReview = document.createElement('div');
            newReview.className = 'testimonial-card glassmorphism fade-up';
            // If VanillaTilt is active, add the necessary data attributes.
            newReview.setAttribute('data-tilt', '');
            newReview.setAttribute('data-tilt-max', '15');
            newReview.setAttribute('data-tilt-speed', '400');
            newReview.setAttribute('data-tilt-glare', 'true');
            newReview.setAttribute('data-tilt-max-glare', '0.15');

            newReview.innerHTML = `
                <div class="rating" style="margin-bottom: 1.5rem; font-size: 1.2rem;">
                    ${starsHtml}
                </div>
                <p class="review-text">"${escapeHTML(comment)}"</p>
                <div class="reviewer">
                    <div class="reviewer-info">
                        <h4>${escapeHTML(name)}</h4>
                        <span>${escapeHTML(country)}</span>
                    </div>
                    <i class="fas fa-user-check" style="color:var(--primary); font-size: 1.5rem;"></i>
                </div>
            `;

            // Append instantly to the testimonials grid
            const testimonialsGrid = document.querySelector('.testimonials-grid');
            if (testimonialsGrid) {
                testimonialsGrid.prepend(newReview);

                // Re-initialize Vanilla-Tilt for the new element if it exists
                if (typeof VanillaTilt !== 'undefined') {
                    VanillaTilt.init(newReview);
                }

                // Ensure it is observed by the animation observer
                if (typeof observer !== 'undefined') {
                    observer.observe(newReview);
                }

                // Scroll the new review into full view on mobile
                if (window.innerWidth <= 992) {
                    testimonialsGrid.scrollTo({ left: 0, behavior: 'smooth' });
                }
            }

            // Save newly added review to Firebase Database
            db.collection("reviews").add({
                name: name,
                country: country,
                comment: comment,
                rating: parseInt(rating),
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log("Review successfully saved to Firebase!");
            }).catch((error) => {
                console.error("Error saving review: ", error);
            });

            // Show success message and reset styling on the submit button
            const submitBtn = reviewForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<i class="fas fa-check" style="margin-right: 8px;"></i> Review Submitted!';
            submitBtn.style.background = '#28a745';
            submitBtn.style.borderColor = '#28a745';
            submitBtn.style.boxShadow = '0 10px 20px -5px rgba(40, 167, 69, 0.4)';

            // Set the rate limit timestamp
            localStorage.setItem('last_review_time', new Date().getTime().toString());

            setTimeout(() => {
                reviewForm.reset();
                ratingInput.value = '';
                stars.forEach(s => s.classList.remove('active', 'hover'));

                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.style.borderColor = '';
                submitBtn.style.boxShadow = '';
                document.getElementById('reviewer-country').value = '';
            }, 3000); // Reset after 3 seconds
        });
    }
});

// Load Saved Reviews Function from Firebase
document.addEventListener('DOMContentLoaded', () => {
    const testimonialsGrid = document.querySelector('.testimonials-grid');
    if (!testimonialsGrid) return;

    // Load reviews from Firebase Database (real-time updates)
    db.collection("reviews").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
        // Only clear if it's a real update to avoid flickering, 
        // but for simplicity in this architecture, we rebuild the grid
        testimonialsGrid.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const review = doc.data();
            if (review.status && review.status !== 'approved') return;

            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                if (i < review.rating) {
                    starsHtml += '<i class="fas fa-star" style="color:#FFD700; margin-right:2px;"></i>';
                } else {
                    starsHtml += '<i class="far fa-star" style="color:#FFD700; margin-right:2px;"></i>';
                }
            }

            const newReview = document.createElement('div');
            newReview.className = 'testimonial-card glassmorphism fade-up';

            // Tilt attributes
            newReview.setAttribute('data-tilt', '');
            newReview.setAttribute('data-tilt-max', '15');
            newReview.setAttribute('data-tilt-speed', '400');
            newReview.setAttribute('data-tilt-glare', 'true');
            newReview.setAttribute('data-tilt-max-glare', '0.15');

            newReview.innerHTML = `
                <div class="rating" style="margin-bottom: 1.5rem; font-size: 1.2rem;">
                    ${starsHtml}
                </div>
                <p class="review-text">"${escapeHTML(review.comment)}"</p>
                <div class="reviewer">
                    <div class="reviewer-info">
                        <h4>${escapeHTML(review.name)}</h4>
                        <span>${escapeHTML(review.country || "New Explorer")}</span>
                    </div>
                    <i class="fas fa-user-check" style="color:var(--primary); font-size: 1.5rem;"></i>
                </div>
            `;
            // Append
            testimonialsGrid.appendChild(newReview);

            if (typeof VanillaTilt !== 'undefined') {
                VanillaTilt.init(newReview);
            }

            if (typeof observer !== 'undefined') {
                observer.observe(newReview);
            }
        });
    }, (error) => {
        console.log("Error listening to reviews from Firebase:", error);
    });
});

// --- LOAD DYNAMIC ADMIN DATA ---


document.addEventListener('DOMContentLoaded', () => {
    // Safely check if db exists
    if (typeof window.db === 'undefined' || !window.db) return;

    const db = window.db;

    // 1. Load News Ticker Data
    const newsContainer = document.getElementById('dynamic-news');
    if (newsContainer) {
        db.collection("settings").doc("news").onSnapshot((doc) => {
            if (doc.exists) {
                const newsText = doc.data().text;
                const items = newsText.split('|').map(t => t.trim()).filter(t => t.length > 0);

                let html = '';
                items.forEach(item => {
                    html += `<span><i class="fas fa-bolt" style="color:var(--primary);"></i> ${escapeHTML(item)}</span>`;
                });
                // Duplicate for smooth infinite scrolling
                html += html;
                newsContainer.innerHTML = html;
            }
        });
    }

    // 3. Load Real-time River Status
    const riverStatusElement = document.getElementById('river-status');
    if (riverStatusElement) {
        db.collection("settings").doc("status").onSnapshot((doc) => {
            if (doc.exists) {
                const status = doc.data().riverStatus || "Good";

                // Multi-language Support for River Status
                const lang = localStorage.getItem('selected_lang') || 'en';
                const statusKey = `river_${status.toLowerCase()}`;

                // Fallback to raw status if translation missing
                riverStatusElement.innerText = (translations[lang] && translations[lang][statusKey])
                    ? translations[lang][statusKey]
                    : status;

                // Sync styles for world-class visual feedback
                riverStatusElement.classList.remove('status-good', 'status-normal', 'status-caution', 'status-alert', 'status-glow');
                if (status === "Good") {
                    riverStatusElement.classList.add('status-good', 'status-glow');
                } else if (status === "Normal") {
                    riverStatusElement.classList.add('status-normal', 'status-glow');
                } else if (status === "Caution") {
                    riverStatusElement.classList.add('status-caution', 'status-glow');
                } else if (status === "Alert") {
                    riverStatusElement.classList.add('status-alert', 'status-glow');
                }
            }
        });
    }

    // Load Gallery (Homepage - limit to 2)
    const galleryContainer = document.getElementById('dynamic-gallery');
    if (galleryContainer) {
        db.collection("gallery").orderBy("createdAt", "desc").limit(2).onSnapshot((snapshot) => {
            if (!snapshot.empty) {
                galleryContainer.innerHTML = '';
            } else {
                galleryContainer.innerHTML = '<div style="padding: 2rem; color: #888; text-align: center;">Gallery coming soon...</div>';
                return;
            }
            snapshot.forEach((doc, index) => {
                const data = doc.data();
                const div = document.createElement('div');
                // Make the first item large
                div.className = index === 0 ? 'gallery-item large zoom-in' : 'gallery-item zoom-in';
                div.innerHTML = `
                    <img src="${data.url}" alt="${escapeHTML(data.title)}">
                    <div class="gallery-overlay">
                        <h3>${escapeHTML(data.title)}</h3>
                        <p>${escapeHTML(data.category)}</p>
                    </div>
                `;
                galleryContainer.appendChild(div);
                if (typeof observer !== 'undefined') {
                    observer.observe(div);
                }
            });

            // Re-init tilt if needed
            if (typeof VanillaTilt !== 'undefined') {
                VanillaTilt.init(document.querySelectorAll("#dynamic-gallery .gallery-item"), {
                    max: 10, speed: 300, glare: true, "max-glare": 0.2
                });
            }
        });
    }

    // Load Extended Gallery (for gallery.html)
    const galleryFullContainer = document.getElementById('dynamic-gallery-full');
    if (galleryFullContainer) {
        db.collection("gallery").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
            if (!snapshot.empty) {
                galleryFullContainer.innerHTML = '';
            } else {
                galleryFullContainer.innerHTML = '<div style="padding: 3rem; text-align: center; color: var(--text-muted); width: 100%; grid-column: 1 / -1; border: 1px dashed rgba(255,255,255,0.1); border-radius: 15px;">No photos available yet.</div>';
                return;
            }
            snapshot.forEach((doc, index) => {
                const data = doc.data();
                const div = document.createElement('div');

                // Create an appealing layout mask (make some items large)
                // e.g. every 1st and 5th element in a 5 element pattern is large
                const patternIndex = index % 5;
                const isLarge = patternIndex === 0 || patternIndex === 4;

                div.className = isLarge ? 'gallery-item large zoom-in' : 'gallery-item zoom-in';

                // Stagger delays based on index
                const delayClass = (index % 3 === 1) ? 'delay-1' : (index % 3 === 2) ? 'delay-2' : '';
                if (delayClass) div.classList.add(delayClass);

                div.innerHTML = `
                    <img src="${data.url}" alt="${escapeHTML(data.title)}" loading="lazy">
                    <div class="gallery-overlay">
                        <h3>${escapeHTML(data.title)}</h3>
                        <p>${escapeHTML(data.category)}</p>
                    </div>
                `;

                galleryFullContainer.appendChild(div);
                if (typeof observer !== 'undefined') {
                    observer.observe(div);
                }
            });

            if (typeof VanillaTilt !== 'undefined') {
                VanillaTilt.init(document.querySelectorAll("#dynamic-gallery-full .gallery-item"), {
                    max: 10, speed: 300, glare: true, "max-glare": 0.2
                });
            }
        });
    }

    // Load Packages
    const packagesContainer = document.getElementById('dynamic-packages');

    // Helper function to create a package card
    const createPackageCard = (id, data, index) => {
        const isPopular = index === 1;
        const div = document.createElement('div');
        div.className = isPopular ? 'package-card glassmorphism highlight-card fade-up' : 'package-card glassmorphism fade-up';

        let featuresHtml = '';
        if (data && data.features) {
            try {
                const featuresList = (typeof data.features === 'string') ? data.features.split(',') : (Array.isArray(data.features) ? data.features : []);
                if (featuresList.length > 0) {
                    featuresHtml = '<ul class="package-features">';
                    featuresList.forEach(f => {
                        if (f && typeof f === 'string') {
                            featuresHtml += `<li><i class="fas fa-check-circle"></i> <span>${escapeHTML(f.trim())}</span></li>`;
                        }
                    });
                    featuresHtml += '</ul>';
                }
            } catch (e) {
                console.error("Error parsing features for package", id, e);
            }
        }

        const name = data && data.name ? data.name : "Unnamed Package";
        const price = data && data.price ? data.price : "Call for Price";
        const icon = data && data.icon ? data.icon : "fa-ship";

        div.innerHTML = `
            ${isPopular ? '<div class="popular-badge"><i class="fas fa-star"></i> ' + (translations[savedLang]?.most_popular || 'Most Popular') + '</div>' : ''}
            <div class="package-icon"><i class="fas ${icon}"></i></div>
            <h3>${escapeHTML(name)}</h3>
            <div class="price">Rs. ${price}<span>/person</span></div>
            ${featuresHtml}
            <a href="#contact" class="btn-${isPopular ? 'primary' : 'outline'} w-100">${translations[savedLang]?.book_now || 'Book Now'}</a>
        `;
        return div;
    };

    if (packagesContainer) {
        // Dynamic Select Sync
        const bookPackageSelect = document.getElementById('book-package');

        // Initial state: Observe hardcoded ones if they exist
        const hardcoded = packagesContainer.querySelectorAll('.package-card');
        if (hardcoded.length > 0 && typeof observer !== 'undefined') {
            hardcoded.forEach(card => observer.observe(card));
        }

        db.collection("packages").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
            if (!snapshot.empty) {
                packagesContainer.innerHTML = '';

                // Clear existing dynamic options in select, keep placeholder and 'Other'
                if (bookPackageSelect) {
                    const placeholder = bookPackageSelect.querySelector('option[disabled]');
                    const otherOpt = bookPackageSelect.querySelector('option[data-t="other"]');
                    bookPackageSelect.innerHTML = '';
                    if (placeholder) bookPackageSelect.appendChild(placeholder);

                    snapshot.forEach((doc, index) => {
                        const data = doc.data();
                        const card = createPackageCard(doc.id, data, index);
                        packagesContainer.appendChild(card);

                        // Add to select
                        const opt = document.createElement('option');
                        opt.value = data.name;
                        opt.innerText = data.name;
                        bookPackageSelect.appendChild(opt);

                        // Crucial: Observe new cards for animations
                        if (typeof observer !== 'undefined') {
                            observer.observe(card);
                        }
                    });

                    if (otherOpt) bookPackageSelect.appendChild(otherOpt);
                } else {
                    snapshot.forEach((doc, index) => {
                        const data = doc.data();
                        const card = createPackageCard(doc.id, data, index);
                        packagesContainer.appendChild(card);
                        if (typeof observer !== 'undefined') {
                            observer.observe(card);
                        }
                    });
                }

                if (typeof VanillaTilt !== 'undefined') {
                    VanillaTilt.init(document.querySelectorAll("#dynamic-packages .package-card"), {
                        max: 15, speed: 400, glare: true, "max-glare": 0.15, scale: 1.02
                    });
                }
            }
        }, (error) => {
            console.error("Error loading packages from Firebase:", error);
        });
    }

    // Online Booking Form Submit Handling
    const bookingForm = document.getElementById('online-booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btn-submit-booking');
            const originalText = btnSubmit.innerHTML;

            const name = stripHTML(document.getElementById('book-name').value.trim());
            const phone = stripHTML(document.getElementById('book-phone').value.trim());
            const date = document.getElementById('book-date').value;
            const pkg = document.getElementById('book-package').value;
            const guests = document.getElementById('book-guests').value;
            const message = stripHTML(document.getElementById('book-message').value.trim());

            if (!name || !phone || !date || !pkg || !guests) {
                alert("Please fill out all required fields.");
                return;
            }

            // Security Check: No links in name or message
            if (containsURL(name) || containsURL(message)) {
                alert("For security reasons, links or URLs are not allowed in booking requests.");
                return;
            }

            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btnSubmit.disabled = true;

            try {
                await db.collection("bookings").add({
                    name: name,
                    phone: phone,
                    date: date,
                    package: pkg,
                    guests: parseInt(guests),
                    message: message,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                });

                alert("Booking Request Sent! We will contact you soon to confirm.");
                bookingForm.reset();
            } catch (error) {
                console.error("Booking Error:", error);
                alert("There was an error sending your request. Please try WhatsApp instead.");
            } finally {
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            }
        });
    }

    // Dynamic Services Loading (on services.html)
    const servicesList = document.getElementById('dynamic-services-list');
    if (servicesList) {
        db.collection("services").orderBy("createdAt", "asc").onSnapshot((snapshot) => {
            if (snapshot.empty) return;
            servicesList.innerHTML = '';
            let delay = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                const serviceCard = document.createElement('div');
                serviceCard.className = `package-card glassmorphism fade-up ${delay > 0 ? 'delay-' + (delay % 3) : ''}`;
                serviceCard.style.opacity = '1';
                serviceCard.style.transform = 'none';

                serviceCard.innerHTML = `
                    <div class="package-icon"><i class="fas ${data.icon || 'fa-concierge-bell'}"></i></div>
                    <h3>${data.name}</h3>
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">${data.description}</p>
                `;
                servicesList.appendChild(serviceCard);
                delay++;
            });
        });
    }

    // Special Offer Popup Trigger
    const offerPopup = document.getElementById('offer-popup');
    const closePopupBtn = document.getElementById('close-popup');

    if (offerPopup) {
        // Fetch popup settings from Firebase
        db.collection("settings").doc("popup").get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data.enabled) {
                    // Update content
                    document.getElementById('popup-title-display').innerText = data.title;
                    document.getElementById('popup-message-display').innerText = data.message;
                    const ctaBtn = document.getElementById('popup-btn-display');
                    ctaBtn.innerText = data.btnText;
                    ctaBtn.href = data.btnLink || '#';

                    // Show after a delay (e.g. 3 seconds)
                    setTimeout(() => {
                        // Check if they've already closed it in this session
                        if (!sessionStorage.getItem('popup_closed')) {
                            offerPopup.classList.add('active');
                            offerPopup.style.display = 'flex';
                        }
                    }, 3000);
                }
            }
        });

        // Close logic
        const closePopup = () => {
            offerPopup.classList.remove('active');
            setTimeout(() => {
                offerPopup.style.display = 'none';
            }, 500);
            sessionStorage.setItem('popup_closed', 'true');
        };

        if (closePopupBtn) closePopupBtn.addEventListener('click', closePopup);
        offerPopup.addEventListener('click', (e) => {
            if (e.target === offerPopup) closePopup();
        });
    }

    // --- PROFESSIONAL GLOBAL TRANSLATION ENGINE ---
    const translations = {
        en: {
            // Nav
            nav_home: "Home", nav_services: "Services", nav_packages: "Packages", nav_gallery: "Gallery", nav_wildlife: "Wildlife Info", nav_book: "Book Now",
            // Hero
            hero_slogan_top: "ENTER THE REALM", hero_title: "Giants of the River", hero_description: "Embark on a breathtaking boat safari. Witness massive saltwater crocodiles in their natural habitat with our safe and expert-guided tours.",
            hero_explore_packages: "Explore Packages", hero_watch_tour: "Watch Tour",
            news_1: "Home to the largest living saltwater crocodile in Sri Lanka", news_2: "Encounter the oldest known crocodile in the country",
            news_largest_croc_dup: "Home to the largest living saltwater crocodile in Sri Lanka", news_oldest_croc_dup: "Encounter the oldest known crocodile in the country",
            news_highest_pop_dup: "Highest crocodile population in Sri Lanka (80 - 100 individuals)", news_breathtaking_evenings_dup: "Witness breathtaking evenings as thousands of birds gather on the river island",
            // About
            about_welcome_badge: "Welcome", about_title: "Experience Croc Kingdom", about_p1: "Located in the heart of Matara, the Nilwala River is home to some of the most magnificent saltwater crocodiles in Sri Lanka. At Croc Kingdom, we offer a safe, thrilling, and unforgettable safari experience perfectly designed for both adventure seekers and wildlife enthusiasts.",
            about_p2: "Our modern boats and experienced guides ensure that you get up close to nature's ancient reptiles while maintaining strict safety standards. Whether you're a nature photographer or looking for a family adventure, our safari is the perfect escape into the wild.",
            stat_safe: "Safe & Secure", stat_exp: "10+ Years Exp.", stat_happy: "Happy Explorers",
            // Services
            serv_badge: "Premium Offerings", serv_title: "Our Services", serv_safari: "Boat Safari", serv_watch: "Croc & Bird Watching", serv_bird: "Bird Watching", serv_fish: "Fishing Experiences", serv_monkey: "Monkey Feeding", serv_transfer: "Free Pick & Drop",
            serv_safari_desc: "Explore the Nilwala river with our safe and comfortable boats.", serv_watch_desc: "Get a chance to see the giants of the river and beautiful birds.",
            serv_monkey_desc: "Enjoy feeding monkeys in their natural habitats along the river.", serv_transfer_desc: "We offer free transportation from your hotel within Matara city.",
            serv_safari_desc_long: "Experience a calm, yet thrilling ride deep into the Nilwala river mangroves in our safe and comfortable premium boats.",
            serv_watch_desc_long: "Safely approach and observe massive saltwater crocodiles in their natural habitat with our expert naturalists.",
            serv_bird_desc_long: "A paradise for bird lovers! Spot exotic Kingfishers, Eagles, Egrets, and majestic flocks of Storks.",
            serv_fish_desc_long: "Enjoy serene, traditional river fishing experiences tailored for relaxation during your safari trip.",
            serv_monkey_desc_long: "Interact with friendly native macaques along the riverbanks with safe and enjoyable feeding activities.",
            serv_transfer_desc_long: "Hassle-free transportation! We offer absolutely free pick up and drop off locally for your maximum convenience.",
            hospitality_badge: "VIP Hospitality", hospitality_title: "On-Board Refreshments", hospitality_desc: "We treat every guest like royalty. Relax on our premium safari boats while we take care of all your cravings mid-tour. Your comfort is our ultimate priority.",
            refresh_1: "King Coconut (Thambili): Fresh, cold, and refreshing local welcome drinks.",
            refresh_2: "Fresh Seasonal Fruits: A platter of Sri Lanka's finest sweet tropical fruits.",
            refresh_3: "Snacks & Water: Quality snacks and unlimited bottled water provided.",
            refresh_4: "Meals on Request: Pre-book authentic, delicious Sri Lankan Breakfast or Lunch to enjoy on the river!",
            monk_title: "Monkey Feeding", monk_subtitle: "Interactive Wildlife", monk_desc: "Get up close and personal with the playful native macaque monkeys that inhabit the lush mangrove forests along the Nilwala riverbanks.",
            monk_feat_1: "Perfect Photo Opportunities: Capture amazing close-up photos of these curious and adorable creatures.",
            monk_feat_2: "Safe & Fun: A delightful and safe interactive feeding experience suitable for all ages.",
            monk_feat_3: "Eco-Friendly Approach: We ensure our feeding practices are healthy and environmentally conscious for the monkeys.",
            on_the_house: "ON THE HOUSE", complimentary: "Complimentary",
            book_tour: "Book A Tour Now",
            // Gallery
            gallery: "Gallery", view_gallery: "View Full Gallery", croc_king_desc: "The undisputed king of Nilwala", stork_title: "Graceful Storks (Kokku)", stork_desc: "Beautiful white birds hunting in the shallows", boat_title: "Premium Safari Boats", boat_desc: "Ultimate comfort and safety",
            // Packages
            pack_badge: "Pricing", packages: "Packages", pack_subtitle: "Choose the perfect adventure tailored to your needs.", pack_standard: "Standard Safari", pack_vip: "VIP Sunset Cruise", pack_photo: "Photography Tour",
            feat_1h: "1 Hour Boat Ride", feat_guide: "Basic Guide Included", feat_jacket: "Life Jackets Provided", feat_slots: "Morning / Evening Slots",
            feat_2h: "2 Hours Guided Tour", feat_nat: "Expert Naturalist Guide", feat_refresh: "Complimentary Refreshments", feat_boat: "Premium Seating Boat",
            feat_3h: "3 Hours Exclusive Hire", feat_close: "Close-up Approaching", feat_prof: "Ideal for Professionals", feat_early: "Early Morning Departure",
            book_standard: "Book Standard", book_vip: "Book VIP Now", book_photo: "Book Photo Tour", most_popular: "Most Popular",
            // Reviews
            reviews: "Reviews", explorers: "Explorers", review_subtitle: "Read real experiences from adventurers who joined our Nilwala safari.",
            rev_1_text: "Absolutely mind-blowing! The guides were incredibly knowledgeable and safety was their top priority. Seeing those massive saltwater crocs in the golden hour light was a memory for a lifetime.",
            rev_2_text: "The highlight of our Sri Lanka trip! Croc Kingdom provides professional boats and the sunset tour was stunning. We saw over 6 massive crocodiles and beautiful flocks of storks. Worth every penny!",
            rev_3_text: "As a wildlife photographer, the photography package was exactly what I needed. The guide knew exactly where the big ones were hiding and positioned the boat perfectly for the light.",
            uk: "United Kingdom", aus: "Australia", germany: "Germany",
            // FAQ
            faq_badge: "FAQ", faq_title: "Frequently Asked Questions", faq_title_q: "Questions", faq_desc: "Got questions before you book? Here are the most common things our adventurers ask us.", more_faq: "Still have questions?",
            faq_q1: "Is it safe to get close to the crocodiles?", faq_a1: "Absolutely. Your safety is our #1 priority. Our premium boats are designed specifically for crocodile safaris with high sides and stable decks. Our guides have over 10 years of experience navigating the Nilwala river and maintain a strict, safe distance at all times.",
            faq_q2: "What is the best time to see crocodiles?", faq_a2: "The best sightings are usually early morning (7AM-9AM) or late afternoon (4PM-6PM) when crocodiles come out to sunbathe on the banks. Sunset tours offer magical lighting for photography.",
            faq_q3: "Do you provide life jackets?", faq_a3: "Yes, safety is mandatory. We provide high-quality life jackets for all passengers, including specialized sizes for children, which must be worn throughout the entire safari.",
            faq_q4: "Can I bring my camera equipment?", faq_a4: "Absolutely! Our boats are very stable and perfect for photography. We suggest bringing a lens with good zoom (200mm+) to capture detailed shots of the crocodiles and birds.",
            // Booking form
            booking: "Booking", book_title: "Secure Your Safari", book_title_part2: "Safari", book_desc: "Fill out the form below to request a booking. We will review and confirm your reservation shortly!",
            form_name: "Your Name", form_phone: "Phone / WhatsApp", form_guests: "No. of Guests", form_special: "Any special requests? (Optional)", form_submit: "Submit Booking Request", sel_package: "Select Package", other: "Other / Not Sure",
            // Footer
            footer_desc: "Experience the thrill of the wild with Matara's #1 premier crocodile boat safari. Safety, adventure, and memories guaranteed.",
            footer_links: "Quick Links", footer_follow: "Follow Us",
            // Services Page
            serv_hero_subtitle: "EXPERIENCE THE WILD", serv_hero_title: "Exclusive Adventures & Services",
            serv_badge: "What We Offer", serv_title_main: "Premium Safari Experiences", serv_subtitle_main: "A fully guided, luxurious natural adventure tailored to give you the thrill of a lifetime.",
            hospitality_badge: "VIP Hospitality", hospitality_title: "On-Board Refreshments", hospitality_desc: "We treat every guest like royalty. Relax on our premium safari boats while we take care of all your cravings mid-tour.",
            refresh_1: "King Coconut (Thambili): Fresh, cold, and refreshing local welcome drinks.",
            refresh_2: "Fresh Seasonal Fruits: A platter of Sri Lanka's finest sweet tropical fruits.",
            refresh_3: "Ceylon Tea & Coffee: Experience the world-famous taste of authentic Pure Ceylon tea on the river.",
            refresh_4: "Local Treats: Delicious Sri Lankan snacks to keep your energy up during the expedition.",
            on_the_house: "ON THE HOUSE", complimentary: "Complimentary",
            // Wildlife Page
            wild_hero_subtitle: "NATURE'S WONDERS", wild_hero_title: "Discover Nilwala's Wildlife",
            wild_badge: "The Apex Predator", wild_title_croc: "The Saltwater Crocodile", wild_subtitle_croc: "Fascinating facts about the ancient giants ruling the Nilwala River.",
            wild_stat_teeth_num: "66 Teeth", wild_stat_teeth_desc: "They constantly replace teeth. Over a lifespan, they can grow up to 8,000 teeth!",
            wild_stat_age_num: "70+ Years", wild_stat_age_desc: "These ancient reptiles have incredibly long lifespans, often outliving humans.",
            wild_stat_bite_num: "Strongest Bite", wild_stat_bite_desc: "They have the strongest bite force of any living animal (over 3,700 PSI).",
            wild_stat_size_num: "Massive Size", wild_stat_size_desc: "Males can reach lengths of up to 6 meters (20 feet) and weigh over 1,000 kg.",
            wild_ancient_title: "Ancient Survivors of the Deep",
            wild_ancient_p1: "The crocodiles found in the Nilwala River are primarily Saltwater Crocodiles (Crocodylus porosus). Despite their name, they are extremely adaptable and thrive in the brackish and freshwater environments of the river.",
            wild_ancient_p2: "They are ambush predators, capable of remaining perfectly still in the murky water for hours, with only their eyes and nostrils exposed above the surface.",
            wild_ancient_didyouknow: "Did you know? Crocodiles actually have excellent night vision. While on our sunset tours, their eyes can sometimes be seen glowing red when light reflects off them in the dark.",
            wild_badge_birds: "Aerial Beauty", wild_title_birds: "Birds of the River", wild_subtitle_birds: "Nilwala isn't just about crocodiles; it's a paradise for exotic bird watchers too.",
            bird_tag_1: "Local Giant", bird_title_1: "The Painted Stork", bird_desc_1: "Locally known as 'Kokku', these majestic waders are a common sight along the Nilwala banks. With their bright yellow beaks and delicate pink-tinged wings, they create a stunning silhouette against the river canopy.",
            bird_tag_2: "Silent Hunter", bird_title_2: "Great White Egret", bird_desc_2: "A symbol of patience and grace. Egrets are master hunters, standing perfectly motionless in the shallows for minutes before striking with lightning speed to catch small fish and river prawns.",
            // Gallery Page
            gal_hero_subtitle: "Capturing Nature", gal_hero_title: "Our Wildlife Gallery",
            gal_title: "Birds & Beasts", gal_subtitle: "A stunning collection of majestic crocodiles, beautiful storks (Kokku), and scenic views from the Nilwala river.",
            // Global / Mobile
            call: "Call", book_now: "Book Now", chat: "Chat", special_offer: "Special Offer!", claim_now: "Claim Now",
            river_good: "Good", river_normal: "Normal", river_caution: "Caution", river_alert: "Alert", river_label: "River Condition", change_language: "Change Language"
        },
        si: {
            nav_home: "මුල් පිටුව", nav_services: "සේවාවන්", nav_packages: "පැකේජ", nav_gallery: "ඡායාරූප", nav_wildlife: "වනජීවී විස්තර", nav_book: "දැන්ම වෙන්කරන්න",
            hero_slogan_top: "රාජධානියට ඇතුළු වන්න", hero_title: "ගඟේ යෝධයෝ", hero_description: "විස්මිත බෝට්ටු සෆාරියකට එක්වන්න. අපගේ ආරක්ෂිත සහ පළපුරුදු මඟපෙන්වන්නන් සමඟ නිල්වලා ගඟේ වෙසෙන යෝධ කිඹුලන් ඔවුන්ගේ ස්වාභාවික වාසස්ථානවලදීම දැකබලා ගන්න.",
            hero_explore_packages: "පැකේජ බලන්න", hero_watch_tour: "වීඩියෝව බලන්න",
            news_1: "ශ්‍රී ලංකාවේ විශාලතම කරදිය කිඹුලන්ගේ නිවහන", news_2: "ලංකාවේ සිටින වයස්ගතම කිඹුලා දැකබලා ගන්න",
            news_largest_croc_dup: "ශ්‍රී ලංකාවේ විශාලතම කරදිය කිඹුලන්ගේ නිවහන", news_oldest_croc_dup: "ලංකාවේ සිටින වයස්ගතම කිඹුලා දැකබලා ගන්න",
            news_highest_pop_dup: "ශ්‍රී ලංකාවේ වැඩිම කිඹුල් ගහනයක් සහිත ගඟ (කිඹුලන් 80 - 100)", news_breathtaking_evenings_dup: "දහස් සංඛ්‍යාත කුරුල්ලන් ගඟේ දූපතට රොක් වන සුන්දර සවස් යාමය",
            about_welcome_badge: "සාදරයෙන් පිළිගනිමු", about_title: "Croc Kingdom අත්දැකීම", about_p1: "මාතර නගර මධ්‍යයේ පිහිටි නිල්වලා ගඟ, ශ්‍රී ලංකාවේ සිටින විශාලතම සහ විශ්මයජනක කිඹුලන්ගේ නිවහන වේ. සෆාරි අත්දැකීමක් සොයන ඕනෑම අයෙකුට Croc Kingdom අපූරු තෝතැන්නකි.",
            about_p2: "අපගේ නවීන බෝට්ටු සහ පළපුරුදු මඟපෙන්වන්නන් ඔබට කිඹුලන් මෙන්ම ස්වාභාවික සෞන්දර්යය ඉතා සමීපව දැකබලා ගැනීමට අවශ්‍ය පහසුකම් සලසා දෙයි. ඔබ වනජීවී ඡායාරූප ශිල්පියෙකු වුවද, පවුලේ සැමට විනෝදජනක අත්දැකීමක් වුවද මෙය කදිම තේරීමකි.",
            stat_safe: "ආරක්ෂාව සහ සහතිකය", stat_exp: "වසර 10+ පළපුරුද්ද", stat_happy: "ප්‍රීතිමත් සංචාරකයින්",
            serv_badge: "අපගේ සේවාවන්", serv_title: "අපගේ සේවාවන්", serv_safari: "බෝට්ටු සෆාරි", serv_watch: "කිඹුලන් සහ කුරුල්ලන් නැරඹීම", serv_bird: "කුරුල්ලන් නැරඹීම", serv_fish: "මසුන් ඇල්ලීම", serv_monkey: "වඳුරන්ට කෑම දීම", serv_transfer: "නවාතැන්පොළේ සිට ගෙන ඒම සහ රැගෙන යාම",
            serv_safari_desc: "අපගේ ආරක්ෂිත සහ සුවපහසු බෝට්ටු මගින් නිල්වලා ගඟේ චාරිකාවක යෙදෙන්න.", serv_watch_desc: "ගඟේ යෝධයන් සහ ලස්සන කුරුල්ලන් දැක ගැනීමට අවස්ථාව ලබා ගන්න.",
            serv_monkey_desc: "ගඟ අසබඩ ස්වාභාවික වාසස්ථානවල සිටින වඳුරන්ට ආහාර දීමෙන් විනෝද වන්න.", serv_transfer_desc: "මාතර නගරය තුළ පිහිටි ඔබේ හෝටලයේ සිට නොමිලේ ප්‍රවාහන පහසුකම් සපයනු ලැබේ.",
            serv_safari_desc_long: "අපගේ ආරක්ෂිත සහ වාරික බෝට්ටු වලින් නිල්වලා ගඟේ කඩොලාන පරිසරය හරහා විස්මිත චාරිකාවක යෙදෙන්න.",
            serv_watch_desc_long: "අපගේ පළපුරුදු මඟපෙන්වන්නන් සමඟ නිල්වලා ගඟේ වෙසෙන යෝධ කරදිය කිඹුලන් ඔවුන්ගේ ස්වාභාවික පරිසරයේදී ආරක්ෂිතව දැකබලා ගන්න.",
            serv_bird_desc_long: "කුරුලු ලෝලීන්ට පාරාදීසයක්! මාටින් පක්ෂීන්, රාජාලියන් සහ ලස්සන කොක්කු දැකබලා ගන්න.",
            serv_fish_desc_long: "ඔබේ සෆාරි ගමන අතරතුර සාම්ප්‍රදායික මසුන් ඇල්ලීමේ අත්දැකීමක් ලබා ගන්න.",
            serv_monkey_desc_long: "ගඟ ඉවුර දිගේ සිටින මිත්‍රශීලී වඳුරන් සමඟ ආරක්ෂිතව සහ විනෝදජනක ලෙස ආහාර ලබා දීමේ අත්දැකීම ලබා ගන්න.",
            serv_transfer_desc_long: "පහසු ප්‍රවාහනය! ඔබගේ උපරිම පහසුව සඳහා අපි මාතර නගරය අවට නොමිලේ ප්‍රවාහන පහසුකම් සපයන්නෙමු.",
            hospitality_badge: "VIP සත්කාරය", hospitality_title: "නැව මත කෙටි ආහාර", hospitality_desc: "අපි සෑම අමුත්තෙකුටම රජෙකුට මෙන් සලකමු. ඔබේ සුවපහසුව අපගේ අවසාන ප්‍රමුඛතාවයයි.",
            refresh_1: "තැඹිලි: නැවුම්, සිසිල් සහ ප්‍රබෝධමත් දේශීය පිළිගැනීමේ පානය.",
            refresh_2: "නැවුම් පලතුරු: ශ්‍රී ලංකාවේ හොඳම මිහිරි නිවර්තන පලතුරු තැටියක්.",
            refresh_3: "කෑම සහ ජලය: ගුණාත්මක කෙටි ආහාර සහ අසීමිත බෝතල් කළ ජලය සපයනු ලැබේ.",
            refresh_4: "ඉල්ලීම මත ආහාර: ගඟේ සිට භුක්ති විඳීමට අව්‍යාජ, රසවත් ශ්‍රී ලංකාවේ උදේ ආහාරය හෝ දිවා ආහාරය කලින් වෙන්කරවා ගන්න!",
            monk_title: "වඳුරන්ට ආහාර ලබා දීම", monk_subtitle: "සජීවී වනජීවී", monk_desc: "නිල්වලා ගඟ ඉවුර දිගේ සශ්‍රීක කඩොලාන වනාන්තරවල වාසය කරන සෙල්ලක්කාර දේශීය වඳුරන් සමඟ සමීප අත්දැකීමක් ලබා ගන්න.",
            monk_feat_1: "පරිපූර්ණ ඡායාරූප අවස්ථා: මෙම කුතුහලයෙන් පිරුණු සත්වයන්ගේ අපූරු ඡායාරූප ගන්න.",
            monk_feat_2: "ආරක්ෂිත සහ විනෝදජනක: සියලුම වයස් කාණ්ඩ සඳහා සුදුසු ප්‍රීතිමත් සහ ආරක්ෂිත අත්දැකීමක්.",
            monk_feat_3: "පරිසර හිතකාමී ප්‍රවේශය: අපගේ ආහාර ලබා දීමේ ක්‍රම වන සතුන්ට හිතකර වන බව අපි සහතික කරමු.",
            on_the_house: "නොමිලේ", complimentary: "අනුග්‍රහයෙන්",
            book_tour: "දැන්ම වෙන්කරවා ගන්න",
            gallery: "ඡායාරූප", view_gallery: "සියලුම ඡායාරූප බලන්න", croc_king_desc: "නිල්වලා ගඟේ අසමසම රජු", stork_title: "ලස්සන කොක්කු", stork_desc: "දියමත ඇවිදිමින් දඩයම් කරන ලස්සන සුදු කොක්කු", boat_title: "වාරික සෆාරි බෝට්ටු", boat_desc: "උපරිම සුවපහසුව සහ ආරක්ෂාව",
            pack_badge: "මිල ගණන්", packages: "පැකේජ", pack_subtitle: "ඔබේ අවශ්‍යතාවයට සරිලන පරිදි අප සතුව ඇති හොඳම පැකේජය තෝරාගන්න.", pack_standard: "සාමාන්්‍ය සෆාරි", pack_vip: "VIP හිරු බැසයන සංචාරය", pack_photo: "ඡායාරූපකරණ සංචාරය",
            feat_1h: "පැයක බෝට්ටු සංචාරය", feat_guide: "මඟපෙන්වන්නෙකු ඇතුළත් වේ", feat_jacket: "ආරක්ෂිත කබා (Life Jackets)", feat_slots: "උදෑසන / සවස වේලාවන්",
            feat_2h: "පැය දෙකක විශේෂ සංචාරය", feat_nat: "විශේෂිත වනජීවී මඟපෙන්වන්නෙක්", feat_refresh: "නොමිලේ අමතර ආහාර පැන්", feat_boat: "සුවපහසු වාරික බෝට්ටු",
            feat_3h: "පැය තුනක විශේෂ කුලී පදනම", feat_close: "කිඹුලන් අසලටම යාම", feat_prof: "ඡායාරූප ශිල්පීන්ට කදිමයි", feat_early: "උදෑසන පිටත්වීම",
            book_standard: "සාමාන්්‍ය සෆාරි වෙන්කරන්න", book_vip: "VIP සංචාරය වෙන්කරන්න", book_photo: "ඡායාරූප සංචාරය වෙන්කරන්න", most_popular: "වඩාත් ජනප්‍රිය",
            reviews: "සමාලෝචන", explorers: "සංචාරකයින්", review_subtitle: "අප සමඟ සංචාරය කළ අයගේ අත්දැකීම් මෙතැනින් කියවන්න.",
            rev_1_text: "ඇත්තටම පුදුම අත්දැකීමක්! මඟපෙන්වන්නන් ඉතා දැනුමෙන් යුක්තයි වගේම ආරක්ෂාව ගැන ගොඩක් හිතනවා. යෝධ කිඹුලන් දැකපු එක කවදාවත් අමතක වෙන්නේ නෑ.",
            rev_2_text: "ශ්‍රී ලංකා සංචාරයේ හොඳම මතකය! බෝට්ටු ඉතා පහසුයි වගේම හිරු බැසයන දර්ශනය විස්මිතයි. අපි කිඹුලන් 6 දෙනෙක් විතර සහ කොක්කු රංචු දැක්කා.",
            rev_3_text: "වනජීවී ඡායාරූප ශිල්පියෙකු ලෙස, මෙම පැකේජය මට ගොඩක් වැදගත් වුණා. හරිම වෙලාවට හරිම තැනට අපිව රැගෙන ගියා.",
            uk: "එක්සත් රාජධානිය", aus: "ඕස්ට්‍රේලියාව", germany: "ජර්මනිය",
            // FAQ
            faq_badge: "නිතර අසන පැන", faq_title: "නිතර අසන පැන", faq_title_q: "පැන", faq_desc: "වෙන්කිරීමට පෙර ඔබට ඇති ගැටළු වලට පිළිතුරු මෙතැනින් ලබා ගන්න.", more_faq: "තවමත් ගැටළු පවතීද?",
            faq_q1: "කිඹුලන් අසලට යාම ආරක්ෂිතද?", faq_a1: "නියත වශයෙන්ම. ඔබගේ ආරක්ෂාව අපගේ අංක 1 ප්‍රමුඛතාවයයි. ඒ සඳහා අප සතුව විශේෂිත බෝට්ටු ඇති අතර අපගේ මඟපෙන්වන්නන් වසර 10 කට වඩා පළපුරුදු අය වෙති.",
            faq_q2: "කිඹුලන් බැලීමට හොඳම කාලය කවදාද?", faq_a2: "සාමාන්යයෙන් උදෑසන (7AM-9AM) හෝ සවස් කාලයේ (4PM-6PM) කිඹුලන් ගොඩට ඒම සිදු වේ.",
            faq_q3: "ආරක්ෂිත කබා ලබා දෙනවාද?", faq_a3: "ඔව්, සෑම අමුත්තෙකුටම උසස් තත්ත්වයේ ආරක්ෂිත කබා (Life Jackets) ලබා දෙන අතර ඒවා පැළඳ සිටීම අනිවාර්ය වේ.",
            faq_q4: "කැමරා උපකරණ ගෙන ඒමට හැකිද?", faq_a4: "ඔව්, අපගේ බෝට්ටු ඉතා ආරක්ෂිතයි. වනජීවී ඡායාරූප ගැනීමට මෙය ඉතා සුදුසු වේ.",
            // Booking
            booking: "වෙන්කිරීම්", book_title: "ඔබේ සෆාරිය වෙන්කරන්න", book_title_part2: "වෙන්කරන්න", book_desc: "පහත පෝරමය පුරවා ඔබේ වෙන්කිරීම යොමු කරන්න. අපි ඉක්මනින්ම ඔබව සම්බන්ධ කරගන්නෙමු!",
            form_name: "ඔබේ නම", form_phone: "දුරකථන / WhatsApp අංකය", form_guests: "සංචාරකයින් සංඛ්‍යාව", form_special: "විශේෂ ඉල්ලීම් (අත්‍යවශ්‍ය නොවේ)", form_submit: "වෙන්කිරීම සඳහා යොමුකරන්න", sel_package: "පැකේජය තෝරන්න", other: "වෙනත් / නිශ්චිත නැත",
            footer_desc: "මාතර අංක 1 කිඹුලන් නැරඹීමේ සෆාරි සේවාව සමඟ වනජීවී අත්දැකීමක් ලබා ගන්න. ආරක්ෂාව සහ විශ්වාසය 100% ක් සහතිකයි.",
            footer_links: "පිටුවේ සබැඳි", footer_follow: "අපව අනුගමනය කරන්න",
            serv_hero_subtitle: "වනජීවී අත්දැකීම මනාව විඳින්න", serv_hero_title: "සුවිශේෂී වික්‍රමාන්විත සංචාරයන් සහ සේවාවන්",
            serv_badge: "අප ලබා දෙන සේවාවන්", serv_title_main: "වාරික සෆාරි අත්දැකීම්", serv_subtitle_main: "ඔබේ ජීවිතයට අමතක නොවන වික්‍රමාන්විත අත්දැකීමක් ලබා දීමට සකස් කළ සුඛෝපභෝගී සංචාරයන්.",
            hospitality_badge: "VIP සත්කාරය", hospitality_title: "සංචාරය අතරතුර ආහාර පාන", hospitality_desc: "අපි සෑම අමුත්තෙකුටම එක ලෙස ගෞරව කරනවා. බෝට්ටු සංචාරය අතරතුර රසවත් දේශීය ආහාර පාන රස බලන්න.",
            refresh_1: "තැඹිලි: නැවුම් සහ සිසිල් දේශීය පිළිගැනීමේ පානය.",
            refresh_2: "නැවුම් පලතුරු: ශ්‍රී ලංකාවේ රසවත් පලතුරු සහිත තැටියක්.",
            refresh_3: "ලංකාවේ තේ සහ කෝපි: ලොව සුපතල සැබෑ ලංකා තේ රසය ගඟ මැදදී අත්විඳින්න.",
            refresh_4: "දේශීය කෙටි කෑම: සංචාරය පුරා ඔබේ ශක්තිය රැක ගැනීමට උපකාරී වන රසවත් කෑම.",
            on_the_house: "නොමිලේ", complimentary: "නොමිලේ සපයනු ලැබේ",
            wild_hero_subtitle: "සොබාදහමේ අසිරිය", wild_hero_title: "නිල්වලා වනජීවී ලෝකය",
            wild_badge: "ගඟේ රජු", wild_title_croc: "ලංකාවේ කරදිය කිඹුලා", wild_subtitle_croc: "නිල්වලා ගඟේ ආධිපත්‍යය පතුරවන යෝධයන් ගැන රසවත් තොරතුරු.",
            wild_stat_teeth_num: "දත් 66 ක්", wild_stat_teeth_desc: "ඔවුහු තම දත් නිරන්තරයෙන් අලුත් කරති. ජීවිත කාලය පුරා දත් 8,000 ක් පමණ වැවිය හැක!",
            wild_stat_age_num: "වසර 70+ ක්", wild_stat_age_desc: "මෙම සතුන් මිනිසුන්ට වඩා වැඩි කාලයක් ජීවත් වීමේ හැකියාව පවතී.",
            wild_stat_bite_num: "බලවත්ම හනුව", wild_stat_bite_desc: "ලොව සිටින සතුන් අතරින් ඉතාමත් බලවත්ම සපා කෑමේ හැකියාව මොවුන් සතුය.",
            wild_stat_size_num: "යෝධ ප්‍රමාණය", wild_stat_size_desc: "පිරිමි සතුන් මීටර් 6 (අඩි 20) දක්වා වැඩිය හැකි අතර කිලෝග්‍රෑම් 1,000 කට වඩා බර විය හැක.",
            wild_ancient_title: "ගැඹුරු දියේ නිහඬ යෝධයෝ",
            wild_ancient_p1: "නිල්වලා ගඟේ දක්නට ලැබෙන කිඹුලන් ප්‍රධාන වශයෙන් කරදිය කිඹුලන් (Saltwater Crocodiles) ගණයට අයත් වේ. නමින් කරදිය වුවද ලුණු මිශ්‍ර ජලය සහ කරදිය යන ජල තත්වයන් දෙකටම ඔවුහු හොඳින් හැඩගැසී ජීවත් වෙති.",
            wild_ancient_p2: "ඔවුන් දක්ෂ දඩයම්කරුවන් වන අතර පැය ගණනාවක් නිහඬව ජලයේ රැඳී සිටිය හැකිය.",
            wild_ancient_didyouknow: "ඔබ දන්නවාද? කිඹුලන්ට රාත්‍රියේදී ඉතා හොඳින් පෙනේ. රාත්‍රී කාලයේදී ආලෝකය වැදුණු විට ඔවුන්ගේ දෑස් රතු පැහැයෙන් දිදුලනු දක්නට ලැබෙන්නේ එබැවිනි.",
            wild_badge_birds: "සුන්දර කුරුලු ලෝකය", wild_title_birds: "නිල්වලා ගඟේ කුරුල්ලෝ", wild_subtitle_birds: "නිල්වලා ගඟ යනු කිඹුලන්ට පමණක් නොව විවිධ වර්ගයේ පක්ෂීන්ටද කදිම පාරාදීසයකි.",
            bird_tag_1: "දේශීය යෝධයා", bird_title_1: "වර්ණවත් කොක්කු", bird_desc_1: "නිල්වලා ගං ඉවුරේ නිතර දැකිය හැකි ලස්සන පක්ෂි විශේෂයකි. මොවුන්ගේ කහ පැහැති හොට සහ රෝස පැහැති පියාපත් ගඟේ සුන්දරත්වය තවත් වැඩි කරයි.",
            bird_tag_2: "නිහඬ දඩයම්කරුවා", bird_title_2: "මහා සුදු කොකා", bird_desc_2: "ඉවසීමේ සහ සුන්දරත්වයේ සංකේතයකි. මෙම පක්ෂීන් දියමත ඉතා නිහඬව සිට ක්ෂණිකව පහර දී මසුන් දඩයම් කිරීමට දක්ෂයෝ වෙති.",
            gal_hero_subtitle: "සොබාදහම ඡායාරූපයට නැගීම", gal_hero_title: "අපගේ වනජීවී ඡායාරූප",
            gal_title: "වන පියස හා ජලජ අසිරිය", gal_subtitle: "නිල්වලා ගං ඉවුරේ සුන්දරත්වය සහ වනජීවීන්ගේ චමත්කාරජනක එකතුවක්.",
            // Global / Mobile
            call: "අමතන්න", book_now: "දැන්ම වෙන්කරන්න", chat: "පණිවිඩයක් එවන්න", special_offer: "විශේෂ දීමනාවක්!", claim_now: "දීමනාව ලබාගන්න",
            river_good: "යහපත්", river_normal: "සාමාන්‍ය", river_caution: "අවධානයෙන්", river_alert: "අවදානම්", river_label: "ගඟේ තත්වය", change_language: "භාෂාව වෙනස් කරන්න"
        },
        de: {
            nav_home: "Startseite", nav_services: "Leistungen", nav_packages: "Pakete", nav_gallery: "Galerie", nav_wildlife: "Wildtiere", nav_book: "Jetzt Buchen",
            hero_slogan_top: "BETRETEN SIE DAS REICH", hero_title: "Riesen des Flusses", hero_description: "Begeben Sie sich auf eine atemberaubende Bootssafari. Erleben Sie riesige Salzwasserkrokodile in ihrem natürlichen Lebensraum mit unseren sicheren und fachkundig geführten Touren.",
            hero_explore_packages: "Pakete erkunden", hero_watch_tour: "Tour ansehen",
            news_1: "Heimat des größten lebenden Salzwasserkrokodils in Sri Lanka", news_2: "Begegnen Sie dem ältesten bekannten Krokodil des Landes",
            news_largest_croc_dup: "Größtes Krokodil Sri Lankas", news_oldest_croc_dup: "Ältestes Krokodil",
            news_highest_pop_dup: "Höchste Krokodilpopulation in Sri Lanka (80 - 100 Individuen)", news_breathtaking_evenings_dup: "Erleben Sie atemberaubende Abende, wenn Tausende von Vögeln auf der Flussinsel zusammenkommen",
            about_welcome_badge: "Willkommen", about_title: "Erleben Sie Croc Kingdom", about_p1: "Im Herzen von Matara gelegen, beherbergt der Nilwala-Fluss einige der prächtigsten Salzwasserkrokodile in Sri Lanka. Bei Croc Kingdom bieten wir ein sicheres, aufregendes und unvergessliches Safari-Erlebnis, perfekt für Abenteuerlustige und Wildtierliebhaber.",
            about_p2: "Unsere modernen Boote und erfahrenen Guides sorgen dafür, dass Sie den alten Reptilien der Natur nahe kommen, während strenge Sicherheitsstandards eingehalten werden. Ob Sie ein Naturfotograf sind oder ein Familienabenteuer suchen, unsere Safari ist die perfekte Flucht in die Wildnis.",
            stat_safe: "Sicher & Zertifiziert", stat_exp: "10+ Jahre Erfahrung", stat_happy: "Zufriedene Gäste",
            serv_badge: "Premium-Angebote", serv_title: "Unsere Leistungen", serv_safari: "Bootssafari", serv_watch: "Krokodil- & Vogelbeobachtung", serv_bird: "Vogelbeobachtung", serv_fish: "Angelerlebnisse", serv_monkey: "Affenfütterung", serv_transfer: "Gratis Abhol- & Bringservice",
            serv_safari_desc: "Erkunden Sie den Nilwala-Fluss mit unseren sicheren und komfortablen Booten.", serv_watch_desc: "Erhalten Sie die Chance, die Riesen des Flusses und wunderschöne Vögel zu sehen.",
            serv_monkey_desc: "Viel Spaß beim Füttern von Affen in ihrem natürlichen Lebensraum entlang des Flusses.", serv_transfer_desc: "Wir bieten kostenlosen Transport von Ihrem Hotel innerhalb der Stadt Matara an.",
            serv_safari_desc_long: "Erleben Sie eine ruhige, aber aufregende Fahrt tief in die Mangroven des Nilwala-Flusses in unseren sicheren und komfortablen Premium-Booten.",
            serv_watch_desc_long: "Nähern Sie sich sicher und beobachten Sie massive Salzwasserkrokodile in ihrem natürlichen Lebensraum mit unseren erfahrenen Naturforschern.",
            serv_bird_desc_long: "Ein Paradies für Vogelliebhaber! Entdecken Sie exotische Eisvögel, Adler, Reiher und majestätische Storchenschwärme.",
            serv_fish_desc_long: "Genießen Sie entspannende, traditionelle Flussanglerlebnisse, die auf Entspannung während Ihrer Safari zugeschnitten sind.",
            serv_monkey_desc_long: "Interagieren Sie mit freundlichen einheimischen Makaken an den Flussufern mit sicheren und unterhaltsamen Fütterungsaktivitäten.",
            serv_transfer_desc_long: "Stressfreie Beförderung! Wir bieten einen absolut kostenlosen lokalen Abhol- und Bringservice für Ihren maximalen Komfort.",
            hospitality_badge: "VIP Gastfreundschaft", hospitality_title: "Erfrischungen an Bord", hospitality_desc: "Wir behandeln jeden Gast wie einen König. Entspannen Sie sich auf unseren Premium-Safari-Booten, während wir uns während der Tour um all Ihre Wünsche kümmern.",
            refresh_1: "Königskokosnuss (Thambili): Frische, kalte und erfrischende lokale Begrüßungsgetränke.",
            refresh_2: "Frische saisonale Früchte: Eine Platte mit den feinsten süßen tropischen Früchten Sri Lankas.",
            refresh_3: "Snacks & Wasser: Hochwertige Snacks und unbegrenztes Wasser in Flaschen zur Verfügung gestellt.",
            refresh_4: "Mahlzeiten auf Anfrage: Buchen Sie ein authentisches, leckeres sri-lankisches Frühstück oder Mittagessen für unterwegs!",
            monk_title: "Affenfütterung", monk_subtitle: "Interaktive Wildtiere", monk_desc: "Erleben Sie die verspielten einheimischen Makaken hautnah, die in den üppigen Mangrovenwäldern entlang der Nilwala-Ufer leben.",
            monk_feat_1: "Perfekte Fotomöglichkeiten: Machen Sie erstaunliche Nahaufnahmen dieser neugierigen und liebenswerten Kreaturen.",
            monk_feat_2: "Sicher & Lustig: Ein unterhaltsames und sicheres interaktives Fütterungserlebnis für alle Altersgruppen.",
            monk_feat_3: "Umweltfreundlicher Ansatz: Wir stellen sicher, dass unsere Fütterungspraktiken gesund und umweltbewusst für die Affen sind.",
            on_the_house: "AUFS HAUS", complimentary: "Inbegriffen",
            book_tour: "Jetzt Buchen",
            gallery: "Galerie", view_gallery: "Vollständige Galerie", croc_king_desc: "Der unbestrittene König des Nilwala", stork_title: "Anmutige Störche (Kokku)", stork_desc: "Wunderschöne weiße Vögel jagen in den Untiefen", boat_title: "Premium Safari Boote", boat_desc: "Ultimativer Komfort und Sicherheit",
            pack_badge: "Preise", packages: "Pakete", pack_subtitle: "Wählen Sie das perfekte Abenteuer, das auf Ihre Bedürfnisse zugeschnitten ist.", pack_standard: "Standard Safari", pack_vip: "VIP-Sonnenuntergang", pack_photo: "Fototour",
            feat_1h: "1 Stunde Bootsfahrt", feat_guide: "Grundlegender Guide inklusive", feat_jacket: "Schwimmwesten werden gestellt", feat_slots: "Morgen- / Abendtermine",
            feat_2h: "2 Stunden geführte Tour", feat_nat: "Erfahrener Naturführer", feat_refresh: "Kostenlose Erfrischungen", feat_boat: "Premium-Sitzboot",
            feat_3h: "3 Stunden exklusive Anmietung", feat_close: "Nahaufnahmen", feat_prof: "Ideal für Profis", feat_early: "Frühe Morgenabfahrt",
            book_standard: "Standard buchen", book_vip: "VIP buchen", book_photo: "Foto buchen", most_popular: "Sehr Beliebt",
            reviews: "Bewertungen", explorers: "Entdecker", review_subtitle: "Lesen Sie echte Erfahrungen von Abenteurern, die an unserer Nilwala-Safari teilgenommen haben.",
            rev_1_text: "Absolut umwerfend! Die Guides waren unglaublich sachkundig und Sicherheit hatte oberste Priorität. Diese massiven Salzwasserkrokodile im goldenen Licht der Abendstunden zu sehen, war eine Erinnerung fürs Leben.",
            rev_2_text: "Der Höhepunkt unserer Sri Lanka Reise! Croc Kingdom bietet professionelle Boote und die Sonnenuntergangstour war atemberaubend. Wir sahen über 6 massive Krokodile und wunderschöne Storchenschwärme. Jeden Cent wert!",
            rev_3_text: "Als Wildtierfotograf war das Fotopaket genau das, was ich brauchte. Der Guide wusste genau, wo sich die großen versteckten und positionierte das Boot perfekt für das Licht.",
            uk: "Vereinigtes Königreich", aus: "Australien", germany: "Deutschland",
            faq_badge: "FAQ", faq_title: "Häufig gestellte Fragen", faq_title_q: "Fragen", faq_desc: "Haben Sie Fragen, bevor Sie buchen? Hier sind die häufigsten Fragen unserer Abenteurer.", more_faq: "Noch Fragen?",
            faq_q1: "Ist es sicher, sich den Krokodilen zu nähern?", faq_a1: "Absolut. Ihre Sicherheit ist unsere oberste Priorität. Unsere Premium-Boote sind speziell für Krokodilsafaris mit hohen Seiten und stabilen Decks konzipiert. Unsere Guides haben über 10 Jahre Erfahrung in der Navigation des Nilwala-Flusses und halten stets einen strengen, sicheren Abstand ein.",
            faq_q2: "Wann ist die beste Zeit, um Krokodile zu sehen?", faq_a2: "Die besten Sichtungen sind normalerweise am frühen Morgen (7-9 Uhr) oder am späten Nachmittag (16-18 Uhr), wenn Krokodile zum Sonnenbaden an die Ufer kommen. Sonnenuntergangstouren bieten magisches Licht für die Fotografie.",
            faq_q3: "Stellen Sie Schwimmwesten zur Verfügung?", faq_a3: "Ja, Sicherheit ist obligatorisch. Wir stellen hochwertige Schwimmwesten für alle Passagiere zur Verfügung, einschließlich spezieller Größen für Kinder, die während der gesamten Safari getragen werden müssen.",
            faq_q4: "Kann ich meine Kameraausrüstung mitbringen?", faq_a4: "Absolut! Unsere Boote sind sehr stabil und perfekt für die Fotografie. Wir empfehlen, ein Objektiv mit gutem Zoom (200mm+) mitzubringen, um detaillierte Aufnahmen der Krokodile und Vögel zu machen.",
            book_title: "Sichern Sie sich Ihre Safari", book_title_part2: "Safari", book_desc: "Füllen Sie das untenstehende Formular aus, um eine Buchung anzufragen. Wir werden Ihre Reservierung in Kürze überprüfen und bestätigen!",
            form_name: "Ihr Name", form_phone: "Telefon / WhatsApp", form_guests: "Anzahl der Gäste", form_special: "Besondere Wünsche? (Optional)", form_submit: "Buchungsanfrage senden", sel_package: "Paket auswählen", other: "Andere / Unsicher",
            footer_desc: "Erleben Sie den Nervenkitzel der Wildnis mit Mataras führender Krokodil-Bootssafari. Sicherheit, Abenteuer und unvergessliche Erinnerungen garantiert.",
            footer_links: "Schnelllinks", footer_follow: "Folgen Sie uns",
            serv_hero_subtitle: "ERLEBEN SIE DIE WILDNIS", serv_hero_title: "Exklusive Abenteuer & Dienstleistungen",
            serv_badge: "Was wir anbieten", serv_title_main: "Premium Safari Erlebnisse", serv_subtitle_main: "Ein vollständig geführtes, luxuriöses Naturabenteuer, das Ihnen den Nervenkitzel Ihres Lebens bescheren wird.",
            wild_hero_subtitle: "WUNDER DER NATUR", wild_hero_title: "Entdecken Sie die Tierwelt des Nilwala",
            wild_badge: "Der Spitzenprädator", wild_title_croc: "Das Salzwasserkrokodil", wild_subtitle_croc: "Faszinierende Fakten über die alten Giganten, die den Nilwala-Fluss beherrschen.",
            wild_stat_teeth_num: "66 Zähne", wild_stat_teeth_desc: "Sie ersetzen ständig Zähne. Im Laufe ihres Lebens können sie bis zu 8.000 Zähne entwickeln!",
            wild_stat_age_num: "70+ Jahre", wild_stat_age_desc: "Diese alten Reptilien haben eine unglaublich lange Lebensdauer und überleben oft Menschen.",
            wild_stat_bite_num: "Stärkster Biss", wild_stat_bite_desc: "Sie haben die stärkste Bisskraft aller lebenden Tiere (über 3.700 PSI).",
            wild_stat_size_num: "Massive Größe", wild_stat_size_desc: "Männchen können eine Länge von bis zu 6 Metern (20 Fuß) erreichen und über 1.000 kg wiegen.",
            wild_ancient_title: "Alte Überlebende der Tiefe",
            wild_ancient_p1: "Die im Nilwala-Fluss gefundenen Krokodile sind hauptsächlich Salzwasserkrokodile (Crocodylus porosus). Trotz ihres Namens sind sie extrem anpassungsfähig und gedeihen in den Brack- und Süßwasserumgebungen des Flusses.",
            wild_ancient_p2: "Sie sind Lauerjäger, die stundenlang perfekt still im trüben Wasser verharren können, wobei nur ihre Augen und Nasenlöcher über die Oberfläche ragen.",
            wild_ancient_didyouknow: "Wussten Sie schon? Krokodile haben tatsächlich eine ausgezeichnete Nachtsicht. Während unserer Sonnenuntergangstouren können ihre Augen manchmal rot leuchten, wenn Licht im Dunkeln von ihnen reflektiert wird.",
            wild_badge_birds: "Luftige Schönheit", wild_title_birds: "Vögel des Flusses", wild_subtitle_birds: "Nilwala ist nicht nur Krokodile; es ist auch ein Paradies für exotische Vogelbeobachter.",
            bird_tag_1: "Lokaler Riese", bird_title_1: "Der Buntstorch", bird_desc_1: "Lokal bekannt als 'Kokku', sind diese majestätischen Watvögel ein häufiger Anblick entlang der Nilwala-Ufer. Mit ihren leuchtend gelben Schnäbeln und zart rosa getönten Flügeln bilden sie eine atemberaubende Silhouette vor dem Flussdach.",
            bird_tag_2: "Stiller Jäger", bird_title_2: "Großer Weißer Reiher", bird_desc_2: "Ein Symbol für Geduld und Anmut. Reiher sind Meisterjäger, die minutenlang perfekt regungslos im seichten Wasser stehen, bevor sie blitzschnell zuschlagen, um kleine Fische und Flussgarnelen zu fangen.",
            gal_hero_subtitle: "Natur einfangen", gal_hero_title: "Unsere Wildtier-Galerie",
            gal_title: "Vögel & Bestien", gal_subtitle: "Eine atemberaubende Sammlung majestätischer Krokodile, wunderschöner Störche (Kokku) und malerischer Ausblicke vom Nilwala-Fluss.",
            // Global / Mobile
            call: "Anrufen", book_now: "Buchen", chat: "Chatten", special_offer: "Sonderangebot!", claim_now: "Sichern",
            river_good: "Gut", river_normal: "Normal", river_caution: "Vorsicht", river_alert: "Alarm", river_label: "Flusszustand", change_language: "Sprache Ändern"
        },
        ru: {
            nav_home: "Главная", nav_services: "Услуги", nav_packages: "Пакеты", nav_gallery: "Галерея", nav_wildlife: "Природа", nav_book: "Забронировать",
            hero_slogan_top: "ВОЙДИТЕ В ЦАРСТВО", hero_title: "Гиганты реки", hero_description: "Отправьтесь на захватывающее лодочное сафари. Посмотрите на огромных морских крокодилов в их естественной среде обитания с нашими безопасными и экспертно-руководимыми турами.",
            hero_explore_packages: "Посмотреть пакеты", hero_watch_tour: "Смотреть тур",
            news_1: "Дом самого большого живого морского крокодила в Шри-Ланке", news_2: "Встретьтесь с старейшим известным крокодилом в стране",
            news_largest_croc_dup: "Дом самого большого живого морского крокодила в Шри-Ланке", news_oldest_croc_dup: "Встретьтесь с старейшим известным крокодилом в стране",
            news_highest_pop_dup: "Самая высокая популяция крокодилов в Шри-Ланке (80 - 100 особей)", news_breathtaking_evenings_dup: "Наблюдайте захватывающие вечера, когда тысячи птиц собираются на речном острове",
            about_welcome_badge: "Добро пожаловать", about_title: "Посетите Croc Kingdom", about_p1: "Расположенная в самом сердце Матары, река Нилвала является домом для самых величественных морских крокодилов в Шри-Ланке. В Croc Kingdom мы предлагаем безопасное, захватывающее и незабываемое сафари, идеально подходящее как для любителей приключений, так и для любителей дикой природы.",
            about_p2: "Наши современные лодки и опытные гиды гарантируют, что вы сможете близко познакомиться с древними рептилиями природы, соблюдая строгие стандарты безопасности. Независимо от того, являетесь ли вы фотографом природы или ищете семейное приключение, наше сафари — идеальный побег в дикую природу.",
            stat_safe: "Надежно и Безопасно", stat_exp: "10+ лет опыта", stat_happy: "Счастливых Гостей",
            serv_badge: "Премиум услуги", serv_title: "Наши услуги", serv_safari: "Сафари на лодке", serv_watch: "Наблюдение за крокодилами и птицами", serv_bird: "Наблюдение за птицами", serv_fish: "Рыбалка", serv_monkey: "Кормление обезьян", serv_transfer: "Бесплатный трансфер",
            serv_safari_desc: "Исследуйте реку Нилвала на наших безопасных и комфортабельных лодках.", serv_watch_desc: "Получите шанс увидеть гигантов реки и красивых птиц.",
            serv_monkey_desc: "Наслаждайтесь кормлением обезьян в их естественной среде обитания вдоль реки.", serv_transfer_desc: "Мы предлагаем бесплатный транспорт от вашего отеля в пределах города Матара.",
            serv_safari_desc_long: "Испытайте спокойную, но захватывающую поездку глубоко в мангровые заросли реки Нилвала на наших безопасных и комфортабельных премиум-лодках.",
            serv_watch_desc_long: "Безопасно приближайтесь и наблюдайте за массивными морскими крокодилами в их естественной среде обитания с нашими опытными натуралистами.",
            serv_bird_desc_long: "Рай для любителей птиц! Заметьте экзотических зимородков, орлов, цапель и величественные стаи аистов.",
            serv_fish_desc_long: "Насладитесь безмятежной, традиционной рыбалкой на реке, созданной для расслабления во время вашего сафари.",
            serv_monkey_desc_long: "Взаимодействуйте с дружелюбными местными макаками вдоль берегов реки с безопасными и приятными мероприятиями по кормлению.",
            serv_transfer_desc_long: "Беспроблемный транспорт! Мы предлагаем абсолютно бесплатный трансфер и высадку на месте для вашего максимального удобства.",
            hospitality_badge: "VIP Гостеприимство", hospitality_title: "Угощения на борту", hospitality_desc: "Мы относимся к каждому гостю как к королю. Расслабьтесь на борту наших премиум-сафари-лодок, пока мы заботимся обо всех ваших желаниях во время тура.",
            refresh_1: "Королевский кокос (Тамбили): Свежие, холодные и освежающие местные приветственные напитки.",
            refresh_2: "Свежие сезонные фрукты: Плато лучших сладких тропических фруктов Шри-Ланки.",
            refresh_3: "Закуски и вода: Качественные закуски и неограниченное количество бутилированной воды.",
            refresh_4: "Питание по запросу: Забронируйте аутентичный, вкусный ланкийский завтрак или обед, чтобы насладиться на реке!",
            monk_title: "Кормление обезьян", monk_subtitle: "Интерактивная природа", monk_desc: "Познакомьтесь поближе с игривыми местными макаками, обитающими в пышных мангровых лесах вдоль берегов реки Нилвала.",
            monk_feat_1: "Идеальные возможности для фото: Сделайте потрясающие фотографии этих любопытных и очаровательных существ.",
            monk_feat_2: "Безопасно и весело: Приятное и безопасное интерактивное кормление, подходящее для всех возрастов.",
            monk_feat_3: "Эко-подход: Мы гарантируем, что наши методы кормления полезны для здоровья и экологически безопасны для обезьян.",
            on_the_house: "ЗА СЧЕТ ЗАВЕДЕНИЯ", complimentary: "Бесплатно",
            book_tour: "Забронировать тур сейчас",
            gallery: "Галерея", view_gallery: "Вся галерея", croc_king_desc: "Бесспорный король Нилвалы", stork_title: "Изящные аисты (Кокку)", stork_desc: "Красивые белые птицы, охотящиеся на мелководье", boat_title: "Премиум-сафари-лодки", boat_desc: "Максимальный комфорт и безопасность",
            pack_badge: "Цены", packages: "Пакеты", pack_subtitle: "Выберите идеальное приключение, адаптированное к вашим потребностям.", pack_standard: "Стандарт сафари", pack_vip: "VIP закат", pack_photo: "Фото тур",
            feat_1h: "1 час прогулки на лодке", feat_guide: "Базовый гид включен", feat_jacket: "Спасательные жилеты предоставляются", feat_slots: "Утренние / Вечерние слоты",
            feat_2h: "2 часа экскурсии", feat_nat: "Опытный гид-натуралист", feat_refresh: "Бесплатные угощения", feat_boat: "Лодка с премиум-сиденьями",
            feat_3h: "3 часа эксклюзивной аренды", feat_close: "Приближение крупным планом", feat_prof: "Идеально для профессионалов", feat_early: "Ранний утренний выезд",
            book_standard: "Отправить запрос", book_vip: "Заказать VIP", book_photo: "Заказать фото", most_popular: "Популярный",
            reviews: "Отзывы", explorers: "Исследователи", review_subtitle: "Прочитайте реальные отзывы от искателей приключений, присоединившихся к нашему сафари по Нилвале.",
            rev_1_text: "Абсолютно потрясающе! Гиды были невероятно осведомлены, и безопасность была их главным приоритетом. Увидеть этих массивных морских крокодилов в свете золотого часа было незабываемым воспоминанием.",
            rev_2_text: "Изюминка нашей поездки по Шри-Ланке! Croc Kingdom предоставляет профессиональные лодки, и тур на закате был потрясающим. Мы видели более 6 массивных крокодилов и красивые стаи аистов. Стоит каждой копейки!",
            rev_3_text: "Как фотографу дикой природы, пакет для фотосъемки был именно тем, что мне нужно. Гид точно знал, где прячутся крупные особи, и идеально расположил лодку для света.",
            uk: "Великобритания", aus: "Австралия", germany: "Германия",
            faq_badge: "Часто задаваемые вопросы", faq_title: "Часто задаваемые вопросы", faq_title_q: "Вопросы", faq_desc: "Есть вопросы перед бронированием? Вот самые распространенные вопросы, которые задают наши искатели приключений.", more_faq: "Все еще есть вопросы?",
            faq_q1: "Безопасно ли приближаться к крокодилам?", faq_a1: "Абсолютно. Ваша безопасность — наш главный приоритет. Наши премиум-лодки специально разработаны для крокодиловых сафари с высокими бортами и устойчивыми палубами. Наши гиды имеют более 10 лет опыта навигации по реке Нилвала и всегда соблюдают строгое безопасное расстояние.",
            faq_q2: "Какое лучшее время для наблюдения за крокодилами?", faq_a2: "Лучшие наблюдения обычно бывают рано утром (7-9 утра) или поздно вечером (16-18 часов), когда крокодилы выходят погреться на берег. Туры на закате предлагают волшебное освещение для фотосъемки.",
            faq_q3: "Вы предоставляете спасательные жилеты?", faq_a3: "Да, безопасность обязательна. Мы предоставляем высококачественные спасательные жилеты для всех пассажиров, включая специальные размеры для детей, которые должны быть надеты на протяжении всего сафари.",
            faq_q4: "Могу ли я взять с собой фотооборудование?", faq_a4: "Абсолютно! Наши лодки очень устойчивы и идеально подходят для фотосъемки. Мы рекомендуем взять объектив с хорошим зумом (200 мм+), чтобы сделать детализированные снимки крокодилов и птиц.",
            book_title: "Забронируйте сафари", book_title_part2: "Сафари", book_desc: "Заполните форму ниже, чтобы отправить запрос на бронирование. Мы рассмотрим и подтвердим вашу бронь в ближайшее время!",
            form_name: "Ваше имя", form_phone: "Телефон / WhatsApp", form_guests: "Количество гостей", form_special: "Особые пожелания? (Необязательно)", form_submit: "Отправить запрос на бронирование", sel_package: "Выбрать пакет", other: "Другое / Не уверен",
            footer_desc: "Испытайте острые ощущения дикой природы с лучшим сафари на лодке по крокодилам в Матаре. Безопасность, приключения и воспоминания гарантированы.",
            footer_links: "Ссылки", footer_follow: "Мы в соцсетях",
            serv_hero_subtitle: "ОЩУТИТЕ ДИКУЮ ПРИРОДУ", serv_hero_title: "Эксклюзивные приключения и услуги",
            serv_badge: "Что мы предлагаем", serv_title_main: "Премиум-сафари", serv_subtitle_main: "Полностью управляемое, роскошное природное приключение, созданное для того, чтобы подарить вам незабываемые впечатления.",
            wild_hero_subtitle: "ЧУДЕСА ПРИРОДЫ", wild_hero_title: "Откройте для себя дикую природу Нилвалы",
            wild_badge: "Верховный хищник", wild_title_croc: "Морской крокодил", wild_subtitle_croc: "Увлекательные факты о древних гигантах, правящих рекой Нилвала.",
            wild_stat_teeth_num: "66 зубов", wild_stat_teeth_desc: "Они постоянно меняют зубы. За свою жизнь они могут вырастить до 8 000 зубов!",
            wild_stat_age_num: "70+ лет", wild_stat_age_desc: "Эти древние рептилии имеют невероятно долгую продолжительность жизни, часто переживая людей.",
            wild_stat_bite_num: "Сильнейший укус", wild_stat_bite_desc: "У них самая сильная сила укуса среди всех живых животных (более 3 700 PSI).",
            wild_stat_size_num: "Массивный размер", wild_stat_size_desc: "Самцы могут достигать длины до 6 метров (20 футов) и весить более 1 000 кг.",
            wild_ancient_title: "Древние выжившие из глубин",
            wild_ancient_p1: "Крокодилы, обитающие в реке Нилвала, в основном являются морскими крокодилами (Crocodylus porosus). Несмотря на свое название, они чрезвычайно адаптивны и процветают в солоноватых и пресноводных средах реки.",
            wild_ancient_p2: "Они являются хищниками из засады, способными оставаться совершенно неподвижными в мутной воде часами, при этом только их глаза и ноздри видны над поверхностью.",
            wild_ancient_didyouknow: "Знаете ли вы? Крокодилы на самом деле обладают отличным ночным зрением. Во время наших туров на закате их глаза иногда могут светиться красным, когда свет отражается от них в темноте.",
            wild_badge_birds: "Воздушная красота", wild_title_birds: "Птицы реки", wild_subtitle_birds: "Нилвала — это не только крокодилы; это также рай для любителей экзотических птиц.",
            bird_tag_1: "Местный гигант", bird_title_1: "Расписной аист", bird_desc_1: "Известные как 'Кокку', эти величественные болотные птицы часто встречаются вдоль берегов Нилвалы. С их ярко-желтыми клювами и нежно-розовыми крыльями они создают потрясающий силуэт на фоне речного полога.",
            bird_tag_2: "Тихий охотник", bird_title_2: "Большая белая цапля", bird_desc_2: "Символ терпения и грации. Цапли — мастера охоты, стоящие совершенно неподвижно на мелководье в течение нескольких минут, прежде чем молниеносно нанести удар, чтобы поймать мелкую рыбу и речных креветок.",
            gal_hero_subtitle: "Запечатлевая природу", gal_hero_title: "Наша фотогалерея дикой природы",
            gal_title: "Птицы и Звери", gal_subtitle: "Потрясающая коллекция величественных крокодилов, красивых аистов (Кокку) и живописных видов реки Нилвала.",
            // Global / Mobile
            call: "Позвонить", book_now: "Заказать", chat: "Чат", special_offer: "Акция!", claim_now: "Получить",
            river_good: "Хорошо", river_normal: "Нормально", river_caution: "Осторожно", river_alert: "Тревога", river_label: "Состояние реки", change_language: "Сменить язык"
        },
        fr: {
            nav_home: "Accueil", nav_services: "Services", nav_packages: "Forfaits", nav_gallery: "Galerie", nav_wildlife: "Vie Sauvage", nav_book: "Réserver",
            hero_slogan_top: "ENTREZ DANS LE ROYAUME", hero_title: "Géants de la Rivière", hero_description: "Embarquez pour un safari en bateau époustouflant. Observez d'énormes crocodiles marins dans leur habitat naturel avec nos visites sûres et guidées par des experts.",
            hero_explore_packages: "Explorer les Forfaits", hero_watch_tour: "Voir la Visite",
            news_1: "Abrite le plus grand crocodile marin vivant du Sri Lanka", news_2: "Rencontrez le plus ancien crocodile connu du pays",
            news_largest_croc_dup: "Abrite le plus grand crocodile marin vivant du Sri Lanka", news_oldest_croc_dup: "Rencontrez le plus ancien crocodile connu du pays",
            news_highest_pop_dup: "Plus grande population de crocodiles au Sri Lanka (80 - 100 individus)", news_breathtaking_evenings_dup: "Assistez à des soirées à couper le souffle alors que des milliers d'oiseaux se rassemblent sur l'île fluviale",
            about_welcome_badge: "Bienvenue", about_title: "Découvrez Croc Kingdom", about_p1: "Située au cœur de Matara, la rivière Nilwala abrite certains des plus magnifiques crocodiles marins du Sri Lanka. Chez Croc Kingdom, nous offrons une expérience de safari sûre, passionnante et inoubliable, parfaitement conçue pour les amateurs d'aventure et les passionnés de faune.",
            about_p2: "Nos bateaux modernes et nos guides expérimentés vous permettent d'approcher les anciens reptiles de la nature tout en respectant des normes de sécurité strictes. Que vous soyez photographe animalier ou à la recherche d'une aventure en famille, notre safari est l'évasion parfaite dans la nature.",
            stat_safe: "Sûr et Sécurisé", stat_exp: "10+ ans d'expérience", stat_happy: "Explorateurs Heureux",
            serv_badge: "Offres Premium", serv_title: "Nos Services", serv_safari: "Safari en bateau", serv_watch: "Observation de crocodiles et d'oiseaux", serv_bird: "Observation d'oiseaux", serv_fish: "Expériences de pêche", serv_monkey: "Nourrissage de singes", serv_transfer: "Transfert gratuit",
            serv_safari_desc: "Explorez la rivière Nilwala avec nos bateaux sûrs et confortables.", serv_watch_desc: "Ayez la chance de voir les géants de la rivière et de beaux oiseaux.",
            serv_monkey_desc: "Profitez de nourrir les singes dans leur habitat naturel le long de la rivière.", serv_transfer_desc: "Nous offrons un transport gratuit depuis votre hôtel dans la ville de Matara.",
            serv_safari_desc_long: "Vivez une promenade calme mais palpitante au cœur des mangroves de la rivière Nilwala dans nos bateaux premium sûrs et confortables.",
            serv_watch_desc_long: "Approchez et observez en toute sécurité les crocodiles marins massifs dans leur habitat naturel avec nos naturalistes experts.",
            serv_bird_desc_long: "Un paradis pour les amoureux des oiseaux ! Observez des martins-pêcheurs exotiques, des aigles, des aigrettes et de majestueux vols de cigognes.",
            serv_fish_desc_long: "Profitez d'expériences de pêche fluviale sereines et traditionnelles, conçues pour la détente pendant votre safari.",
            serv_monkey_desc_long: "Interagissez avec les macaques indigènes amicaux le long des berges du fleuve grâce à des activités de nourrissage sûres et agréables.",
            serv_transfer_desc_long: "Transport sans tracas ! Nous proposons un service de prise en charge et de dépose local absolument gratuit pour votre plus grand confort.",
            hospitality_badge: "Hospitalité VIP", hospitality_title: "Rafraîchissements à bord", hospitality_desc: "Nous traitons chaque invité comme un roi. Détendez-vous sur nos bateaux de safari de première qualité pendant que nous prenons soin de toutes vos envies à mi-parcours.",
            refresh_1: "Noix de coco royale (Thambili) : Boissons de bienvenue locales fraîches, froides et rafraîchissantes.",
            refresh_2: "Fruits de saison frais : Un plateau des meilleurs fruits tropicaux sucrés du Sri Lanka.",
            refresh_3: "Snacks & Eau : Collations de qualité et eau en bouteille illimitée fournies.",
            refresh_4: "Repas sur demande : Réservez un authentique et délicieux petit-déjeuner ou déjeuner sri-lankais à déguster sur la rivière !",
            monk_title: "Nourrissage des singes", monk_subtitle: "Vie sauvage interactive", monk_desc: "Approchez-vous des macaques indigènes joueurs qui habitent les forêts de mangroves luxuriantes le long des rives du fleuve Nilwala.",
            monk_feat_1: "Opportunités de photos parfaites : Capturez d'incroyables photos en gros plan de ces créatures curieuses et adorables.",
            monk_feat_2: "Sûr & Amusant : Une expérience de nourrissage interactive joyeuse et sûre, adaptée à tous les âges.",
            monk_feat_3: "Approche éco-responsable : Nous veillons à ce que nos pratiques de nourrissage soient saines et respectueuses de l'environnement pour les singes.",
            on_the_house: "OFFERT PAR LA MAISON", complimentary: "Gratuit",
            book_tour: "Réserver un tour maintenant",
            gallery: "Galerie", view_gallery: "Voir la galerie complète", croc_king_desc: "Le roi incontesté du Nilwala", stork_title: "Cigognes gracieuses (Kokku)", stork_desc: "De beaux oiseaux blancs chassant dans les bas-fonds", boat_title: "Bateaux de safari premium", boat_desc: "Confort et sécurité ultimes",
            pack_badge: "Tarifs", packages: "Forfaits", pack_subtitle: "Choisissez l'aventure parfaite adaptée à vos besoins.", pack_standard: "Safari Standard", pack_vip: "Croisière VIP au coucher du soleil", pack_photo: "Safari Photo",
            feat_1h: "1 heure de promenade en bateau", feat_guide: "Guide de base inclus", feat_jacket: "Gilets de sauvetage fournis", feat_slots: "Créneaux matin / soir",
            feat_2h: "2 heures de visite guidée", feat_nat: "Guide naturaliste expert", feat_refresh: "Rafraîchissements offerts", feat_boat: "Bateau avec sièges premium",
            feat_3h: "3 heures de location exclusive", feat_close: "Approche rapprochée", feat_prof: "Idéal pour les professionnels", feat_early: "Départ tôt le matin",
            book_standard: "Réserver Standard", book_vip: "Réserver VIP", book_photo: "Réserver Photo", most_popular: "Le plus populaire",
            reviews: "Avis", explorers: "Explorateurs", review_subtitle: "Lisez les expériences réelles des aventuriers qui ont rejoint notre safari Nilwala.",
            rev_1_text: "Absolument époustouflant ! Les guides étaient incroyablement compétents et la sécurité était leur priorité absolue. Voir ces énormes crocodiles marins à l'heure dorée était un souvenir pour la vie.",
            rev_2_text: "Le point culminant de notre voyage au Sri Lanka ! Croc Kingdom propose des bateaux professionnels et la visite au coucher du soleil était magnifique. Nous avons vu plus de 6 crocodiles massifs et de magnifiques vols de cigognes. Ça vaut chaque centime !",
            rev_3_text: "En tant que photographe animalier, le forfait photographie était exactement ce dont j'avais besoin. Le guide savait exactement où se cachaient les grands et a positionné le bateau parfaitement pour la lumière.",
            uk: "Royaume-Uni", aus: "Australie", germany: "Allemagne",
            faq_badge: "FAQ", faq_title: "Questions fréquemment posées", faq_title_q: "Questions", faq_desc: "Vous avez des questions avant de réserver ? Voici les questions les plus courantes que nos aventuriers nous posent.", more_faq: "Encore des questions ?",
            faq_q1: "Est-il sûr de s'approcher des crocodiles ?", faq_a1: "Absolument. Votre sécurité est notre priorité n°1. Nos bateaux premium sont spécialement conçus pour les safaris aux crocodiles avec des côtés hauts et des ponts stables. Nos guides ont plus de 10 ans d'expérience dans la navigation sur la rivière Nilwala et maintiennent toujours une distance de sécurité stricte.",
            faq_q2: "Quel est le meilleur moment pour voir des crocodiles ?", faq_a2: "Les meilleures observations ont généralement lieu tôt le matin (7h-9h) ou en fin d'après-midi (16h-18h) lorsque les crocodiles sortent pour prendre un bain de soleil sur les rives. Les visites au coucher du soleil offrent un éclairage magique pour la photographie.",
            faq_q3: "Fournissez-vous des gilets de sauvetage ?", faq_a3: "Oui, la sécurité est obligatoire. Nous fournissons des gilets de sauvetage de haute qualité pour tous les passagers, y compris des tailles spécialisées pour les enfants, qui doivent être portés pendant toute la durée du safari.",
            faq_q4: "Puis-je apporter mon équipement photo ?", faq_a4: "Absolument ! Nos bateaux sont très stables et parfaits pour la photographie. Nous suggérons d'apporter un objectif avec un bon zoom (200mm+) pour capturer des clichés détaillés des crocodiles et des oiseaux.",
            book_title: "Réservez votre safari", book_title_part2: "Safari", book_desc: "Remplissez le formulaire ci-dessous pour demander une réservation. Nous examinerons et confirmerons votre réservation sous peu !",
            form_name: "Votre nom", form_phone: "Téléphone / WhatsApp", form_guests: "Nombre d'invités", form_special: "Demandes spéciales ? (Facultatif)", form_submit: "Envoyer ma demande de réservation", sel_package: "Sélectionner un forfait", other: "Autre / Incertain",
            footer_desc: "Vivez le frisson de la nature sauvage avec le safari en bateau aux crocodiles n°1 de Matara. Sécurité, aventure et souvenirs garantis.",
            footer_links: "Liens rapides", footer_follow: "Suivez-nous",
            serv_hero_subtitle: "VIVEZ LA NATURE SAUVAGE", serv_hero_title: "Aventures et services exclusifs",
            serv_badge: "Ce que nous offrons", serv_title_main: "Expériences de safari premium", serv_subtitle_main: "Une aventure naturelle luxueuse et entièrement guidée, conçue pour vous offrir le frisson d'une vie.",
            wild_hero_subtitle: "MERVEILLES DE LA NATURE", wild_hero_title: "Découvrez la faune de Nilwala",
            wild_badge: "Le prédateur suprême", wild_title_croc: "Le crocodile marin", wild_subtitle_croc: "Faits fascinants sur les anciens géants régnant sur la rivière Nilwala.",
            wild_stat_teeth_num: "66 Dents", wild_stat_teeth_desc: "Ils remplacent constamment leurs dents. Au cours de leur vie, ils peuvent développer jusqu'à 8 000 dents !",
            wild_stat_age_num: "70+ Ans", wild_stat_age_desc: "Ces anciens reptiles ont une durée de vie incroyablement longue, dépassant souvent celle des humains.",
            wild_stat_bite_num: "Morsure la plus forte", wild_stat_bite_desc: "Ils ont la force de morsure la plus puissante de tous les animaux vivants (plus de 3 700 PSI).",
            wild_stat_size_num: "Taille massive", wild_stat_size_desc: "Les mâles peuvent atteindre des longueurs allant jusqu'à 6 mètres (20 pieds) et peser plus de 1 000 kg.",
            wild_ancient_title: "Anciens survivants des profondeurs",
            wild_ancient_p1: "Les crocodiles trouvés dans la rivière Nilwala sont principalement des crocodiles marins (Crocodylus porosus). Malgré leur nom, ils sont extrêmement adaptables et prospèrent dans les environnements saumâtres et d'eau douce de la rivière.",
            wild_ancient_p2: "Ce sont des prédateurs d'embuscade, capables de rester parfaitement immobiles dans l'eau trouble pendant des heures, avec seulement leurs yeux et leurs narines exposés au-dessus de la surface.",
            wild_ancient_didyouknow: "Le saviez-vous ? Les crocodiles ont en fait une excellente vision nocturne. Lors de nos visites au coucher du soleil, leurs yeux peuvent parfois être vus rougeoyer lorsque la lumière se reflète sur eux dans l'obscurité.",
            wild_badge_birds: "Beauté aérienne", wild_title_birds: "Oiseaux de la rivière", wild_subtitle_birds: "Nilwala ne se limite pas aux crocodiles ; c'est aussi un paradis pour les observateurs d'oiseaux exotiques.",
            bird_tag_1: "Géant local", bird_title_1: "La cigogne peinte", bird_desc_1: "Localement connus sous le nom de 'Kokku', ces majestueux échassiers sont un spectacle courant le long des rives de Nilwala. Avec leurs becs jaune vif et leurs ailes délicatement teintées de rose, ils créent une silhouette époustouflante sur la canopée de la rivière.",
            bird_tag_2: "Chasseur silencieux", bird_title_2: "Grande aigrette blanche", bird_desc_2: "Un symbole de patience et de grâce. Les aigrettes sont des maîtres chasseurs, restant parfaitement immobiles dans les bas-fonds pendant des minutes avant de frapper à la vitesse de l'éclair pour attraper de petits poissons et des crevettes de rivière.",
            gal_hero_subtitle: "Capturer la nature", gal_hero_title: "Notre Galerie de la Faune",
            gal_title: "Oiseaux et Fauves", gal_subtitle: "Une collection époustouflante de crocodiles majestueux, de belles cigognes (Kokku) et de vues panoramiques de la rivière Nilwala.",
            // Global / Mobile
            call: "Appeler", book_now: "Réserver", chat: "Chat", special_offer: "Offre Spéciale!", claim_now: "Profiter",
            river_good: "Bon", river_normal: "Normal", river_caution: "Attention", river_alert: "Alerte", river_label: "État de la rivière", change_language: "Changer la langue"
        }
    };


    const setLanguage = (lang) => {
        localStorage.setItem('selected_lang', lang);
        const dict = translations[lang];

        // 1. Standard approach for all [data-t] elements
        document.querySelectorAll('[data-t]').forEach(el => {
            const key = el.getAttribute('data-t');
            if (dict[key]) {
                // If it's an input/textarea placeholder
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = dict[key];
                } else if (el.tagName === 'SELECT') {
                    // Update all options including the placeholder
                    el.querySelectorAll('option').forEach(opt => {
                        const optKey = opt.getAttribute('data-t');
                        if (optKey && dict[optKey]) {
                            opt.innerText = dict[optKey];
                        }
                    });
                } else {
                    // Normal text content
                    // Check if it's a key that needs innerHTML (like refreshments or those with specific formatting)
                    const htmlKeys = ['refresh_1', 'refresh_2', 'refresh_3', 'refresh_4', 'monk_feat_1', 'monk_feat_2', 'monk_feat_3'];

                    if (htmlKeys.includes(key) || el.classList.contains('highlight') || el.classList.contains('highlight-italic') || el.querySelector('.highlight') || el.querySelector('.highlight-italic')) {
                        let translated = dict[key];

                        // Handle highlights dynamically for main titles
                        if (lang === 'si') {
                            if (key === 'hospitality_title') el.innerHTML = `නැව මත <span class="highlight-italic">කෙටි ආහාර</span>`;
                            else if (key === 'hero_title') el.innerHTML = `<span class="highlight">ගඟේ</span> යෝධයෝ`;
                            else if (key === 'about_title') el.innerHTML = `<span class="highlight">Croc Kingdom</span> අත්දැකීම`;
                            else if (key === 'monk_title') el.innerHTML = `වඳුරන්ට <span class="highlight">ආහාර ලබා දීම</span>`;
                            else if (key === 'gal_title') el.innerHTML = `වන පියස හා <span class="highlight">ජලජ අසිරිය</span>`;
                            else el.innerHTML = translated;
                        } else {
                            if (key === 'hospitality_title') {
                                translated = translated.replace("Refreshments", '<span class="highlight-italic">Refreshments</span>');
                            } else if (key === 'hero_title') {
                                translated = translated.replace("Giants", '<span class="highlight">Giants</span>');
                            } else if (key === 'about_title') {
                                translated = translated.replace("Croc Kingdom", '<span class="highlight">Croc Kingdom</span>');
                            } else if (key === 'monk_title') {
                                translated = translated.replace("Feeding", '<span class="highlight">Feeding</span>');
                            }
                            el.innerHTML = translated;
                        }
                    } else {
                        el.innerText = dict[key];
                    }
                }
            }
        });

        // 3. Update Language Switcher UI Display
        let currentFlag = 'gb';
        let currentText = 'EN';
        if (lang === 'si') { currentFlag = 'lk'; currentText = 'SI'; }
        else if (lang === 'de') { currentFlag = 'de'; currentText = 'DE'; }
        else if (lang === 'ru') { currentFlag = 'ru'; currentText = 'RU'; }
        else if (lang === 'fr') { currentFlag = 'fr'; currentText = 'FR'; }

        const langDisplay = document.querySelector('.lang-selected');
        if (langDisplay) {
            langDisplay.innerHTML = `<img src="https://flagcdn.com/w20/${currentFlag}.png" alt="${lang}"> ${currentText} <i class="fas fa-chevron-down"></i>`;
        }

        // 4. Force specific translations for fixed nav links if data-t misses (Double Protection)
        const allNavLinks = document.querySelectorAll('.nav-links a');
        if (allNavLinks.length >= 5) {
            allNavLinks[0].innerText = dict.nav_home;
            allNavLinks[1].innerText = dict.nav_services;
            allNavLinks[2].innerText = dict.nav_packages;
            allNavLinks[3].innerText = dict.nav_gallery;
            allNavLinks[4].innerText = dict.nav_wildlife;
            if (allNavLinks[5]) allNavLinks[5].innerText = dict.nav_book;
        }

        // 5. Sync Booking Package Selection (if any)
        const packageSelect = document.getElementById('book-package');
        if (packageSelect && packageSelect.value) {
            const currentVal = packageSelect.value;
            // Optionally force select the translated equivalent if value changes
        }
    };




    // Language Dropdown Event Listeners
    const langOptions = document.querySelectorAll('.lang-dropdown li');
    const langSwitcher = document.querySelector('.lang-switcher');
    const langSelected = document.querySelector('.lang-selected');

    // Mobile specific toggle
    if (langSelected && langSwitcher) {
        langSelected.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                e.preventDefault();
                langSwitcher.classList.toggle('active');
            }
        });
    }

    langOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const lang = opt.getAttribute('data-lang');
            setLanguage(lang);
            // Close dropdown and main nav after selection on mobile
            if (langSwitcher) langSwitcher.classList.remove('active');
            if (window.innerWidth <= 1024) {
                if (navLinks) navLinks.classList.remove('active');
                const icon = hamburger ? hamburger.querySelector('i') : null;
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
                document.body.style.overflow = 'auto';
            }
        });
    });

    // Review Form Toggle
    const btnToggleReview = document.getElementById('btn-toggle-review');
    const btnCancelReview = document.getElementById('btn-cancel-review');
    const btnCloseReview = document.getElementById('btn-close-review');
    const reviewFormContainer = document.getElementById('review-form-container');

    if (btnToggleReview && reviewFormContainer) {
        btnToggleReview.addEventListener('click', () => {
            reviewFormContainer.style.display = 'block';
            btnToggleReview.style.display = 'none';
        });
    }

    const closeReviewForm = () => {
        reviewFormContainer.style.display = 'none';
        btnToggleReview.style.display = 'inline-block';
    };

    if (btnCancelReview && reviewFormContainer) {
        btnCancelReview.addEventListener('click', closeReviewForm);
    }

    if (btnCloseReview && reviewFormContainer) {
        btnCloseReview.addEventListener('click', closeReviewForm);
    }

    // Star Rating Logic
    const stars = document.querySelectorAll('#star-rating i');
    const starsValueInput = document.getElementById('review-stars-value');

    stars.forEach(star => {
        star.addEventListener('mouseover', function () {
            const val = this.getAttribute('data-value');
            highlightStars(val);
        });

        star.addEventListener('mouseout', function () {
            highlightStars(starsValueInput.value);
        });

        star.addEventListener('click', function () {
            const val = this.getAttribute('data-value');
            starsValueInput.value = val;
            highlightStars(val);
        });
    });

    function highlightStars(val) {
        stars.forEach(s => {
            if (s.getAttribute('data-value') <= val) {
                s.style.color = '#FFD700';
            } else {
                s.style.color = 'rgba(255, 255, 255, 0.15)';
            }
        });
    }

    // Public Review Form Submit
    const publicReviewForm = document.getElementById('public-review-form');
    if (publicReviewForm) {
        publicReviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btn-submit-review');
            const originalText = btnSubmit.innerHTML;

            const name = document.getElementById('review-name').value.trim();
            const country = document.getElementById('review-country').value.trim();
            const message = document.getElementById('review-message').value.trim();
            const stars = starsValueInput.value;

            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
            btnSubmit.disabled = true;

            try {
                // If db is available, save to firebase
                if (typeof db !== 'undefined' && db !== null) {
                    await db.collection("reviews").add({
                        name: name,
                        country: country,
                        comment: message,
                        rating: parseInt(stars),
                        status: 'pending',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        date: new Date().toLocaleDateString(),
                        createdAt: new Date().toISOString()
                    });
                }

                alert("Thank you! Your review has been submitted and will be visible after approval.");
                publicReviewForm.reset();
                starsValueInput.value = 5;
                highlightStars(5);
                reviewFormContainer.style.display = 'none';
                btnToggleReview.style.display = 'inline-block';

            } catch (error) {
                console.error("Review Error:", error);
                alert("Something went wrong. Please try again.");
            } finally {
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            }
        });
    }

    if (savedLang !== 'en') setLanguage(savedLang);

});
