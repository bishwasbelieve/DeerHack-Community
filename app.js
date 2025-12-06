import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,  // ⬅️ ADDED: You were using this but didn't import it!
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
    const form=document.getElementById('form-section');
    const btn=document.getElementById('btn');
  const closeFormBtn=document.getElementById('closeForm');
    closeFormBtn.addEventListener('click',()=>{
        postForm.style.display="none";
    });
    //form-status
    postForm.style.display="none";
btn.addEventListener('click',()=>{
   postForm.style.display="block";
});
    // Store filter state
    let currentFilterType = 'all';
    let currentFilterArea = 'all';
    
    // Store all posts for filtering
    let allPosts = [];

    // -------- SUBMIT POST --------
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const type = document.getElementById('type').value;
        const area = document.getElementById('area').value;
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const contactName = document.getElementById('contactName').value;
        const contactPhone = document.getElementById('contactPhone').value;

        // Validate all fields are filled
        if (!type || !area || !title || !description || !contactName || !contactPhone) {
            alert('❌ Please fill in all fields before posting.');
            return;
        }

        const submitBtn = postForm.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Posting...';

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
            postForm.style.display="none";
            
        } catch (error) {
            console.error('Error adding post:', error);
            alert('❌ Failed to create post: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '📤 Post';
        }
    });

    // -------- FILTER BUTTON --------
    applyFilterBtn.addEventListener('click', () => {
        currentFilterType = filterTypeSelect.value;
        currentFilterArea = filterAreaSelect.value;
        console.log('Filters applied:', currentFilterType, currentFilterArea);
        renderFilteredPosts();
    });

    // -------- REALTIME LISTENER --------
    const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    
    onSnapshot(postsQuery, (snapshot) => {
        console.log('📡 Real-time update received');
        allPosts = []; // Clear array
        
        snapshot.forEach((doc) => {
            allPosts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderFilteredPosts();
    }, (error) => {
        console.error('Error in real-time listener:', error);
        postsContainer.innerHTML = '<p class="loading">❌ Connection error. Refresh page.</p>';
    });

    // -------- RENDER WITH FILTERS --------
    function renderFilteredPosts() {
        postsContainer.innerHTML = '';
        
        if (allPosts.length === 0) {
            postsContainer.innerHTML = '<p class="loading">No posts yet. Be the first to post!</p>';
            return;
        }

        // Apply filters
        const filteredPosts = allPosts.filter(post => {
            const typeMatch = currentFilterType === 'all' || post.type === currentFilterType;
            const areaMatch = currentFilterArea === 'all' || post.area === currentFilterArea;
            return typeMatch && areaMatch;
        });

        if (filteredPosts.length === 0) {
            postsContainer.innerHTML = '<p class="loading">No posts match your filters. Try different options.</p>';
            return;
        }

        // Display filtered posts
        filteredPosts.forEach(post => {
            displayPost(post);
        });
        
        console.log(`Showing ${filteredPosts.length} of ${allPosts.length} posts`);
    }

    // -------- DISPLAY SINGLE POST --------
    function displayPost(post) {
        const typeLabels = {
            'help-needed': '🆘 Help Needed',
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

    // -------- ESCAPE HTML (Security) --------
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});