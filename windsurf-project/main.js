// Login form handler
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const dashboard = document.getElementById('dashboard');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const name = document.getElementById('name').value.trim();
  const passcode = document.getElementById('passcode').value.trim();

  const { data: profile, error } = await fetchProfile(name, passcode);
  if (error || !profile) {
    loginError.textContent = 'Invalid name or passcode.';
    return;
  }

  // Update last_login timestamp in Supabase
  await supabase
    .from('profiles')
    .update({ last_login: new Date().toISOString() })
    .eq('id', profile.id);

  // Hide login, show dashboard
  document.getElementById('login-container').style.display = 'none';
  dashboard.style.display = 'block';
  showDashboard(profile);
});

async function showDashboard(profile) {
  if (profile.role === 'ta') {
    // Fetch all sections for this TA
    const { data: taSections, error: taSectionError } = await fetchTASections(profile.custom_id);
    if (taSectionError) {
      dashboard.innerHTML = `<p>Error loading your sections: ${taSectionError.message}</p>`;
      return;
    }
    let sectionsList = taSections.length > 0
      ? `<ul class="section-list">${taSections.map((s, idx) => `<li><strong>${s.day}</strong> ${s.time}<br><span class="location">${s.location}</span> <button class="roster-toggle" data-section="${s.id}" data-idx="${idx}">Show Roster</button><div class="roster" id="roster-${s.id}" style="display:none;"></div></li>`).join('')}</ul>`
      : '<p>No sections assigned.</p>';
    dashboard.innerHTML = `
      <h2>Welcome TA ${profile.name}</h2>
      <div class="info-row"><span class="label">Role:</span> <span class="value">${profile.role}</span></div>
      <div class="info-row"><span class="label">Custom ID:</span> <span class="value">${profile.custom_id}</span></div>
      <h3>Your Sections</h3>
      ${sectionsList}
      <div id="role-dashboard" class="dashboard-panel">
        <div id="ta-controls">
          <h4>TA Controls</h4>
          <p>Click "Show Roster" to view students in a section.</p>
        </div>
      </div>
      <button id="logout-btn">Logout</button>
    `;
    document.querySelectorAll('.roster-toggle').forEach(btn => {
      btn.onclick = async function() {
        const sectionId = btn.getAttribute('data-section');
        const rosterDiv = document.getElementById(`roster-${sectionId}`);
        if (rosterDiv.style.display === 'none') {
          rosterDiv.innerHTML = '<em>Loading...</em>';
          rosterDiv.style.display = 'block';
          const { data: students, error } = await fetchStudentsBySection(sectionId);
          if (error) {
            rosterDiv.innerHTML = `<span style="color:red">Failed to load roster</span>`;
          } else if (students.length === 0) {
            rosterDiv.innerHTML = '<span>No students enrolled.</span>';
          } else {
            rosterDiv.innerHTML = `<ul class="roster-list">${students.map(stu => `<li>${stu.name}</li>`).join('')}</ul>`;
          }
          btn.textContent = 'Hide Roster';
        } else {
          rosterDiv.style.display = 'none';
          btn.textContent = 'Show Roster';
        }
      };
    });
    document.getElementById('logout-btn').onclick = () => {
      dashboard.style.display = 'none';
      document.getElementById('login-container').style.display = 'block';
    };
    return;
  }

  // For students, keep section selection
  const { data: sections, error: sectionError } = await fetchSections();
  if (sectionError) {
    dashboard.innerHTML = `<p>Error loading sections: ${sectionError.message}</p>`;
    return;
  }
  let sectionOptions = sections.map(
    s => {
      const taName = s.profiles ? s.profiles.name : '(No TA)';
      return `<option value="${s.id}" ${profile.section_id === s.id ? 'selected' : ''}>${s.day} ${s.time} (${s.location}) - TA: ${taName}</option>`;
    }
  ).join('');
  // Helper to render the section confirmation and change option
  function renderSectionConfirmation(section) {
    const taName = section.profiles ? section.profiles.name : '(No TA)';
    sectionInfoDiv.innerHTML = `
      <div class="info-row"><span class="label">Section:</span> <span class="value">${section.day} ${section.time} (${section.location}) - TA: ${taName}</span></div>
      <button id="change-section-btn" class="change-section">Change Section</button>
    `;
    const form = document.getElementById('section-form');
    if (form) form.style.display = 'none';
    document.getElementById('change-section-btn').onclick = () => {
      if (form) form.style.display = 'flex';
      sectionInfoDiv.innerHTML = '';
    };
  }

  dashboard.innerHTML = `
    <h2>Welcome ${profile.name}</h2>
    <div class="info-row"><span class="label">Role:</span> <span class="value">${profile.role}</span></div>
    <form id="section-form">
      <label for="section-select"><strong>Section:</strong></label>
      <select id="section-select">${sectionOptions}</select>
      <button type="submit">Save Section</button>
      <span id="section-success" style="color:green;display:none;margin-left:1em;">Section updated!</span>
    </form>
    <div id="student-section-info"></div>
    <div id="role-dashboard" class="dashboard-panel">
      <div id="student-games">
        <h4>Student Dashboard</h4>
        <div id="student-games-list"><em>(No games available yet)</em></div>
      </div>
    </div>
    <button id="logout-btn">Logout</button>
  `;
  // Show current section info for students
  const sectionInfoDiv = document.getElementById('student-section-info');
  const currentSection = sections.find(s => s.id === profile.section_id);
  if (currentSection) {
    renderSectionConfirmation(currentSection);
  } else {
    sectionInfoDiv.innerHTML = `<span style="color:#b00">No section selected.</span>`;
  }
  // (Optional) Load games for student when implemented
  // const { data: games, error: gamesError } = await fetchGamesByStudent(profile.id);
  // ...
  document.getElementById('logout-btn').onclick = () => {
    dashboard.style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
  };
  document.getElementById('section-form').onsubmit = async (e) => {
    e.preventDefault();
    const newSectionId = document.getElementById('section-select').value;
    const successMsg = document.getElementById('section-success');
    if (newSectionId !== profile.section_id) {
      const { data: updatedProfile, error: updateError } = await updateUserSection(profile.id, newSectionId);
      if (updateError) {
        alert('Failed to update section: ' + updateError.message);
        return;
      }
      // Show success message
      successMsg.style.display = 'inline';
      setTimeout(() => successMsg.style.display = 'none', 2000);
      // Re-render dashboard with updated profile
      showDashboard(updatedProfile);
      return;
    }
    // If section didn't change, just reload dashboard
    showDashboard(profile);
  };

  // Hide section form if student already has a section
  if (currentSection) {
    const form = document.getElementById('section-form');
    if (form) form.style.display = 'none';
  }

  // Show TA controls or student dashboard after section selection
  const roleDashboard = document.getElementById('role-dashboard');
  if (profile.role === 'ta') {
    roleDashboard.innerHTML = '<div id="ta-controls">(TA controls go here)</div>';
  } else {
    roleDashboard.innerHTML = `
      <div id="student-games">
        <h4>Available Games</h4>
        <div id="student-games-list">
          <div class="game-card">
            <h5>Investment Odyssey</h5>
            <p>An interactive financial market simulation game designed to help you understand investment strategies, risk management, and portfolio diversification.</p>
            <button id="play-investment-odyssey" class="game-btn">Play Now</button>
          </div>
        </div>
      </div>
    `;

    // Add event listener for the Investment Odyssey button
    document.getElementById('play-investment-odyssey').addEventListener('click', () => {
      // Store user data in localStorage for the game to access
      localStorage.setItem('userData', JSON.stringify(profile));
      // Navigate to the Investment Odyssey game
      window.location.href = 'investment-odyssey/index.html';
    });
  }
}
