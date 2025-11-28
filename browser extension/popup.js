document.addEventListener('DOMContentLoaded', function() {
  const emailInput = document.getElementById('email');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');

  // Load saved email
  chrome.storage.sync.get(['userEmail'], function(result) {
    if (result.userEmail) {
      emailInput.value = result.userEmail;
    }
  });

  // Save email
  saveButton.addEventListener('click', function() {
    const email = emailInput.value;
    chrome.storage.sync.set({ userEmail: email }, function() {
      statusDiv.textContent = 'Email saved successfully!';
      setTimeout(function() {
        statusDiv.textContent = '';
      }, 2000);
    });
  });
});
