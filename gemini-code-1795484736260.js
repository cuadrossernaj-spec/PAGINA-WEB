/* ==========================================================================
   GOLAZOBET - LÓGICA INTERACTIVA, CANVAS DE IMPACTO Y SIMULADOR
   ========================================================================== */

const MATCHES_DATA = [
  {
    id: 'rma-fcb',
    league: 'UEFA Champions League',
    statusType: 'live',
    statusLabel: "EN VIVO • 64'",
    home: { code: 'RMA', name: 'Real Madrid', crestClass: 'crest-blue', score: 1 },
    away: { code: 'FCB', name: 'Barcelona', crestClass: 'crest-gold', score: 1 },
    odds: { '1': 2.15, X: 3.35, '2': 3.10 }
  },
  {
    id: 'mci-liv',
    league: 'Premier League',
    statusType: 'super',
    statusLabel: 'SUPERODDS • Hoy 16:00',
    home: { code: 'MCI', name: 'Man. City', crestClass: 'crest-neon', score: null },
    away: { code: 'LIV', name: 'Liverpool', crestClass: 'crest-red', score: null },
    odds: { '1': 2.05, X: 3.60, '2': 3.45 }
  },
  {
    id: 'atm-sev',
    league: 'LaLiga EA Sports',
    statusType: 'super',
    statusLabel: 'SUPERODDS • Hoy 18:30',
    home: { code: 'ATM', name: 'Atlético Madrid', crestClass: 'crest-red', score: null },
    away: { code: 'SEV', name: 'Sevilla FC', crestClass: 'crest-blue', score: null },
    odds: { '1': 1.78, X: 3.50, '2': 4.60 }
  },
  {
    id: 'bay-dor',
    league: 'Bundesliga',
    statusType: 'live',
    statusLabel: "EN VIVO • 29'",
    home: { code: 'BAY', name: 'Bayern Múnich', crestClass: 'crest-red', score: 2 },
    away: { code: 'BVB', name: 'Dortmund', crestClass: 'crest-gold', score: 0 },
    odds: { '1': 1.42, X: 4.80, '2': 6.50 }
  }
];

const WINNERS_FEED = [
  {
    initials: 'JP',
    name: 'Juan P.',
    amount: '$450 USD',
    event: 'Champions League',
    time: 'Hace unos segundos',
    odd: '3.00'
  },
  {
    initials: 'MC',
    name: 'María C.',
    amount: '$285 USD',
    event: 'Premier League',
    time: 'Hace 18 seg',
    odd: '2.85'
  },
  {
    initials: 'DR',
    name: 'Diego R.',
    amount: '$620 USD',
    event: 'Combinada Fútbol',
    time: 'Hace 42 seg',
    odd: '4.13'
  },
  {
    initials: 'LV',
    name: 'Lucía V.',
    amount: '$190 USD',
    event: 'LaLiga EA Sports',
    time: 'Hace 1 min',
    odd: '2.53'
  }
];

const state = {
  activeFilter: 'all',
  selections: [], // { matchId, matchTitle, pick, odd }
  stake: 25,
  countdownSeconds: 2 * 3600 + 45 * 60 + 18,
  winnerIndex: 0,
  introRunning: false
};

/* ==========================================================================
   1. ANIMACIÓN "BREAK THE SCREEN" (BALÓN 3D + GRIETAS EN CANVAS + SHAKE)
   ========================================================================== */

