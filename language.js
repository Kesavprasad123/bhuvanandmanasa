/* =========================================================
   LANGUAGE TOGGLE (ENG / తెలుగు)
   - Inserts the button as the FIRST item in .floating-nav
   - Swaps only translatable English text; existing Telugu
     (nav links, Telugu quotes) is left untouched.
   ========================================================= */
(function () {
  const LANG_KEY = 'weddingLang';

  const DICT = {
    'a beautiful beginning awaits': 'ఒక అందమైన ప్రారంభం ఎదురుచూస్తోంది',
    'youre invited': 'మీకు ఆహ్వానం',
    "you're invited": 'మీకు ఆహ్వానం',
    'tap the envelope to open our invitation': 'మా ఆహ్వానాన్ని తెరవడానికి ఎన్వలప్‌ను నొక్కండి',
    'the wedding of': 'వివాహం',
    'counting every moment': 'ప్రతి క్షణం గణించుతున్నాము',
    'until we say “i do”': 'మేము "అవును" అని చెప్పే వరకు',
    'a little surprise': 'ఒక చిన్న ఆశ్చర్యం',
    'scratch to reveal our special date': 'మా ప్రత్యేక తేదీని చూడటానికి స్క్రాచ్ చేయండి',
    'use your finger or mouse to gently scratch the golden layer': 'బంగారు పొరను మెల్లగా స్క్రాచ్ చేయడానికి వేలు లేదా మౌస్ ఉపయోగించండి',
    'our special day — 12 december 2026': 'మా ప్రత్యేక రోజు — 12 డిసెంబర్ 2026',
    'with love & blessings': 'ప్రేమతో & ఆశీర్వాదాలతో',
    'two families, one new beginning': 'రెండు కుటుంబాలు, ఒక నూతన ప్రారంభం',
    'with the blessings of our parents and elders, we invite you to celebrate the wedding of': 'మా తల్లిదండ్రులు మరియు పెద్దల ఆశీర్వాదాలతో, వివాహాన్ని జరుపుకోవడానికి మిమ్మల్ని ఆహ్వానిస్తున్నాము',
    'groom': 'వరుడు',
    'bride': 'వధువు',
    's/o': 'సుపుత్రుడు',
    'd/o': 'సుపుత్రిక',
    '❧ with their love, blessings & warm wishes ❧': '❧ వారి ప్రేమ, ఆశీర్వాదాలు & శుభాకాంక్షలతో ❧',
    'save the dates': 'తేదీలు గుర్తుంచుకోండి',
    'wedding festivities': 'శుభకార్యాలు',
    'three beautiful moments leading to a lifetime of togetherness.': 'జన్మజన్మల సహచారానికి మూడు అందమైన క్షణాలు.',
    'a traditional beginning filled with blessings': 'ఆశీర్వాదాలతో కూడిన సాంప్రదాయ ప్రారంభం',
    'a joyful blessing from family and friends': 'కుటుంబం, మిత్రుల నుంచి ఆనందకరమైన ఆశీస్సు',
    'two hearts, two families, one forever': 'రెండు హృదయాలు, రెండు కుటుంబాలు, ఒక్క జీవితమంతా',
    'with the blessings of our families': 'మా కుటుంబాల ఆశీర్వాదాలతో',
    'two hearts • one beautiful journey': 'రెండు హృదయాలు • ఒక అందమైన ప్రయాణం',
    'explore our celebration ↓': 'మా వేడుకను చూడండి ↓',
    'we would be honoured to have you with us as we begin our new chapter.': 'మేము మా నూతన అధ్యాయాన్ని ప్రారంభిస్తున్న ఈ సందర్భంలో మీరు మాతో ఉండటం మా గౌరవం.',
    'open in google maps': 'గూగుల్ మ్యాప్స్‌లో తెరవండి',
    'the beginning of forever': 'శాశ్వతమైన ప్రారంభం',
    'a few moments of joy': 'ఆనందమైన కొన్ని క్షణాలు',
    'our celebration': 'మా వేడుకలు',
    'your presence is our blessing': 'మీ ఉనికి మా ఆశీర్వాదం',
    "we can't wait to celebrate with you": 'మీతో జరుపుకోవడానికి ఎదురుచూస్తున్నాము',
    'made with love for a beautiful beginning': 'ఒక అందమైన ప్రారంభం కోసం ప్రేమతో తయారు చేయబడింది',
    'all rights reserved.': 'సర్వ హక్కులు రిజర్వ్ చేయబడ్డాయి.',
    'days': 'రోజులు',
    'hours': 'గంటలు',
    'minutes': 'నిమిషాలు',
    'seconds': 'సెకన్లు',
    'photos': 'ఫోటోలు',
    'videos': 'వీడియోలు',
    'celebration memories': 'వేడుక జ్ఞాపకాలు',
    'join us live': 'మాతో ప్రత్యక్షంగా కలవండి',
    'be with us for the beginning of forever': 'శాశ్వతమైన ప్రారంభంలో మాతో ఉండండి',
    'wedding ceremony': 'వివాహ వేడుక',
    'the stream will appear here': 'లైవ్ స్ట్రీమ్ ఇక్కడ కనిపిస్తుంది',
    'we look forward to celebrating with you.': 'మీతో జరుపుకోవాలని ఎదురుచూస్తున్నాం.',
    'watch on youtube': 'యూట్యూబ్‌లో చూడండి',
    'live from rajahmundry': 'రాజమండ్రి నుండి లైవ్',
    'wedding videos will appear here.': 'వివాహ వీడియోలు ఇక్కడ కనిపిస్తాయి.',
    'wedding film': 'వివాహ చిత్రం',
    'distance from you:': 'మీ నుండి దూరం:',
    'pelli koduku': 'పెళ్లి కొడుకు',
    'pelli kuthuru': 'పెళ్లి కూతురు',
    'wedding': 'వివాహం',
    'bhuvan': 'భువన్',
    'manasa': 'మానస',
    'kotti venkata subbarao': 'కొట్టి వెంకట సుబ్బారావు',
    'smt. kotti padma tulasi': 'శ్రీమతి కొట్టి పద్మ తులసి',
    'kotti kesava prasad (brother)': 'కొట్టి కేశవ ప్రసాద్ (సోదరుడు)',
    'manyapu satya kiran': 'మణ్యాపు సత్య కిరణ్',
    'smt. manyapu sujatha (late)': 'శ్రీమతి మణ్యాపు సుజాత (దివంగత)',
    'manyapu harsha vardhan (brother)': 'మణ్యాపు హర్ష వర్ధన్ (సోదరుడు)'
  };

  const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const normInner = (s) => s.replace(/[^\p{L}\p{N}•&—↓’”"'-]/gu, '').toLowerCase();

  function lookup(text) {
    const t = text.trim();
    if (DICT[norm(t)]) return DICT[norm(t)];
    // prefix keys like 'distance from you:'
    for (const key of Object.keys(DICT)) {
      if (key.endsWith(':') && norm(t).startsWith(key)) {
        return DICT[key] + t.slice(t.indexOf(':') + 1);
      }
    }
    // try ignoring leading emoji/symbols like 📍
    const stripped = t.replace(/^[^\p{L}\p{N}]+/u, '');
    if (DICT[norm(stripped)]) return stripped.length !== t.length ? t.slice(0, t.length - stripped.length) + DICT[norm(stripped)] : DICT[norm(stripped)];
    return null;
  }

  function eachTextTarget(cb) {
    document.querySelectorAll('body *').forEach((el) => {
      if (el.children.length === 0) { cb(el, null); return; }
      // any direct text-node children, e.g. "Name1<br>&amp; Name2"
      [...el.childNodes].forEach((n) => {
        if (n.nodeType === 3 && n.textContent.trim()) cb(el, n);
      });
    });
  }

  function translateAll() {
    eachTextTarget((el, textNode) => {
      if (textNode) {
        const idx = [...el.childNodes].indexOf(textNode);
        const key = 'i18nText' + idx;
        if (el.dataset[key] === undefined) {
          const hit = lookup(textNode.textContent);
          if (hit !== null) { el.dataset[key] = textNode.textContent; textNode.textContent = hit; }
        } else {
          const hit = lookup(el.dataset[key]);
          if (hit !== null) textNode.textContent = hit;
        }
        return;
      }
      const text = el.textContent;
      if (!text || !text.trim()) return;
      if (el.dataset.i18n === undefined) {
        const hit = lookup(text);
        if (hit !== null) { el.dataset.i18n = text; el.textContent = hit; }
      } else {
        const hit = lookup(el.dataset.i18n);
        if (hit !== null) el.textContent = hit;
      }
    });
  }

  function restoreAll() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = el.dataset.i18n;
      delete el.dataset.i18n;
    });
    document.querySelectorAll('body *').forEach((el) => {
      Object.keys(el.dataset).forEach((k) => {
        if (!k.startsWith('i18nText')) return;
        const idx = Number(k.slice('i18nText'.length));
        const node = el.childNodes[idx];
        if (node && node.nodeType === 3) node.textContent = el.dataset[k];
        delete el.dataset[k];
      });
    });
  }

  function setLanguage(lang) {
    localStorage.setItem(LANG_KEY, lang);
    document.body.classList.toggle('lang-te', lang === 'te');
    if (lang === 'te') translateAll(); else restoreAll();
    updateButtonLabels();
  }

  function ensureButton() {
    document.querySelectorAll('.floating-nav').forEach((nav) => {
      if (nav.querySelector('.lang-toggle')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-toggle';
      btn.setAttribute('aria-label', 'Switch website language');
      btn.addEventListener('click', () => {
        const next = localStorage.getItem(LANG_KEY) === 'te' ? 'en' : 'te';
        setLanguage(next);
      });
      nav.insertBefore(btn, nav.firstChild);
    });
    updateButtonLabels();
  }

  function updateButtonLabels() {
    const isTe = localStorage.getItem(LANG_KEY) === 'te';
    document.querySelectorAll('.lang-toggle').forEach((b) => {
      b.textContent = isTe ? 'ENG' : 'తెలుగు';
      b.setAttribute('aria-label', isTe ? 'Switch to English' : 'తెలుగుకు మార్చు');
    });
  }

  function init() {
    ensureButton();
    const lang = localStorage.getItem(LANG_KEY);
    document.body.classList.toggle('lang-te', lang === 'te');
    if (lang === 'te') translateAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
