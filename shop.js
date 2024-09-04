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
        loadShopItems(); // Load data when authenticated

        // Set the author image
        const authorImg = document.getElementById('authorimg');
        if (user.photoURL) {
            authorImg.src = user.photoURL;
        }
    }
});

document.getElementById('shopForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const itemPrice = parseFloat(document.getElementById('itemPrice').value);
    const frontImage = document.getElementById('frontImage').files[0];
    const sideImage = document.getElementById('sideImage').files[0];
    const backImage = document.getElementById('backImage').files[0];

    if (!auth.currentUser) {
        showResult('You must be logged in to post!', 'red');
        return;
    }

    let uploadPromises = [
        uploadImage(frontImage, 'front'),
        uploadImage(sideImage, 'side'),
        uploadImage(backImage, 'back')
    ];

    Promise.all(uploadPromises).then(([frontUrl, sideUrl, backUrl]) => {
        const itemData = {
            price: itemPrice,
            frontImageUrl: frontUrl || '',
            sideImageUrl: sideUrl || '',
            backImageUrl: backUrl || '',
            createdBy: auth.currentUser.uid,
            createdAt: serverTimestamp()
        };

        return addDoc(collection(db, "shop"), itemData);
    }).then(() => {
        showResult('item posted successfully!', '#1877f2');
        document.getElementById('shopForm').reset();
        loadShopItems(); // Reload items after adding new item
    }).catch(error => {
        showResult('Error: ' + error.message, 'red');
    });
});

function uploadImage(image, view) {
    if (!image) return Promise.resolve(null);
    const storageRef = ref(storage, `shop-images/${view}_${Date.now()}_${image.name}`);
    return uploadBytes(storageRef, image).then(() => getDownloadURL(storageRef));
}

async function loadShopItems() {
    try {
        const querySnapshot = await getDocs(collection(db, "shop"));
        let output = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            output += `
                <div class="shop-item">
                    <p>السعر:  ${data.price.toFixed(2)}DT</p>
                    ${data.frontImageUrl ? `<img src="${data.frontImageUrl}" alt="Front view">` : ''}
                    ${data.sideImageUrl ? `<img src="${data.sideImageUrl}" alt="Side view">` : ''}
                    ${data.backImageUrl ? `<img src="${data.backImageUrl}" alt="Back view">` : ''}
                  <div class="layout">
                      <button onclick="openEditForm('${doc.id}')">تعديل</button>
                      <button onclick="deleteItem('${doc.id}')">حذف</button>
                  </div>
                </div>
            `;
        });
        document.getElementById('shopItemsSection').innerHTML = output;
    } catch (error) {
        showResult('Error: ' + error.message, 'red');
    }
}

window.openEditForm = async function(itemId) {
    const docRef = doc(db, "shop", itemId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('editItemPrice').value = data.price;
        document.getElementById('editItemId').value = itemId;
        document.getElementById('editFormContainer').style.display = 'block';
    } else {
        console.log("No such document!");
    }
};

document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const itemId = document.getElementById('editItemId').value;
    const itemPrice = parseFloat(document.getElementById('editItemPrice').value);
    const frontImage = document.getElementById('editFrontImage').files[0];
    const sideImage = document.getElementById('editSideImage').files[0];
    const backImage = document.getElementById('editBackImage').files[0];

    let uploadPromises = [
        uploadImage(frontImage, 'front'),
        uploadImage(sideImage, 'side'),
        uploadImage(backImage, 'back')
    ];

    Promise.all(uploadPromises).then(async ([frontUrl, sideUrl, backUrl]) => {
        const itemRef = doc(db, "shop", itemId);
        const itemData = {
            price: itemPrice,
            updatedAt: serverTimestamp()
        };

        if (frontUrl) itemData.frontImageUrl = frontUrl;
        if (sideUrl) itemData.sideImageUrl = sideUrl;
        if (backUrl) itemData.backImageUrl = backUrl;

        await updateDoc(itemRef, itemData);
        showResult('items updated successfully!', '#1877f2');
        document.getElementById('editForm').reset();
        document.getElementById('editFormContainer').style.display = 'none';
        loadShopItems(); // Reload items after updating
    }).catch(error => {
        showResult('Error: ' + error.message, 'red');
    });
});

document.getElementById('cancelEdit').addEventListener('click', function() {
    document.getElementById('editForm').reset();
    document.getElementById('editFormContainer').style.display = 'none';
});

window.deleteItem = async function(itemId) {
   
        try {
            await deleteDoc(doc(db, "shop", itemId));
            showResult('item deleted successfully!', '#1877f2');
            loadShopItems(); // Reload items after deleting
        } catch (error) {
            showResult('Error: ' + error.message, 'red');
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

// Initial load of shop items
loadShopItems();