function drawGlassCracks(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const cx = width * 0.5;
  const cy = height * 0.48;
  const primaryRays = 14;

  // Destello de impacto central
  const radialGlow = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.max(width, height) * 0.45);
  radialGlow.addColorStop(0, 'rgba(0, 255, 102, 0.35)');
  radialGlow.addColorStop(0.25, 'rgba(0, 184, 255, 0.22)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  const rayEndpoints = [];

  for (let i = 0; i < primaryRays; i++) {
    const baseAngle = (Math.PI * 2 * i) / primaryRays + (Math.random() - 0.5) * 0.18;
    const maxLen = Math.hypot(width, height) * (0.42 + Math.random() * 0.25);
    const segments = 6;

    let px = cx + Math.cos(baseAngle) * 28;
    let py = cy + Math.sin(baseAngle) * 28;

    ctx.beginPath();
    ctx.moveTo(px, py);

    for (let s = 1; s <= segments; s++) {
      const progress = s / segments;
      const jitter = (Math.random() - 0.5) * 34 * progress;
      const perpAngle = baseAngle + Math.PI / 2;
      const nx = cx + Math.cos(baseAngle) * (28 + maxLen * progress) + Math.cos(perpAngle) * jitter;
      const ny = cy + Math.sin(baseAngle) * (28 + maxLen * progress) + Math.sin(perpAngle) * jitter;

      ctx.lineTo(nx, ny);

      // Ramificaciones secundarias
      if (s >= 2 && s <= 5 && Math.random() > 0.35) {
        const branchAngle = baseAngle + (Math.random() > 0.5 ? 0.55 : -0.55);
        const branchLen = 45 + Math.random() * 75;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(
          nx + Math.cos(branchAngle) * branchLen,
          ny + Math.sin(branchAngle) * branchLen
        );
        ctx.strokeStyle = 'rgba(220, 245, 255, 0.72)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }

      px = nx;
      py = ny;
    }

    rayEndpoints.push({ x: px, y: py, angle: baseAngle });

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 2.1;
    ctx.shadowColor = 'rgba(0, 184, 255, 0.85)';
    ctx.shadowBlur = 10;
    ctx.stroke();
  }

  // Anillos concéntricos de fractura alrededor del impacto
  const rings = [58, 118, 195];
  rings.forEach((radius, idx) => {
    ctx.beginPath();
    const steps = 20;
    for (let k = 0; k <= steps; k++) {
      const ang = (Math.PI * 2 * k) / steps;
      const rJitter = radius + (Math.random() - 0.5) * (14 + idx * 5);
      const rx = cx + Math.cos(ang) * rJitter;
      const ry = cy + Math.sin(ang) * rJitter;
      if (k === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(210, 242, 255, ${0.55 - idx * 0.12})`;
    ctx.lineWidth = 1.3;
    ctx.stroke();
  });

  // Fragmentos triangulares de cristal que se dispersan
  for (let f = 0; f < 28; f++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 35 + Math.random() * 210;
    const fx = cx + Math.cos(angle) * dist;
    const fy = cy + Math.sin(angle) * dist;
    const size = 8 + Math.random() * 18;

    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.cos(angle + 0.5) * size, fy + Math.sin(angle + 0.5) * size);
    ctx.lineTo(fx + Math.cos(angle - 0.6) * size, fy + Math.sin(angle - 0.6) * size);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function triggerBreakTheScreenIntro() {
  if (state.introRunning) return;
  state.introRunning = true;

  const overlay = document.getElementById('intro-overlay');
  const ballWrapper = document.getElementById('ball-3d-wrapper');
  const ctaBox = document.getElementById('intro-cta-box');
  const canvas = document.getElementById('crack-canvas');
  const appShell = document.getElementById('app-shell');

  overlay.classList.remove('shatter-disperse');
  canvas.classList.remove('active', 'disperse');
  ballWrapper.classList.remove('charging-impact');
  ctaBox.classList.remove('fade-out');
  appShell.classList.remove('revealed');

  // 1. Ocultar CTA de entrada y lanzar balón en 3D hacia la pantalla
  ctaBox.classList.add('fade-out');
  void ballWrapper.offsetWidth;
  ballWrapper.classList.add('charging-impact');

  // 2. Al chocar (~740ms): dibujar grietas en Canvas + temblor de pantalla
  setTimeout(() => {
    drawGlassCracks(canvas);
    canvas.classList.add('active');
    overlay.classList.add('screen-shake');
    appShell.classList.add('screen-shake');
  }, 740);

  // Limpiar clase de temblor tras completarse
  setTimeout(() => {
    overlay.classList.remove('screen-shake');
    appShell.classList.remove('screen-shake');
  }, 1300);

  // 3. Disipar fragmentos y revelar panel principal (~1500ms desde el impacto)
  setTimeout(() => {
    canvas.classList.add('disperse');
    overlay.classList.add('shatter-disperse');
    appShell.classList.add('revealed');
    state.introRunning = false;
  }, 2150);
}

function skipIntroImmediately() {
  const overlay = document.getElementById('intro-overlay');
  const appShell = document.getElementById('app-shell');
  overlay.classList.add('shatter-disperse');
  appShell.classList.add('revealed');
  state.introRunning = false;
}

/* ==========================================================================
   2. CUENTA REGRESIVA DEL BONO DE BIENVENIDA
   ========================================================================== */

function formatTwoDigits(num) {
  return String(Math.max(0, num)).padStart(2, '0');
}

function updateCountdownDOM() {
  const hours = Math.floor(state.countdownSeconds / 3600);
  const minutes = Math.floor((state.countdownSeconds % 3600) / 60);
  const seconds = state.countdownSeconds % 60;

  document.getElementById('cd-hours').textContent = formatTwoDigits(hours);
  document.getElementById('cd-minutes').textContent = formatTwoDigits(minutes);
  document.getElementById('cd-seconds').textContent = formatTwoDigits(seconds);
}

function startCountdown() {
  updateCountdownDOM();
  setInterval(() => {
    if (state.countdownSeconds > 0) {
      state.countdownSeconds -= 1;
    } else {
      // Reinicia automáticamente el ciclo promocional para mantener activa la oferta
      state.countdownSeconds = 2 * 3600 + 30 * 60;
    }
    updateCountdownDOM();
  }, 1000);
}

/* ==========================================================================
   3. PARTIDOS DESTACADOS (1 X 2) + BOLETA DE APUESTA INTERACTIVA
   ========================================================================== */

function renderMatches() {
  const grid = document.getElementById('matches-grid');
  const filtered = MATCHES_DATA.filter((match) => {
    if (state.activeFilter === 'all') return true;
    return match.statusType === state.activeFilter;
  });

  grid.innerHTML = filtered
    .map((match) => {
      const matchTitle = `${match.home.name} vs. ${match.away.name}`;
      const statusClass =
        match.statusType === 'live' ? 'match-status-live' : 'match-status-super';

      const scoreHome = match.home.score !== null ? `<span class="match-score">${match.home.score}</span>` : '';
      const scoreAway = match.away.score !== null ? `<span class="match-score">${match.away.score}</span>` : '';

      const picks = [
        { key: '1', label: `1 (${match.home.code})`, odd: match.odds['1'] },
        { key: 'X', label: 'X (Empate)', odd: match.odds.X },
        { key: '2', label: `2 (${match.away.code})`, odd: match.odds['2'] }
      ];

      const oddsHtml = picks
        .map((p) => {
          const isSelected = state.selections.some(
            (item) => item.matchId === match.id && item.pick === p.key
          );
          return `
            <button
              type="button"
              class="odd-btn ${isSelected ? 'selected' : ''}"
              data-match-id="${match.id}"
              data-match-title="${matchTitle}"
              data-pick="${p.key}"
              data-pick-label="${p.label}"
              data-odd="${p.odd}"
            >
              <span class="odd-label">${p.label}</span>
              <span class="odd-value">${p.odd.toFixed(2)}</span>
            </button>
          `;
        })
        .join('');

      return `
        <article class="match-card glass">
          <div class="match-meta">
            <span>${match.league}</span>
            <span class="${statusClass}">${match.statusLabel}</span>
          </div>
          <div class="match-teams">
            <div class="team-row">
              <div class="team-left">
                <span class="mini-crest ${match.home.crestClass}">${match.home.code}</span>
                <span>${match.home.name}</span>
              </div>
              ${scoreHome}
            </div>
            <div class="team-row">
              <div class="team-left">
                <span class="mini-crest ${match.away.crestClass}">${match.away.code}</span>
                <span>${match.away.name}</span>
              </div>
              ${scoreAway}
            </div>
          </div>
          <div class="odds-grid">
            ${oddsHtml}
          </div>
        </article>
      `;
    })
    .join('');

  grid.querySelectorAll('.odd-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleBetSelection({
        matchId: btn.dataset.matchId,
        matchTitle: btn.dataset.matchTitle,
        pick: btn.dataset.pick,
        pickLabel: btn.dataset.pickLabel,
        odd: parseFloat(btn.dataset.odd)
      });
    });
  });
}

function toggleBetSelection(selection) {
  const existingIndex = state.selections.findIndex(
    (item) => item.matchId === selection.matchId && item.pick === selection.pick
  );

  if (existingIndex > -1) {
    state.selections.splice(existingIndex, 1);
  } else {
    // Reemplaza selección previa del mismo partido para evitar contradicciones 1X2
    state.selections = state.selections.filter((item) => item.matchId !== selection.matchId);
    state.selections.push(selection);
  }

  renderMatches();
  renderBetslip();
}

function renderBetslip() {
  const countEl = document.getElementById('betslip-count');
  const emptyEl = document.getElementById('betslip-empty');
  const contentEl = document.getElementById('betslip-content');
  const listEl = document.getElementById('betslip-selections');
  const totalOddsEl = document.getElementById('betslip-total-odds');
  const payoutEl = document.getElementById('betslip-potential-payout');
  const stakeInput = document.getElementById('betslip-stake');

  countEl.textContent = String(state.selections.length);

  if (state.selections.length === 0) {
    emptyEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  contentEl.classList.remove('hidden');

  listEl.innerHTML = state.selections
    .map(
      (item) => `
      <div class="slip-item">
        <div>
          <div class="slip-item-match">${item.matchTitle}</div>
          <div class="slip-item-pick">Pronóstico: ${item.pickLabel}</div>
        </div>
        <div class="slip-item-right">
          <span class="slip-item-odd">@${item.odd.toFixed(2)}</span>
          <button
            type="button"
            class="remove-pick-btn"
            aria-label="Quitar pronóstico"
            data-remove-id="${item.matchId}"
          >✕</button>
        </div>
      </div>
    `
    )
    .join('');

  listEl.querySelectorAll('.remove-pick-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idToRemove = btn.dataset.removeId;
      state.selections = state.selections.filter((s) => s.matchId !== idToRemove);
      renderMatches();
      renderBetslip();
    });
  });

  const combinedOdds = state.selections.reduce((acc, item) => acc * item.odd, 1);
  const currentStake = Math.max(0, parseFloat(stakeInput.value) || 0);
  const potentialPayout = currentStake * combinedOdds;

  totalOddsEl.textContent = combinedOdds.toFixed(2);
  payoutEl.textContent = `$${potentialPayout.toFixed(2)} USD`;
}

/* ==========================================================================
   4. CALCULADORA / SIMULADOR DE GANANCIAS RÁPIDAS
   ========================================================================== */

function populateCalculatorOptions() {
  const selectEl = document.getElementById('calc-match-select');
  const options = [];

  MATCHES_DATA.forEach((match) => {
    const title = `${match.home.name} vs. ${match.away.name}`;
    options.push({
      label: `${title} — Gana ${match.home.name} (1)`,
      odd: match.odds['1']
    });
    options.push({
      label: `${title} — Empate (X)`,
      odd: match.odds.X
    });
    options.push({
      label: `${title} — Gana ${match.away.name} (2)`,
      odd: match.odds['2']
    });
  });

  selectEl.innerHTML = options
    .map(
      (opt, idx) =>
        `<option value="${opt.odd}" ${idx === 0 ? 'selected' : ''}>${opt.label} [@${opt.odd.toFixed(2)}]</option>`
    )
    .join('');

  updateCalculator();
}

function updateCalculator() {
  const slider = document.getElementById('calc-amount-slider');
  const selectEl = document.getElementById('calc-match-select');
  const amountDisplay = document.getElementById('calc-amount-display');
  const oddsDisplay = document.getElementById('calc-odds-value');
  const bonusDisplay = document.getElementById('calc-bonus-value');
  const payoutDisplay = document.getElementById('calc-payout-value');
  const profitNote = document.getElementById('calc-profit-note');

  const amount = parseFloat(slider.value) || 0;
  const odd = parseFloat(selectEl.value) || 1;
  const bonusMatch = Math.min(amount, 200);
  const potentialPayout = amount * odd;
  const netProfit = potentialPayout - amount;

  amountDisplay.textContent = `$${amount.toFixed(0)} USD`;
  oddsDisplay.textContent = odd.toFixed(2);
  bonusDisplay.textContent = `+$${bonusMatch.toFixed(2)} USD`;
  payoutDisplay.textContent = `$${potentialPayout.toFixed(2)} USD`;
  profitNote.textContent = `Ganancia neta estimada: +$${netProfit.toFixed(2)} USD`;
}

/* ==========================================================================
   5. PRUEBA SOCIAL / FEED EN VIVO DE GANADORES
   ========================================================================== */

function renderWinnersFeed() {
  const spotlight = document.getElementById('winners-feed-card');
  const avatarEl = document.getElementById('winner-avatar');
  const textEl = document.getElementById('winner-text');
  const metaEl = document.getElementById('winner-meta');
  const chipsContainer = document.getElementById('winners-chips');

  chipsContainer.innerHTML = WINNERS_FEED.map(
    (w) => `<span class="winner-chip">${w.name} • <strong>${w.amount}</strong> (${w.event})</span>`
  ).join('');

  function showWinner(index) {
    const item = WINNERS_FEED[index];
    spotlight.classList.add('fade-swap');

    setTimeout(() => {
      avatarEl.textContent = item.initials;
      textEl.innerHTML = `<strong>${item.name}</strong> acaba de ganar <span class="accent-neon">${item.amount}</span> en la ${item.event}`;
      metaEl.textContent = `${item.time} • Cuota ${item.odd}`;
      spotlight.classList.remove('fade-swap');
    }, 180);
  }

  showWinner(0);

  setInterval(() => {
    state.winnerIndex = (state.winnerIndex + 1) % WINNERS_FEED.length;
    showWinner(state.winnerIndex);
  }, 3600);
}

/* ==========================================================================
   6. MODAL DE REGISTRO / LOGIN / JUEGO RESPONSABLE
   ========================================================================== */

function openAuthModal(mode = 'register', customSummaryHtml = '') {
  const modal = document.getElementById('auth-modal');
  const tag = document.getElementById('modal-tag');
  const title = document.getElementById('modal-title');
  const desc = document.getElementById('modal-desc');
  const submitBtn = document.getElementById('modal-submit-btn');
  const extraSummary = document.getElementById('modal-extra-summary');
  const feedback = document.getElementById('modal-feedback');
  const form = document.getElementById('auth-form');

  feedback.classList.add('hidden');
  feedback.textContent = '';
  form.classList.remove('hidden');

  if (mode === 'login') {
    tag.textContent = 'ACCESO A CUENTA';
    title.textContent = 'Inicia sesión en GolazoBet';
    desc.textContent = 'Accede a tus apuestas en vivo, retiros rápidos y promociones activas.';
    submitBtn.textContent = 'Iniciar Sesión';
  } else {
    tag.textContent = 'BONO DE BIENVENIDA 100%';
    title.textContent = 'Crea tu cuenta y duplica hasta $200 USD';
    desc.textContent = 'Completa tu registro en segundos para activar tu bono deportivo del 100%.';
    submitBtn.textContent = 'Reclamar Bono hasta $200 USD';
  }

  if (customSummaryHtml) {
    extraSummary.innerHTML = customSummaryHtml;
    extraSummary.classList.remove('hidden');
  } else {
    extraSummary.innerHTML = '';
    extraSummary.classList.add('hidden');
  }

  modal.classList.remove('hidden');
}

function openInfoModal(type) {
  const modal = document.getElementById('auth-modal');
  const tag = document.getElementById('modal-tag');
  const title = document.getElementById('modal-title');
  const desc = document.getElementById('modal-desc');
  const form = document.getElementById('auth-form');
  const feedback = document.getElementById('modal-feedback');

  form.classList.add('hidden');
  feedback.classList.remove('hidden');

  if (type === 'responsible') {
    tag.textContent = 'JUEGO RESPONSABLE +18';
    title.textContent = 'Control y Límites de Juego';
    desc.textContent = 'Herramientas para mantener el control de tu actividad deportiva.';
    feedback.innerHTML =
      'Puedes configurar límites diarios, semanales o mensuales de depósito, activar recordatorios de sesión o solicitar autoexclusión temporal desde el panel de usuario.';
  } else if (type === 'help') {
    tag.textContent = 'APOYO ESPECIALIZADO';
    title.textContent = 'Ayuda contra la Ludopatía';
    desc.textContent = 'Si sientes que el juego deja de ser recreativo, busca orientación confidencial.';
    feedback.innerHTML =
      'Existen líneas de ayuda gratuita y asesoría profesional disponibles en tu región las 24 horas para jugadores y familiares.';
  } else {
    tag.textContent = 'CONDICIONES PROMOCIONALES';
    title.textContent = 'Términos del Bono de Bienvenida 100%';
    desc.textContent = 'Resumen transparente de la promoción inicial.';
    feedback.innerHTML =
      'Aplica al primer depósito calificado hasta $200 USD en mercados de fútbol con cuota mínima de 1.50. Consulta los términos completos antes de depositar.';
  }

  modal.classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

/* ==========================================================================
   7. INICIALIZACIÓN DE EVENTOS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('current-year').textContent = String(new Date().getFullYear());

  // Botones de la animación de entrada
  document.getElementById('btn-enter-action').addEventListener('click', triggerBreakTheScreenIntro);
  document.getElementById('btn-skip-intro').addEventListener('click', skipIntroImmediately);
  document.getElementById('replay-intro-btn').addEventListener('click', () => {
    const overlay = document.getElementById('intro-overlay');
    overlay.classList.remove('shatter-disperse');
    triggerBreakTheScreenIntro();
  });

  window.addEventListener('resize', () => {
    const canvas = document.getElementById('crack-canvas');
    if (canvas.classList.contains('active')) {
      drawGlassCracks(canvas);
    }
  });

  // Menú móvil
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileDrawer.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  mobileDrawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Filtros de partidos
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter;
      renderMatches();
    });
  });

  // Controles de la boleta de apuesta
  document.getElementById('betslip-stake').addEventListener('input', renderBetslip);
  document.querySelectorAll('.chip-btn').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.getElementById('betslip-stake').value = chip.dataset.quickStake;
      renderBetslip();
    });
  });
  document.getElementById('btn-clear-betslip').addEventListener('click', () => {
    state.selections = [];
    renderMatches();
    renderBetslip();
  });
  document.getElementById('btn-place-bet').addEventListener('click', () => {
    const stakeVal = Math.max(1, parseFloat(document.getElementById('betslip-stake').value) || 25);
    const combinedOdds = state.selections.reduce((acc, item) => acc * item.odd, 1);
    const payout = (stakeVal * combinedOdds).toFixed(2);
    const picksList = state.selections
      .map((s) => `<li><strong>${s.matchTitle}</strong> (${s.pickLabel} @${s.odd.toFixed(2)})</li>`)
      .join('');

    openAuthModal(
      'register',
      `<div><strong>Selecciones listas (${state.selections.length}):</strong><ul style="margin:0.35rem 0 0.45rem 1.1rem;">${picksList}</ul><span>Apuesta: <strong>$${stakeVal.toFixed(2)} USD</strong> → Cobro potencial: <strong class="accent-neon">$${payout} USD</strong></span></div>`
    );
  });

  // Calculadora de ganancias rápidas
  document.getElementById('calc-amount-slider').addEventListener('input', updateCalculator);
  document.getElementById('calc-match-select').addEventListener('change', updateCalculator);

  // Botones que abren el modal desde cualquier sección
  document.querySelectorAll('[data-open-modal]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
      openAuthModal(trigger.dataset.openModal);
    });
  });

  document.getElementById('modal-close-btn').addEventListener('click', closeAuthModal);
  document.getElementById('auth-modal').addEventListener('click', (e) => {
    if (e.target.id === 'auth-modal') closeAuthModal();
  });

  document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const form = document.getElementById('auth-form');
    const feedback = document.getElementById('modal-feedback');

    form.classList.add('hidden');
    feedback.classList.remove('hidden');
    feedback.innerHTML = `¡Listo, <strong>${email}</strong>! Tu acceso a <strong>GolazoBet</strong> y el bono de bienvenida hasta <strong>$200 USD</strong> han sido preparados para activar en tu perfil.`;
  });

  // Render inicial de componentes
  startCountdown();
  renderMatches();
  renderBetslip();
  populateCalculatorOptions();
  renderWinnersFeed();
});