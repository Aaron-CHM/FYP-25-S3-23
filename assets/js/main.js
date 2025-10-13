// Consolidated site JavaScript
(function(){
  // Expose download helper globally (used by onclick attributes in some pages)
  window.downloadFile = function(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  document.addEventListener('DOMContentLoaded', function(){
    // ---------- Signup page ----------
    if (document.getElementById('signupForm')) {
      const title = document.getElementById('formTitle');
      const map = {
        user: 'User Sign Up',
        admin: 'Admin Sign Up',
        guest: 'Guest Sign Up',
        subscriber: 'Subscribers / Paid User Sign Up'
      };

      function setSignupRole(roleKey) {
        if (title && map[roleKey]) title.textContent = map[roleKey];
        document.querySelectorAll('.role-item').forEach(el => el.classList.remove('active'));
        const el = document.querySelector(`.role-item[data-role="${roleKey}"]`);
        if (el) el.classList.add('active');
      }

      // attach listeners to role items that have data-role
      document.querySelectorAll('.role-item[data-role]').forEach(li => {
        li.addEventListener('click', () => setSignupRole(li.dataset.role));
      });

      // expose for legacy uses if needed
      window.showForm = setSignupRole;

      // initialize default
      if (!document.querySelector('.role-item.active')) setSignupRole('user');
    }

    // ---------- Login page ----------
    if (document.getElementById('loginForm')) {
      // Test credentials
      const testCredentials = {
        "User Login": { email: "user@test.com", password: "1234", redirect: "user.html" },
        "Admin Login": { email: "admin@test.com", password: "admin", redirect: "admin.html" },
        "Guest Login": { email: "guest@test.com", password: "guest", redirect: "guest.html" },
        "Subscribers / Paid User Login": { email: "subscriber@test.com", password: "sub123", redirect: "subscriber.html" }
      };

      const formTitle = document.getElementById("formTitle");
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");
      const roleItems = document.querySelectorAll(".role-item");

      function activateRole(roleText) {
        roleItems.forEach(item => item.classList.remove("active"));
        const activeItem = Array.from(roleItems).find(item => item.dataset.role === roleText);
        if (activeItem) activeItem.classList.add("active");

        if (formTitle) formTitle.textContent = roleText;
        if (emailInput && passwordInput && testCredentials[roleText]) {
          emailInput.value = testCredentials[roleText].email;
          passwordInput.value = testCredentials[roleText].password;
        }
      }

      roleItems.forEach(item => {
        item.addEventListener("click", () => {
          activateRole(item.dataset.role);
        });
      });

      // Initialize default role
      activateRole("User Login");

      // Login handler
      document.getElementById("loginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const activeRoleEl = document.querySelector(".role-item.active");
        const activeRole = activeRoleEl ? activeRoleEl.dataset.role : "User Login";
        const creds = testCredentials[activeRole];

        if (emailInput && passwordInput && creds && emailInput.value === creds.email && passwordInput.value === creds.password) {
          // Redirect immediately without showing a blocking alert
          console.log(`${activeRole} successful, redirecting to ${creds.redirect}`);
          window.location.href = creds.redirect;
        } else {
          alert("Invalid email or password. Use the test credentials.");
        }
      });
    }

    // ---------- User dashboard ----------
    if (document.getElementById('username') || document.getElementById('avatarForm') || document.getElementById('generateBtn')) {
      // Profile edit
      const editProfileBtn = document.getElementById('editProfileBtn');
      const editProfileForm = document.getElementById('editProfileForm');
      const cancelEditBtn = document.getElementById('cancelEditBtn');
      const saveProfileBtn = document.getElementById('saveProfileBtn');
      if (editProfileBtn) editProfileBtn.onclick = () => { if (editProfileForm) editProfileForm.style.display = 'block'; };
      if (cancelEditBtn) cancelEditBtn.onclick = () => { if (editProfileForm) editProfileForm.style.display = 'none'; };
      if (saveProfileBtn) saveProfileBtn.onclick = () => {
        const newUsername = document.getElementById('newUsername') && document.getElementById('newUsername').value;
        const newEmail = document.getElementById('newEmail') && document.getElementById('newEmail').value;
        if(newUsername) { const el = document.getElementById('username'); if(el) el.innerText = newUsername; }
        if(newEmail) { const el = document.getElementById('email'); if(el) el.innerText = newEmail; }
        if (editProfileForm) editProfileForm.style.display = 'none';
      };

      // Delete account
      const deleteAccountBtn = document.getElementById('deleteAccountBtn');
      if (deleteAccountBtn) deleteAccountBtn.onclick = () => alert('Account deletion triggered');

      // Avatar management
      const avatarUpload = document.getElementById('avatarUpload');
      const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
      const avatarList = document.getElementById('avatarList');
      const avatarSelect = document.getElementById('avatarSelect');
      if (uploadAvatarBtn) uploadAvatarBtn.onclick = () => {
        if(!avatarUpload || avatarUpload.files.length === 0) return alert('Select an avatar to upload');
        const file = avatarUpload.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
          const avatarDiv = document.createElement('div');
          avatarDiv.className = 'avatar-item';
          avatarDiv.innerHTML = `\n            <img src="${e.target.result}" alt="Avatar">\n            <div class="profile-actions">\n              <button class="btn small-btn danger-btn deleteAvatarBtn">Delete</button>\n            </div>`;
          if (avatarList) avatarList.appendChild(avatarDiv);

          // Add to avatar dropdown
          if (avatarSelect) {
            const option = document.createElement('option');
            option.value = e.target.result;
            option.text = file.name;
            avatarSelect.add(option);

            // Delete avatar
            avatarDiv.querySelector('.deleteAvatarBtn').onclick = () => {
              avatarDiv.remove();
              option.remove();
            };
          }
        };
        reader.readAsDataURL(file);
        avatarUpload.value = '';
      };

      // Animation generator (preview/save)
      const generateBtn = document.getElementById('generateBtn');
      const animationPreview = document.getElementById('animationPreview');
      const previewVideo = document.getElementById('previewVideo');
      const saveAnimationBtn = document.getElementById('saveAnimationBtn');
      const cancelPreviewBtn = document.getElementById('cancelPreviewBtn');
      const animationList = document.getElementById('animationList');

      if (generateBtn) generateBtn.onclick = () => {
        const avatarSel = document.getElementById('avatarSelect');
        const avatarSrc = avatarSel ? avatarSel.value : '';
        const expression = document.getElementById('expressionSelect') ? document.getElementById('expressionSelect').value : '';
        if(!avatarSrc || !expression) return alert('Select avatar and expression');
        if (previewVideo) previewVideo.src = avatarSrc; // placeholder
        if (animationPreview) animationPreview.style.display = 'block';
      };

      if (cancelPreviewBtn) cancelPreviewBtn.onclick = () => { if (animationPreview) animationPreview.style.display = 'none'; };
      if (saveAnimationBtn) saveAnimationBtn.onclick = () => {
        if (!previewVideo) return;
        const videoSrc = previewVideo.src;
        const animDiv = document.createElement('div');
        animDiv.className = 'animation-item';
        animDiv.innerHTML = `\n          <video src="${videoSrc}" controls></video>\n          <button class="btn small-btn danger-btn deleteAnimationBtn">Delete</button>`;
        if (animationList) animationList.appendChild(animDiv);
        animDiv.querySelector('.deleteAnimationBtn').onclick = () => animDiv.remove();
        if (animationPreview) animationPreview.style.display = 'none';
      };
    }

    // ---------- Subscriber page ----------
    if (document.getElementById('saveStep1Btn') || document.getElementById('drivingVideoUpload')) {
      // Profile controls
      const editProfileBtn = document.getElementById('editProfileBtn');
      const editProfileForm = document.getElementById('editProfileForm');
      const cancelEditBtn = document.getElementById('cancelEditBtn');
      const saveProfileBtn = document.getElementById('saveProfileBtn');
      const deleteAccountBtn = document.getElementById('deleteAccountBtn');
      const logoutBtn = document.getElementById('logoutBtn');
      if (editProfileBtn) editProfileBtn.onclick = () => { if (editProfileForm) editProfileForm.style.display = 'block'; };
      if (cancelEditBtn) cancelEditBtn.onclick = () => { if (editProfileForm) editProfileForm.style.display = 'none'; };
      if (saveProfileBtn) saveProfileBtn.onclick = () => {
        const newUsername = document.getElementById('newUsername') && document.getElementById('newUsername').value;
        const newEmail = document.getElementById('newEmail') && document.getElementById('newEmail').value;
        if(newUsername) { const el = document.getElementById('username'); if(el) el.innerText = newUsername; }
        if(newEmail) { const el = document.getElementById('email'); if(el) el.innerText = newEmail; }
        if (editProfileForm) editProfileForm.style.display = 'none';
        alert('Profile updated!');
      };
      if (deleteAccountBtn) deleteAccountBtn.onclick = () => alert('Account deleted!');
      if (logoutBtn) logoutBtn.onclick = () => alert('Logging out...');

      // Avatar upload for subscriber page
      const avatarUpload = document.getElementById('avatarUpload');
      const avatarList = document.getElementById('avatarList');
      const avatarSelectStep1 = document.getElementById('avatarSelectStep1');
      const sourceAvatarSelect = document.getElementById('sourceAvatarSelect');
      const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
      if (uploadAvatarBtn) uploadAvatarBtn.onclick = () => {
        const file = avatarUpload && avatarUpload.files[0];
        if(!file) return alert('Please choose an avatar image.');
        const reader = new FileReader();
        reader.onload = (e) => {
          const avatarDiv = document.createElement('div');
          avatarDiv.className = 'avatar-item';
          avatarDiv.innerHTML = `<img src="${e.target.result}" alt="avatar" style="max-width:100px;">\n                           <button class="btn small-btn danger-btn deleteAvatarBtn">Delete</button>`;
          if (avatarList) avatarList.appendChild(avatarDiv);

          // Add to selects
          [avatarSelectStep1, sourceAvatarSelect].forEach(select => {
            if (!select) return;
            const option = document.createElement('option');
            option.value = e.target.result;
            option.textContent = file.name;
            select.add(option);
          });

          avatarDiv.querySelector('.deleteAvatarBtn').onclick = () => {
            avatarDiv.remove();
            [avatarSelectStep1, sourceAvatarSelect].forEach(select => {
              if(!select) return;
              for(let i=0;i<select.options.length;i++){
                if(select.options[i].value===e.target.result) select.remove(i);
              }
            });
          };
        };
        reader.readAsDataURL(file);
        if (avatarUpload) avatarUpload.value = '';
      };

      // Step 1 preview/save
      const prepareStep1Btn = document.getElementById('prepareStep1Btn');
      const step1Preview = document.getElementById('step1Preview');
      const previewStep1Video = document.getElementById('previewStep1Video');
      const saveStep1Btn = document.getElementById('saveStep1Btn');
      const downloadStep1Btn = document.getElementById('downloadStep1Btn');
      const cancelStep1PreviewBtn = document.getElementById('cancelStep1PreviewBtn');
      const animationList = document.getElementById('animationList');

      if (prepareStep1Btn) prepareStep1Btn.onclick = () => {
        const expression = document.getElementById('expressionSelect') ? document.getElementById('expressionSelect').value : '';
        const avatar = avatarSelectStep1 ? avatarSelectStep1.value : '';
        if(!expression || !avatar) return alert('Please select expression and avatar.');
        if (previewStep1Video) previewStep1Video.src = avatar; // placeholder
        if (step1Preview) step1Preview.style.display = 'block';
      };

      if (saveStep1Btn) saveStep1Btn.onclick = () => {
        if (!previewStep1Video) return;
        const div = document.createElement('div');
        div.className = 'animation-item';

        const videoEl = document.createElement('video');
        videoEl.src = previewStep1Video.src;
        videoEl.controls = true;
        videoEl.style.maxWidth = '300px';
        div.appendChild(videoEl);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn small-btn danger-btn deleteAnimationBtn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => div.remove());
        div.appendChild(deleteBtn);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn small-btn';
        downloadBtn.textContent = 'Download';
        downloadBtn.addEventListener('click', () => downloadFile(previewStep1Video.src, 'animation_step1.mp4'));
        div.appendChild(downloadBtn);

        if (animationList) animationList.appendChild(div);
        if (step1Preview) step1Preview.style.display = 'none';
      };

      if (downloadStep1Btn) downloadStep1Btn.onclick = () => { if (previewStep1Video) downloadFile(previewStep1Video.src, 'animation_step1.mp4'); };
      if (cancelStep1PreviewBtn) cancelStep1PreviewBtn.onclick = () => { if (step1Preview) { step1Preview.style.display = 'none'; if (previewStep1Video) previewStep1Video.src = ''; } };

      // Step 2 generate/save
      const drivingVideoUpload = document.getElementById('drivingVideoUpload');
      const videoPreview = document.getElementById('videoPreview');
      const generateBtn2 = document.getElementById('generateBtn');
      const animationPreview = document.getElementById('animationPreview');
      const previewVideoGenerated = document.getElementById('previewVideoGenerated');

      if (drivingVideoUpload) drivingVideoUpload.onchange = () => {
        if(drivingVideoUpload.files.length){
          if (videoPreview) {
            videoPreview.src = URL.createObjectURL(drivingVideoUpload.files[0]);
            videoPreview.style.display = 'block';
          }
        }
      };

      if (generateBtn2) generateBtn2.onclick = () => {
        const avatar = sourceAvatarSelect ? sourceAvatarSelect.value : '';
        if (!avatar) return alert('Please select an avatar.');
        if (!drivingVideoUpload || !drivingVideoUpload.files.length) return alert('Please upload a driving video.');
        if (previewVideoGenerated) previewVideoGenerated.src = URL.createObjectURL(drivingVideoUpload.files[0]); // placeholder
        if (animationPreview) animationPreview.style.display = 'block';
      };

      const saveAnimBtn = document.getElementById('saveAnimationBtn');
      if (saveAnimBtn) saveAnimBtn.onclick = () => {
        if (!previewVideoGenerated) return;
        const div = document.createElement('div');
        div.className = 'animation-item';

        const videoEl = document.createElement('video');
        videoEl.src = previewVideoGenerated.src;
        videoEl.controls = true;
        videoEl.style.maxWidth = '300px';
        div.appendChild(videoEl);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn small-btn danger-btn deleteAnimationBtn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => div.remove());
        div.appendChild(deleteBtn);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn small-btn';
        downloadBtn.textContent = 'Download';
        downloadBtn.addEventListener('click', () => downloadFile(previewVideoGenerated.src, 'animation.mp4'));
        div.appendChild(downloadBtn);

        if (animationList) animationList.appendChild(div);
        if (animationPreview) animationPreview.style.display = 'none';
      };

      const downloadAnimationBtn = document.getElementById('downloadAnimationBtn');
      if (downloadAnimationBtn) downloadAnimationBtn.onclick = () => { if (previewVideoGenerated) downloadFile(previewVideoGenerated.src, 'animation.mp4'); };
      const cancelPreviewBtn2 = document.getElementById('cancelPreviewBtn');
      if (cancelPreviewBtn2) cancelPreviewBtn2.onclick = () => { if (animationPreview) { animationPreview.style.display = 'none'; if (previewVideoGenerated) previewVideoGenerated.src = ''; } };

      // Subscription buttons
      const updateSubscriptionBtn = document.getElementById('updateSubscriptionBtn');
      const cancelSubscriptionBtn = document.getElementById('cancelSubscriptionBtn');
      if (updateSubscriptionBtn) updateSubscriptionBtn.onclick = () => alert('Subscription updated!');
      if (cancelSubscriptionBtn) cancelSubscriptionBtn.onclick = () => alert('Subscription cancelled!');
    }

    // ---------- Guest page ----------
    if (document.getElementById('upgradeBtn')) {
      const upgradeBtn = document.getElementById('upgradeBtn');
      const upgradeForm = document.getElementById('upgradeForm');
      if (upgradeBtn) upgradeBtn.onclick = () => { if (upgradeForm) upgradeForm.scrollIntoView({ behavior: 'smooth' }); };
      if (upgradeForm) upgradeForm.onsubmit = (e) => { e.preventDefault(); const plan = document.getElementById('plan') ? document.getElementById('plan').value : ''; alert(`You selected the ${plan} plan. Redirecting to payment...`); };

      const sampleAnimations = ['sample1.mp4','sample2.mp4','sample3.mp4','sample4.mp4'];
      const sampleAnimationList = document.getElementById('sampleAnimationList');
      if (sampleAnimationList) sampleAnimations.forEach(src => {
        const animDiv = document.createElement('div');
        animDiv.className = 'animation-item';
        animDiv.innerHTML = `\n          <video controls>\n            <source src="${src}" type="video/mp4">\n            Your browser does not support the video tag.\n          </video>`;
        sampleAnimationList.appendChild(animDiv);
      });
    }

    // ---------- Admin page ----------
    if (document.getElementById('adminUsername') || document.getElementById('createUserBtn')) {
      const editAdminProfileBtn = document.getElementById('editAdminProfileBtn');
      const editAdminForm = document.getElementById('editAdminForm');
      const cancelAdminEditBtn = document.getElementById('cancelAdminEditBtn');
      const saveAdminProfileBtn = document.getElementById('saveAdminProfileBtn');
      if (editAdminProfileBtn) editAdminProfileBtn.onclick = () => { if (editAdminForm) editAdminForm.style.display = 'block'; };
      if (cancelAdminEditBtn) cancelAdminEditBtn.onclick = () => { if (editAdminForm) editAdminForm.style.display = 'none'; };
      if (saveAdminProfileBtn) saveAdminProfileBtn.onclick = () => {
        const newName = document.getElementById('newAdminUsername') && document.getElementById('newAdminUsername').value;
        const newEmail = document.getElementById('newAdminEmail') && document.getElementById('newAdminEmail').value;
        if (newName) { const el = document.getElementById('adminUsername'); if(el) el.innerText = newName; }
        if (newEmail) { const el = document.getElementById('adminEmail'); if(el) el.innerText = newEmail; }
        if (editAdminForm) editAdminForm.style.display = 'none';
        alert('Admin profile updated successfully!');
      };

      // User management
      const userList = document.getElementById('userList');
      const createUserBtn = document.getElementById('createUserBtn');
      const searchUserBtn = document.getElementById('searchUserBtn');
      const suspendUserBtn = document.getElementById('suspendUserBtn');
      const viewUserDetailsBtn = document.getElementById('viewUserDetailsBtn');
      const updateUserBtn = document.getElementById('updateUserBtn');
      if (createUserBtn) createUserBtn.onclick = () => {
        const name = prompt('Enter new username:');
        const email = prompt('Enter email:');
        if (name && email) {
          const div = document.createElement('div');
          div.className = 'user-item';
          div.innerHTML = `<p><strong>${name}</strong> (${email}) \n      <button class="btn small-btn danger-btn deleteUserBtn">Delete</button></p>`;
          userList.appendChild(div);
          div.querySelector('.deleteUserBtn').onclick = () => div.remove();
        }
      };
      if (searchUserBtn) searchUserBtn.onclick = () => { const query = document.getElementById('searchUser') ? document.getElementById('searchUser').value.toLowerCase() : ''; alert(`Searching user: ${query}`); };
      if (viewUserDetailsBtn) viewUserDetailsBtn.onclick = () => alert('Viewing user account details...');
      if (suspendUserBtn) suspendUserBtn.onclick = () => alert('User account suspended.');
      if (updateUserBtn) updateUserBtn.onclick = () => alert('User account details updated.');

      // Admin avatar and expression management
      const adminAvatarUpload = document.getElementById('adminAvatarUpload');
      const adminAvatarList = document.getElementById('adminAvatarList');
      const addAvatarBtn = document.getElementById('addAvatarBtn');
      const searchAvatarBtn = document.getElementById('searchAvatarBtn');
      if (addAvatarBtn) addAvatarBtn.onclick = () => {
        const file = adminAvatarUpload && adminAvatarUpload.files[0];
        if (!file) return alert('Please select an avatar image to upload.');
        const reader = new FileReader();
        reader.onload = (e) => {
          const avatarDiv = document.createElement('div');
          avatarDiv.className = 'avatar-item';
          avatarDiv.innerHTML = `<img src="${e.target.result}" alt="avatar">\n                           <button class="btn small-btn danger-btn deleteAvatarBtn">Delete</button>`;
          adminAvatarList.appendChild(avatarDiv);
          avatarDiv.querySelector('.deleteAvatarBtn').onclick = () => avatarDiv.remove();
        };
        reader.readAsDataURL(file);
        if (adminAvatarUpload) adminAvatarUpload.value = '';
      };
      if (searchAvatarBtn) searchAvatarBtn.onclick = () => { const query = document.getElementById('searchAvatar') ? document.getElementById('searchAvatar').value.toLowerCase() : ''; alert(`Searching avatar: ${query}`); };

      const expressionList = document.getElementById('expressionList');
      const addExpressionBtn = document.getElementById('addExpressionBtn');
      const searchExpressionBtn = document.getElementById('searchExpressionBtn');
      if (addExpressionBtn) addExpressionBtn.onclick = () => {
        const name = document.getElementById('expressionName') ? document.getElementById('expressionName').value.trim() : '';
        if (!name) return alert('Please enter an expression name.');
        const li = document.createElement('li');
        li.innerHTML = `${name} <button class="btn small-btn danger-btn deleteExpressionBtn">Delete</button>`;
        if (expressionList) expressionList.appendChild(li);
        li.querySelector('.deleteExpressionBtn').onclick = () => li.remove();
        if (document.getElementById('expressionName')) document.getElementById('expressionName').value = '';
      };
      if (searchExpressionBtn) searchExpressionBtn.onclick = () => { const query = document.getElementById('searchExpression') ? document.getElementById('searchExpression').value.toLowerCase() : ''; alert(`Searching expression: ${query}`); };
    }

  });
})();
