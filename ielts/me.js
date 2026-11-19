/* IELTS · BY AZIMOV — Profil 2.0: daraja, statistika, prognoz, faollik xaritasi, haftalik hisobot, ko‘rinish (aksent rang), zaxira nusxa, ulashish. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, lsGet, lsSet } = IE, S = () => IE.S(), D = IE.D, R = IE.routes, A = IE.act;
const LV = ['A2', 'B1', 'B2', 'C1'];
const BK = ['ielts:dhist', 'ielts:dfav', 'ielts:dcx', 'ielts:chats', 'ielts:cmist', 'ielts:toolrecent', 'ielts:pmode', 'ielts:acc', 'ielts:skin', 'ielts:theme', 'ielts:fdur', 'ielts:nohap', 'ielts:cread'];
const hapOn = () => { try { return !localStorage.getItem('ielts:nohap'); } catch (e) { return true; } };
const mins = () => { const s = S(), f = Object.values(s.focus || {}).reduce((a, b) => a + (+b || 0), 0); return f; };
R.me = () => {
  const s = S(), p = s.prof, pr = D.profile || {}, th = IE.theme(), login = (pr.email || '').replace(/@testlar\.internal$/, ''), lv = IE.level(), st = IE.streak(), acc = IE.accent();
  const bands = []; for (let b = 5; b <= 9; b += .5) bands.push(b);
  const bg = IE.badges ? IE.badges() : [], got = bg.filter(x => x.got).length, fm = mins();
  const days = p.date ? Math.ceil((new Date(p.date + 'T00:00:00') - Date.now()) / 864e5) : null;
  const inner = '<div class="hero" style="padding-bottom:78px"><div class="row" style="justify-content:flex-start;gap:16px"><div class="avt">' + esc((IE.dispName()[0] || 'U').toUpperCase()) + '</div><div style="min-width:0"><h1 style="margin:0;overflow:hidden;text-overflow:ellipsis">' + esc(IE.dispName()) + '</h1><div style="opacity:.85;font-size:13px;margin-top:2px">' + esc(login) + '</div><div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="background:rgba(255,255,255,.2);color:#fff">' + (pr.role === 'owner' ? 'Egasi' : 'IELTS a’zo') + '</span><span class="chip" style="background:rgba(255,255,255,.2);color:#fff">' + esc(lv.name) + ' · ' + lv.L + '</span></div></div></div></div>' +
    '<div class="lift">' +
    '<div class="card rise"><div class="row" style="justify-content:space-between;margin-bottom:8px"><b>Daraja ' + lv.L + '</b><span class="sm mu">' + lv.xp + ' XP · keyingisigacha ' + (lv.hi - lv.xp) + '</span></div><div class="prog"><i style="width:' + lv.pct + '%"></i></div>' +
    '<div class="stats" style="margin-top:14px"><div class="stat"><b>' + st + '</b><span>Seriya</span></div><div class="stat"><b>' + s.days.length + '</b><span>O‘qigan kun</span></div><div class="stat"><b>' + fm + '’</b><span>Fokus</span></div><div class="stat"><b>' + got + '/' + bg.length + '</b><span>Yutuq</span></div></div>' +
    '<div class="two" style="margin-top:14px"><button class="btn" data-a="share">' + ic('share') + ' Progressni ulashish</button><button class="btn ghost" data-go="achievements">' + ic('trophy') + ' Yutuqlar</button></div><button class="btn ghost block" style="margin-top:10px" data-go="report">' + ic('doc') + ' Hisobot (PDF) va bashorat</button></div>' +
    IE.forecastCard() +
    '<div class="sec"><h2>Ko‘nikmalar</h2><span class="mu xs">' + (days != null && days >= 0 ? days + ' kun qoldi' : 'maqsad ' + IE.bandTxt(p.target)) + '</span></div>' + IE.skillRows() +
    '<div class="sec"><h2>Faollik xaritasi</h2><span class="mu xs">16 hafta</span></div><div class="card rise">' + IE.heat(16) + '<div class="row sm mu" style="justify-content:space-between;margin-top:8px"><span>Kam</span><span class="cal-lg"><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i></span><span>Ko‘p</span></div></div>' +
    '<div class="sec"><h2>Haftalik hisobot</h2></div>' + IE.weekCard() +
    '<details class="card rise xset" id="xset"' + (V.xo ? ' open' : '') + '><summary><span class="bd sm sk-W">' + ic('sliders') + '</span><div class="tx"><b>Imtihon sozlamalari</b><span>Maqsad ' + IE.bandTxt(p.target) + (p.level ? ' · ' + esc(p.level) : '') + (days != null && days >= 0 ? ' · ' + days + ' kun qoldi' : ' · sana yo‘q') + ' · ' + (p.mins || 60) + ' daq/kun</span></div><i class="xch">' + ic('next') + '</i></summary><div class="xbody">' +
    '<div class="fld"><label>Ism</label><input id="pn" value="' + esc(p.name || pr.name || '') + '" data-in="pf" data-f="name" maxlength="40"></div>' +
    '<div class="fld"><label>Maqsad band</label><select data-in="pf" data-f="target">' + bands.map(b => '<option value="' + b + '"' + (b === +p.target ? ' selected' : '') + '>' + b.toFixed(1) + '</option>').join('') + '</select></div>' +
    '<div class="fld"><label>Hozirgi daraja</label><select data-in="pf" data-f="level"><option value="">Tanlang</option>' + LV.map(l => '<option' + (p.level === l ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div>' +
    '<div class="fld" style="margin:0"><label>Imtihon sanasi</label><input type="date" value="' + esc(p.date || '') + '" data-in="pf" data-f="date"></div>' +
    '<button class="set" style="margin-top:10px" data-a="pmins"><span class="bd sm sk-T">' + ic('clock') + '</span><div class="tx"><b>Kunlik vaqt</b><span>Reja shunga moslanadi: ' + (p.mins || 60) + ' daqiqa</span></div></button></div></details>' +
    '<div class="sec"><h2>Ko‘rinish</h2></div><div class="card rise"><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">Dizayn uslubi</div><div class="skins">' + IE.SKINS.map(k => '<button class="skn' + (k[0] === IE.skin() ? ' on' : '') + '" data-a="skin" data-v="' + k[0] + '"><div class="sk-pv ' + k[0] + '"><i></i><i></i></div>' + k[1] + '<small>' + k[2] + '</small></button>').join('') + '</div><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase;margin:16px 0 10px">Aksent rang' + (IE.skin() === 'gold' ? ' · Oltin uslubda o‘chiq' : '') + '</div><div class="accs">' + IE.ACC.map(a => '<button class="acc' + (a[0] === acc ? ' on' : '') + '" data-a="acc" data-v="' + a[0] + '" style="--a:' + a[2] + ';--b:' + a[3] + '" aria-label="' + a[1] + '"><i></i><span>' + a[1] + '</span></button>').join('') + '</div>' +
    '<button class="set" data-a="theme"><span class="bd sm sk-A">' + ic('moon') + '</span><div class="tx"><b>Tungi rejim</b><span>' + (th === 'auto' ? 'Avtomatik' : th === 'dark' ? 'Yoqilgan' : 'O‘chirilgan') + ' · bosib almashtiring</span></div></button>' +
    '<button class="set" data-a="hap"><span class="bd sm sk-S">' + ic('zap') + '</span><div class="tx"><b>Tebranish (haptik)</b><span>' + (hapOn() ? 'Yoqilgan' : 'O‘chirilgan') + '</span></div></button></div>' +
    '<div class="sec"><h2>Ma’lumotlar</h2></div><div class="card rise">' +
    '<button class="set" data-a="psync"><span class="bd sm sk-R">' + ic('cloud') + '</span><div class="tx"><b>Hozir sinxronlash</b><span id="syncst">Natijalar bulutda saqlanadi — boshqa qurilmada ham chiqadi</span></div></button>' +
    '<button class="set" data-a="bkexp"><span class="bd sm sk-W">' + ic('dl') + '</span><div class="tx"><b>Zaxira nusxa olish</b><span>Hamma natija, so‘zlar, rejalar — JSON fayl</span></div></button>' +
    '<label class="set" for="bkpf" style="cursor:pointer"><span class="bd sm sk-V">' + ic('up') + '</span><div class="tx"><b>Zaxiradan tiklash</b><span>Faylni tanlang — mavjud ma’lumotga qo‘shiladi (hech narsa o‘chmaydi)</span></div></label><input type="file" id="bkpf" accept="application/json,.json" class="hide"></div>' +
    '<div class="sec"><h2>Boshqa</h2></div><div class="card rise">' +
    (IE.fbMenu ? IE.fbMenu() : '') +
    '<button class="set" data-a="upd"><span class="bd sm sk-R">' + ic('refresh') + '</span><div class="tx"><b>Yangilanishni tekshirish</b><span>Versiya ' + IE.APP_VERSION + ' · bosib yangilang</span></div></button>' +
    '<button class="set" data-a="pwd"><span class="bd sm sk-W">' + ic('key') + '</span><div class="tx"><b>Parolni o‘zgartirish</b></div></button>' +
    (IE.cam ? '<button class="set" data-a="camvdel"><span class="bd sm sk-M">' + ic('trash') + '</span><div class="tx"><b>Shaxsiy lug‘atni o‘chirish</b><span>Cambridge ma’lumotlari qurilmadan o‘chadi</span></div></button>' : '') +
    '<a class="set" href="../" style="color:inherit;text-decoration:none"><span class="bd sm sk-R">' + ic('back2') + '</span><div class="tx"><b>Testlar ilovasi</b><span>Fan testlari va musobaqa</span></div></a>' +
    '<button class="set" data-a="logout"><span class="bd sm sk-G">' + ic('out') + '</span><div class="tx"><b>Chiqish</b></div></button></div>' +
    '<p class="c mu xs" style="margin:18px 0 0">IELTS v' + IE.APP_VERSION + ' · BY AZIMOV</p></div>';
  return IE.page('me', inner);
};
const V = IE.V;
document.addEventListener('toggle', e => { if (e.target && e.target.id === 'xset') V.xo = e.target.open; }, true);
IE.pf = el => {
  const s = S(), f = el.dataset.f, v = el.value; s.prof[f] = f === 'target' ? +v : v; s.pts = Date.now(); IE.save();
  if (f === 'name') { const h = $('.hero h1'); if (h) h.textContent = v || (D.profile && D.profile.name) || ''; const a = $('.avt'); if (a) a.textContent = ((v || IE.dispName())[0] || 'U').toUpperCase(); } else { IE.toast('Saqlandi'); if (f === 'target' || f === 'date') IE.draw(false); }
};
A.skin = el => { IE.setSkin(el.dataset.v); IE.vib(18); IE.draw(false); IE.toast(el.dataset.v === 'glass' ? 'Liquid Glass yoqildi' : el.dataset.v === 'gold' ? 'Oltin Premium yoqildi' : 'Standart uslub'); };
A.acc = el => { IE.setAccent(el.dataset.v); IE.vib(12); IE.draw(false); };
A.hap = () => { try { hapOn() ? localStorage.setItem('ielts:nohap', '1') : localStorage.removeItem('ielts:nohap'); } catch (e) { /* */ } IE.draw(false); if (hapOn()) IE.vib(30); };
A.psync = async () => { const e = $('#syncst'); if (e) e.textContent = 'Sinxronlanmoqda…'; try { await IE.sync(); IE.toast('Sinxronlandi ✓'); } catch (er) { IE.toast('Internet yo‘q — keyinroq urinib ko‘ring'); } IE.draw(false); };

