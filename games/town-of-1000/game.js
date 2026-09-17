/* A Town of 1,000 — a choices game about breast-cancer prevention across a population.
   Plain JavaScript, an SVG icon array (a Cates plot), DOM cards. Every fact carries its source.
   EpiDetective, 2026. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ------------------------------------------------------------------ sources */
const IARC_LIST = 'https://monographs.iarc.who.int/list-of-classifications';
const SRC = {
  gco:      { t: 'GLOBOCAN 2024 estimates (Cancer Today, version 1.0, July 2026), IARC Global Cancer Observatory, https://gco.iarc.who.int/today , accessed 16 September 2026: Western Europe, females, risk of a breast-cancer diagnosis before age 75: 9.4%; of dying of it before 75: 1.5%', u: 'https://gco.iarc.who.int/today' },
  bagnardi: { t: 'Bagnardi et al., Br J Cancer 2015;112:580: breast cancer, light drinking RR 1.04, moderate 1.23, heavy 1.61', u: 'https://doi.org/10.1038/bjc.2014.579' },
  pizot:    { t: 'Pizot et al., Eur J Cancer 2016;52:138: highest versus lowest physical activity, breast cancer RR 0.88; an inactive woman reaching 150 minutes a week reduces her lifetime risk by about 9%', u: 'https://doi.org/10.1016/j.ejca.2015.10.063' },
  kyu:      { t: 'Kyu et al., BMJ 2016;354:i3857: highly active versus insufficiently active, breast cancer RR 0.86', u: 'https://doi.org/10.1136/bmj.i3857' },
  fat:      { t: 'Lauby-Secretan et al., N Engl J Med 2016;375:794 (IARC Handbook on body fatness): excess body fatness and postmenopausal breast cancer', u: 'https://doi.org/10.1056/NEJMsr1606602' },
  bf:       { t: 'Collaborative Group on Hormonal Factors in Breast Cancer, Lancet 2002;360:187: the relative risk of breast cancer falls by 4.3% for every 12 months of breastfeeding', u: 'https://doi.org/10.1016/S0140-6736(02)09454-0' },
  mht:      { t: 'Collaborative Group on Hormonal Factors in Breast Cancer, Lancet 2019;394:1159: current use of combined oestrogen-progestogen menopausal hormone therapy, years 1 to 4 RR 1.60, years 5 to 14 RR 2.08', u: 'https://doi.org/10.1016/S0140-6736(19)31709-X' },
  screen:   { t: 'Lauby-Secretan et al., N Engl J Med 2015;372:2353 (IARC Handbook 15): mammography screening at ages 50 to 69 reduces breast-cancer deaths by about 40% among women who attend, 23% among all women invited', u: 'https://doi.org/10.1056/NEJMsr1504363' },
  mirick:   { t: 'Mirick et al., J Natl Cancer Inst 2002;94:1578: a population-based study found no increase in breast-cancer risk with antiperspirant or deodorant use', u: 'https://doi.org/10.1093/jnci/94.20.1578' },
  m100e:    { t: 'IARC Monographs Vol. 100E (2012): tobacco smoking is carcinogenic to humans (Group 1); for breast cancer a positive association has been observed, classed as limited evidence', u: IARC_LIST },
  chen:     { t: 'Chen et al., Cancer Epidemiol Biomarkers Prev 2014;23:2181: among postmenopausal women, no aspect of bra wearing was associated with breast cancer', u: 'https://doi.org/10.1158/1055-9965.EPI-14-0414' },
  code:     { t: 'European Code Against Cancer, 5th edition (IARC / WHO)', u: 'https://cancer-code-europe.iarc.who.int/' },
};
/* European Code Against Cancer, 5th edition. Only the t strings are the official wording, quoted verbatim; h is the game’s own short label. */
const CODE = {
  c1:  { n: 1,  h: 'Do not smoke', t: 'Do not smoke. Do not use any form of tobacco, or vaping products. If you smoke, you should quit.' },
  c2:  { n: 2,  h: 'Keep your home and car smoke-free', t: 'Keep your home and car free of tobacco smoke.' },
  c3:  { n: 3,  h: 'Avoid or manage overweight', t: 'Take action to avoid or manage overweight and obesity: Limit food high in calories, sugar, fat, and salt. Limit drinks high in sugar. Drink mostly water and unsweetened drinks. Limit ultra-processed foods.' },
  c4:  { n: 4,  h: 'Be physically active', t: 'Be physically active in everyday life. Limit the time you spend sitting.' },
  c5:  { n: 5,  h: 'Eat a healthy diet', t: 'Eat whole grains, vegetables, legumes, and fruits as a major part of your daily diet. Limit red meat, and avoid processed meat.' },
  c6:  { n: 6,  h: 'Avoid alcohol', t: 'Avoid alcoholic drinks.' },
  c7:  { n: 7,  h: 'Breastfeed', t: 'Breastfeed your baby for as long as possible.' },
  c13: { n: 13, h: 'Limit hormone replacement therapy', t: 'If you decide to use hormone replacement therapy (for menopausal symptoms) after a thorough discussion with your health-care professional, limit its use to the shortest duration possible.' },
  c14: { n: 14, h: 'Take part in screening', t: 'Take part in organized cancer screening programmes, as recommended in your country, for: Bowel cancer. Breast cancer. Cervical cancer. Lung cancer.' },
};

