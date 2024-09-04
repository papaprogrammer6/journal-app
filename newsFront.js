// Get the modal
var modal = document.getElementById("newsModal");

// Get the button that opens the modal
var btn = document.getElementById("createpost");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// Get the submit button
var submitBtn = document.getElementById("submitNews");

// Get the form
var form = document.getElementById("dataForm");

// When the user clicks the button, open the modal 
btn.onclick = function() {
  modal.style.display = "block";
  document.body.style.overflow = "hidden"; // Disable scroll
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
  document.body.style.overflowY = "auto"; // Enable scroll
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
    document.body.style.overflowY = "auto"; // Enable scroll
  }
}


// When the form is submitted, close the modal
form.onsubmit = function(event) {
  event.preventDefault(); // Prevent the form from submitting normally
  
  // Here you would typically handle the form submission,
  // such as sending the data to a server
  
  // Close the modal
  modal.style.display = "none";
  document.body.style.overflowY = "auto"; // Enable scroll
  
  // Optionally, reset the form
}

function auto_grow(element) {
  element.style.height = "5px";
  element.style.height = (element.scrollHeight) + "px";
}

const searchInput = document.getElementById('bar');
const searchIcon = document.querySelector('.icon');



// Get the edit modal
var editModal = document.getElementById("editFormContainer");

// Function to open the edit modal
window.openEditForm = function(docId, title, description, mediaUrl, category) {
  document.getElementById('editTitle').value = title;
  document.getElementById('editDescription').value = description;
  document.getElementById('existingMediaUrl').value = mediaUrl;
  document.getElementById('editDocId').value = docId;
  
  // Set the correct radio button for the category
  document.querySelector(`input[name="editNewsCategory"][value="${category}"]`).checked = true;
  
  editModal.style.display = "block";
  document.body.style.overflow = "hidden"; // Disable scroll
};

// Get the cancel button
var cancelEditBtn = document.getElementById("cancelEdit");

// When the user clicks on Cancel, close the modal
cancelEditBtn.onclick = function() {
  editModal.style.display = "none";
  document.body.style.overflowY = "auto"; // Enable scroll
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
    document.body.style.overflowY = "auto"; // Enable scroll
  }
  if (event.target == editModal) {
    editModal.style.display = "none";
    document.body.style.overflowY = "auto"; // Enable scroll
  }
}

// When the edit form is submitted, close the modal
document.getElementById('editForm').onsubmit = function(event) {
  // The form submission is handled in news.js, so we don't prevent default here
  editModal.style.display = "none";
  document.body.style.overflowY = "auto"; // Enable scroll
}
// Add the event listener for the search input
document.getElementById('bar').addEventListener('input', function(e) {
  const searchTerm = e.target.value.trim().toLowerCase();
  filterArticles(searchTerm);
});

function filterArticles(searchTerm) {
  const newsItems = document.querySelectorAll('.news-item');
  let hasResults = false;

  newsItems.forEach(item => {
      const title = item.querySelector('h2').textContent.toLowerCase();
      const description = item.querySelector('p').textContent.toLowerCase(); // Changed to query the <p> tag

      if (title.includes(searchTerm) || description.includes(searchTerm)) {
          item.style.display = 'block';
          hasResults = true;
      } else {
          item.style.display = 'none';
      }
  });

  if (!hasResults) {
      showResult('No news found matching the search term.', 'yellow');
  } else {
      // Clear any previous "no results" message
      document.getElementById('result').textContent = '';
  }
}

function resetSearch() {
  document.getElementById('bar').value = '';
  const newsItems = document.querySelectorAll('.news-item');
  newsItems.forEach(item => {
      item.style.display = 'block';
  });
  document.getElementById('result').textContent = '';
}