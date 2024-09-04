import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
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
        loadEvents(); // Load data when authenticated

        // Set the author image
        const authorImg = document.getElementById('authorimg');
        if (user.photoURL) {
            authorImg.src = user.photoURL;
        }
    }
});

document.getElementById('eventForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const eventplace = document.getElementById('eventplace').value;
    const eventName = document.getElementById('eventName').value;
    const eventImage = document.getElementById('eventImage').files[0];
    const eventDate = document.getElementById('eventDate').value;
    const eventPrice = parseFloat(document.getElementById('eventPrice').value);

    if (!auth.currentUser) {
        showResult('يجب تسجيل الدخول لإنشاء حدث', 'red');
        return;
    }

    let uploadPromise = Promise.resolve(null);

    if (eventImage) {
        const storageRef = ref(storage, 'event-images/' + eventImage.name);
        uploadPromise = uploadBytes(storageRef, eventImage).then(() => getDownloadURL(storageRef));
    }

    uploadPromise.then(imageUrl => {
        const eventData = {
            place: eventplace,
            name: eventName,
            imageUrl: imageUrl || '',
            date: new Date(eventDate),
            price: eventPrice,
            createdBy: auth.currentUser.uid,
            createdAt: serverTimestamp()
        };

        return addDoc(collection(db, "event"), eventData);
    }).then(() => {
        showResult('تم إنشاء الحدث بنجاح!', '#1877f2');
        document.getElementById('eventForm').reset();
        loadEvents(); // Reload events after adding new event
    }).catch(error => {
        showResult('خطأ: ' + error.message, 'red');
    });
});

async function loadEvents() {
    try {
        const querySnapshot = await getDocs(collection(db, "event"));
        let output = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            output += `
                <div class="event-item">
                    <h2>${data.name}</h2>
                    ${data.imageUrl ? `<img src="${data.imageUrl}" alt="${data.name}" style="max-width: 200px;">` : ''}
                    <p>التاريخ: ${data.date.toDate().toLocaleString()}</p>
                    <p>السعر: ${data.price.toFixed(2)} DT</p>
                    <p>المكان: ${data.place}</p>
                    <div class="layout">
                        <button onclick="openEditForm('${doc.id}')" >تعديل</button>
                        <button onclick="deleteEvent('${doc.id}')">حذف</button>
                    </div>
                </div>
            `;
        });
        document.getElementById('eventsSection').innerHTML = output;
    } catch (error) {
        showResult('خطأ: ' + error.message, 'red');
    }
}

window.openEditForm = async function(eventId) {
    const docRef = doc(db, "event", eventId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('editeventplace').value = data.place;
        document.getElementById('editEventName').value = data.name;
        document.getElementById('editEventDate').value = data.date.toDate().toISOString().slice(0, 16);
        document.getElementById('editEventPrice').value = data.price;
        document.getElementById('editEventId').value = eventId;
        document.getElementById('editFormContainer').style.display = 'block';
    } else {
        console.log("لا يوجد مثل هذا المستند!");
    }
};

document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const eventPlace = document.getElementById('editeventplace').value;
    const eventId = document.getElementById('editEventId').value;
    const eventName = document.getElementById('editEventName').value;
    const eventImage = document.getElementById('editEventImage').files[0];
    const eventDate = document.getElementById('editEventDate').value;
    const eventPrice = parseFloat(document.getElementById('editEventPrice').value);

    let uploadPromise = Promise.resolve(null);

    if (eventImage) {
        const storageRef = ref(storage, 'event-images/' + eventImage.name);
        uploadPromise = uploadBytes(storageRef, eventImage).then(() => getDownloadURL(storageRef));
    }

    uploadPromise.then(async (imageUrl) => {
        const eventRef = doc(db, "event", eventId);
        const eventData = {
            place: eventPlace,
            name: eventName,
            date: new Date(eventDate),
            price: eventPrice,
            updatedAt: serverTimestamp()
        };

        if (imageUrl) {
            eventData.imageUrl = imageUrl;
        }

        await updateDoc(eventRef, eventData);
        showResult('تم تحديث الحدث بنجاح!', '#1877f2');
        document.getElementById('editForm').reset();
        document.getElementById('editFormContainer').style.display = 'none';
        loadEvents(); // Reload events after updating
    }).catch(error => {
        showResult('خطأ: ' + error.message, 'red');
    });
});

document.getElementById('cancelEdit').addEventListener('click', function() {
    document.getElementById('editForm').reset();
    document.getElementById('editFormContainer').style.display = 'none';
});

window.deleteEvent = async function(eventId) {
    try {
        await deleteDoc(doc(db, "event", eventId));
        showResult('تم حذف المستند بنجاح!', '#1877f2');
        loadEvents(); // Reload events after deleting
    } catch (error) {
        showResult('خطأ: ' + error.message, 'red');
    }
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

// Initial load of events
loadEvents();

document.getElementById('bar').addEventListener('input', function(e) {
    const searchTerm = e.target.value.trim().toLowerCase();
    filterEvents(searchTerm);
});