/* ------------------------------------------------------------------ model */
const N = 1000;
const BUDGET = 3;
const MODEL = {
  baseCases: 94, baseDeaths: 15,          // per 1,000 women, GLOBOCAN 2024 estimates, Western Europe, risk before age 75
  screenBenefit: 0.40, screenShare: 0.65, s0: 0.55, // 40% fewer breast-cancer deaths among attenders, for the 65% of deaths before 75 assumed to arise from cancers diagnosed at 50 to 69; reference participation 55%
  factors: {
    alcohol:   { name: 'Drinks most days, moderate or more', rr: 1.30, p0: 0.15, w: 1,   from: 0, src: ['bagnardi'], note: 'RR 1.30 assumed, between the meta-analysis’s moderate (1.23) and heavy (1.61) categories; p0 0.15 assumed' },
    inactive:  { name: 'Active for under 150 minutes a week', rr: 1.10, p0: 0.40, w: 1,   from: 0, src: ['pizot', 'kyu'], note: 'RR 1.10 from Pizot’s estimate that an inactive woman reaching 150 minutes a week reduces her lifetime risk by about 9%; the 0.88 and 0.86 figures compare the most active with the least active women; p0 0.40 assumed' },
    obesity:   { name: 'BMI of 30 or more after the menopause', rr: 1.25, p0: 0.20, w: 0.7, from: 2, src: ['fat'], note: 'source: about 1.1 per 5 BMI units; 1.25 assumed for BMI 30 or more versus 18.5 to 24.9; w 0.7 assumed (roughly seven in ten cases before 75 arise after the menopause); p0 0.20 assumed; the factor enters the model from the Forties onward' },
    breastfed: { name: 'Mothers who breastfed 12 months or more in total', rr: 0.957, p0: 0.30, w: 1, from: 0, src: ['bf'], note: 'the relative risk falls 4.3% per 12 months of breastfeeding; p0 0.30 assumed; the RR is applied as a single 12-month step' },
    mht:       { name: 'Combined oestrogen-progestogen MHT, current use 5 years or more', rr: 2.0, p0: 0.05, w: 0.5, from: 0, src: ['mht'], note: 'RR 2.0 rounds the source’s 2.08 for years 5 to 14 of current use versus never users; p0 0.05 and w 0.5 assumed (the exposure applies to cases at ages 50 to 69)' },
  },
};
const FACTOR_ORDER = ['alcohol', 'inactive', 'obesity', 'breastfed', 'mht'];

