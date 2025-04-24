/**
 * KeyTracker - Main JavaScript with persistence
 */

// Constants for specific permanently missing keys per unit
const MISSING_KEYS = {
	'ALPHA1': [1, 3, 7, 12, 15],
	'ALPHA2': [2, 8, 11],
	'ALPHA3': [4, 9, 14, 22],
	'ALPHA4': [6, 13, 19],
	'BRAVO': [5, 17, 23, 31],
	'CHARLIE': [16, 25, 33],
	'DELTA': [21, 27, 35],
	'ECHO': [29, 37, 42],
	'FOXTROT': [32, 39, 44, 48]
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
	// Apply disabled attribute to all missing keys
	const buttons = document.querySelectorAll('.default_missing');
	buttons.forEach(button => {
		button.disabled = true;
		button.setAttribute('aria-disabled', 'true');
		button.style.cursor = 'not-allowed';
		button.style.opacity = '0.7'; // Make it appear more disabled
	});

	// Apply disabled attribute to permanently missing keys based on company
	const companyName = document.querySelector('.header-title').textContent.split(' ')[0];
	if (MISSING_KEYS[companyName]) {
		MISSING_KEYS[companyName].forEach(keyId => {
			const keyButton = document.getElementById(`${companyName}-${keyId}`);
			if (keyButton) {
				keyButton.disabled = true;
				keyButton.setAttribute('aria-disabled', 'true');
				keyButton.classList.remove('default_true', 'default_false');
				keyButton.classList.add('default_missing');
				keyButton.style.cursor = 'not-allowed';
				keyButton.style.opacity = '0.7';
			}
		});
	}
});

/**
 * Change button class and status between True and False with persistence
 */
function changeClass(elem) {
	if (elem.disabled) return; // Don't process clicks on disabled buttons
	
	// Determine new status
	let newStatus;
	if (elem.classList.contains("default_true")) {
		newStatus = "False";
		elem.classList.remove("default_true");
		elem.classList.add("default_false");
	} else if (elem.classList.contains("default_false")) {
		newStatus = "True";
		elem.classList.remove("default_false");
		elem.classList.add("default_true");
	} else {
		return; // Unknown state
	}
	
	// Update server with new status
	updateStatus(elem.getAttribute("coy"), elem.value, newStatus);
}

/**
 * Update key status via AJAX with visual feedback
 */
function updateStatus(coy, boxId, status) {
	// Show loading state
	const button = document.getElementById(`${coy}-${boxId}`);
	if (!button) {
		console.error(`Button not found: ${coy}-${boxId}`);
		showToast('Error: Button not found', 'error');
		return;
	}
	
	console.log(`Updating key ${boxId} in ${coy} to status: ${status}`);
	button.disabled = true; // Prevent multiple clicks
	
	// Save original class for rollback if needed
	const originalClass = status === 'True' ? 'default_false' : 'default_true';
	
	$.ajax({
		url: '/updateStatus',
		data: {coy: coy, bunk: boxId, status: status},
		type: 'POST',
		success: function(response) {
			console.log('Server response:', response);
			// Enable button again
			button.disabled = false;
			showToast('Saved', 'success');
		},
		error: function(error) {
			console.error('Server error:', error);
			// Revert to original state on error
			button.disabled = false;
			
			if (status === 'True') {
				button.classList.remove("default_true");
				button.classList.add("default_false");
			} else {
				button.classList.remove("default_false");
				button.classList.add("default_true");
			}
			
			showToast('Error updating key status', 'error');
		}
	});
}

/**
 * Generate and copy report
 */
function generateReport() {
	showToast('Generating report...', 'info');
	
	$.ajax({
		url: '/genReport',
		type: 'GET',
		dataType: 'text', // Ensure jQuery treats the response as text
		success: function(response) {
			console.log("Report generated successfully");
			console.log("Report length:", response.length);
			// Display first few characters of report for debugging
			console.log("Report preview:", response.substring(0, 100));
			copyToClipboard(response);
		},
		error: function(error) {
			console.error('Failed to generate report:', error);
			showToast('Error generating report', 'error');
		}
	});
}

/**
 * Copy text to clipboard and show toast notification
 */
