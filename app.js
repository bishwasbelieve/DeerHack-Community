import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";


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
const auth = getAuth(app);
console.log("Firebase connected");

let isLoginMode = true;
let currentUser = null;
let currentUserData = null;
let appInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log(' DOM loaded');
    
    const authModal = document.getElementById('authModal');
    const mainApp = document.getElementById('mainApp');
    const authForm = document.getElementById('authForm');
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const firstnameinp = document.getElementById('firstName');
    const lastnameinp = document.getElementById('lastName');
    const nameFields = document.getElementById('nameFields');
    const authsubbtn = document.getElementById('authsubbtn');
    const authTitle = document.getElementById('authTitle');
    const authtxt = document.getElementById('att');
    const authtolink = document.getElementById('authtolink');
    const userInfoDisplay = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!authModal || !authForm || !authtolink) {
        console.error(' Some DOM elements are missing!');
        return;
    }

    console.log(' All DOM elements found');

    onAuthStateChanged(auth, async (user) => {
        console.log(' Auth state changed:', user ? user.email : 'No user');
        
        if (user) {
           
            currentUser = user;
            console.log(' User logged in:', user.email);
            
          
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    currentUserData = userDoc.data();
                    userInfoDisplay.textContent = `${currentUserData.firstName} ${currentUserData.lastName} (${user.email})`;
                    console.log(' User data loaded:', currentUserData);
                } else {
                    currentUserData = null;
                    userInfoDisplay.textContent = user.email;
                    console.log(' No user data found in Firestore');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                currentUserData = null;
                userInfoDisplay.textContent = user.email;
            }
            
            authModal.style.display = 'none';
            mainApp.style.display = 'block';
            
            if (!appInitialized) {
                initializeMainApp();
                appInitialized = true;
            }
        } else {
          
            currentUser = null;
            currentUserData = null;
            console.log(' User logged out');
            
           
            authModal.style.display = 'flex';
            mainApp.style.display = 'none';
        }
    });

    authtolink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Toggle clicked, current mode:', isLoginMode ? 'Login' : 'Signup');
        
        isLoginMode = !isLoginMode;
        
        if (isLoginMode) {
            
            authTitle.textContent = ' Login to Continue';
            authsubbtn.textContent = 'Login';
            authtxt.textContent = "Don't have an account?";
            authtolink.textContent = 'Sign Up';
            nameFields.style.display = 'none';
            firstnameinp.required = false;
            lastnameinp.required = false;
            console.log(' Switched to LOGIN mode');
        } else {
            
            authTitle.textContent = ' Create Account';
            authsubbtn.textContent = 'Sign Up';
            authtxt.textContent = 'Already have an account?';
            authtolink.textContent = 'Login';
            nameFields.style.display = 'block';
            firstnameinp.required = true;
            lastnameinp.required = true;
            console.log('Switched to SIGNUP mode');
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log(' Form submitted, mode:', isLoginMode ? 'Login' : 'Signup');
        
        const email = authEmail.value.trim();
        const password = authPassword.value;
        const firstName = firstnameinp.value.trim();
        const lastName = lastnameinp.value.trim();
        
        if (!email || !password) {
            alert(' Please fill in all fields');
            return;
        }
        
        if (!isLoginMode && (!firstName || !lastName)) {
            alert(' Please enter your first and last name');
            return;
        }
        
        if (password.length < 6) {
            alert(' Password must be at least 6 characters');
            return;
        }
        
        authsubbtn.disabled = true;
        authsubbtn.textContent = '⏳ Please wait...';
        
        try {
            if (isLoginMode) {
               
                console.log(' Attempting login for:', email);
                await signInWithEmailAndPassword(auth, email, password);
                console.log('Login successful');
            } else {
              
                console.log('Attempting signup for:', email);
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log(' Signup successful');
                
            
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    createdAt: serverTimestamp()
                });
                console.log(' User data saved to Firestore');
            }
            
            authForm.reset();
            
        } catch (error) {
            console.error('Auth error:', error);
            
    
            if (error.code === 'auth/email-already-in-use') {
                alert(' This email is already registered. Try logging in instead.');
                isLoginMode = true;
                authTitle.textContent = 'Login to Continue';
                authsubbtn.textContent = 'Login';
                authtxt.textContent = "Don't have an account?";
                authtolink.textContent = 'Sign Up';
                nameFields.style.display = 'none';
                firstnameinp.required = false;
                lastnameinp.required = false;
            } else if (error.code === 'auth/invalid-email') {
                alert(' Invalid email address.');
            } else if (error.code === 'auth/wrong-password') {
                alert(' Wrong password.');
            } else if (error.code === 'auth/user-not-found') {
                alert(' No account found with this email. Please sign up first.');
                isLoginMode = false;
                authTitle.textContent = ' Create Account';
                authsubbtn.textContent = 'Sign Up';
                authtxt.textContent = 'Already have an account?';
                authtolink.textContent = 'Login';
                nameFields.style.display = 'block';
                firstnameinp.required = true;
                lastnameinp.required = true;
            } else if (error.code === 'auth/weak-password') {
                alert(' Password too weak. Use at least 6 characters.');
            } else if (error.code === 'auth/invalid-credential') {
                alert(' Invalid email or password.');
            } else {
                alert('Error: ' + error.message);
            }
        } finally {
            authsubbtn.disabled = false;
            authsubbtn.textContent = isLoginMode ? 'Login' : 'Sign Up';
        }
    });

   
    logoutBtn.addEventListener('click', async () => {
        console.log(' Logout clicked');
        try {
            await signOut(auth);
            console.log(' Logged out successfully');
            appInitialized = false;
        } catch (error) {
            console.error(' Logout error:', error);
            alert(' Logout failed');
        }
    });
});