/* ------------------------------------------------------------------ chapters and cards */
const CHAPTERS = [
  { id: 'twenties', name: 'The Twenties', short: 'Twenties',
    intro: 'The cohort is 20. A thousand young women, first jobs, first flats, a high street that fills up on Friday nights. As the council you have 3 points of effort to spend this decade.',
    cards: [
      { id: 'alcohol', kicker: 'Alcohol', title: 'Nights out', code: ['c6'], src: ['bagnardi'],
        text: 'Two-for-one promotions run most evenings along the high street. In the meta-analysis behind this card, women who drank moderately had about 23% higher risk of breast cancer than women who did not drink or drank only occasionally, heavy drinkers about 61% higher, and even light drinking carried a small increase of about 4%.',
        options: [
          { label: 'Leave the drinks promotions as they are', cost: 0, effect: { factor: 'alcohol', delta: 0.02 },
            fb: 'The promotions stay. A few more women settle into drinking most days, and the projection edges up.' },
          { label: 'Alcohol-free options on every menu and an end to drinks promotions', cost: 1, effect: { factor: 'alcohol', delta: -0.03 },
            fb: 'Alcohol-free options appear on every menu and the promotions end. Fewer women drink most days. A small shift in a common habit, spread across a thousand lives.' },
          { label: 'Minimum unit pricing, free tap water everywhere, alcohol-free venues', cost: 2, effect: { factor: 'alcohol', delta: -0.06 },
            fb: 'Minimum unit pricing, free tap water everywhere and venues without alcohol. Drinking most days becomes less of a default. This is the largest shift the card can make.' },
        ] },
      { id: 'moving', kicker: 'Physical activity', title: 'Getting around', code: ['c4'], src: ['pizot', 'kyu'],
        text: 'Most trips across town are made by car. The ring road puts people off cycling and the paths through the park are dark after dusk. Across many studies, the most active women had about 12% lower risk of breast cancer than the least active, and highly active women about 14% lower than those who were insufficiently active. Those figures compare the most active with the least active; the model uses a smaller step, the estimate that an inactive woman who reaches 150 minutes a week lowers her risk by about 9%.',
        options: [
          { label: 'Nothing changes', cost: 0, effect: { factor: 'inactive', delta: 0.02 },
            fb: 'Nothing changes on the roads. A few more women fall below 150 minutes of activity a week.' },
          { label: 'Safe cycle lanes and lit walking routes', cost: 1, effect: { factor: 'inactive', delta: -0.04 },
            fb: 'Safe cycle lanes and lit walking routes. More trips on foot and by bike, and fewer women below 150 minutes a week.' },
          { label: 'Cycle lanes plus free sport in the parks and the pools', cost: 2, effect: { factor: 'inactive', delta: -0.07 },
            fb: 'Cycle lanes, and free sport in the parks and the pools. Activity becomes part of the town’s ordinary week.' },
        ] },
    ] },
  { id: 'thirties', name: 'The Thirties', short: 'Thirties',
    intro: 'The cohort is 30. Many of the women are having children, and the town’s social feeds are as lively as its streets. Three points of effort again.',
    cards: [
      { id: 'parents', kicker: 'Breastfeeding', title: 'New parents', code: ['c7'], src: ['bf'],
        text: 'Many of the women are having their first and second children. Whether they breastfeed, and for how long, depends a good deal on the support around them. In a collaborative reanalysis of data from many studies, the relative risk of breast cancer fell by about 4.3% for every 12 months of breastfeeding.',
        options: [
          { label: 'No programme', cost: 0, effect: { factor: 'breastfed', delta: 0 },
            fb: 'No programme. Breastfeeding continues at the rate it always has.' },
          { label: 'Midwife-led breastfeeding support and breaks at work', cost: 1, effect: { factor: 'breastfed', delta: 0.06 },
            fb: 'Midwife-led support and breaks at work. More mothers reach 12 months of breastfeeding in total, across their children.' },
          { label: 'Support plus longer paid leave', cost: 2, effect: { factor: 'breastfed', delta: 0.10 },
            fb: 'Support plus longer paid leave. Still more mothers reach 12 months. The effect on breast cancer is small, and it comes with much else that this game does not count.' },
        ] },
      { id: 'viral', kicker: 'A claim to check', title: 'The viral post', code: [], src: ['mirick'],
        text: 'A post says antiperspirants cause breast cancer. It is everywhere, and the council’s inbox fills with worried messages.',
        options: [
          { label: 'Ignore it', cost: 0, effect: { none: true },
            fb: 'The post fades on its own. Nothing in the town changes, since the evidence does not link antiperspirants to breast-cancer risk.' },
          { label: 'Fund an “antiperspirant-free town” campaign', cost: 1, effect: { none: true, wasted: true },
            fb: 'The campaign ran for a year and nothing in the projection moved, because there was nothing to move. A population-based study found no increase in breast-cancer risk with antiperspirant or deodorant use, and the IARC Monographs have not evaluated antiperspirants or deodorants. That effort could have gone elsewhere.' },
          { label: 'Publish a fact check with the evidence', cost: 1, effect: { none: true, badge: 'evidence' },
            fb: 'The fact check went out with the study attached. The counts do not change, since the evidence does not link antiperspirants to breast-cancer risk. The council met a rumour with evidence, and that is a habit worth keeping.' },
        ] },
    ] },
  { id: 'forties', name: 'The Forties', short: 'Forties',
    intro: 'The cohort is 40. Habits set in, waistlines drift, and the menopause is a decade away. From here on, body fatness after the menopause enters the model.',
    cards: [
      { id: 'food', kicker: 'Body weight', title: 'The food environment', code: ['c3', 'c5'], src: ['fat'],
        text: 'Sugary drinks cost less than water in the canteens and the school lunches lean on fried food. Body fatness matters most for breast cancer after the menopause. The IARC Handbook found that avoiding excess body fatness lowers the risk of postmenopausal breast cancer, and this model gives a BMI of 30 or more after the menopause about 25% higher risk.',
        options: [
          { label: 'Nothing', cost: 0, effect: { factor: 'obesity', delta: 0.02 },
            fb: 'Nothing changes. A few more women carry a BMI of 30 or more into the menopause.' },
          { label: 'A sugary-drinks levy and healthier school and canteen food', cost: 1, effect: { factor: 'obesity', delta: -0.03 },
            fb: 'A sugary-drinks levy and healthier food in schools and canteens. Fewer women reach the menopause with a BMI of 30 or more.' },
          { label: 'Levy plus active travel and subsidised fresh food', cost: 2, effect: { factor: 'obesity', delta: -0.05 },
            fb: 'The levy, plus active travel and subsidised fresh food. The food environment shifts for everyone, and fewer women again reach the menopause with a BMI of 30 or more.' },
        ] },
      { id: 'beach', kicker: 'A question of evidence', title: 'The smoke-free beach', code: ['c1', 'c2'], src: ['m100e'],
        text: 'A petition asks the council to make the beach and the parks smoke-free. Some of the signatories mention breast cancer.',
        options: [
          { label: 'Leave it', cost: 0, effect: { none: true },
            fb: 'The beach stays as it is. The breast-cancer projection does not move either way.' },
          { label: 'Make the beach and parks smoke-free', cost: 1, effect: { none: true, badge: 'beach' },
            fb: 'The beach and parks go smoke-free. The breast-cancer counts do not change. Tobacco smoking is carcinogenic to humans (Group 1), with sufficient evidence for lung cancer and many other sites; for breast cancer IARC has observed a positive association, which it classes as limited evidence. The town gains for reasons this game does not count.' },
        ] },
    ] },
  { id: 'fifties', name: 'The Fifties', short: 'Fifties',
    intro: 'The cohort is 50. The menopause arrives for most, and with it the screening invitations. This is the decade with the largest levers.',
    cards: [
      { id: 'clinic', kicker: 'Hormone therapy', title: 'The menopause clinic', code: ['c13'], src: ['mht'],
        text: 'Women arriving at the menopause ask the clinic about hormone therapy, and some are prescribed combined oestrogen-progestogen therapy for years without review. In the collaborative analysis behind this card, current users of combined therapy had about 60% higher risk of breast cancer than never users in years 1 to 4 of use, and about double the risk in years 5 to 14.',
        options: [
          { label: 'Leave prescribing as it is', cost: 0, effect: { factor: 'mht', set: 0.05 },
            fb: 'Prescribing continues as before. Long-term combined therapy stays as common as it was.' },
          { label: 'Guidance: shortest effective duration, reviewed every year', cost: 1, effect: { factor: 'mht', set: 0.03 },
            fb: 'Guidance: the shortest effective duration, reviewed every year. Fewer women stay on combined therapy for 5 years or more.' },
          { label: 'Guidance plus non-hormonal options and a specialist clinic', cost: 2, effect: { factor: 'mht', set: 0.02 },
            fb: 'Guidance, non-hormonal options and a specialist clinic. Fewer women again on long-term combined therapy, and better care for the symptoms themselves.' },
        ] },
      { id: 'screening', kicker: 'Screening', title: 'Screening invitations', code: ['c14'], src: ['screen'],
        text: 'The programme invites women aged 50 to 69 to mammography. In this town just over half attend; the model assumes 55 in 100, and real programmes range from under 20 to over 85 in 100. The IARC Handbook found that screening at these ages reduces breast-cancer deaths by about 40% among women who attend, and by about 23% among all women invited. The same review weighed the harms, such as false-positive results and overdiagnosis, which this model does not count.',
        options: [
          { label: 'Letters only', cost: 0, effect: { screen: 0.55 },
            fb: 'Letters only. Attendance stays at about 55 in 100.' },
          { label: 'Reminders, evening and weekend slots', cost: 1, effect: { screen: 0.68 },
            fb: 'Reminders, and evening and weekend slots. Attendance rises to about 68 in 100.' },
          { label: 'Reminders plus a mobile unit and patient navigators in low-attendance areas', cost: 2, effect: { screen: 0.78 },
            fb: 'Reminders, a mobile unit and patient navigators in the areas where attendance was lowest. Attendance rises to about 78 in 100.' },
        ] },
    ] },
  { id: 'sixties', name: 'The Sixties', short: 'Sixties',
    intro: 'The cohort is 60. Retirement for some, grandchildren for others, and the last decade the council can shape before the story ends at 75.',
    cards: [
      { id: 'active60', kicker: 'Physical activity', title: 'Staying active after 60', code: ['c4'], src: ['pizot', 'kyu'],
        text: 'The ordinary reasons to move about have thinned: fewer commutes, fewer school runs. The same evidence as in the Twenties applies here. The most active women had about 12% lower risk of breast cancer than the least active, the model uses the smaller step of about 9% for an inactive woman who reaches 150 minutes a week, and activity in later life still counts.',
        options: [
          { label: 'Nothing', cost: 0, effect: { factor: 'inactive', delta: 0.03 },
            fb: 'Nothing. More women fall below 150 minutes a week as the decade goes on.' },
          { label: 'Walking groups and a free pool hour', cost: 1, effect: { factor: 'inactive', delta: -0.03 },
            fb: 'Walking groups and a free pool hour. Fewer women below 150 minutes a week.' },
          { label: 'Walking groups plus classes at the community centre', cost: 2, effect: { factor: 'inactive', delta: -0.05 },
            fb: 'Walking groups plus classes at the community centre. Fewer women again below 150 minutes a week, and more company.' },
        ] },
      { id: 'normal', kicker: 'Awareness', title: 'Know what is normal for you', code: [], src: [],
        text: 'A councillor proposes a campaign on noticing changes in the breast and seeing a doctor promptly. Another proposes a ban on underwired bras, citing a rumour that they cause cancer.',
        options: [
          { label: 'Nothing', cost: 0, effect: { none: true },
            fb: 'No campaign. The counts are unchanged.' },
          { label: 'A campaign on noticing changes and seeing a doctor promptly', cost: 1, effect: { none: true, badge: 'aware' },
            fb: 'The campaign runs. The counts in this game do not change, because earlier diagnosis is not modelled here. The town has been told what to look for, and the ending records that.' },
          { label: 'Ban underwired bras “to prevent cancer”', cost: 1, effect: { none: true, wasted: true }, src: ['chen'],
            fb: 'The ban passes and nothing in the projection moves. A population-based study among postmenopausal women found that no aspect of bra wearing was associated with breast cancer. That effort could have gone elsewhere.' },
        ] },
    ] },
];
const BADGES = {
  council:  { label: 'Evidence-based council', sub: 'No effort was spent on measures without evidence.' },
  evidence: { label: 'Evidence first', sub: 'The council answered the viral post with a fact check.' },
  aware:    { label: 'Early diagnosis', sub: 'The town was told what to look for.' },
  beach:    { label: 'Smoke-free beach and parks', sub: 'No change in the breast-cancer counts; gains elsewhere that this game does not count.', flat: true },
};

