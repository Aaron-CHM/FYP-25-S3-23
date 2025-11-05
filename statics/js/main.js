// Global utility functions
function showMessage(message, type = 'info') {
  alert(message);
}

// ============================================
// LOGIN PAGE
// ============================================
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage(data.message, 'success');
        window.location.href = data.redirect;
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      showMessage('Login failed: ' + error.message, 'error');
    }
  });
}

// ============================================
// SIGNUP PAGE
// ============================================
if (document.getElementById('signupForm')) {
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;
    
    if (password !== confirm) {
      showMessage('Passwords do not match', 'error');
      return;
    }
    
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullname, email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage(data.message, 'success');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      showMessage('Signup failed: ' + error.message, 'error');
    }
  });
}

// ============================================
// USER DASHBOARD
// ============================================
if (window.location.pathname.includes('user.html') || window.location.pathname === '/user') {
  // Load profile
  async function loadProfile() {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      
      if (data.success) {
        document.getElementById('username').textContent = data.user.fullname;
        document.getElementById('email').textContent = data.user.email;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }
  
  // Edit profile
  if (document.getElementById('editProfileBtn')) {
    document.getElementById('editProfileBtn').addEventListener('click', () => {
      document.getElementById('editProfileForm').style.display = 'block';
      document.getElementById('newUsername').value = document.getElementById('username').textContent;
      document.getElementById('newEmail').value = document.getElementById('email').textContent;
    });
  }
  
  if (document.getElementById('saveProfileBtn')) {
    document.getElementById('saveProfileBtn').addEventListener('click', async () => {
      const fullname = document.getElementById('newUsername').value;
      const email = document.getElementById('newEmail').value;
      
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fullname, email })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage(data.message, 'success');
          document.getElementById('username').textContent = fullname;
          document.getElementById('email').textContent = email;
          document.getElementById('editProfileForm').style.display = 'none';
        }
      } catch (error) {
        showMessage('Update failed: ' + error.message, 'error');
      }
    });
  }
  
  if (document.getElementById('cancelEditBtn')) {
    document.getElementById('cancelEditBtn').addEventListener('click', () => {
      document.getElementById('editProfileForm').style.display = 'none';
    });
  }
  
  // Upload avatar
  if (document.getElementById('uploadAvatarBtn')) {
    document.getElementById('uploadAvatarBtn').addEventListener('click', async () => {
      const fileInput = document.getElementById('avatarUpload');
      const file = fileInput.files[0];
      
      if (!file) {
        showMessage('Please select an image', 'error');
        return;
      }
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      try {
        const response = await fetch('/api/avatar/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage(data.message, 'success');
          loadAvatars();
          fileInput.value = '';
        } else {
          showMessage(data.message, 'error');
        }
      } catch (error) {
        showMessage('Upload failed: ' + error.message, 'error');
      }
    });
  }
  
  // Load avatars
  async function loadAvatars() {
    try {
      const response = await fetch('/api/avatars');
      const data = await response.json();
      
      if (data.success) {
        const avatarList = document.getElementById('avatarList');
        const avatarSelect = document.getElementById('avatarSelect');
        
        avatarList.innerHTML = '';
        avatarSelect.innerHTML = '<option value="">--Select Avatar--</option>';
        
        data.avatars.forEach(avatar => {
          // Add to gallery
          const avatarDiv = document.createElement('div');
          avatarDiv.className = 'avatar-item';
          avatarDiv.innerHTML = `
            <img src="/static/${avatar.avatar_path}" alt="Avatar">
            <button class="btn small-btn danger-btn" onclick="deleteAvatar(${avatar.avatar_id})">Delete</button>
          `;
          avatarList.appendChild(avatarDiv);
          
          // Add to select
          const option = document.createElement('option');
          option.value = avatar.avatar_id;
          option.textContent = `Avatar ${avatar.avatar_id}`;
          avatarSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading avatars:', error);
    }
  }
  
  // Delete avatar
  window.deleteAvatar = async (avatarId) => {
    if (!confirm('Delete this avatar?')) return;
    
    try {
      const response = await fetch(`/api/avatar/${avatarId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage(data.message, 'success');
        loadAvatars();
      }
    } catch (error) {
      showMessage('Delete failed: ' + error.message, 'error');
    }
  };
  
  // Generate animation
  if (document.getElementById('generateBtn')) {
    document.getElementById('generateBtn').addEventListener('click', async () => {
      const avatarId = document.getElementById('avatarSelect').value;
      const expressionId = document.getElementById('expressionSelect').value;
      
      if (!avatarId || !expressionId) {
        showMessage('Please select avatar and expression', 'error');
        return;
      }
      
      try {
        const response = await fetch('/api/animation/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            avatar_id: avatarId, 
            expression_id: expressionId 
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage(data.message, 'success');
          
          // Show preview
          const preview = document.getElementById('animationPreview');
          const video = document.getElementById('previewVideo');
          video.src = `/static/${data.animation_path}`;
          preview.style.display = 'block';
          
          loadAnimations();
        } else {
          showMessage(data.message, 'error');
        }
      } catch (error) {
        showMessage('Generation failed: ' + error.message, 'error');
      }
    });
  }
  
  // Cancel preview
  if (document.getElementById('cancelPreviewBtn')) {
    document.getElementById('cancelPreviewBtn').addEventListener('click', () => {
      document.getElementById('animationPreview').style.display = 'none';
    });
  }
  
  // Load animations
  async function loadAnimations() {
    try {
      const response = await fetch('/api/animations');
      const data = await response.json();
      
      if (data.success) {
        const animationList = document.getElementById('animationList');
        animationList.innerHTML = '';
        
        data.animations.forEach(animation => {
          const animDiv = document.createElement('div');
          animDiv.className = 'animation-item';
          animDiv.innerHTML = `
            <video src="/static/${animation.animation_path}" controls></video>
            <p>${animation.expression_name || 'Custom'}</p>
            <p>${new Date(animation.created_at).toLocaleDateString()}</p>
          `;
          animationList.appendChild(animDiv);
        });
      }
    } catch (error) {
      console.error('Error loading animations:', error);
    }
  }
  
  // Initialize
  loadProfile();
  loadAvatars();
  loadAnimations();
}

// ============================================
// SUBSCRIBER DASHBOARD
// ============================================
if (window.location.pathname.includes('subscriber.html') || window.location.pathname === '/subscriber') {
  // Similar to user dashboard but with subscription features
  // Add subscriber-specific functionality here
  
  if (document.getElementById('updateSubscriptionBtn')) {
    document.getElementById('updateSubscriptionBtn').addEventListener('click', async () => {
      const plan = document.getElementById('planSelect').value;
      
      try {
        const response = await fetch('/api/subscription/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ plan })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage(data.message, 'success');
        }
      } catch (error) {
        showMessage('Update failed: ' + error.message, 'error');
      }
    });
  }
}

// ============================================
// ADMIN DASHBOARD
// ============================================
if (window.location.pathname.includes('admin.html') || window.location.pathname === '/admin') {
  // Load all users
  async function loadUsers() {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        const userList = document.getElementById('userList');
        userList.innerHTML = '<h4>All Users</h4>';
        
        data.users.forEach(user => {
          const userDiv = document.createElement('div');
          userDiv.style.cssText = 'padding:10px; margin:5px 0; background:#f0f0f0; border-radius:5px;';
          userDiv.innerHTML = `
            <p><strong>${user.fullname}</strong> (${user.email})</p>
            <p>Role: ${user.role} | Status: ${user.subscription_status}</p>
            <button class="btn small-btn danger-btn" onclick="suspendUser(${user.user_id})">Suspend</button>
            <button class="btn small-btn" onclick="activateUser(${user.user_id})">Activate</button>
          `;
          userList.appendChild(userDiv);
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }
  
  window.suspendUser = async (userId) => {
    try {
      const response = await fetch(`/api/admin/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'suspend' })
      });
      
      const data = await response.json();
      if (data.success) {
        showMessage('User suspended', 'success');
        loadUsers();
      }
    } catch (error) {
      showMessage('Action failed', 'error');
    }
  };
  
  window.activateUser = async (userId) => {
    try {
      const response = await fetch(`/api/admin/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'activate' })
      });
      
      const data = await response.json();
      if (data.success) {
        showMessage('User activated', 'success');
        loadUsers();
      }
    } catch (error) {
      showMessage('Action failed', 'error');
    }
  };
  
  loadUsers();
}

// ============================================
// LOGOUT FUNCTIONALITY
// ============================================
const logoutButtons = document.querySelectorAll('#logoutBtn, #logoutAdminBtn');
logoutButtons.forEach(btn => {
  if (btn) {
    btn.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/logout', {
          method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Logout failed:', error);
      }
    });
  }
});
