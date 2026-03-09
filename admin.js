document.addEventListener('DOMContentLoaded', () => {

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
        if (!html) return '';
        let doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }

    // Global references for UI elements
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const btnLogout = document.getElementById('btn-logout');
    const loginError = document.getElementById('login-error');

    // Check Auth State
    auth.onAuthStateChanged((user) => {
        if (user) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'flex';
            document.body.style.overflow = "hidden"; // Prevent root scrolling

            // Initialize Listeners
            setupBookingsListener();
            setupReviewsListener();
            setupGalleryListener();
            setupPackagesListener();
            setupNewsListener();
            setupPopupListener();
            setupServicesListener();
            setupStatusListener();
            setupAnalyticsListener(); // ADDED: Start tracking/showing graph data
            setupStatsRealtime(); // NEW: Hook up real-time stats
            checkInitialSetup();
        } else {
            dashboardSection.style.display = 'none';
            loginSection.style.display = 'flex';
            document.body.style.overflow = "auto";
        }
    });

    function setupStatsRealtime() {
        // Real-time Total Photos
        db.collection("gallery").onSnapshot(snap => {
            const el = document.getElementById('stat-photos');
            if (el) el.innerText = snap.size;
        });
        // Real-time Active Packages
        db.collection("packages").onSnapshot(snap => {
            const el = document.getElementById('stat-packages');
            if (el) el.innerText = snap.size;
        });
        // Real-time Total Bookings
        db.collection("bookings").onSnapshot(snap => {
            const el = document.getElementById('stat-bookings');
            if (el) el.innerText = snap.size;
        });
        // Real-time News Count
        db.collection("settings").doc("news").onSnapshot(doc => {
            const el = document.getElementById('stat-news');
            if (el && doc.exists) {
                const text = doc.data().text || "";
                const count = text.split('|').filter(t => t.trim().length > 0).length;
                el.innerText = count;
            } else if (el) {
                el.innerText = '0';
            }
        });
        // Real-time River Status for Overview
        db.collection("settings").doc("status").onSnapshot(doc => {
            const el = document.getElementById('overview-river-status');
            if (el && doc.exists) {
                el.innerText = doc.data().riverStatus || "Good";
            }
        });
    }

    // --- 1. LOGIN LOGIC ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const btnSubmit = loginForm.querySelector('button[type="submit"]');

        if (!email || !password) {
            showError("Please enter both email and password.");
            return;
        }

        try {
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            await auth.signInWithEmailAndPassword(email, password);
            loginError.style.display = 'none';
        } catch (error) {
            console.error(error);
            showError("Invalid Email or Password. Please try again.");
        } finally {
            btnSubmit.innerHTML = 'Sign In <i class="fas fa-arrow-right"></i>';
        }
    });

    btnLogout.addEventListener('click', async () => {
        await auth.signOut();
        document.getElementById('admin-email').value = '';
        document.getElementById('admin-password').value = '';
    });

    function showError(msg) {
        loginError.innerText = msg;
        loginError.style.display = "block";
    }

    // --- 2. NAVIGATION LOGIC ---
    const sidebarItems = document.querySelectorAll('.sidebar-nav li');
    const tabs = document.querySelectorAll('.admin-tab');
    const sidebar = document.querySelector('.admin-sidebar');
    const sidebarToggle = document.getElementById('admin-sidebar-toggle');
    const sidebarOpen = document.getElementById('admin-sidebar-open');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }

    if (sidebarOpen) {
        sidebarOpen.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');

            // Update Active Class
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Show Relevant Tab
            tabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.id === tabId) tab.classList.add('active');
            });

            // Close sidebar on mobile after selection
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
                const icon = sidebarToggle.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        });
    });

    // --- 2.5 BOOKINGS LOGIC ---
    let allBookings = [];
    let currentFilter = 'all';
    let isInitialLoadComplete = false;
    let lastPendingCount = 0;

    function setupBookingsListener() {
        db.collection("bookings").orderBy("createdAt", "desc").onSnapshot((querySnapshot) => {
            allBookings = [];
            let newCount = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                data.id = doc.id;
                allBookings.push(data);
                if (data.status === 'pending') newCount++;
            });

            // Update badge and stats
            const badge = document.getElementById('booking-badge');
            const statBookings = document.getElementById('stat-bookings');
            if (statBookings) statBookings.innerText = querySnapshot.size;

            if (badge) {
                if (newCount > 0) {
                    badge.style.display = 'inline-block';
                    badge.innerText = newCount;
                } else {
                    badge.style.display = 'none';
                }
            }

            // Check for real-world "New" booking arrival (not just initial local load)
            if (isInitialLoadComplete && newCount > lastPendingCount) {
                showToastNotification("New Booking Received! 🐊");
                // Play a subtle notification sound (optional)
                try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch (e) { }
            }
            lastPendingCount = newCount;
            isInitialLoadComplete = true;

            renderBookings();
            renderAnalyticsChart();
        }, (err) => {
            console.error("Bookings Sync Error: ", err);
        });
    }

    function showToastNotification(message) {
        const toast = document.createElement('div');
        toast.innerHTML = `<i class="fas fa-bell"></i> ${message}`;
        toast.style.cssText = `
            position: fixed; top: 30px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, var(--primary), #d35400);
            color: white; padding: 15px 30px; border-radius: 50px;
            z-index: 10000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            font-weight: 600; font-family: 'Outfit', sans-serif;
            animation: slideDownIn 0.5s ease forwards;
        `;
        document.body.appendChild(toast);

        // Keyframe style injection
        if (!document.getElementById('toast-anim')) {
            const style = document.createElement('style');
            style.id = 'toast-anim';
            style.innerHTML = `
                @keyframes slideDownIn {
                    0% { top: -100px; opacity: 0; }
                    100% { top: 30px; opacity: 1; }
                }
                @keyframes slideUpOut {
                    0% { top: 30px; opacity: 1; }
                    100% { top: -100px; opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            toast.style.animation = 'slideUpOut 0.5s ease forwards';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    function renderBookings() {
        const container = document.getElementById('bookings-list-container');
        if (!container) return;

        container.innerHTML = '';

        const filtered = allBookings.filter(b => currentFilter === 'all' || b.status === currentFilter);

        if (filtered.length === 0) {
            container.innerHTML = `<tr><td colspan="6" style="padding: 2rem; text-align: center; color: #888;">No ${currentFilter === 'all' ? '' : currentFilter} bookings found.</td></tr>`;
            return;
        }

        filtered.forEach(b => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

            let statusColor = '#f39c12'; // pending
            if (b.status === 'confirmed') statusColor = '#2ecc71';
            if (b.status === 'completed') statusColor = '#3498db';

            tr.innerHTML = `
                <td style="padding: 1rem;">${new Date(b.date).toLocaleDateString() || 'N/A'}</td>
                <td style="padding: 1rem; font-weight: 600;">${escapeHTML(b.name)}<br><small style="color:var(--text-muted); font-weight: normal;">${b.guests} Guests</small></td>
                <td style="padding: 1rem;"><a href="https://wa.me/${b.phone.replace(/[^0-9]/g, '')}" target="_blank" style="color: #25D366; text-decoration: none;"><i class="fab fa-whatsapp"></i> ${escapeHTML(b.phone)}</a></td>
                <td style="padding: 1rem;">${escapeHTML(b.package)}</td>
                <td style="padding: 1rem;">
                    <select class="status-select" data-id="${b.id}" style="background: rgba(0,0,0,0.5); border: 1px solid ${statusColor}; color: ${statusColor}; border-radius: 5px; padding: 5px;">
                        <option value="pending" ${b.status === 'pending' ? 'selected' : ''} style="color: black;">Pending</option>
                        <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''} style="color: black;">Confirmed</option>
                        <option value="completed" ${b.status === 'completed' ? 'selected' : ''} style="color: black;">Completed</option>
                    </select>
                </td>
                <td style="padding: 1rem;">
                    <button class="action-btn delete-booking" data-id="${b.id}" style="color: #e74c3c;"><i class="fas fa-trash"></i></button>
                </td>
            `;

            tr.querySelector('.status-select').addEventListener('change', async (e) => {
                const newStatus = e.target.value;
                await db.collection("bookings").doc(b.id).update({ status: newStatus });
            });

            tr.querySelector('.delete-booking').addEventListener('click', async () => {
                if (confirm('Delete this booking forever?')) {
                    await db.collection("bookings").doc(b.id).delete();
                }
            });

            container.appendChild(tr);
        });
    }

    // Filter Listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderBookings();
        });
    });

    // Booking CSV Export
    const btnExportBookings = document.getElementById('btn-export-bookings');
    if (btnExportBookings) {
        btnExportBookings.addEventListener('click', () => {
            if (allBookings.length === 0) return alert('No bookings to export.');
            let csv = 'Date,Name,Phone,Package,Guests,Status,Message\\n';
            allBookings.forEach(b => {
                const safeName = (b.name || '').replace(/"/g, '""');
                const safeMsg = (b.message || '').replace(/"/g, '""');
                csv += `"${b.date}","${safeName}","${b.phone}","${b.package}","${b.guests}","${b.status}","${safeMsg}"\\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CrocKingdom_Bookings_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    // --- 2.6 REVIEWS LOGIC ---
    let allReviews = [];
    let currentRevFilter = 'pending';

    function setupReviewsListener() {
        db.collection("reviews").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
            allReviews = [];
            let newCount = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                data.id = doc.id;
                // Treat missing status as approved originally
                if (!data.status) data.status = 'approved';

                allReviews.push(data);
                if (data.status === 'pending') newCount++;
            });

            // Update gauge/badge on sidebar
            const badge = document.getElementById('review-badge');
            if (badge) {
                if (newCount > 0) {
                    badge.style.display = 'inline-block';
                    badge.innerText = newCount;
                } else {
                    badge.style.display = 'none';
                }
            }

            renderReviews();
        }, (err) => {
            console.error("Reviews Sync Error: ", err);
        });
    }

    function renderReviews() {
        const container = document.getElementById('reviews-list-container');
        if (!container) return;

        container.innerHTML = '';
        const filtered = allReviews.filter(r => r.status === currentRevFilter);

        if (filtered.length === 0) {
            container.innerHTML = `<tr><td colspan="5" style="padding: 2rem; text-align: center; color: #888;">No ${currentRevFilter} reviews found.</td></tr>`;
            return;
        }

        filtered.forEach(r => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                if (i < r.rating) starsHtml += '<i class="fas fa-star" style="color:#FFD700;"></i>';
                else starsHtml += '<i class="far fa-star" style="color:#FFD700;"></i>';
            }

            const isPending = r.status === 'pending';

            tr.innerHTML = `
                <td style="padding: 1rem;">${r.timestamp ? (typeof r.timestamp.toDate === 'function' ? new Date(r.timestamp.toDate()).toLocaleDateString() : new Date(r.timestamp).toLocaleDateString()) : 'N/A'}</td>
                <td style="padding: 1rem; font-weight: 600;">${escapeHTML(r.name)}<br><small style="color:var(--text-muted); font-weight: normal;">${escapeHTML(r.country)}</small></td>
                <td style="padding: 1rem;">${starsHtml}</td>
                <td style="padding: 1rem; max-width: 300px; white-space: normal;">"${escapeHTML(r.comment)}"</td>
                <td style="padding: 1rem; display: flex; gap: 10px;">
                    ${isPending ? `<button class="action-btn approve-review" data-id="${r.id}" style="color: #2ecc71;" title="Approve"><i class="fas fa-check"></i></button>` : `<button class="action-btn hide-review" data-id="${r.id}" style="color: #f39c12;" title="Hide (Set Pending)"><i class="fas fa-eye-slash"></i></button>`}
                    <button class="action-btn delete-review" data-id="${r.id}" style="color: #e74c3c;" title="Delete Forever"><i class="fas fa-trash"></i></button>
                </td>
            `;

            if (isPending) {
                tr.querySelector('.approve-review').addEventListener('click', async () => {
                    await db.collection("reviews").doc(r.id).update({ status: 'approved' });
                });
            } else {
                tr.querySelector('.hide-review').addEventListener('click', async () => {
                    await db.collection("reviews").doc(r.id).update({ status: 'pending' });
                });
            }

            tr.querySelector('.delete-review').addEventListener('click', async () => {
                if (confirm('Delete this review forever?')) {
                    await db.collection("reviews").doc(r.id).delete();
                }
            });

            container.appendChild(tr);
        });
    }

    document.querySelectorAll('.filter-rev-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-rev-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentRevFilter = e.target.getAttribute('data-filter');
            renderReviews();
        });
    });



    // --- 3. NEWS LOGIC ---
    let currentNewsItems = [];

    function setupNewsListener() {
        db.collection("settings").doc("news").onSnapshot((docSnap) => {
            const newsContainer = document.getElementById('news-list-container');
            if (!newsContainer) return;

            newsContainer.innerHTML = '';

            if (docSnap.exists) {
                const text = docSnap.data().text || "";
                currentNewsItems = text.split('|').map(t => t.trim()).filter(t => t.length > 0);
            } else {
                currentNewsItems = [];
            }

            const statNews = document.getElementById('stat-news');
            if (statNews) statNews.innerText = currentNewsItems.length;


            if (currentNewsItems.length === 0) {
                newsContainer.innerHTML = '<div style="padding: 2rem; color: #888; text-align: center;">No active news items.</div>';
                return;
            }

            currentNewsItems.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'admin-list-item';
                itemDiv.innerHTML = `
                    <div class="item-info">
                        <h4 style="font-weight: 400; font-size: 1.05rem; color: #ddd; display: flex; align-items: center;"><i class="fas fa-bolt" style="color: var(--primary); margin-right: 12px; font-size: 1.2rem;"></i> ${escapeHTML(item)}</h4>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn delete" data-index="${index}" title="Remove this news item"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                itemDiv.querySelector('.delete').addEventListener('click', async () => {
                    if (confirm('Delete this news item?')) {
                        const btn = itemDiv.querySelector('.delete');
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                        btn.disabled = true;
                        currentNewsItems.splice(index, 1);
                        await updateNewsInDB(currentNewsItems);
                    }
                });

                newsContainer.appendChild(itemDiv);
            });
        }, (err) => {
            console.error("News Sync Error: ", err);
        });
    }

    async function updateNewsInDB(itemsArray) {
        const joinedText = itemsArray.join(' | ');
        try {
            await db.collection("settings").doc("news").set({ text: joinedText });
        } catch (e) {
            console.error(e);
            alert("Error updating news.");
        }
    }

    const btnAddNews = document.getElementById('btn-add-news');
    const inputAddNews = document.getElementById('new-news-item');

    if (btnAddNews) {
        btnAddNews.addEventListener('click', async () => {
            const val = stripHTML(inputAddNews.value.trim());
            if (!val) {
                alert("Please type a news item.");
                return;
            }
            if (val.includes('|')) {
                alert("The '|' character is not allowed in news items. It is used to separate items.");
                return;
            }

            const originalText = btnAddNews.innerHTML;
            btnAddNews.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btnAddNews.disabled = true;

            currentNewsItems.unshift(val); // Add to the top of the list
            await updateNewsInDB(currentNewsItems);

            inputAddNews.value = '';
            btnAddNews.innerHTML = originalText;
            btnAddNews.disabled = false;
        });
    }

    // --- 4. GALLERY LOGIC ---
    const btnAddPhoto = document.getElementById('btn-add-photo');
    const formAddPhoto = document.getElementById('form-add-photo');
    const btnCancelPhoto = document.getElementById('btn-cancel-photo');
    const btnSavePhoto = document.getElementById('btn-save-photo');
    const galleryList = document.getElementById('admin-gallery-list');

    btnAddPhoto.addEventListener('click', () => {
        if (formAddPhoto.style.display === 'none' || formAddPhoto.style.display === '') {
            formAddPhoto.style.display = 'block';
            btnAddPhoto.innerHTML = '<i class="fas fa-times"></i> Close Form';
            btnAddPhoto.classList.replace('btn-primary', 'btn-secondary-light');
        } else {
            closePhotoForm();
        }
    });

    btnCancelPhoto.addEventListener('click', closePhotoForm);

    function closePhotoForm() {
        formAddPhoto.style.display = 'none';
        btnAddPhoto.innerHTML = '<i class="fas fa-plus"></i> Add New Photo';
        btnAddPhoto.classList.replace('btn-secondary-light', 'btn-primary');
        document.getElementById('photo-title').value = '';
        document.getElementById('photo-subtitle').value = '';
        document.getElementById('photo-file').value = '';
    }

    let galleryUnsubscribe = null;
    function setupGalleryListener() {
        const q = db.collection("gallery").orderBy("createdAt", "desc");
        galleryUnsubscribe = q.onSnapshot((querySnapshot) => {
            galleryList.innerHTML = '';

            const statPhotos = document.getElementById('stat-photos');
            if (statPhotos) statPhotos.innerText = querySnapshot.size;


            if (querySnapshot.empty) {
                galleryList.innerHTML = '<div style="padding: 2rem; color: #888; grid-column: 1/-1; text-align: center;">No photos uploaded yet.</div>';
                return;
            }

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const div = document.createElement('div');
                div.style.cssText = "position: relative; border-radius: 10px; overflow: hidden; height: 180px;";
                div.innerHTML = `
                    <img src="${data.url}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8; transition: 0.3s;">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); padding: 10px;">
                        <span style="font-weight: 600; font-size: 0.9rem;">${data.title}</span><br>
                        <span style="font-size: 0.8rem; color: var(--primary);">${data.category}</span>
                    </div>
                    <button class="action-btn delete" data-id="${docSnap.id}" style="position: absolute; top: 10px; right: 10px; background: rgba(255,0,0,0.8);">
                        <i class="fas fa-trash"></i>
                    </button>
                `;

                const delBtn = div.querySelector('.delete');
                delBtn.addEventListener('click', async () => {
                    if (confirm('Delete this photo?')) {
                        await db.collection("gallery").doc(delBtn.getAttribute('data-id')).delete();
                    }
                });

                galleryList.appendChild(div);
            });
        }, (err) => {
            console.error("Gallery Sync Error: ", err);
        });
    }

    // Function to compress image and convert to Base64
    const compressImage = (file, maxWidth, maxHeight, quality) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height *= maxWidth / width));
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width *= maxHeight / height));
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const base64String = canvas.toDataURL('image/jpeg', quality);
                    resolve(base64String);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    btnSavePhoto.addEventListener('click', async () => {
        const title = document.getElementById('photo-title').value;
        const category = document.getElementById('photo-subtitle').value;
        const fileInput = document.getElementById('photo-file').files[0];

        if (!title || !fileInput) {
            alert('Title and Image are required!');
            return;
        }

        const originalText = btnSavePhoto.innerHTML;
        btnSavePhoto.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btnSavePhoto.disabled = true;

        try {
            btnSavePhoto.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Compressing...';
            const base64Image = await compressImage(fileInput, 800, 800, 0.7);

            btnSavePhoto.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            await db.collection("gallery").add({
                title: stripHTML(title),
                category: stripHTML(category) || '',
                url: base64Image,
                createdAt: new Date().toISOString()
            });

            closePhotoForm();
            alert("Photo saved to database successfully!");
        } catch (error) {
            console.error("Upload Error: ", error);
            alert("Failed to save photo. It might be too large.");
        } finally {
            btnSavePhoto.innerHTML = originalText;
            btnSavePhoto.disabled = false;
        }
    });

    const btnRestorePhotos = document.getElementById('btn-restore-photos');
    if (btnRestorePhotos) {
        btnRestorePhotos.addEventListener('click', async () => {
            if (!confirm("This will restore the 5 original beautiful gallery photos. Continue?")) return;

            const originalText = btnRestorePhotos.innerHTML;
            btnRestorePhotos.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restoring...';
            btnRestorePhotos.disabled = true;

            try {
                const photos = [
                    { url: 'assets/crocodile_close_1772769164834.png', title: 'Apex Predator', category: 'Close encounter with saltwater crocodiles' },
                    { url: 'assets/white_egret_1772771256035.png', title: 'Graceful Storks (Kokku)', category: 'Beautiful white birds hunting in the shallows' },
                    { url: 'assets/flying_storks_1772771273573.png', title: 'Flight at Sunset', category: 'Flock of local birds flying over the river' },
                    { url: 'assets/hero_bg_1772769136315.png', title: 'Mangrove Scenery', category: 'Deep within the lush tropical ecosystem' },
                    { url: 'assets/modern_croc_kingdom_boat.png', title: 'The Journey Begins', category: 'Safely exploring the wild' }
                ];

                for (let i = 0; i < photos.length; i++) {
                    btnRestorePhotos.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Restoring (${i + 1}/${photos.length})...`;
                    try {
                        // We use the relative path directly instead of fetching as base64,
                        // this avoids the CORS issue completely when running without a web server.
                        await db.collection("gallery").add({
                            title: photos[i].title,
                            category: photos[i].category,
                            url: photos[i].url,
                            createdAt: new Date(Date.now() - i * 1000).toISOString() // Keep the order
                        });
                    } catch (e) {
                        console.warn("Could not load image: " + photos[i].url, e);
                    }
                }

                alert("Original photos restored successfully!");
            } catch (error) {
                console.error("Restore error:", error);
                alert("Something went wrong restoring the photos.");
            } finally {
                btnRestorePhotos.innerHTML = originalText;
                btnRestorePhotos.disabled = false;
            }
        });
    }

    // --- 5. PACKAGES LOGIC ---

    const btnAddPackage = document.getElementById('btn-add-package');
    const formAddPackage = document.getElementById('form-add-package');
    const btnCancelPackage = document.getElementById('btn-cancel-package');
    const btnSavePackage = document.getElementById('btn-save-package');

    if (btnAddPackage) {
        btnAddPackage.addEventListener('click', () => {
            if (formAddPackage.style.display === 'none' || formAddPackage.style.display === '') {
                formAddPackage.style.display = 'block';
                btnAddPackage.innerHTML = '<i class="fas fa-times"></i> Close Form';
                btnAddPackage.classList.replace('btn-primary', 'btn-secondary-light');
            } else {
                closePackageForm();
            }
        });
    }

    if (btnCancelPackage) {
        btnCancelPackage.addEventListener('click', closePackageForm);
    }

    function closePackageForm() {
        formAddPackage.style.display = 'none';
        btnAddPackage.innerHTML = '<i class="fas fa-plus"></i> New Package';
        btnAddPackage.classList.replace('btn-secondary-light', 'btn-primary');
        document.getElementById('pack-name').value = '';
        document.getElementById('pack-price').value = '';
        document.getElementById('pack-features').value = '';
        document.getElementById('pack-icon').value = 'fa-ship';
    }

    if (btnSavePackage) {
        btnSavePackage.addEventListener('click', async () => {
            const name = document.getElementById('pack-name').value;
            const price = document.getElementById('pack-price').value;
            const features = document.getElementById('pack-features').value;
            const icon = document.getElementById('pack-icon').value || 'fa-ship';

            if (!name || !price) {
                alert('Name and Price are required!');
                return;
            }

            const originalText = btnSavePackage.innerHTML;
            btnSavePackage.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            btnSavePackage.disabled = true;

            try {
                await db.collection("packages").add({
                    name: stripHTML(name),
                    price: stripHTML(price),
                    features: stripHTML(features),
                    icon: stripHTML(icon),
                    createdAt: new Date().toISOString()
                });

                closePackageForm();
                alert("Package saved successfully!");
            } catch (error) {
                console.error("Upload Error: ", error);
                alert("Failed to save package.");
            } finally {
                btnSavePackage.innerHTML = originalText;
                btnSavePackage.disabled = false;
            }
        });
    }


    function setupPackagesListener() {
        const q = db.collection("packages").orderBy("createdAt", "desc");
        q.onSnapshot((querySnapshot) => {
            const packageContainer = document.querySelector('#tab-packages .packages-list-container');
            if (!packageContainer) return;

            packageContainer.innerHTML = '';

            const statPackages = document.getElementById('stat-packages');
            if (statPackages) statPackages.innerText = querySnapshot.size;


            if (querySnapshot.empty) {
                packageContainer.innerHTML = '<div style="padding: 2rem; color: #888; text-align: center;">No packages created yet.</div>';
                return;
            }

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const item = document.createElement('div');
                item.className = 'admin-list-item';
                item.innerHTML = `
                    <div class="item-info">
                        <h4>${escapeHTML(data.name)}</h4>
                        <p>Rs. ${escapeHTML(data.price)} / Person</p>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn delete" data-id="${docSnap.id}"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                item.querySelector('.delete').addEventListener('click', async () => {
                    if (confirm('Delete this package?')) {
                        await db.collection("packages").doc(docSnap.id).delete();
                    }
                });

                packageContainer.appendChild(item);
            });
        });
    }

    // --- 6. INITIAL IMPORT LOGIC ---
    async function checkInitialSetup() {
        try {
            // Check if gallery and packages are completely empty
            const gallerySnap = await db.collection("gallery").limit(1).get();
            const packagesSnap = await db.collection("packages").limit(1).get();
            const servicesSnap = await db.collection("services").limit(1).get();

            const importSection = document.getElementById('import-data-section');
            if (importSection) {
                // Show if any of these are empty to allow syncing the new parts
                if (gallerySnap.empty || packagesSnap.empty || servicesSnap.empty) {
                    importSection.style.display = 'block';
                } else {
                    importSection.style.display = 'none';
                }
            }
        } catch (error) {
            console.error("Setup check error:", error);
        }
    }

    // Function getBase64FromUrl removed to avoid local file CORS issues

    const btnImport = document.getElementById('btn-import-initial');
    if (btnImport) {
        btnImport.addEventListener('click', async () => {
            if (!confirm("This will import the default website data into your database. Continue?")) return;

            const originalText = btnImport.innerHTML;
            btnImport.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing... Please wait!';
            btnImport.disabled = true;

            try {
                // 1. Import Packages
                const packages = [
                    { name: 'Standard Safari', price: '3,500', features: '1 Hour Boat Ride, Basic Guide Included, Life Jackets Provided, Morning / Evening Slots', icon: 'fa-ship' },
                    { name: 'VIP Sunset Cruise', price: '6,000', features: '2 Hours Guided Tour, Expert Naturalist Guide, Complimentary Refreshments, Premium Seating Boat', icon: 'fa-crown' },
                    { name: 'Photography Tour', price: '9,000', features: '3 Hours Exclusive Hire, Close-up Approaching, Ideal for Professionals, Early Morning Departure', icon: 'fa-camera-retro' }
                ];

                for (let i = 0; i < packages.length; i++) {
                    btnImport.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Importing Packages (${i + 1}/${packages.length})...`;
                    await db.collection("packages").add({ ...packages[i], createdAt: new Date().toISOString() });
                }

                // 2. Import Gallery Photos
                const photos = [
                    { url: 'assets/crocodile_close_1772769164834.png', title: 'The Giants of Nilwala', category: 'Get up close safely to the apex predators' },
                    { url: 'assets/white_egret_1772771256035.png', title: 'Graceful Storks (Kokku)', category: 'Beautiful white birds hunting in the shallows' },
                    { url: 'assets/modern_croc_kingdom_boat.png', title: 'Premium Safari Boats', category: 'Ultimate comfort and safety' }
                ];

                for (let i = 0; i < photos.length; i++) {
                    btnImport.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Importing Photos (${i + 1}/${photos.length})...`;
                    try {
                        await db.collection("gallery").add({
                            title: photos[i].title,
                            category: photos[i].category,
                            url: photos[i].url, // Saving origin path
                            createdAt: new Date().toISOString()
                        });
                    } catch (e) {
                        console.warn("Could not import image: " + photos[i].url, e);
                    }
                }

                // 3. Import Default News
                btnImport.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Setting Default News...`;
                await db.collection("settings").doc("news").set({
                    text: '🔥 Special Offer: 20% off on premium bookings this weekend! | 🐊 Spotted a 15ft Saltwater Crocodile yesterday - Book now! | 📸 Join our exclusive photography tours for the best shots. | ⛵ New luxury boats added to our fleet for a smoother ride.'
                });

                // 4. Import Default Services
                const defaultServices = [
                    { name: 'Boat Safari', icon: 'fa-ship', description: 'Experience a calm, yet thrilling ride deep into the Nilwala river mangroves in our safe and comfortable premium boats.' },
                    { name: 'Crocodile Watching', icon: 'fa-binoculars', description: 'Safely approach and observe massive saltwater crocodiles in their natural habitat with our expert naturalists.' },
                    { name: 'Bird Watching', icon: 'fa-dove', description: 'A paradise for bird lovers! Spot exotic Kingfishers, Eagles, Egrets, and majestic flocks of Storks.' },
                    { name: 'Fishing Experiences', icon: 'fa-fish', description: 'Enjoy serene, traditional river fishing experiences tailored for relaxation during your safari trip.' },
                    { name: 'Monkey Feeding', icon: 'fa-leaf', description: 'Interact with friendly native macaques along the riverbanks with safe and enjoyable feeding activities.' },
                    { name: 'Free Pick & Drop', icon: 'fa-taxi', description: 'Hassle-free transportation! We offer absolutely free pick up and drop off locally for your maximum convenience.' }
                ];
                btnImport.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Setting Default Services...`;
                for (const s of defaultServices) {
                    await db.collection("services").add({ ...s, createdAt: new Date().toISOString() });
                }

                // 5. Initial Popup State
                await db.collection("settings").doc("popup").set({
                    enabled: true,
                    title: 'Welcome to Croc Kingdom!',
                    message: 'Book your Standard Safari today and get the VIP Refreshments package absolutely FREE! Limited slots this week.',
                    btnText: 'Book Now',
                    btnLink: '#contact'
                });

                // Initialize default news without looking for the text input


                // Default News is already handled by saving directly. We'll just hide the alert.
                btnImport.innerHTML = '<i class="fas fa-check"></i> Import Complete!';
                document.getElementById('import-data-section').style.display = 'none';

            } catch (error) {
                console.error("Import error:", error);
                alert("Something went wrong during import.");
                btnImport.innerHTML = originalText;
                btnImport.disabled = false;
            }
        });
    }

    // --- 6.5 POPUP & OFFERS LOGIC ---

    const formPopup = document.getElementById('form-popup');
    const toggleEnabled = document.getElementById('popup-enabled');
    const inputTitle = document.getElementById('popup-title');
    const inputMessage = document.getElementById('popup-message');
    const inputBtnText = document.getElementById('popup-btn-text');
    const inputBtnLink = document.getElementById('popup-btn-link');

    const prevTitle = document.getElementById('prev-title');
    const prevMsg = document.getElementById('prev-msg');
    const prevBtn = document.getElementById('prev-btn');

    function updatePreview() {
        if (!prevTitle) return;
        prevTitle.innerText = inputTitle.value || 'Preview Title';
        prevMsg.innerText = inputMessage.value || 'Your message will appear here. Keep it engaging!';
        prevBtn.innerText = inputBtnText.value || 'Button Text';

        // Disable state visual
        if (!toggleEnabled.checked) {
            document.getElementById('popup-preview').style.opacity = '0.4';
            document.getElementById('popup-preview').style.filter = 'grayscale(100%)';
        } else {
            document.getElementById('popup-preview').style.opacity = '1';
            document.getElementById('popup-preview').style.filter = 'none';
        }
    }

    if (inputTitle) {
        // Live update preview
        toggleEnabled.addEventListener('change', updatePreview);
        inputTitle.addEventListener('input', updatePreview);
        inputMessage.addEventListener('input', updatePreview);
        inputBtnText.addEventListener('input', updatePreview);

        formPopup.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = formPopup.querySelector('button[type="submit"]');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                await db.collection('settings').doc('popup').set({
                    enabled: toggleEnabled.checked,
                    title: inputTitle.value,
                    message: inputMessage.value,
                    btnText: inputBtnText.value,
                    btnLink: inputBtnLink.value
                });

                btnSubmit.innerHTML = '<i class="fas fa-check"></i> Saved!';
                btnSubmit.style.background = '#28a745';
                btnSubmit.style.borderColor = '#28a745';

                setTimeout(() => {
                    btnSubmit.innerHTML = originalText;
                    btnSubmit.style.background = '';
                    btnSubmit.style.borderColor = '';
                }, 2000);
            } catch (err) {
                console.error("Popup settings error", err);
                alert("Failed to save popup settings.");
                btnSubmit.innerHTML = originalText;
            }
        });
    }

    function setupPopupListener() {
        db.collection("settings").doc("popup").onSnapshot((doc) => {
            if (doc.exists && inputTitle) {
                const data = doc.data();
                toggleEnabled.checked = data.enabled || false;
                inputTitle.value = data.title || '';
                inputMessage.value = data.message || '';
                inputBtnText.value = data.btnText || '';
                inputBtnLink.value = data.btnLink || '';
                updatePreview();
            }
        });
    }

    // --- 7. ANALYTICS LOGIC ---
    let allAnalytics = {};
    let analyticsChart = null;

    function setupAnalyticsListener() {
        db.collection("analytics").onSnapshot((snapshot) => {
            allAnalytics = {};
            snapshot.forEach(doc => {
                allAnalytics[doc.id] = doc.data().hits || 0;
            });
            renderAnalyticsChart();
        }, (err) => console.error("Analytics Sync Error:", err));
    }

    function renderAnalyticsChart() {
        const ctx = document.getElementById('analyticsChart');
        if (!ctx) return;

        const timelineSelect = document.getElementById('chartTimeline');
        const daysToLookBack = timelineSelect ? parseInt(timelineSelect.value) : 7;

        // Generate Labels (Dates)
        const labels = [];
        const visitorsData = [];
        const bookingsData = [];

        for (let i = daysToLookBack - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            labels.push(dateLabel);

            // Get Real Visitors for this ISO date (YYYY-MM-DD)
            const dateISO = d.toISOString().split('T')[0];
            let dailyVisitors = allAnalytics[dateISO] || 0;

            // Find real bookings RECEIVED on this specific date
            let dailyBookingsCount = 0;
            if (Array.isArray(allBookings)) {
                allBookings.forEach(b => {
                    if (b.createdAt) {
                        const bCreated = new Date(b.createdAt);
                        if (bCreated.getDate() === d.getDate() &&
                            bCreated.getMonth() === d.getMonth() &&
                            bCreated.getFullYear() === d.getFullYear()) {
                            dailyBookingsCount++;
                        }
                    }
                });
            }

            visitorsData.push(dailyVisitors);
            bookingsData.push(dailyBookingsCount);
        }

        if (analyticsChart) {
            analyticsChart.destroy();
        }

        analyticsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Website Visitors',
                        data: visitorsData,
                        borderColor: '#FFD700', // Primary Yellow/Gold
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Bookings',
                        data: bookingsData,
                        borderColor: '#2ecc71', // Green
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        tension: 0.4,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'rgba(255, 255, 255, 0.7)' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                    }
                }
            }
        });
    }

    const timelineSelect = document.getElementById('chartTimeline');
    if (timelineSelect) {
        timelineSelect.addEventListener('change', renderAnalyticsChart);
    }

    // --- 8. SERVICES LOGIC ---
    function setupServicesListener() {
        const container = document.getElementById('admin-services-list');
        if (!container) return;

        db.collection("services").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
            container.innerHTML = '';
            if (snapshot.empty) {
                container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #888;">No services added yet. Click "New Service" to start.</div>';
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                const div = document.createElement('div');
                div.className = 'packages-list-item'; // Reusing style
                div.style.padding = '1.5rem';
                div.style.background = 'rgba(255,255,255,0.02)';
                div.style.borderRadius = '15px';
                div.style.marginBottom = '1rem';
                div.style.border = '1px solid rgba(255,255,255,0.05)';
                div.style.display = 'flex';
                div.style.justifyContent = 'space-between';
                div.style.alignItems = 'center';

                div.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(242, 100, 25, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                            <i class="fas ${data.icon || 'fa-concierge-bell'}"></i>
                        </div>
                        <div style="flex: 1;">
                            <h4 style="color: white; margin: 0; font-size: 1.1rem;">${escapeHTML(data.name)}</h4>
                            <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0; max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(data.description)}</p>
                        </div>
                    </div>
                    <button class="action-btn delete-service" data-id="${doc.id}" style="color: #e74c3c; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-trash"></i>
                    </button>
                `;

                div.querySelector('.delete-service').addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to delete "${data.name}"?`)) {
                        await db.collection("services").doc(doc.id).delete();
                    }
                });

                container.appendChild(div);
            });
        }, (err) => console.error(err));
    }

    const btnAddService = document.getElementById('btn-add-service');
    const btnCancelService = document.getElementById('btn-cancel-service');
    const formAddService = document.getElementById('form-add-service');
    const btnSaveService = document.getElementById('btn-save-service');

    if (btnAddService) {
        btnAddService.addEventListener('click', () => {
            formAddService.style.display = 'block';
            btnAddService.style.display = 'none';
        });

        btnCancelService.addEventListener('click', () => {
            formAddService.style.display = 'none';
            btnAddService.style.display = 'block';
            clearServiceForm();
        });

        btnSaveService.addEventListener('click', async () => {
            const name = document.getElementById('service-name').value.trim();
            const icon = document.getElementById('service-icon').value.trim();
            const desc = document.getElementById('service-description').value.trim();
            const image = document.getElementById('service-image').value.trim();

            if (!name || !desc) return alert("Please fill in at least the name and description.");

            btnSaveService.disabled = true;
            btnSaveService.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                await db.collection("services").add({
                    name: stripHTML(name),
                    icon: stripHTML(icon) || 'fa-concierge-bell',
                    description: stripHTML(desc),
                    image: stripHTML(image) || '',
                    createdAt: new Date().toISOString()
                });
                formAddService.style.display = 'none';
                btnAddService.style.display = 'block';
                clearServiceForm();
            } catch (err) {
                console.error("Error saving service:", err);
                alert("Error saving service.");
            } finally {
                btnSaveService.disabled = false;
                btnSaveService.innerHTML = 'Save Service';
            }
        });
    }

    function setupStatusListener() {
        const statusSelect = document.getElementById('admin-river-status');
        const saveBtn = document.getElementById('btn-save-status');
        const confirmMsg = document.getElementById('status-save-confirm');

        if (!statusSelect || !saveBtn) return;

        // Fetch initial status
        db.collection("settings").doc("status").onSnapshot((doc) => {
            if (doc.exists) {
                statusSelect.value = doc.data().riverStatus || "Good";
            }
        });

        saveBtn.addEventListener('click', async () => {
            const status = statusSelect.value;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';

            try {
                await db.collection("settings").doc("status").set({
                    riverStatus: status,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                confirmMsg.style.display = 'inline-block';
                confirmMsg.innerHTML = `<i class="fas fa-check-circle"></i> Homepage updated to "${status}"!`;
                setTimeout(() => { confirmMsg.style.display = 'none'; }, 4000);
            } catch (error) {
                console.error("Error updating status:", error);
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Push Real-time Update <i class="fas fa-sync-alt" style="margin-left: 10px;"></i>';
            }
        });
    }

    // Remove the redundant and nested setupPopupListener (it was defined twice)

    // Call additional setups
    setupPopupListener(); // Call the first one defined at line 981
    setupAnalyticsListener();
    setupStatusListener();
    setupServicesListener();

    function clearServiceForm() {
        document.getElementById('service-name').value = '';
        document.getElementById('service-icon').value = '';
        document.getElementById('service-description').value = '';
        document.getElementById('service-image').value = '';
    }
});
