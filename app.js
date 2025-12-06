import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app); 
const postForm = document.getElementById('postForm');
const postsContainer = document.getElementById('postsContainer');
const filterTypeSelect = document.getElementById('filterType');
const filterAreaSelect = document.getElementById('filterArea');
const applyFilterBtn = document.getElementById('applyFilter');


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
        
        alert('Post created successfully!');
        postForm.reset(); 
        loadPosts(); 
        
    } catch (error) {
        console.error('Error adding post:', error);
        alert('❌ Failed to create post. Check console.');
    }
});

async function loadPosts(filterType = 'all', filterArea = 'all') {
    postsContainer.innerHTML = '<p class="loading">Loading posts...</p>';
    
    try {
        
        const q = query(
            collection(db, 'posts'),
            orderBy('timestamp', 'desc')
        );
        
       
        const querySnapshot = await getDocs(q);
        
      
        postsContainer.innerHTML = '';
        
    
        if (querySnapshot.empty) {
            postsContainer.innerHTML = '<p class="loading">No posts yet. Be the first to post!</p>';
            return;
        }
        
    
        querySnapshot.forEach((doc) => {
            const post = doc.data(); 
            const postId = doc.id;
            
           
            if (filterType !== 'all' && post.type !== filterType) return;
            if (filterArea !== 'all' && post.area !== filterArea) return;
            
            
            displayPost(post, postId);
        });
        
        
        if (postsContainer.innerHTML === '') {
            postsContainer.innerHTML = '<p class="loading">No posts match your filters.</p>';
        }
        
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<p class="loading">❌ Error loading posts. Check console.</p>';
    }
}


function displayPost(post, postId) {
    
    const typeLabels = {
        'help-needed': '🆘 Help Needed',
        'help-offered': '🤲 Help Offered',
        'lost': '😢 Lost Item',
        'found': '🎉 Found Item'
    };
    
   
    let timeString = 'Just now';
    if (post.timestamp) {
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


applyFilterBtn.addEventListener('click', () => {
    const selectedType = filterTypeSelect.value;
    const selectedArea = filterAreaSelect.value;
    loadPosts(selectedType, selectedArea);
});


loadPosts();


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}