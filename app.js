import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// -------- FIREBASE CONFIG --------
const firebaseConfig = {
  apiKey: "AIzaSyAy2c_WCjUwnqOuhkaFdlmFc1xcSMC2uDc",
  authDomain: "deerhack-community-7f3d3.firebaseapp.com",
  projectId: "deerhack-community-7f3d3",
  storageBucket: "deerhack-community-7f3d3.firebasestorage.app",
  messagingSenderId: "203116699968",
  appId: "1:203116699968:web:d957c9b62a8d1348f1daa5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("✅ Firebase connected");

// -------- DOM ELEMENTS --------
document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.getElementById('postForm');
    const postsContainer = document.getElementById('postsContainer');
    const filterTypeSelect = document.getElementById('filterType');
    const filterAreaSelect = document.getElementById('filterArea');
    const applyFilterBtn = document.getElementById('applyFilter');

    let currentFilterType = 'all';
    let currentFilterArea = 'all';

    // -------- SUBMIT POST --------
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = document.getElementById('type').value;
        const area = document.getElementById('area').value;
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const contactName = document.getElementById('contactName').value;
        const contactPhone = document.getElementById('contactPhone').value;

        try {
            await addDoc(collection(db, 'posts'), {
                type: type,
                area: area,
                title: title,
                description: description,
                contactName: contactName,
                contactPhone: contactPhone,
                timestamp: serverTimestamp()
            });
            alert('✅ Post created successfully!');
            postForm.reset();
        } catch (error) {
            console.error('Error adding post:', error);
            alert('❌ Failed to create post. Check console.');
        }
    });

    // -------- FILTER BUTTON --------
    applyFilterBtn.addEventListener('click', () => {
        currentFilterType = filterTypeSelect.value;
        currentFilterArea = filterAreaSelect.value;
        renderPosts();
    });

    // -------- REALTIME POSTS --------
    const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    onSnapshot(postsQuery, () => {
        renderPosts();
    });

    // -------- FUNCTION TO RENDER POSTS --------
    async function renderPosts() {
        postsContainer.innerHTML = '<p class="loading">Loading posts...</p>';
        try {
            const snapshot = await getDocs(postsQuery);
            postsContainer.innerHTML = '';
            if (snapshot.empty) {
                postsContainer.innerHTML = '<p class="loading">No posts yet. Be the first to post!</p>';
                return;
            }

            let hasPosts = false;
            snapshot.forEach((doc) => {
                const post = doc.data();
                if (currentFilterType !== 'all' && post.type !== currentFilterType) return;
                if (currentFilterArea !== 'all' && post.area !== currentFilterArea) return;
                displayPost(post);
                hasPosts = true;
            });

            if (!hasPosts) {
                postsContainer.innerHTML = '<p class="loading">No posts match your filters.</p>';
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            postsContainer.innerHTML = '<p class="loading">❌ Error loading posts. Check console.</p>';
        }
    }

    // -------- DISPLAY SINGLE POST --------
    function displayPost(post) {
        const typeLabels = {
            'help-needed': '🆘 Help Needed',
            'help-offered': '🤲 Help Offered',
            'lost': '😢 Lost Item',
            'found': '🎉 Found Item'
        };

        let timeString = 'Just now';
        if (post.timestamp && post.timestamp.toDate) {
            const date = post.timestamp.toDate();
            timeString = date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        const postCard = document.createElement('div');
        postCard.className = `post-card ${post.type}`;
        postCard.innerHTML = `
            <div class="post-header">
                <span class="post-type">${typeLabels[post.type]}</span>
                <span class="post-area">${post.area}</span>
            </div>
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <p class="post-description">${escapeHtml(post.description)}</p>
            <div class="post-contact">
                <strong>Contact:</strong> ${escapeHtml(post.contactName)} - ${escapeHtml(post.contactPhone)}
            </div>
            <p class="post-time">Posted: ${timeString}</p>
        `;
        postsContainer.appendChild(postCard);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