/* ---------- zaxira nusxa ---------- */
A.bkexp = () => {
  const local = {}; BK.forEach(k => { try { const v = localStorage.getItem(k); if (v != null) local[k] = v; } catch (e) { /* */ } });
  const blob = new Blob([JSON.stringify({ app: 'ielts', v: 1, ts: Date.now(), state: S(), local }, null, 1)], { type: 'application/json' }), u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u; a.download = 'ielts-zaxira-' + IE.dayKey() + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); IE.toast('Zaxira nusxa yuklab olindi');
};
document.addEventListener('change', async e => {
  if (!e.target || e.target.id !== 'bkpf' || !e.target.files || !e.target.files[0]) return;
  const f = e.target.files[0]; e.target.value = '';
  try {
    const j = JSON.parse(await f.text()); if (!j || j.app !== 'ielts' || !j.state || typeof j.state !== 'object') throw new Error('bad');
    IE.ask('Zaxiradan tiklansinmi?', 'Fayldagi ma’lumot hozirgisiga qo‘shiladi (takrorlar birlashadi, hech narsa o‘chmaydi).', 'Tiklash', () => {
      const m = IE.mergeState(S(), j.state); IE.setState(m); IE.saveLocal();
      Object.entries(j.local || {}).forEach(([k, v]) => { if (BK.includes(k) && typeof v === 'string' && (!localStorage.getItem(k) || /^ielts:(dhist|dfav|chats|cmist)$/.test(k) === false)) { try { localStorage.setItem(k, v); } catch (er) { /* */ } } });
      IE.save(true); IE.setAccent(IE.accent()); IE.setTheme(IE.theme()); IE.toast('Tiklandi ✓'); IE.draw(false);
    });
  } catch (er) { IE.toast('Bu IELTS zaxira fayli emas'); }
});
})();