/* ------------------------------------------------------------------ state */
const KEY = 'epi-town-of-1000';
const state = { chapter: 0, picks: {}, shown: { cases: MODEL.baseCases, deaths: MODEL.baseDeaths }, settings: {} };
let dotsMain = [], dotsFinal = [];

function loadSettings() {
  try { Object.assign(state.settings, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const app = $('#app');
  app.classList.toggle('contrast', !!state.settings.contrast);
  app.classList.toggle('large', !!state.settings.large);
  app.classList.toggle('wide', !!state.settings.font);
  app.classList.toggle('still', !!state.settings.motion);
  ['contrast', 'large', 'font', 'motion'].forEach(k => { $('#opt-' + k).checked = !!state.settings[k]; });
}
function saveSettings() { try { localStorage.setItem(KEY, JSON.stringify(state.settings)); } catch (e) {} }
function isStill() {
  return $('#app').classList.contains('still') || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
function show(screen) {
  $('#app').dataset.screen = screen;
  ['title', 'play', 'report'].forEach(s => { $('#screen-' + s).hidden = s !== screen; });
}

/* ------------------------------------------------------------------ the model */
const clamp01 = v => Math.min(1, Math.max(0, v));
function cardsUpTo(upto) {
  const out = [];
  for (let c = 0; c <= upto && c < CHAPTERS.length; c++) CHAPTERS[c].cards.forEach(card => out.push(card));
  return out;
}
function pickOf(card) { const i = state.picks[card.id]; return i == null ? null : card.options[i]; }
function town(upto) {
  const p = {}; FACTOR_ORDER.forEach(k => { p[k] = MODEL.factors[k].p0; });
  let s = MODEL.s0;
  cardsUpTo(upto).forEach(card => {
    const o = pickOf(card); if (!o) return;
    const e = o.effect;
    if (e.factor && e.delta != null) p[e.factor] = clamp01(p[e.factor] + e.delta);
    if (e.factor && e.set != null) p[e.factor] = e.set;
    if (e.screen != null) s = e.screen;
  });
  return { p, s };
}
function project(upto) {
  const { p, s } = town(upto);
  let ratio = 1;
  FACTOR_ORDER.forEach(k => {
    const f = MODEL.factors[k];
    if (upto < f.from) return;
    const rr = 1 + f.w * (f.rr - 1);
    ratio *= (1 + p[k] * (rr - 1)) / (1 + f.p0 * (rr - 1));
  });
  const ws = MODEL.screenShare * MODEL.screenBenefit;
  const screen = (1 - ws * s) / (1 - ws * MODEL.s0);
  return { cases: Math.round(MODEL.baseCases * ratio), deaths: Math.round(MODEL.baseDeaths * ratio * screen), ratio, screen, p, s };
}
function deltaText(n, base) {
  const d = n - base;
  if (d === 0) return 'same as the baseline';
  return (d > 0 ? '+' : '−') + Math.abs(d) + ' vs the baseline';
}
function deltaClass(n, base) { return n < base ? 'down' : n > base ? 'up' : ''; }

/* ------------------------------------------------------------------ dots */
function buildDots(container) {
  const cols = 40, rows = 25, cell = 10;
  let circles = '';
  for (let i = 0; i < N; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    circles += `<circle class="dot" cx="${c * cell + cell / 2}" cy="${r * cell + cell / 2}" r="3.4"/>`;
  }
  container.innerHTML = `<svg viewBox="0 0 ${cols * cell} ${rows * cell}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${container.id}-title"><title id="${container.id}-title"></title>${circles}</svg>`;
  return Array.from(container.querySelectorAll('.dot'));
}
function paintDots(dots, container, cases, deaths, animate) {
  const still = isStill();
  const B = MODEL;
  let k = 0;
  dots.forEach((el, i) => {
    const cls = i < deaths ? 'die' : i < cases ? 'case' : '';
    // baseline ghost: rings where the baseline count reached and the town's count does not, or beyond it
    const ghost = (i >= deaths && i < B.baseDeaths) ? 'die' : (i >= cases && i < B.baseCases) ? 'case' : (i >= B.baseCases && i < cases) ? 'over' : '';
    const cur = el.getAttribute('data-s') || '';
    if (ghost) el.setAttribute('data-g', ghost); else el.removeAttribute('data-g');
    if (cls === cur) return;
    if (cls) el.setAttribute('data-s', cls); else el.removeAttribute('data-s');
    const delay = (animate && !still) ? Math.min(900, k * 60) : 0;
    el.style.transitionDelay = delay + 'ms';
    if (animate && !still) { el.classList.remove('pop'); void el.getBoundingClientRect(); el.style.animationDelay = delay + 'ms'; el.classList.add('pop'); }
    k++;
  });
  const t = container.querySelector('title');
  if (t) t.textContent = `A grid of 1,000 dots. About ${cases} are red, for women projected to be diagnosed with breast cancer by 75; about ${deaths} of those are ink, for women projected to die of it. Rings mark where the baseline of about ${B.baseCases} and about ${B.baseDeaths} sat.`;
}
function tween(el, from, to) {
  if (isStill() || from === to) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 800;
  const f = now => {
    const t = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (t < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}
function renderTown(next, animate) {
  const prev = state.shown;
  paintDots(dotsMain, $('#dots'), next.cases, next.deaths, animate);
  tween($('#fig-cases'), prev.cases, next.cases);
  tween($('#fig-deaths'), prev.deaths, next.deaths);
  const dc = $('#fig-cases-d'), dd = $('#fig-deaths-d');
  dc.textContent = deltaText(next.cases, MODEL.baseCases); dc.className = 'delta ' + deltaClass(next.cases, MODEL.baseCases);
  dd.textContent = deltaText(next.deaths, MODEL.baseDeaths); dd.className = 'delta ' + deltaClass(next.deaths, MODEL.baseDeaths);
  [['cases', prev.cases !== next.cases], ['deaths', prev.deaths !== next.deaths]].forEach(([k, changed]) => {
    const fig = $('#fig-' + k).closest('.figure'); fig.classList.remove('bump'); if (changed && animate) { void fig.offsetWidth; fig.classList.add('bump'); }
  });
  state.shown = { cases: next.cases, deaths: next.deaths };
}

/* ------------------------------------------------------------------ shared html */
function srcHtml(keys) {
  if (!keys || !keys.length) return '';
  return `<div class="src"><b>Sources.</b> ${keys.map(k => `<a href="${SRC[k].u}" target="_blank" rel="noopener">${esc(SRC[k].t)}</a>`).join(' · ')}</div>`;
}
function codeHtml(k) {
  const c = CODE[k];
  return `<div class="code"><p class="kicker">European Code Against Cancer · recommendation ${c.n} · ${esc(c.h)}</p>${esc(c.t)}</div>`;
}
function costHtml(cost) {
  const pips = Array.from({ length: BUDGET }, (_, i) => `<i class="${i < cost ? 'on' : ''}"></i>`).join('');
  return `<span class="cost"><span class="pips" aria-hidden="true">${pips}</span><span class="cost-l">${cost === 0 ? 'no effort' : cost === 1 ? '1 effort' : cost + ' effort'}</span></span>`;
}
/* Policies already in place, for the skyline behind the dot array. */
function townFlags(upto) {
  const f = {};
  cardsUpTo(upto).forEach(card => {
    const o = pickOf(card); if (!o) return; const i = state.picks[card.id];
    if (card.id === 'moving' && i >= 1) f.cycle = true;
    if (card.id === 'moving' && i === 2) f.sport = true;
    if (card.id === 'alcohol' && i === 2) f.fountain = true;
    if (card.id === 'food' && i >= 1) f.market = true;
    if (card.id === 'screening' && i >= 1) f.clinic = true;
    if (card.id === 'screening' && i === 2) f.van = true;
    if (card.id === 'active60' && i >= 1) f.walkers = true;
  });
  return f;
}
function renderSkyline(chapterIdx, flags, animate) {
  const el = $('#skyline'); if (!el || !window.TownArt) return;
  const swap = () => { el.innerHTML = window.TownArt.skyline(chapterIdx, flags); el.dataset.season = window.TownArt.seasons[chapterIdx]; };
  if (!animate || isStill()) { swap(); el.classList.remove('fade'); return; }
  el.classList.add('fade');
  setTimeout(() => { swap(); void el.offsetWidth; el.classList.remove('fade'); }, 260);
}

/* ------------------------------------------------------------------ chapter render */
function chapter() { return CHAPTERS[state.chapter]; }
function effortUsed() { return chapter().cards.reduce((sum, card) => { const o = pickOf(card); return sum + (o ? o.cost : 0); }, 0); }
function renderChapter() {
  const ch = chapter();
  $('#hud-step').textContent = `Chapter ${state.chapter + 1} of ${CHAPTERS.length}`;
  $('#hud-chapter').textContent = ch.name;
  $('#chapter-title').textContent = ch.name;
  $('#chapter-intro').textContent = ch.intro;
  $('#chapter-season').textContent = window.TownArt ? window.TownArt.seasons[state.chapter] : '';
  renderSkyline(state.chapter, townFlags(state.chapter - 1), state.chapter > 0);
  $('#cards').innerHTML = ch.cards.map((card, ci) => `
    <article class="card" data-card="${card.id}" aria-labelledby="card-${card.id}">
      <div class="card-head">
        <div class="card-art">${window.TownArt ? window.TownArt.vignette(card.id) : ''}</div>
        <div class="card-titles"><p class="kicker">Card ${ci + 1} · ${esc(card.kicker)}</p><h3 id="card-${card.id}">${esc(card.title)}</h3></div>
      </div>
      <p class="desc">${esc(card.text)}</p>
      ${srcHtml(card.src)}
      <div class="bins" role="group" aria-label="${esc(card.title)}: options">
        ${card.options.map((o, i) => `<button type="button" class="choice" data-card="${card.id}" data-i="${i}" aria-pressed="false"><span class="tick" aria-hidden="true"></span><b>${esc(o.label)}</b>${costHtml(o.cost)}</button>`).join('')}
      </div>
    </article>`).join('');
  $$('#cards .choice').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.card, i = +btn.dataset.i;
    if (state.picks[id] === i) delete state.picks[id]; else state.picks[id] = i;
    updateEffort();
  }));
  updateEffort();
  const wrap = $('.cards'); wrap.classList.remove('enter'); void wrap.offsetWidth; wrap.classList.add('enter');
  window.scrollTo({ top: 0 });
  $('#chapter-title').focus({ preventScroll: true });
}
function updateEffort() {
  const ch = chapter();
  const used = effortUsed(), left = BUDGET - used;
  $('#hud-effort').textContent = left;
  $('#hud-pips').innerHTML = Array.from({ length: BUDGET }, (_, i) => `<i class="${i < left ? 'on' : ''}"></i>`).join('');
  ch.cards.forEach(card => {
    const mine = pickOf(card); const refund = mine ? mine.cost : 0;
    card.options.forEach((o, i) => {
      const btn = $(`#cards .choice[data-card="${card.id}"][data-i="${i}"]`);
      const picked = state.picks[card.id] === i;
      btn.setAttribute('aria-pressed', picked ? 'true' : 'false');
      btn.disabled = !picked && o.cost > left + refund;
    });
  });
  const allPicked = ch.cards.every(card => state.picks[card.id] != null);
  const ready = allPicked || left === 0;
  $('#btn-close-chapter').disabled = !ready;
  $('#close-hint').textContent = ready ? 'You can still change your mind before you close the chapter.'
    : left === 0 ? '' : 'Pick an option on each card.';
}

/* ------------------------------------------------------------------ closing a chapter */
function closeChapter() {
  const ch = chapter();
  ch.cards.forEach(card => { if (state.picks[card.id] == null) state.picks[card.id] = 0; });
  const before = state.shown;
  const next = project(state.chapter);
  renderTown(next, true);
  $('#town-status').textContent = `After ${ch.name.toLowerCase()}: about ${next.cases} of 1,000 diagnosed by 75, about ${next.deaths} die of it.`;
  const last = state.chapter === CHAPTERS.length - 1;
  const codes = []; ch.cards.forEach(card => card.code.forEach(k => { if (!codes.includes(k)) codes.push(k); }));
  const cardsHtml = ch.cards.map(card => {
    const o = pickOf(card); const e = o.effect;
    const cls = e.wasted ? 'no' : e.none ? 'flat' : 'ok';
    const head = e.wasted ? 'Effort spent without evidence' : e.none ? 'No change in the counts' : 'Done';
    return `<div class="verdict ${cls}"><h3>${esc(card.title)} · ${esc(o.label)} <span class="tally">${o.cost === 0 ? 'no effort' : o.cost + ' effort'}</span></h3>
      <p><b>${head}.</b> ${esc(o.fb)}</p>${srcHtml(o.src || card.src)}</div>`;
  }).join('');
  $('#panel-kicker').textContent = `End of ${ch.name.toLowerCase()} · chapter ${state.chapter + 1} of ${CHAPTERS.length}`;
  $('#panel-title').textContent = 'What changed';
  $('#panel-text').textContent = before.cases === next.cases && before.deaths === next.deaths
    ? 'The projection for the town is where it was at the start of the decade.'
    : 'The projection for the town moved this decade.';
  $('#panel-body').innerHTML = `
    <div class="shift">
      <div><b>about ${before.cases} → ${next.cases}</b><span>of 1,000 diagnosed by 75 · ${esc(deltaText(next.cases, MODEL.baseCases))}</span></div>
      <div><b>about ${before.deaths} → ${next.deaths}</b><span>of 1,000 die of it · ${esc(deltaText(next.deaths, MODEL.baseDeaths))}</span></div>
    </div>
    ${cardsHtml}
    ${codes.map(codeHtml).join('')}
    <div class="actions"><button type="button" class="btn primary" id="btn-next">${last ? 'See how the town did' : 'Open ' + CHAPTERS[state.chapter + 1].name.toLowerCase()}</button></div>`;
  const p = $('#panel'); p.hidden = false;
  $('#panel-title').focus({ preventScroll: true }); p.scrollTop = 0;
  $('#btn-next').addEventListener('click', () => {
    p.hidden = true;
    if (last) return ending();
    state.chapter++; renderChapter();
  });
}

/* ------------------------------------------------------------------ ending */
function tally() {
  let spent = 0, wasted = 0; const badges = {};
  cardsUpTo(CHAPTERS.length - 1).forEach(card => {
    const o = pickOf(card); if (!o) return;
    spent += o.cost;
    if (o.effect.wasted) wasted += o.cost;
    if (o.effect.badge) badges[o.effect.badge] = true;
  });
  if (wasted === 0 && spent > 0) badges.council = true;
  return { spent, wasted, badges };
}
function part(n, noun) {
  if (n > 0) return `about ${n} ${n === 1 ? noun : noun + 's'} avoided`;
  if (n < 0) return `about ${-n} more ${-n === 1 ? noun : noun + 's'} than the baseline`;
  return `no change in ${noun}s`;
}
function ending() {
  const fin = project(CHAPTERS.length - 1);
  const ca = MODEL.baseCases - fin.cases, da = MODEL.baseDeaths - fin.deaths;
  const { spent, wasted, badges } = tally();
  $('#report-headline').textContent = (ca >= 0 && da >= 0)
    ? `About ${ca} ${ca === 1 ? 'case' : 'cases'} and ${da} ${da === 1 ? 'death' : 'deaths'} avoided per 1,000 women by age 75. Set against the whole town, that is a modest change, and it is what population prevention usually looks like.`
    : `Per 1,000 women by age 75: ${part(ca, 'case')} and ${part(da, 'death')}. Population prevention moves the numbers modestly in either direction.`;
  $('#report-grid').innerHTML = [
    [`<small>about</small> ${fin.cases}`, `of 1,000 diagnosed by 75 · ${deltaText(fin.cases, MODEL.baseCases)}`],
    [`<small>about</small> ${fin.deaths}`, `of 1,000 die of it · ${deltaText(fin.deaths, MODEL.baseDeaths)}`],
    [`${spent}<small>/${BUDGET * CHAPTERS.length}</small>`, 'effort points spent'],
    [`${wasted}`, wasted === 1 ? 'effort point spent without evidence' : 'effort points spent without evidence'],
  ].map(([b, s]) => `<div><b>${b}</b><span>${esc(s)}</span></div>`).join('');
  if (!dotsFinal.length) dotsFinal = buildDots($('#dots-final'));
  paintDots(dotsFinal, $('#dots-final'), fin.cases, fin.deaths, false);
  if (window.TownArt) $('#skyline-final').innerHTML = window.TownArt.skyline(CHAPTERS.length - 1, townFlags(CHAPTERS.length - 1));

  const badgeHtml = Object.keys(BADGES).filter(k => badges[k]).map(k =>
    `<span class="badge ${BADGES[k].flat ? 'flat' : ''}" title="${esc(BADGES[k].sub)}">${esc(BADGES[k].label)}<span class="visually-hidden">: ${esc(BADGES[k].sub)}</span></span>`).join('');
  const choicesHtml = CHAPTERS.map((ch, ci) => `<li class="tl-chapter"><span class="tl-node" aria-hidden="true">${ci + 1}</span><div class="tl-body"><h3>${esc(ch.name)} <span class="tl-season">${window.TownArt ? esc(window.TownArt.seasons[ci]) : ''}</span></h3><ul class="tl-cards">${ch.cards.map(card => {
    const o = pickOf(card); const e = o.effect;
    return `<li class="${e.wasted ? 'wasted' : ''}"><div><span class="ch">${esc(card.title)}</span><em>${esc(o.label)}</em></div>${costHtml(o.cost)}</li>`;
  }).join('')}</ul></div></li>`).join('');
  const codes = []; CHAPTERS.forEach(ch => ch.cards.forEach(card => card.code.forEach(k => { if (!codes.includes(k)) codes.push(k); })));
  $('#report-body').innerHTML = `
    <p class="kicker" style="margin-top:18px">Badges</p>
    <div class="badges">${badgeHtml || '<span class="fine">No badges this time.</span>'}</div>
    ${Object.keys(BADGES).filter(k => badges[k]).map(k => `<p class="fine"><b>${esc(BADGES[k].label)}.</b> ${esc(BADGES[k].sub)}</p>`).join('')}
    <p class="kicker" style="margin-top:22px">The council’s choices, decade by decade</p>
    <ol class="timeline">${choicesHtml}</ol>
    <div class="honest">
      <p class="kicker">Read before quoting</p>
      <h2>What this game can and cannot say</h2>
      <ul>
        <li>The numbers are population averages from pooled studies. They describe what tends to happen across a thousand women, and they cannot predict any one woman’s future.</li>
        <li>The model is illustrative. It multiplies a handful of published relative risks by assumed prevalences; real towns, real programmes and real people are more complicated than that.</li>
        <li>Most women with any of these factors never develop breast cancer, and some women with none of them do.</li>
        <li>Treatment and screening decisions belong with a clinician. Nothing here is medical advice.</li>
        <li>The cards are simplified. Real policies overlap, take years to work and affect other cancers and other diseases that this game does not count.</li>
      </ul>
    </div>
    <p class="kicker">The European Code Against Cancer, as it appeared in the game</p>
    ${codes.map(codeHtml).join('')}
    <p class="fine">Recommendations are the official wording of the European Code Against Cancer, 5th edition. The full model is in “About the numbers”.</p>
    <div class="actions"><button type="button" class="btn" id="btn-about-3">About the numbers</button></div>
    ${srcHtml(['gco', 'bagnardi', 'pizot', 'kyu', 'fat', 'bf', 'mht', 'screen', 'mirick', 'm100e', 'chen', 'code'])}`;
  $('#btn-about-3').addEventListener('click', () => openAbout());
  show('report'); window.scrollTo({ top: 0 });
  $('#screen-report h1').setAttribute('tabindex', '-1'); $('#screen-report h1').focus({ preventScroll: true });
}

/* ------------------------------------------------------------------ about the numbers */
const pct = v => Math.round(v * 100);
function aboutHtml() {
  const inPlay = $('#app').dataset.screen !== 'title';
  const upto = $('#app').dataset.screen === 'report' ? CHAPTERS.length - 1 : state.chapter - 1;
  const now = inPlay ? project(upto) : null;
  const rows = FACTOR_ORDER.map(k => {
    const f = MODEL.factors[k]; const rr = 1 + f.w * (f.rr - 1);
    return `<tr><td>${esc(f.name)}${f.note ? `<br><span class="fine">${esc(f.note)}</span>` : ''}</td><td class="num">${f.rr}</td><td class="num">${f.w}</td><td class="num">${rr.toFixed(3)}</td><td class="num">about ${pct(f.p0)} in 100</td>${now ? `<td class="num">about ${pct(now.p[k])} in 100</td>` : ''}<td>${f.src.map(s => `<a href="${SRC[s].u}" target="_blank" rel="noopener">${esc(SRC[s].t.split(':')[0])}</a>`).join('; ')}</td></tr>`;
  }).join('');
  const effects = [];
  CHAPTERS.forEach(ch => ch.cards.forEach(card => card.options.forEach(o => {
    const e = o.effect; let what;
    if (e.factor && e.delta != null) what = e.delta === 0 ? 'no change' : `${MODEL.factors[e.factor].name.toLowerCase()}: ${e.delta > 0 ? '+' : '−'}${Math.abs(pct(e.delta))} in 100`;
    else if (e.factor && e.set != null) what = `${MODEL.factors[e.factor].name.toLowerCase()}: set to about ${pct(e.set)} in 100`;
    else if (e.screen != null) what = `screening participation: set to about ${pct(e.screen)} in 100`;
    else what = e.wasted ? 'no effect on any count; effort recorded as spent without evidence' : e.badge ? 'no effect on any count; noted in the ending' : 'no effect';
    effects.push(`<tr><td>${esc(ch.short)} · ${esc(card.title)}</td><td>${esc(o.label)}</td><td class="num">${o.cost}</td><td>${esc(what)}</td></tr>`);
  })));
  return `<div class="about">
    <p>Everything the game calculates is here. All results are shown rounded to whole numbers, with “about” in front, because that is the precision they deserve.</p>
    <h3>The baseline</h3>
    <p>GLOBOCAN 2024 estimates (Cancer Today, version 1.0, July 2026), IARC Global Cancer Observatory, accessed 16 September 2026: Western Europe, females, risk of a breast-cancer diagnosis before age 75: 9.4%, which is about 94 per 1,000; of dying of it before 75: 1.5%, which is about 15 per 1,000.</p>
    ${srcHtml(['gco'])}
    <h3>How the town’s projection is calculated</h3>
    <div class="formula">incidence ratio = ∏ over factors f of (1 + p<sub>f</sub> × (RR<sub>eff,f</sub> − 1)) ÷ (1 + p<sub>0,f</sub> × (RR<sub>eff,f</sub> − 1))<br>RR<sub>eff</sub> = 1 + w × (RR − 1)<br>cases = round(94 × ratio)<br>deaths = round(15 × ratio × (1 − 0.65 × 0.40 × s) ÷ (1 − 0.65 × 0.40 × s<sub>0</sub>)), with s<sub>0</sub> = 0.55</div>
    <p>p<sub>0</sub> is the reference prevalence assumed behind the baseline; p is the town’s prevalence after your choices. s is screening participation among women aged 50 to 69, and mammography screening at those ages reduces breast-cancer deaths by about 40% among women who attend (about 23% among all women invited). That reduction applies only to cancers diagnosed at the screening ages, so it cannot touch all deaths before 75: the weight w<sub>s</sub> = 0.65 is the assumed share of breast-cancer deaths before 75 that arise from cancers diagnosed at 50 to 69. s<sub>0</sub> = 0.55 is assumed; real programmes range from under 20 to over 85 in 100 (IARC Handbook 15).</p>
    ${srcHtml(['screen'])}
    <h3>The factors</h3>
    <table class="tbl"><thead><tr><th>Factor</th><th>RR</th><th>w</th><th>RR<sub>eff</sub></th><th>p<sub>0</sub></th>${now ? '<th>p now</th>' : ''}<th>Source</th></tr></thead><tbody>${rows}</tbody></table>
    ${now ? `<p class="fine">Screening participation now: about ${pct(now.s)} in 100 (reference about ${pct(MODEL.s0)} in 100). Incidence ratio ${now.ratio.toFixed(2)}; projected about ${now.cases} diagnosed and about ${now.deaths} deaths per 1,000.</p>` : ''}
    <h3>What each card does</h3>
    <table class="tbl"><thead><tr><th>Card</th><th>Option</th><th>Effort</th><th>Effect in the model</th></tr></thead><tbody>${effects.join('')}</tbody></table>
    <p class="fine">The effects are deliberately modest. They are meant to show the shape of population prevention, where a small change in a common exposure adds up across many people, and to be honest about how small the changes are for any one town.</p>
  </div>`;
}
function openAbout() { $('#about-body').innerHTML = aboutHtml(); openModal('#modal-about'); }

/* ------------------------------------------------------------------ reset and wiring */
function reset() {
  state.chapter = 0; state.picks = {};
  state.shown = { cases: MODEL.baseCases, deaths: MODEL.baseDeaths };
  if (!dotsMain.length) dotsMain = buildDots($('#dots'));
  paintDots(dotsMain, $('#dots'), MODEL.baseCases, MODEL.baseDeaths, false);
  $('#fig-cases').textContent = MODEL.baseCases; $('#fig-deaths').textContent = MODEL.baseDeaths;
  $('#fig-cases-d').textContent = 'the baseline'; $('#fig-cases-d').className = 'delta';
  $('#fig-deaths-d').textContent = 'the baseline'; $('#fig-deaths-d').className = 'delta';
  $('#town-status').textContent = '';
  $('#panel').hidden = true;
  renderSkyline(0, {}, false);
}
function start() { reset(); show('play'); renderChapter(); }
function openModal(id) { $(id).hidden = false; const f = $(id).querySelector('input, button'); if (f) f.focus(); }
function closeModals() { $$('.modal').forEach(m => { m.hidden = true; }); }
$('#btn-start').addEventListener('click', start);
$('#btn-again').addEventListener('click', start);
$('#btn-how').addEventListener('click', () => openModal('#modal-how'));
$('#btn-about').addEventListener('click', openAbout);
$('#btn-about-2').addEventListener('click', openAbout);
$('#btn-settings').addEventListener('click', () => openModal('#modal-settings'));
$('#btn-settings-2').addEventListener('click', () => openModal('#modal-settings'));
$('#btn-close-chapter').addEventListener('click', closeChapter);
$$('[data-close]').forEach(b => b.addEventListener('click', closeModals));
$$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModals(); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });
['contrast', 'large', 'font', 'motion'].forEach(k => $('#opt-' + k).addEventListener('change', e => { state.settings[k] = e.target.checked; saveSettings(); loadSettings(); }));
loadSettings();
if (window.TownArt) {
  document.body.insertAdjacentHTML('afterbegin', window.TownArt.defs());
  $('#title-art').innerHTML = window.TownArt.title();
}
dotsMain = buildDots($('#dots'));
paintDots(dotsMain, $('#dots'), MODEL.baseCases, MODEL.baseDeaths, false);
show('title');
})();
