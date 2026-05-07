const SCREEN_META = {
  'screen-welcome': {
    name: 'Онбординг (Splash)',
    desc: 'Экран приветствия — тёмный фон с силуэтом авто, белый bottom sheet. Кнопка «Начать» ведёт на главный экран.'
  },
  'screen-browse': {
    name: 'Главная (Browse)',
    desc: 'Поиск, популярные продукты, карточки предложений. Аналог Home в DrivIQ — адаптирован под страховые продукты SOS24.'
  },
  'screen-fleet': {
    name: 'Мои полисы (Fleet)',
    desc: 'Детали активного полиса с donut-диаграммой срока действия. Аналог My Electric Fleet в DrivIQ.'
  },
  'screen-sos': {
    name: 'AI-помощник (SOS Chat)',
    desc: 'Экран SOS и AI-чата — орб, быстрые категории, поле ввода. Аналог AI Chat в DrivIQ.'
  },
};

function go(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.querySelectorAll('.thumb').forEach(t => t.classList.toggle('active', t.dataset.go === id));
  const m = SCREEN_META[id];
  if (m) {
    document.getElementById('cur-name').textContent = m.name;
    document.getElementById('cur-desc').textContent = m.desc;
  }
  const el = document.getElementById(id);
  if (el) el.scrollTop = 0;
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.classList.remove('show'), 2400);
}

document.addEventListener('click', e => {
  const goBtn = e.target.closest('[data-go]');
  if (goBtn) { e.preventDefault(); go(goBtn.dataset.go); return; }
  const tBtn = e.target.closest('[data-toast]');
  if (tBtn) { e.preventDefault(); toast(tBtn.dataset.toast); }
});

go('screen-welcome');
