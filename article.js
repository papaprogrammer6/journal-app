import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyBNeCcKGHaIPYEq2PwN4RfweXFdB2WZ78Q",
    authDomain: "jc-fm-database.firebaseapp.com",
    projectId: "jc-fm-database",
    storageBucket: "jc-fm-database.appspot.com",
    messagingSenderId: "430573474575",
    appId: "1:430573474575:web:c872c4ecd6ebd8218b647a",
    measurementId: "G-VBGHM4H0R2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Authentication Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html'; // Redirect to login page if not authenticated
    } else {
        loadData(); // Load data when authenticated

        // Set the author image
        const authorImg = document.getElementById('authorimg');
        if (user.photoURL) {
            authorImg.src = user.photoURL;
        }
    }
});

document.getElementById('dataForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const articleTitle = document.getElementById('articleTitle').value;
    const articleDescreption = document.getElementById('articleDescreption').value;
    const articleMedia = document.getElementById('articleMedia').files[0];
    const user = auth.currentUser;
    if (!user) {
        showResult('يجب أن تكون مسجلاً للدخول لنشر المقال!', 'red');
        return;
    }

    let uploadPromise = Promise.resolve(null);

    if (articleMedia) {
        const storageRef = ref(storage, 'media/' + articleMedia.name);
        uploadPromise = uploadBytes(storageRef, articleMedia).then(() => getDownloadURL(storageRef));
    }

    uploadPromise.then(mediaUrl => {
        const articleData = {
            Title: articleTitle,
            description: articleDescreption,
            author: user.displayName || 'مجهول',
            authorPhotoURL: user.photoURL || '',
            mediaUrl: mediaUrl || '',
            mediaType: articleMedia ? articleMedia.type : '',
            createdAt: serverTimestamp()
        };

        return addDoc(collection(db, "article"), articleData);
    }).then(() => {
        showResult('تم إنشاء المقال بنجاح!', '#1877f2');
        document.getElementById('dataForm').reset();
        loadData(); // Reload data after adding new post
    }).catch(error => {
        showResult('خطأ: ' + error.message, 'red');
    });
});

async function loadData() {
    try {
        const querySnapshot = await getDocs(collection(db, "article"));
        let output = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            output += `
                <div class="news-item">
                    <div class="author-info">
                        <div class="author-details">
                        ${data.authorPhotoURL ? `<img src="${data.authorPhotoURL}" >` : ''}
                        <div class="author-name">
                        <p> ${data.author}</p>
                        <p> ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'غير متوفر'}</p>
                        </div>
                        </div>
                        <div class="edit-delete">
                      <div class="layout">
                         <button onclick="openEditForm('${doc.id}', '${encodeForAttribute(data.Title)}', '${encodeForAttribute(data.description)}', '${data.mediaUrl}', '${data.category}')">تعديل</button>
                          <button onclick="deleteData('${doc.id}')">حذف</button>
                      </div>

                        </div>
                    </div>
                    <div class="news-content">
                    <h2> ${escapeHtml(data.Title)}</h2>
                    <p id="description"> ${escapeHtml(data.description)}</p>
                    ${data.mediaUrl ? (data.mediaType.startsWith('image/') ? 
                        `<img src="${data.mediaUrl}" alt="Media">` : 
                        `<video controls src="${data.mediaUrl}"></video>`) : ''}
                    </div>
                </div>
            `;
        });
        document.getElementById('newsSection').innerHTML = output;
    } catch (error) {
        showResult('خطأ: ' + error.message, 'red');
    }
}

window.openEditForm = function(docId, title, description, mediaUrl) {
    document.getElementById('editTitle').value = decodeURIComponent(title);
    document.getElementById('editDescription').value = decodeURIComponent(description);
    document.getElementById('existingMediaUrl').value = mediaUrl;
    document.getElementById('editDocId').value = docId;
    
    // Show the edit form modal
    const editModal = document.getElementById('editFormContainer');
    if (editModal) {
        editModal.style.display = "block";
        document.body.style.overflow = "hidden"; // Disable scroll
    } else {
        console.error('لم يتم العثور على حاوية نموذج التعديل');
    }
};

document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;
    const mediaFile = document.getElementById('editMedia').files[0];
    const docId = document.getElementById('editDocId').value;
    const existingMediaUrl = document.getElementById('existingMediaUrl').value;

    if (!docId) {
        showResult('لم يتم تحديد معرّف المستند.', 'red');
        return;
    }

    const docRef = doc(db, "article", docId);

    let uploadPromise = Promise.resolve(null);
    let mediaUrl = existingMediaUrl;
    let mediaType = '';

    if (mediaFile) {
        const storageRef = ref(storage, 'media/' + mediaFile.name);
        uploadPromise = uploadBytes(storageRef, mediaFile).then(() => getDownloadURL(storageRef));
        mediaType = mediaFile.type;
    } else if (existingMediaUrl) {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            mediaType = docSnap.data().mediaType;
        }
    }

    uploadPromise.then(newMediaUrl => {
        mediaUrl = newMediaUrl || mediaUrl;

        return updateDoc(docRef, {
            Title: title || '',
            description: description || '',
            mediaUrl: mediaUrl,
            mediaType: mediaType
        });
    }).then(() => {
        showResult('تم تحديث المقال بنجاح!', '#1877f2');
        document.getElementById('editForm').reset();
        // The modal is now closed in frontart.js
        loadData();
    }).catch(error => {
        showResult('خطأ: ' + error.message, 'red');
    });
});

window.deleteData = function(docId) {
    if (!docId) {
        showResult('لم يتم اختيار مستند.', 'red');
        return;
    }

    const docRef = doc(db, "article", docId);
    deleteDoc(docRef).then(() => {
        showResult('تم حذف المستند بنجاح!', '#1877f2');
        loadData();
    }).catch(error => {
        showResult('خطأ: ' + error.message, 'red');
    });
};

function showResult(message, color) {
    const result = document.getElementById('result');
    result.textContent = message;
    result.style.backgroundColor = color;
    result.style.opacity = "1";
    result.style.transform = "translateY(0)";

    setTimeout(() => {
        result.style.opacity = "0";
        result.style.transform = "translateY(-20px)";
    }, 3000);
}

// Initial load of data
loadData();
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function encodeForAttribute(value) {
    return encodeURIComponent(value).replace(/'/g, "%27");
}
