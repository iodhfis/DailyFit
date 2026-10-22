(function () {
  var DEMO_EMAIL = '000';
  var DEMO_PW = '000';
  var KEY = 'dailyfit_auth';
  var memAuth = false;
  function isAuthed() { try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return memAuth; } }
  var NEWKEY = 'dailyfit_new';
  function isNew() { try { return sessionStorage.getItem(NEWKEY) === '1'; } catch (e) { return false; } }
  function setNew(v) { try { v ? sessionStorage.setItem(NEWKEY, '1') : sessionStorage.removeItem(NEWKEY); } catch (e) {} }
  function setAuth(v) { memAuth = v; try { v ? sessionStorage.setItem(KEY, '1') : sessionStorage.removeItem(KEY); } catch (e) {} }

  var page = document.body.getAttribute('data-page');
  var root = document.querySelector('.phone > div');
  var PUBLIC = ['index', 'SignIn', 'Login', 'Consent', 'Permission', 'Onboarding', 'OnboardingIdle', 'OnboardingRated', 'Preference', 'PreferenceNone', 'PreferenceCasual', 'PreferenceVintage', 'OnboardingDone'];
  if (PUBLIC.indexOf(page) < 0 && !isAuthed()) { location.replace('SignIn.html?next=' + encodeURIComponent(page)); return; }
  var nextPage = (location.search.match(/[?&]next=([A-Za-z0-9]+)/) || [])[1];
  if (page === 'Lookbook' && isNew()) { location.replace('LookbookEmpty.html'); return; }

  // ---- scale phone to fit the window ----
  var stage = document.querySelector('.stage');
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    var mobile = w <= 500;
    document.body.classList.toggle('mobile', mobile);
    var pad = mobile ? 0 : 32;
    var s = Math.min((w - pad) / 402, (h - pad) / 874);
    if (!mobile) s = Math.min(s, 1);
    stage.style.transform = 'scale(' + s + ')';
    stage.style.margin = ((874 * s - 874) / 2) + 'px ' + ((402 * s - 402) / 2) + 'px';
  }
  window.addEventListener('resize', fit); fit();

  // ---- toast ----
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('demo-toast');
    if (!t) {
      t = document.createElement('div'); t.id = 'demo-toast'; t.setAttribute('role', 'status');
      root.appendChild(t);
    }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }
  function go(url) { location.href = url; }
  function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function each(sel, fn) { Array.prototype.forEach.call(root.querySelectorAll(sel), fn); }
  // saved <-> unsaved toggle on the bookmark button
  function saveToggle(b) {
    var on = b.getAttribute('aria-pressed') !== 'false';
    on = !on;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    var svg = b.querySelector('svg');
    if (svg) { svg.setAttribute('fill', on ? '#15171C' : 'none'); svg.setAttribute('stroke', '#15171C'); }
    var lc = b.lastChild; if (lc.nodeType === 3) lc.nodeValue = on ? '저장됨' : '저장'; else lc.textContent = on ? '저장됨' : '저장';
    toast(on ? '룩북에 저장했어요' : '룩북에서 저장을 해제했어요');
  }
  function onText(sel, label, fn) { each(sel, function (el) { if (txt(el) === label) el.addEventListener('click', function (e) { e.preventDefault(); fn(el, e); }); }); }

  // ---- generic behaviors ----
  each('a[href="#"]', function (a) {
    if (a.getAttribute('aria-current') === 'page') { a.addEventListener('click', function (e) { e.preventDefault(); }); return; }
    a.addEventListener('click', function (e) { e.preventDefault(); toast('시안에서는 준비 중인 메뉴예요'); });
  });
  each('button[aria-label="공유"]', function (b) { b.addEventListener('click', function () { toast('공유 링크를 복사했어요'); }); });
  each('button[aria-label="알림"]', function (b) { b.addEventListener('click', function () { toast('새 알림이 없어요'); }); });
  each('button[aria-label="룩 검색"]', function (b) { b.addEventListener('click', function () { toast('검색은 준비 중이에요'); }); });
  each('button[aria-label="비밀번호 보기"]', function (b) {
    b.addEventListener('click', function () {
      var inp = b.parentNode.querySelector('input'); if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
    });
  });

  // ---- carousel for recommendation results ----
  var CAROUSEL = { Result: ['Result3', 'Result2'], Result2: ['Result', 'Result3'], Result3: ['Result2', 'Result'],
    SaveToast: ['Result3', 'Result2'], HideToast: ['Result', 'Result3'],
    Result2Saved: ['Result', 'Result3'], Result3Saved: ['Result2', 'Result'], HideToastSaved: ['Result', 'Result3'],
    Result2SaveToast: ['Result', 'Result3'], Result3SaveToast: ['Result2', 'Result'], HideToastSaveToast: ['Result', 'Result3'] };
  if (CAROUSEL[page]) {
    var img = root.querySelector('img');
    var box = img && img.closest('div[style*="height: 312px"]');
    if (box) {
      box.style.cursor = 'pointer';
      var x0 = null;
      box.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
      box.addEventListener('pointerup', function (e) {
        if (x0 === null) return; var dx = e.clientX - x0; x0 = null;
        go((dx > 40 ? CAROUSEL[page][0] : CAROUSEL[page][1]) + '.html');
      });
      var dots = root.querySelector('[aria-label^="3개 중"]');
      if (dots) {
        var order = ['Result', 'Result2', 'Result3'];
        Array.prototype.forEach.call(dots.children, function (d, i) {
          d.style.cursor = 'pointer'; d.addEventListener('click', function () { go(order[i] + '.html'); });
        });
      }
    }
  }

  // hiding a look: carry a flag so the next screen can show a toast
  each('a', function (a) { if (txt(a) === '숨김') a.addEventListener('click', function () { try { sessionStorage.setItem('dailyfit_hidden', '1'); } catch (e) {} }); });
  try {
    if (sessionStorage.getItem('dailyfit_hidden') === '1') {
      sessionStorage.removeItem('dailyfit_hidden');
      if (page === 'Result3') setTimeout(function () { toast('이전 룩을 숨겼어요'); }, 150);
    }
  } catch (e) {}

  // in-design toasts (save / hide): let clicks pass through, keep the link tappable, fade out after a while
  if (/Toast/.test(page)) {
    var st = root.querySelector('div[role="status"]');
    if (st) {
      st.style.pointerEvents = 'none'; st.style.transition = 'opacity .3s';
      each('div[role="status"] a', function (a) { a.style.pointerEvents = 'auto'; });
      setTimeout(function () { st.style.opacity = '0'; each('div[role="status"] a', function (a) { a.style.pointerEvents = 'none'; }); }, 3500);
    }
  }


  // ---- selection-state pages ----
  each('a[aria-disabled="true"]', function (a) {
    a.addEventListener('click', function (e) {
      if (a.getAttribute('aria-disabled') !== 'true') return;
      e.preventDefault(); toast(/상황/.test(page) || /Situation/.test(page) ? '상황을 먼저 골라주세요' : /Music/.test(page) ? '장르를 먼저 골라주세요' : '스타일을 하나 이상 골라주세요');
    });
  });
  function enableCta(a) { if (!a) return; a.setAttribute('aria-disabled', 'false'); a.style.background = '#15171C'; a.style.color = '#FFFFFF'; }
  function disableCta(a) { if (!a) return; a.setAttribute('aria-disabled', 'true'); a.style.background = '#E7E3DC'; a.style.color = '#8A8D94'; }
  if (/^Preference/.test(page)) {
    var ON = '<span style="width: 24px; height: 24px; border-radius: 12px; background: #FFFFFF; display: flex; align-items: center; justify-content: center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15171C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg></span>';
    var OFF = '<span style="width: 22px; height: 22px; border-radius: 12px; border: 1px solid #ECE9E3"></span>';
    var cta = root.querySelector('a[href="OnboardingDone.html"]');
    var sub = null; each('p', function (p) { if (/개 선택됨/.test(txt(p))) sub = p; });
    function count() {
      var n = root.querySelectorAll('button[aria-pressed="true"]').length;
      if (sub) sub.textContent = sub.textContent.replace(/\d+개 선택됨/, n + '개 선택됨');
      if (n) enableCta(cta); else disableCta(cta);
    }
    each('button[aria-pressed]', function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.style.background = on ? '#15171C' : '#FFFFFF'; b.style.color = on ? '#FFFFFF' : '#15171C';
        b.lastElementChild.outerHTML = on ? ON : OFF;
        count();
      });
    });
  }
  if (/^SituationSheet/.test(page)) {
    var scta = root.querySelector('section a[href="Loading.html"]');
    each('section button[aria-pressed]', function (b) {
      b.addEventListener('click', function () {
        each('section button[aria-pressed]', function (o) {
          var on = o === b; o.setAttribute('aria-pressed', on ? 'true' : 'false');
          o.style.background = on ? '#15171C' : '#F7F5F1'; o.style.color = on ? '#FFFFFF' : '#15171C';
          var sv = o.querySelector('svg'); if (sv) sv.setAttribute('stroke', on ? '#FFFFFF' : '#15171C');
        });
        enableCta(scta); if (scta) scta.textContent = txt(b) + ' 룩 추천 받기';
      });
    });
  }
  if (/^MusicSelect/.test(page)) {
    each('button[aria-pressed]', function (b) {
      b.addEventListener('click', function () {
        var g = txt(b);
        if (g === '인디 록') go('MusicSelect.html');
        else if (g === 'POP') go('MusicSelectPop.html');
        else toast('시안에서는 POP · 인디 록만 볼 수 있어요');
      });
    });
  }
  if (/^Compare(None|B)?$/.test(page)) {
    var cards = root.querySelectorAll('div[style*="padding: 8px; border-radius: 16px; background: #FFFFFF"]');
    if (cards.length >= 2) {
      cards[0].style.cursor = cards[1].style.cursor = 'pointer';
      cards[0].addEventListener('click', function () { if (page !== 'Compare') go('Compare.html'); });
      cards[1].addEventListener('click', function () { if (page !== 'CompareB') go('CompareB.html'); });
    }
    if (page === 'CompareNone') onText('a', '투표하기', function () { toast('A나 B를 먼저 골라주세요'); });
  }
  // ---- page-specific ----
  switch (page) {
    case 'index':
      setTimeout(function () { go(isAuthed() ? 'Main.html' : 'SignIn.html'); }, 1600);
      root.style.cursor = 'pointer';
      root.addEventListener('click', function () { go(isAuthed() ? 'Main.html' : 'SignIn.html'); });
      break;

    case 'SignIn': {
      var email = root.querySelector('#si-email'), pw = root.querySelector('#si-pw');
      var btn = null;
      each('a[href="Main.html"]', function (a) { if (txt(a) === '로그인') btn = a; });
      var err = document.createElement('p');
      err.id = 'login-error'; err.setAttribute('role', 'alert');
      var hint = document.createElement('p');
      hint.className = 'demo-hint';
      hint.innerHTML = '데모 계정 · <b>' + DEMO_EMAIL + '</b> / <b>' + DEMO_PW + '</b>';
      btn.parentNode.insertBefore(err, btn);
      btn.parentNode.insertBefore(hint, btn.nextSibling);
      function tryLogin(e) {
        if (e) e.preventDefault();
        var ok = email.value.trim().toLowerCase() === DEMO_EMAIL && pw.value === DEMO_PW;
        if (ok) { setAuth(true); setNew(false); go((nextPage || 'Main') + '.html'); return; }
        err.textContent = !email.value.trim() || !pw.value ? '아이디와 비밀번호를 입력해 주세요' : '아이디 또는 비밀번호가 맞지 않아요';
        err.classList.add('show');
        (email.value.trim() ? pw : email).focus();
      }
      btn.addEventListener('click', tryLogin);
      [email, pw].forEach(function (i) {
        i.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryLogin(e); });
        i.addEventListener('input', function () { err.classList.remove('show'); });
      });
      each('a[href="Main.html"]', function (a) {
        if (a !== btn) a.addEventListener('click', function (e) { e.preventDefault(); toast('데모에서는 이메일 로그인만 지원해요'); });
      });
      break;
    }

    case 'Onboarding':
    case 'OnboardingIdle':
      ['싫음', '보통', '좋음'].forEach(function (l) { onText('button', l, function () { go('OnboardingRated.html'); }); });
      break;
    case 'OnboardingRated':
      setTimeout(function () { go('PreferenceNone.html'); }, 1500);
      break;
    case 'OnboardingDone':
      each('a[href="Main.html"]', function (a) { a.addEventListener('click', function () { setAuth(true); setNew(true); }); });
      break;
    case 'Loading':
      setTimeout(function () { go('Result.html'); }, 2200);
      break;
    case 'SaveToast':
      setNew(false);
      onText('button', '저장됨', saveToggle);
      onText('button', '숨김', function () { go('HideToast.html'); });
      onText('button', '비슷한 룩', function () { go('Similar.html'); });
      break;
    case 'LookDetail':
      onText('button', '비슷한 룩', function () { go('Similar.html'); });
      onText('button', '저장됨', saveToggle);
      break;
    case 'LogoutPopup':
      each('a[href="SignIn.html"]', function (a) { a.addEventListener('click', function () { setAuth(false); }); });
      break;
    case 'Account': {
      var cb = root.querySelector('input[type="checkbox"]'), wpw = root.querySelector('#withdraw-pw');
      var del = null; each('button', function (b) { if (txt(b) === '탈퇴하기') del = b; });
      function upd() {
        var ok = cb.checked && wpw.value === DEMO_PW;
        del.setAttribute('aria-disabled', ok ? 'false' : 'true');
        del.style.background = ok ? '#15171C' : '#E7E3DC'; del.style.color = ok ? '#FFFFFF' : '#8A8D94';
      }
      cb.addEventListener('change', upd); wpw.addEventListener('input', upd);
      del.addEventListener('click', function () {
        if (del.getAttribute('aria-disabled') === 'true') { toast('비밀번호를 입력하고 동의에 체크해 주세요'); return; }
        setAuth(false); go('index.html');
      });
      break;
    }
  }
})();