function initializeMainApp() {
    console.log('Initializing main app');
    
    const postForm = document.getElementById('postForm');
    const postsContainer = document.getElementById('postsContainer');
    const filterTypeSelect = document.getElementById('filterType');
    const filterAreaSelect = document.getElementById('filterArea');
    const applyFilterBtn = document.getElementById('applyFilter');

    let currentFilterType = 'all';
    let currentFilterArea = 'all';
    let allPosts = [];

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert(' You must be logged in to post');
            return;
        }
        
        const submitBtn = postForm.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = ' Posting...';
        
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
                userId: currentUser.uid,
                userEmail: currentUser.email,
                userName: currentUserData ? `${currentUserData.firstName} ${currentUserData.lastName}` : 'User',
                timestamp: serverTimestamp()
            });
            
            alert(' Post created successfully!');
            postForm.reset();
            
        } catch (error) {
            console.error('Error adding post:', error);
            alert(' Failed to create post: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = ' Post';
        }
    });

    
    applyFilterBtn.addEventListener('click', () => {
        currentFilterType = filterTypeSelect.value;
        currentFilterArea = filterAreaSelect.value;
        console.log('Filters applied:', currentFilterType, currentFilterArea);
        renderFilteredPosts();
    });

    async function deletePost(postId) {
        console.log(' DELETE FUNCTION CALLED!');
        console.log('Post ID:', postId);
        console.log('Current User:', currentUser);
        
        if (!currentUser) {
            alert('You must be logged in to delete posts');
            return;
        }
        
        const confirmed = confirm(' Are you sure you want to delete this post?\n\nThis action cannot be undone.');
        
        if (!confirmed) {
            console.log(' Delete cancelled by user');
            return;
        }
        
        console.log(' Attempting to delete post from Firestore...');
        
        try {
            await deleteDoc(doc(db, 'posts', postId));
            console.log(' Post deleted successfully:', postId);
            alert(' Post deleted successfully!');
        } catch (error) {
            console.error(' Error deleting post:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            alert('Failed to delete post: ' + error.message);
        }
    }

   
    const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    
    onSnapshot(postsQuery, (snapshot) => {
        console.log(' Real-time update received, posts count:', snapshot.size);
        allPosts = [];
        
        snapshot.forEach((doc) => {
            allPosts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderFilteredPosts();
    }, (error) => {
        console.error(' Error in real-time listener:', error);
        postsContainer.innerHTML = '<p class="loading"> Connection error. Refresh page.</p>';
    });

    // -------- RENDER WITH FILTERS --------
    function renderFilteredPosts() {
        postsContainer.innerHTML = '';
        
        if (allPosts.length === 0) {
            postsContainer.innerHTML = '<p class="loading">No posts yet. Be the first to post!</p>';
            return;
        }

        const filteredPosts = allPosts.filter(post => {
            const typeMatch = currentFilterType === 'all' || post.type === currentFilterType;
            const areaMatch = currentFilterArea === 'all' || post.area === currentFilterArea;
            return typeMatch && areaMatch;
        });

        if (filteredPosts.length === 0) {
            postsContainer.innerHTML = '<p class="loading">No posts match your filters.</p>';
            return;
        }

        filteredPosts.forEach(post => {
            displayPost(post);
        });
        
        console.log(`Showing ${filteredPosts.length} of ${allPosts.length} posts`);
    }

   
    function displayPost(post) {
        const typeLabels = {
            'help-needed': ' Help Needed',
            'lost': ' Lost Item',
            'found': ' Found Item'
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
        
        const isOwnPost = currentUser && post.userId === currentUser.uid;
        
        postCard.innerHTML = `
            <div class="post-header">
                <span class="post-type">${typeLabels[post.type]}</span>
                <span class="post-area">${post.area}</span>
            </div>
            ${isOwnPost ? '<span class="own-post-badge"> Your Post</span>' : ''}
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <p class="post-description">${escapeHtml(post.description)}</p>
            <div class="post-contact">
                <strong>Contact:</strong> ${escapeHtml(post.contactName)} - ${escapeHtml(post.contactPhone)}
            </div>
            <p class="post-time">Posted: ${timeString}</p>
        `;
        

        if (isOwnPost) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete';
            deleteBtn.textContent = ' Delete Post';
            
           
            deleteBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(' DELETE BUTTON CLICKED!');
                console.log('Deleting post ID:', post.id);
                await deletePost(post.id);
            });
            
            postCard.appendChild(deleteBtn);
            console.log(' Delete button added for post:', post.id);
        }
        
        postsContainer.appendChild(postCard);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}