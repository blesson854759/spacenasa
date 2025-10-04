// User credentials (in production, this would be handled by a backend)
const users = {
  'demo': 'space2024',
  'researcher': 'nasa123',
  'admin': 'starexplorer'
};

function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const remember = document.getElementById('remember').checked;
  
  // Validate credentials
  if (users[username] && users[username] === password) {
    // Store user session
    const userData = {
      username: username,
      loginTime: new Date().toISOString(),
      role: username === 'admin' ? 'admin' : 'user'
    };
    
    if (remember) {
      localStorage.setItem('starExplorerUser', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('starExplorerUser', JSON.stringify(userData));
    }
    
    // Show success message
    showMessage('Login successful! Redirecting...', 'success');
    
    // Redirect to main dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  } else {
    showMessage('Invalid username or password!', 'error');
  }
}

function showMessage(message, type) {
  // Remove existing message if any
  const existingMsg = document.querySelector('.message');
  if (existingMsg) {
    existingMsg.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
  `;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Check if user is already logged in
window.addEventListener('load', () => {
  const user = localStorage.getItem('starExplorerUser') || sessionStorage.getItem('starExplorerUser');
  if (user) {
    window.location.href = 'dashboard.html';
  }
});