function copyToClipboard(text) {
	console.log("Attempting to copy to clipboard");
	
	// Try to use modern clipboard API first
	if (navigator.clipboard && window.isSecureContext) {
		try {
			navigator.clipboard.writeText(text)
				.then(() => {
					console.log("Copied using Clipboard API");
					showToast('Report copied to clipboard!', 'success');
				})
				.catch(err => {
					console.error('Could not copy text with Clipboard API:', err);
					fallbackCopyToClipboard(text);
				});
		} catch (e) {
			console.error("Error with Clipboard API:", e);
			fallbackCopyToClipboard(text);
		}
	} else {
		console.log("Clipboard API not available, using fallback");
		fallbackCopyToClipboard(text);
	}
}

/**
 * Fallback clipboard method using textarea
 */
function fallbackCopyToClipboard(text) {
	// Create hidden textarea element
	const textarea = document.createElement('textarea');
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	textarea.value = text;
	document.body.appendChild(textarea);
	
	try {
		// Select and copy
		textarea.select();
		const successful = document.execCommand('copy');
		if (successful) {
			showToast('Report copied to clipboard!', 'success');
		} else {
			showReportModal(text);
		}
	} catch (err) {
		console.error('Could not copy text: ', err);
		showReportModal(text);
	} finally {
		// Clean up
		document.body.removeChild(textarea);
	}
}

/**
 * Show modal with report text when clipboard API fails
 */
function showReportModal(text) {
	// Create modal elements
	const modal = document.createElement('div');
	modal.className = 'report-modal';
	modal.style.position = 'fixed';
	modal.style.top = '0';
	modal.style.left = '0';
	modal.style.width = '100%';
	modal.style.height = '100%';
	modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
	modal.style.display = 'flex';
	modal.style.justifyContent = 'center';
	modal.style.alignItems = 'center';
	modal.style.zIndex = '9999';
	
	const modalContent = document.createElement('div');
	modalContent.style.backgroundColor = '#111';
	modalContent.style.padding = '20px';
	modalContent.style.borderRadius = '8px';
	modalContent.style.maxWidth = '600px';
	modalContent.style.width = '90%';
	modalContent.style.maxHeight = '80vh';
	modalContent.style.display = 'flex';
	modalContent.style.flexDirection = 'column';
	modalContent.style.border = '1px solid #333';
	
	const heading = document.createElement('h3');
	heading.textContent = 'Copy Report Text';
	heading.style.color = '#2ecc71';
	heading.style.marginBottom = '15px';
	heading.style.borderBottom = '1px solid #333';
	heading.style.paddingBottom = '10px';
	
	const instructions = document.createElement('p');
	instructions.textContent = 'Clipboard access was denied. Please manually copy the text below:';
	instructions.style.marginBottom = '15px';
	instructions.style.color = '#ccc';
	
	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.style.width = '100%';
	textarea.style.minHeight = '300px';
	textarea.style.padding = '10px';
	textarea.style.marginBottom = '15px';
	textarea.style.backgroundColor = '#222';
	textarea.style.color = '#fff';
	textarea.style.border = '1px solid #444';
	textarea.style.borderRadius = '4px';
	textarea.style.fontFamily = 'monospace';
	textarea.readOnly = true;
	
	const closeButton = document.createElement('button');
	closeButton.textContent = 'Close';
	closeButton.style.padding = '8px 16px';
	closeButton.style.backgroundColor = '#1a3a5f';
	closeButton.style.color = 'white';
	closeButton.style.border = '1px solid #3498db';
	closeButton.style.borderRadius = '4px';
	closeButton.style.cursor = 'pointer';
	closeButton.style.alignSelf = 'flex-end';
	
	closeButton.onclick = function() {
		document.body.removeChild(modal);
	};
	
	modalContent.appendChild(heading);
	modalContent.appendChild(instructions);
	modalContent.appendChild(textarea);
	modalContent.appendChild(closeButton);
	modal.appendChild(modalContent);
	
	document.body.appendChild(modal);
	
	// Select all text in textarea for easy copying
	textarea.select();
	
	// Allow closing by clicking outside
	modal.addEventListener('click', function(e) {
		if (e.target === modal) {
			document.body.removeChild(modal);
		}
	});
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
	const toast = document.getElementById('toast');
	
	// Check if toast element exists
	if (!toast) return;
	
	// Set message and styling
	toast.textContent = message;
	
	if (type === 'error') {
		toast.style.backgroundColor = '#e74c3c';
	} else if (type === 'warning') {
		toast.style.backgroundColor = '#f39c12';
	} else if (type === 'info') {
		toast.style.backgroundColor = '#3498db';
	} else {
		toast.style.backgroundColor = '#2ecc71';
	}
	
	// Show and hide toast
	toast.classList.add('show');
	
	setTimeout(() => {
		toast.classList.remove('show');
	}, 3000);
} 