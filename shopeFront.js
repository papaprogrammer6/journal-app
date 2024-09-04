document.addEventListener('DOMContentLoaded', function() {
  // Get the modal
  var modal = document.getElementById("shopModal");

  // Get the button that opens the modal
  var btn = document.getElementById("createShopItem");

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

  // Get the submit button
  var submitBtn = document.getElementById("submitShopItem");

  // Get the form
  var form = document.getElementById("shopForm");

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
    form.reset();
  }



  // Edit modal functionality
  var editModal = document.getElementById("editFormContainer");
  var cancelEditBtn = document.getElementById("cancelEdit");

  // When the user clicks on Cancel, close the modal
  cancelEditBtn.onclick = function() {
    editModal.style.display = "none";
    document.body.style.overflowY = "auto"; // Enable scroll
  }

  // When the edit form is submitted, close the modal
  document.getElementById('editForm').onsubmit = function(event) {
    event.preventDefault();
    editModal.style.display = "none";
    document.body.style.overflowY = "auto"; // Enable scroll
  }
});
document.getElementById('bar').addEventListener('input', function(e) {
  const searchTerm = e.target.value.trim().toLowerCase();
  filterShopItems(searchTerm);
});
function filterShopItems(searchTerm) {
  const shopItems = document.querySelectorAll('#shopItemsSection > div');
  let hasResults = false;

  shopItems.forEach(item => {
      const itemText = item.textContent.toLowerCase();

      if (itemText.includes(searchTerm)) {
          item.style.display = 'block';
          hasResults = true;
      } else {
          item.style.display = 'none';
      }
  });

  if (!hasResults) {
      showResult('No shop items found matching the search term.', 'yellow');
  } else {
      // Clear any previous "no results" message
      document.getElementById('result').textContent = '';
  }
}
document.getElementById('bar').value = ''; // Clear search bar
const currentSearchTerm = document.getElementById('bar').value.trim().toLowerCase();
if (currentSearchTerm) {
    filterShopItems(currentSearchTerm);
}