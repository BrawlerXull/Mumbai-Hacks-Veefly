document.addEventListener('mouseup', function(e) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // Remove existing icon if any
  const existingIcon = document.querySelector('.veefly-chat-icon');
  if (existingIcon) {
    existingIcon.remove();
  }

  if (selectedText.length > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const icon = document.createElement('div');
    icon.className = 'veefly-chat-icon';
    icon.textContent = 'Analyse news';
    
    // Position the icon just above the selection
    // We need to account for scroll position
    const top = rect.top + window.scrollY - 40; 
    const left = rect.left + window.scrollX + (rect.width / 2) - 20; // Center horizontally

    icon.style.top = `${top}px`;
    icon.style.left = `${left}px`;

    icon.addEventListener('mousedown', function(e) {
        e.preventDefault(); // Prevent losing selection
        e.stopPropagation();
        
        showLoadingModal();

        chrome.runtime.sendMessage({
            type: 'ANALYZE_TEXT',
            data: {
                text: selectedText,
                url: window.location.href,
                source: 'browser_extension',
                title: document.title,
                date: new Date().toISOString()
            }
        }, response => {
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
                alert('Error starting analysis. Check console for details.');
                return;
            }

            if (response && response.success) {
                console.log('Analysis result:', response.data);
                showResultsModal(response.data);
            } else {
                console.error('Analysis failed:', response ? response.error : 'Unknown error');
                alert('Error analyzing text. Check console for details.');
            }
        });
    });

    document.body.appendChild(icon);
  }
});

function showResultsModal(data) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.veefly-modal-overlay');
    if (existingModal) existingModal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'veefly-modal-overlay';
    
    // Close on click outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    const score = data.authenticity_score !== undefined ? (data.authenticity_score * 100).toFixed(1) + '%' : 'N/A';
    const category = data.authenticity_category || 'Unknown';
    
    let scoreClass = 'veefly-score-medium';
    if (data.authenticity_score >= 0.7) scoreClass = 'veefly-score-high';
    if (data.authenticity_score < 0.4) scoreClass = 'veefly-score-low';

    const claimsHtml = data.key_claims && data.key_claims.length > 0 
        ? `<ul class="veefly-claims-list">${data.key_claims.map(c => `<li>${c.claim}</li>`).join('')}</ul>`
        : '<p>No specific claims identified.</p>';

    // Simple markdown-like formatting for report
    let reportHtml = data.report || 'No report available.';
    reportHtml = reportHtml
        .replace(/### (.*?)\n/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    overlay.innerHTML = `
        <div class="veefly-modal-content">
            <div class="veefly-modal-header">
                <h2 class="veefly-modal-title">Analysis Result</h2>
                <button class="veefly-close-btn">&times;</button>
            </div>
            
            <div class="veefly-score-container">
                <span class="veefly-score-label">Authenticity:</span>
                <span class="veefly-score-value ${scoreClass}">${category} (${score})</span>
            </div>

            <div class="veefly-section">
                <div class="veefly-section-title">Key Claims</div>
                ${claimsHtml}
            </div>

            <div class="veefly-section">
                <div class="veefly-section-title">Detailed Report</div>
                <div class="veefly-report-text">${reportHtml}</div>
            </div>
        </div>
    `;

    const closeBtn = overlay.querySelector('.veefly-close-btn');
    closeBtn.addEventListener('click', () => overlay.remove());

    document.body.appendChild(overlay);
}

function showLoadingModal() {
    // Remove existing modal if any
    const existingModal = document.querySelector('.veefly-modal-overlay');
    if (existingModal) existingModal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'veefly-modal-overlay';
    
    overlay.innerHTML = `
        <div class="veefly-modal-content" style="max-width: 400px; text-align: center;">
            <div class="veefly-loading-container">
                <div class="veefly-spinner"></div>
                <div class="veefly-loading-text">Analyzing content...</div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

document.addEventListener('mousedown', function(e) {
    // If clicking outside the icon, remove it
    if (!e.target.classList.contains('veefly-chat-icon')) {
        const existingIcon = document.querySelector('.veefly-chat-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
    }
});
