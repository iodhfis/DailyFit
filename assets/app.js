/* Daily Fit click prototype — shared behaviour for every page */
(function () {
  var DEMO_ID = '000';
  var DEMO_PW = '000';
  var root = document.querySelector('.phone > div');
  if (!root) return;

  // ---- session flags ----
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function isAuthed() { return ss('dailyfit_auth') === '1'; }
  function setAuth(on) { ss('dailyfit_auth', on ? '1' : null); }
  function isNew() { return ss('dailyfit_new') === '1'; }
  function setNew(on) { ss('dailyfit_new', on ? '1' : null); }

  var page = document.body.getAttribute('data-page');
  var params = new URLSearchParams(location.search);
  var nextPage = params.get('next');
  var PUBLIC = ['index', 'SignIn', 'Login', 'Consent', 'Permission',
    'Onboarding', 'Onboarding1', 'OnboardingIdle', 'Onboarding3', 'Onboarding4', 'Onboarding5', 'OnboardingRated',
    'Preference', 'PreferenceNone', 'PreferenceCasual', 'PreferenceVintage', 'OnboardingDone'];
  if (PUBLIC.indexOf(page) < 0 && !isAuthed()) { location.replace('SignIn.html?next=' + encodeURIComponent(page)); return; }
  if (page === 'Lookbook' && isNew()) { location.replace('LookbookEmpty.html'); return; }

  // ---- fit the phone to the window ----
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

  // ---- helpers ----
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('demo-toast');
    if (!t) { t = document.createElement('div'); t.id = 'demo-toast'; t.setAttribute('role', 'status'); root.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }
  function go(url) { location.href = url; }
  function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function each(sel, fn) { Array.prototype.forEach.call(root.querySelectorAll(sel), fn); }
  function onText(sel, label, fn) { each(sel, function (el) { if (txt(el) === label) el.addEventListener('click', function (e) { e.preventDefault(); fn(el, e); }); }); }

  // ---- generic behaviours ----
  each('a[href="#"]', function (a) {
    if (a.getAttribute('aria-current') === 'page') { a.addEventListener('click', function (e) { e.preventDefault(); }); return; }
    a.addEventListener('click', function (e) { e.preventDefault(); toast('시안에서는 준비 중인 메뉴예요'); });
  });
  each('button[aria-label="공유"]', function (b) { b.addEventListener('click', function () { toast('공유 링크를 복사했어요'); }); });
  each('button[aria-label="알림"]', function (b) { b.addEventListener('click', function () { toast('새 알림이 없어요'); }); });
  each('button[aria-label="룩 검색"]', function (b) { b.addEventListener('click', function () { toast('검색은 준비 중이에요'); }); });
  each('button[aria-label="비밀번호 보기"]', function (b) {
    b.addEventListener('click', function () { var inp = b.parentNode.querySelector('input'); if (inp) inp.type = inp.type === 'password' ? 'text' : 'password'; });
  });

  // ---- recommendation carousel (tap / swipe / dots) ----
  var CAROUSEL = {
    Result: ['Result3', 'Result2'], Result2: ['Result', 'Result3'], Result3: ['Result2', 'Result'],
    SaveToast: ['Result3', 'Result2'], HideToast: ['Result', 'Result3'],
    Result2Saved: ['Result', 'Result3'], Result3Saved: ['Result2', 'Result'], HideToastSaved: ['Result', 'Result3'],
    Result2SaveToast: ['Result', 'Result3'], Result3SaveToast: ['Result2', 'Result'], HideToastSaveToast: ['Result', 'Result3']
  };
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
        Array.prototype.forEach.call(dots.children, function (d, i) { d.style.cursor = 'pointer'; d.addEventListener('click', function () { go(order[i] + '.html'); }); });
      }
    }
  }

  // ---- hide: carry a flag so the next look shows a toast ----
  each('a', function (a) { if (txt(a) === '숨김') a.addEventListener('click', function () { ss('dailyfit_hidden', '1'); }); });
  if (ss('dailyfit_hidden') === '1') {
    ss('dailyfit_hidden', null);
    if (page === 'Result3') setTimeout(function () { toast('이전 룩을 숨겼어요'); }, 150);
  }

  // ---- in-design toasts: click-through, fade after a while ----
  if (/Toast/.test(page)) {
    var st = root.querySelector('div[role="status"]');
    if (st) {
      st.style.pointerEvents = 'none'; st.style.transition = 'opacity .3s';
      each('div[role="status"] a', function (a) { a.style.pointerEvents = 'auto'; });
      setTimeout(function () { st.style.opacity = '0'; each('div[role="status"] a', function (a) { a.style.pointerEvents = 'none'; }); }, 3500);
    }
  }

  // ---- save state, remembered for the session ----
  var LOOK = {
    Result: 'r1', SaveToast: 'r1',
    Result2: 'r2', Result2Saved: 'r2', Result2SaveToast: 'r2', HideToast: 'r2', HideToastSaved: 'r2', HideToastSaveToast: 'r2',
    Result3: 'r3', Result3Saved: 'r3', Result3SaveToast: 'r3',
    MusicResult: 'm1', MusicResultSaved: 'm1', MusicResultSaveToast: 'm1',
    LookDetail: 'ld', LookDetailUnsaved: 'ld', LookDetailSaveToast: 'ld'
  };
  var SAVE_PAGE = { r1: 'SaveToast', r2: 'Result2SaveToast', r3: 'Result3SaveToast', m1: 'MusicResultSaveToast', ld: 'LookDetailSaveToast' };
  var UNSAVE_PAGE = { r1: 'Result', r2: 'Result2', r3: 'Result3', m1: 'MusicResult', ld: 'LookDetailUnsaved' };
  function savedMap() { try { return JSON.parse(ss('dailyfit_saved') || '{}'); } catch (e) { return {}; } }
  function setSaved(look, on) { var m = savedMap(); m[look] = on ? 1 : 0; ss('dailyfit_saved', JSON.stringify(m)); }
  function paintSave(b, on) {
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    var sv = b.querySelector('svg'); if (sv) { sv.setAttribute('fill', on ? '#15171C' : 'none'); sv.setAttribute('stroke', '#15171C'); }
    var lc = b.lastChild; var label = on ? '저장됨' : '저장';
    if (lc.nodeType === 3) lc.nodeValue = label; else lc.textContent = label;
  }
  var look = LOOK[page];
  var saveBtn = null;
  if (look) {
    each('a, button', function (el) { var t = txt(el); if ((t === '저장' || t === '저장됨') && el.querySelector('svg')) saveBtn = el; });
  }
  if (saveBtn) {
    var shownSaved = txt(saveBtn) === '저장됨';
    var m = savedMap();
    if (m[look] === undefined) setSaved(look, shownSaved);           // this page is the first word on that look
    else if (!!m[look] !== shownSaved) { shownSaved = !!m[look]; paintSave(saveBtn, shownSaved); }
    saveBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (shownSaved) {
        setSaved(look, false);
        if (/Toast|Saved/.test(page) || page === 'LookDetail') { go(UNSAVE_PAGE[look] + '.html'); return; }
        shownSaved = false; paintSave(saveBtn, false); toast('룩북에서 저장을 해제했어요');
      } else {
        setSaved(look, true); setNew(false);
        go(SAVE_PAGE[look] + '.html');
      }
    });
  }

  // ---- disabled CTAs ----
  function enableCta(a) { if (!a) return; a.setAttribute('aria-disabled', 'false'); a.style.background = '#15171C'; a.style.color = '#FFFFFF'; }
  function disableCta(a) { if (!a) return; a.setAttribute('aria-disabled', 'true'); a.style.background = '#E7E3DC'; a.style.color = '#8A8D94'; }
  each('a[aria-disabled]', function (a) {
    a.addEventListener('click', function (e) {
      if (a.getAttribute('aria-disabled') !== 'true') return;
      e.preventDefault(); e.stopImmediatePropagation();
      toast(/^Situation/.test(page) ? '상황을 먼저 골라주세요' : /^Music/.test(page) ? '장르를 먼저 골라주세요' : '스타일을 하나 이상 골라주세요');
    });
  });

  var DATE_ONLY = '시안에서는 데이트 추천만 볼 수 있어요';

  // ---- onboarding cards: 싫음 / 보통 / 좋음 all selectable ----
  var ONB = { Onboarding1: 'OnboardingIdle', OnboardingIdle: 'Onboarding3', Onboarding: 'Onboarding3', Onboarding3: 'Onboarding4', Onboarding4: 'Onboarding5', Onboarding5: 'PreferenceNone' };
  if (ONB[page]) {
    var rateBtns = [];
    each('button', function (b) { var t = txt(b); if (t === '싫음' || t === '보통' || t === '좋음') rateBtns.push(b); });
    function paintRate(sel) {
      rateBtns.forEach(function (b) {
        var on = b === sel;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.style.background = on ? '#15171C' : '#E7E3DC'; b.style.color = on ? '#FFFFFF' : '#15171C';
        var sv = b.querySelector('svg'); if (sv) sv.setAttribute('stroke', on ? '#FFFFFF' : '#15171C');
      });
    }
    paintRate(null);
    var busy = false;
    rateBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (busy) return; busy = true;
        paintRate(b); toast('취향이 반영되었어요');
        setTimeout(function () { go(ONB[page] + '.html'); }, 900);
      });
    });
  }

  // ---- style preference: multi-select ----
  if (/^Preference/.test(page)) {
    var ON = '<span style="width: 24px; height: 24px; border-radius: 12px; background: #FFFFFF; display: flex; align-items: center; justify-content: center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15171C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg></span>';
    var OFF = '<span style="width: 22px; height: 22px; border-radius: 12px; border: 1px solid #ECE9E3"></span>';
    var pcta = root.querySelector('a[href="OnboardingDone.html"]');
    var sub = null; each('p', function (p) { if (/개 선택됨/.test(txt(p))) sub = p; });
    function count() {
      var n = root.querySelectorAll('button[aria-pressed="true"]').length;
      if (sub) sub.textContent = sub.textContent.replace(/\d+개 선택됨/, n + '개 선택됨');
      if (n) enableCta(pcta); else disableCta(pcta);
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

  // ---- situation sheet: single select, only 데이트 has a result ----
  if (/^SituationSheet/.test(page)) {
    var scta = root.querySelector('section a[href="Loading.html"]');
    var picked = page === 'SituationSheet' ? '데이트' : null;
    each('section button[aria-pressed]', function (b) {
      b.addEventListener('click', function () {
        each('section button[aria-pressed]', function (o) {
          var on = o === b; o.setAttribute('aria-pressed', on ? 'true' : 'false');
          o.style.background = on ? '#15171C' : '#F7F5F1'; o.style.color = on ? '#FFFFFF' : '#15171C';
          var sv = o.querySelector('svg'); if (sv) sv.setAttribute('stroke', on ? '#FFFFFF' : '#15171C');
        });
        picked = txt(b);
        enableCta(scta); if (scta) scta.textContent = picked + ' 룩 추천 받기';
      });
    });
    if (scta) scta.addEventListener('click', function (e) {
      if (scta.getAttribute('aria-disabled') === 'true') return;
      if (picked && picked !== '데이트') { e.preventDefault(); toast(DATE_ONLY); }
    });
  }

  // ---- music: POP / 인디 록 ----
  if (/^MusicSelect/.test(page)) {
    each('button[aria-pressed]', function (b) {
      b.addEventListener('click', function () {
        var g = txt(b);
        if (g === '인디 록') go('MusicSelect.html');
        else if (g === 'POP') go('MusicSelectPop.html');
        else toast('시안에서는 POP · 인디 록만 볼 수 있어요');
      });
    });
    if (page === 'MusicSelectPop') onText('a', '이 무드로 추천 받기', function () { toast('시안에서는 인디 록만 추천을 볼 수 있어요'); });
  }

  // ---- A vs B ----
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
      var idIn = root.querySelector('#si-email'), pw = root.querySelector('#si-pw');
      var btn = null;
      each('a[href="Main.html"]', function (a) { if (txt(a) === '로그인') btn = a; });
      if (!btn || !idIn || !pw) break;
      var err = document.createElement('p'); err.id = 'login-error'; err.setAttribute('role', 'alert');
      var hint = document.createElement('p'); hint.className = 'demo-hint';
      hint.innerHTML = '데모 계정 · 아이디 <b>' + DEMO_ID + '</b> / 비밀번호 <b>' + DEMO_PW + '</b>';
      btn.parentNode.insertBefore(err, btn);
      btn.parentNode.insertBefore(hint, btn.nextSibling);
      function tryLogin(e) {
        if (e) e.preventDefault();
        if (idIn.value.trim() === DEMO_ID && pw.value === DEMO_PW) { setAuth(true); setNew(false); go((nextPage || 'Main') + '.html'); return; }
        err.textContent = !idIn.value.trim() || !pw.value ? '아이디와 비밀번호를 입력해 주세요' : '아이디 또는 비밀번호가 맞지 않아요';
        err.classList.add('show');
        (idIn.value.trim() ? pw : idIn).focus();
      }
      btn.addEventListener('click', tryLogin);
      [idIn, pw].forEach(function (i) {
        i.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryLogin(e); });
        i.addEventListener('input', function () { err.classList.remove('show'); });
      });
      each('a[href="Main.html"]', function (a) { if (a !== btn) a.addEventListener('click', function (e) { e.preventDefault(); toast('데모에서는 아이디 로그인만 지원해요'); }); });
      break;
    }

    case 'Main':
      // situation cards other than the big 데이트 card have no result of their own
      each('a[href="Loading.html"][style*="height: 84px"]', function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); toast(DATE_ONLY); });
      });
      break;
    case 'OnboardingRated':
      setTimeout(function () { go('PreferenceNone.html'); }, 1500);
      break;
    case 'OnboardingDone':
      each('a[href="Main.html"]', function (a) { a.addEventListener('click', function () { setAuth(true); setNew(true); ss('dailyfit_saved', null); }); });
      break;
    case 'Loading':
      setTimeout(function () { go('Result.html'); }, 2200);
      break;
    case 'SaveToast':
      setNew(false);
      onText('button', '숨김', function () { go('HideToast.html'); });
      onText('button', '비슷한 룩', function () { go('Similar.html'); });
      break;
    case 'LookDetail': case 'LookDetailUnsaved': case 'LookDetailSaveToast':
      onText('button', '비슷한 룩', function () { go('Similar.html'); });
      break;
    case 'LogoutPopup':
      each('a[href="SignIn.html"]', function (a) { a.addEventListener('click', function () { setAuth(false); }); });
      break;
    case 'Account': {
      var cb = root.querySelector('input[type="checkbox"]'), wpw = root.querySelector('#withdraw-pw');
      var del = null; each('button', function (b) { if (txt(b) === '탈퇴하기') del = b; });
      if (!cb || !wpw || !del) break;
      function upd() {
        var ok = cb.checked && wpw.value === DEMO_PW;
        del.setAttribute('aria-disabled', ok ? 'false' : 'true');
        del.style.background = ok ? '#15171C' : '#E7E3DC'; del.style.color = ok ? '#FFFFFF' : '#8A8D94';
      }
      cb.addEventListener('change', upd); wpw.addEventListener('input', upd);
      del.addEventListener('click', function () {
        if (del.getAttribute('aria-disabled') === 'true') { toast('비밀번호를 입력하고 동의에 체크해 주세요'); return; }
        setAuth(false); ss('dailyfit_saved', null); go('index.html');
      });
      break;
    }
  }
})();
