import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
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

    const newsTitle = document.getElementById('newsTitle').value;
    const newsDescreption = document.getElementById('newsDescreption').value;
    const newsMedia = document.getElementById('newsMedia').files[0];
    const newsCategory = document.querySelector('input[name="newsCategory"]:checked')?.value;
    const user = auth.currentUser;

    if (!user) {
        showResult('يجب تسجيل الدخول لنشر خبر جديد!', 'red');
        return;
    }

    if (!newsCategory) {
        showResult('يرجى اختيار الفئة!', 'red');
        return;
    }

    let uploadPromise = Promise.resolve(null);

    if (newsMedia) {
        const storageRef = ref(storage, 'media/' + newsMedia.name);
        uploadPromise = uploadBytes(storageRef, newsMedia).then(() => getDownloadURL(storageRef));
    }

    uploadPromise.then(mediaUrl => {
        const newsData = {
            Title: newsTitle,
            description: newsDescreption,
            author: user.displayName || 'مجهول',
            authorPhotoURL: user.photoURL || '',
            mediaUrl: mediaUrl || '',
            mediaType: newsMedia ? newsMedia.type : '',
            category: newsCategory,
            createdAt: serverTimestamp()
        };

        return addDoc(collection(db, "news"), newsData);
    }).then(() => {
        showResult('تم إنشاء الخبر بنجاح!', '#1877f2');
        document.getElementById('dataForm').reset();
        loadData(); // Reload data after adding new post
    }).catch(error => {
        showResult('خطأ: ' + error.message, 'red');
    });
});

document.getElementById('getData').addEventListener('click', async function() {
    const docId = prompt("أدخل معرف الخبر لاسترجاعه:");
    if (!docId) {
        showResult('معرف الخبر مطلوب.', 'yellow');
        return;
    }

    const docRef = doc(db, "news", docId);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('result').innerHTML = `
                <h2>العنوان: ${data.Title}</h2>
                <p>الوصف: ${data.description}</p>
                <p>الفئة: ${data.category}</p>
                <div style="display: flex; align-items: center;">
                    ${data.authorPhotoURL ? `<img src="${data.authorPhotoURL}" alt="الكاتب" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px;">` : ''}
                    <p>الكاتب: ${data.author}</p>
                </div>
                ${data.mediaUrl ? (data.mediaType.startsWith('image/') ? 
                    `<img src="${data.mediaUrl}" alt="الوسائط" style="max-width: 200px;">` : 
                    `<video controls src="${data.mediaUrl}" style="max-width: 200px;"></video>`) : ''}
                <p>تم إنشاؤه في: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'غير متوفر'}</p>
            `;
        } else {
            showResult('لا يوجد مثل هذا الخبر!', 'red');
        }
    } catch (error) {
        showResult('خطأ: ' + error.message, 'red');
    }
});

async function loadData() {
    try {
        const querySnapshot = await getDocs(collection(db, "news"));
        let output = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            output += `
                <div class="news-item">
                    <h2>العنوان: ${escapeHtml(data.Title)}</h2>
                    <p>الوصف: ${escapeHtml(data.description)}</p>
                    <p>الفئة: ${data.category}</p>
                    <div style="display: flex; align-items: center;">
                        ${data.authorPhotoURL ? `<img src="${data.authorPhotoURL}" alt="الكاتب" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px;">` : ''}
                        <p>الكاتب: ${data.author}</p>
                    </div>
                    ${data.mediaUrl ? (data.mediaType.startsWith('image/') ? 
                        `<img src="${data.mediaUrl}" alt="الوسائط" style="max-width: 200px;">` : 
                        `<video controls src="${data.mediaUrl}" style="max-width: 200px;"></video>`) : ''}
                    <p>تم إنشاؤه في: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'غير متوفر'}</p>
                  <div class="layout">
                     <button onclick="openEditForm('${doc.id}', '${encodeForAttribute(data.Title)}', '${encodeForAttribute(data.description)}', '${data.mediaUrl}', '${data.category}')">تعديل</button>
                      <button onclick="deleteData('${doc.id}')">حذف</button>
                  </div>
                </div>
            `;
        });
        document.getElementById('newsSection').innerHTML = output;
    } catch (error) {
        showResult('خطأ: ' + error.message, 'red');
    }
}

window.openEditForm = function(docId, title, description, mediaUrl, category) {
    console.log("فتح نموذج التعديل للفئة:", category);  // Debug log
    document.getElementById('editTitle').value = decodeURIComponent(title);
    document.getElementById('editDescription').value = decodeURIComponent(description);
    document.getElementById('existingMediaUrl').value = mediaUrl;
    document.getElementById('editDocId').value = docId;
    
    // Find the radio button for the category
    const categoryRadio = document.querySelector(`input[name="editNewsCategory"][value="${category}"]`);
    
    if (categoryRadio) {
        categoryRadio.checked = true;
    } else {
        console.warn(`لا يوجد زر راديو للفئة: ${category}`);
        // Optionally, you could set a default category or clear all radio buttons here
    }
    
    document.getElementById('editFormContainer').style.display = 'block';
};

document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;
    const mediaFile = document.getElementById('editMedia').files[0];
    const docId = document.getElementById('editDocId').value;
    const existingMediaUrl = document.getElementById('existingMediaUrl').value;
    const category = document.querySelector('input[name="editNewsCategory"]:checked')?.value;

    if (!docId) {
        showResult('لم يتم تحديد معرف الخبر.', 'red');
        return;
    }

    if (!category) {
        showResult('يرجى اختيار فئة.', 'red');
        return;
    }

    const docRef = doc(db, "news", docId);

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
            mediaType: mediaType,
            category: category
        });
    }).then(() => {
        showResult('تم تحديث الخبر بنجاح!', '#1877f2');
        document.getElementById('editForm').reset();
        document.getElementById('editFormContainer').style.display = 'none';
        loadData();
    }).catch(error => {
        showResult('خطأ: ' + error.message, 'red');
    });
});

document.getElementById('cancelEdit').addEventListener('click', function() {
    document.getElementById('editForm').reset();
    document.getElementById('editFormContainer').style.display = 'none';
});

window.deleteData = function(docId) {
    if (!docId) {
        showResult('لم يتم اختيار خبر.', 'red');
        return;
    }

    const docRef = doc(db, "news", docId);
    deleteDoc(docRef).then(() => {
        showResult('تم حذف الخبر بنجاح!', '#1877f2');
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
