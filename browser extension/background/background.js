// Background script
console.log("Background script running");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE_TEXT') {
    const formData = new FormData();
    // Append data from the message
    for (const key in message.data) {
      formData.append(key, message.data[key]);
    }

    console.log('Sending request to API...', Object.fromEntries(formData));

    fetch('https://ntq5xfqh-6000.inc1.devtunnels.ms/analyze', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      sendResponse({ success: true, data: data });
    })
    .catch(error => {
      console.error('Error in background script:', error);
      sendResponse({ success: false, error: error.toString() });
    });

    return true; // Will respond asynchronously
  }
});
