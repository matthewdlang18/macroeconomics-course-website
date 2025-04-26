import supabase from './services/supabase-config.js';
import sectionService from './services/section-service.js';
import gameService from './services/game-service.js';

document.addEventListener('DOMContentLoaded', async () => {
  const authCheck = document.getElementById('auth-check');
  const taContent = document.getElementById('ta-content');
  const taNameEl = document.getElementById('ta-name');
  const sectionsContainer = document.getElementById('sections-container');

  // Verify TA auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    authCheck.classList.remove('d-none');
    return;
  }
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('custom_id, name, role')
    .eq('id', user.id)
    .single();
  if (profErr || profile.role !== 'ta') {
    authCheck.classList.remove('d-none');
    return;
  }

  // Show TA interface
  taNameEl.textContent = profile.name;
  taContent.classList.remove('d-none');

  // Load sections
  const secRes = await sectionService.getSectionsByTA(profile.custom_id);
  if (!secRes.success) {
    sectionsContainer.innerHTML = '<p class="text-danger">Failed to load sections</p>';
    return;
  }
  sectionsContainer.innerHTML = '';

  // Render each section
  for (const sec of secRes.data) {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card section-card mb-4">
        <div class="card-body" data-section-id="${sec.id}">
          <h5 class="card-title">${sec.day} – ${sec.time}</h5>
          <p class="card-text">${sec.location}</p>
          <div class="game-status mb-2"><span class="badge badge-secondary">Loading...</span></div>
          <button class="btn btn-primary game-action-btn">...</button>
          <div class="active-controls mt-3 d-none">
            <p>Round: <span class="current-round"></span>/20</p>
            <button class="btn btn-sm btn-warning advance-round-btn">Advance Round</button>
            <button class="btn btn-sm btn-danger end-game-btn">End Game</button>
            <h6 class="mt-3">Participants</h6>
            <table class="table table-sm">
              <thead><tr><th>ID</th><th>Cash</th><th>Value</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>`;
    sectionsContainer.appendChild(col);
    bindSection(col.querySelector('.card-body'));
  }

  // Initialize controls for a section card
  function bindSection(body) {
    const sectionId = body.dataset.sectionId;
    const statusEl = body.querySelector('.game-status span');
    const actionBtn = body.querySelector('.game-action-btn');
    const controls = body.querySelector('.active-controls');
    const roundEl = body.querySelector('.current-round');
    const tbody = body.querySelector('tbody');

    async function refresh() {
      const games = await gameService.getGamesBySection(sectionId);
      const game = games.success
        ? games.data.find(g => g.status === 'active')
        : null;
      if (!game) {
        statusEl.textContent = 'No Active Game';
        actionBtn.textContent = 'Start New Game';
        controls.classList.add('d-none');
      } else {
        statusEl.innerHTML = `<span class="badge badge-success">Active – Round ${game.current_round}/${game.max_rounds}</span>`;
        actionBtn.textContent = 'Manage Game';
        roundEl.textContent = game.current_round;
        controls.classList.remove('d-none');
        const parts = await gameService.getGameParticipants(game.id);
        if (parts.success) {
          tbody.innerHTML = '';
          parts.data.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${p.user_id}</td><td>${p.cash.toFixed(2)}</td><td>${p.portfolio_value.toFixed(2)}</td>`;
            tbody.appendChild(tr);
          });
        }
      }
    }

    actionBtn.addEventListener('click', async () => {
      const games = await gameService.getGamesBySection(sectionId);
      const game = games.success
        ? games.data.find(g => g.status === 'active')
        : null;
      if (!game) {
        const res = await gameService.createGame(user.id, 'class', sectionId);
        if (res.success) await refresh();
      } else {
        await refresh();
      }
    });
    body.querySelector('.advance-round-btn').addEventListener('click', async () => {
      const games = await gameService.getGamesBySection(sectionId);
      const game = games.success
        ? games.data.find(g => g.status === 'active')
        : null;
      if (game) {
        const res = await gameService.advanceRound(game.id);
        if (res.success) await refresh();
      }
    });
    body.querySelector('.end-game-btn').addEventListener('click', async () => {
      const games = await gameService.getGamesBySection(sectionId);
      const game = games.success
        ? games.data.find(g => g.status === 'active')
        : null;
      if (game) {
        const res = await gameService.endGame(game.id);
        if (res.success) await refresh();
      }
    });

    refresh();
    setInterval(refresh, 10000);
  }
});
