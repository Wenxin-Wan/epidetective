/* The Lung Detective — an investigation game about the causes of lung cancer.
   Plain JavaScript, SVG scenes, DOM panels. Every fact carries its source.
   EpiDetective, 2026. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ------------------------------------------------------------------ sources */
const IARC_LIST = 'https://monographs.iarc.who.int/list-of-classifications';
const SRC = {
  who:      { t: 'WHO fact sheet, Lung cancer (2026): tobacco accounts for 60 to 70% of preventable cases worldwide, and for a larger share in Europe', u: 'https://www.who.int/news-room/fact-sheets/detail/lung-cancer' },
  m100e:    { t: 'IARC Monographs Vol. 100E (2012): tobacco smoking and second-hand tobacco smoke, Group 1', u: IARC_LIST },
  m83:      { t: 'IARC Monographs Vol. 83 (2004): people who never smoked but live with a smoker have a lung-cancer risk about 20 to 30% higher; exposure at work raises it by about 12 to 19%', u: IARC_LIST },
  darby:    { t: 'Darby et al., BMJ 2005;330:223: radon in homes raises lung-cancer risk by about 16% for every 100 Bq/m³ of long-term average concentration; the absolute risk is about 25 times higher in smokers than in never-smokers', u: 'https://doi.org/10.1136/bmj.38308.477650.63' },
  whoRadon: { t: 'WHO Handbook on Indoor Radon (2009): a reference level of 100 Bq/m³, and national reference levels that should not exceed 300; radon causes 3 to 14% of lung cancers depending on the country', u: 'https://www.who.int/publications/i/item/9789241547673' },
  peto:     { t: 'Peto et al., BMJ 2000;321:323: among UK men at 1990 rates, stopping at 60, 50, 40 or 30 lowered the risk of lung cancer by age 75 from about 16% to 10%, 6%, 3% and 2%', u: 'https://doi.org/10.1136/bmj.321.7257.323' },
  loomis:   { t: 'Loomis et al., Lancet Oncology 2013;14:1262: outdoor air pollution and its particulate matter, Group 1 (IARC Monographs Vol. 109)', u: 'https://doi.org/10.1016/S1470-2045(13)70487-X' },
  m105:     { t: 'IARC Monographs Vol. 105 (2014): diesel engine exhaust, Group 1', u: IARC_LIST },
  m95:      { t: 'IARC Monographs Vol. 95 (2010): indoor emissions from household coal burning, Group 1; from wood and other biomass, Group 2A; high-temperature frying emissions, Group 2A', u: IARC_LIST },
  m100c:    { t: 'IARC Monographs Vol. 100C (2012): asbestos (all forms) and crystalline silica dust, Group 1', u: IARC_LIST },
  m118:     { t: 'IARC Monographs Vol. 118 (2018): welding fumes, Group 1', u: IARC_LIST },
  m103:     { t: 'IARC Monographs Vol. 103 (2013): exposure to oxidized bitumens and their emissions during roofing, Group 2A', u: IARC_LIST },
  coffee:   { t: 'Loomis et al., Lancet Oncology 2016;17:877: the evidence on coffee drinking was inadequate, so it is not classifiable as to its carcinogenicity (Group 3)', u: 'https://doi.org/10.1016/S1470-2045(16)30239-X' },
  stress:   { t: 'Heikkilä et al., BMJ 2013;346:f165: among 116,000 European workers followed for 12 years, work stress (job strain) was not significantly associated with lung cancer', u: 'https://doi.org/10.1136/bmj.f165' },
  code:     { t: 'European Code Against Cancer, 5th edition (IARC / WHO)', u: 'https://cancer-code-europe.iarc.who.int/' },
  few:      { t: 'Inoue-Choi et al., JAMA Internal Medicine 2017;177:87: in a US cohort, people who smoked fewer than one cigarette a day had about nine times the lung-cancer death rate of never-smokers, and one to ten a day about twelve times', u: 'https://doi.org/10.1001/jamainternmed.2016.7511' },
  cutdown:  { t: 'Godtfredsen et al., JAMA 2005;294:1505: heavy smokers who halved their intake lowered their lung-cancer risk far less than those who stopped', u: 'https://doi.org/10.1001/jama.294.12.1505' },
  light:    { t: 'Harris et al., BMJ 2004;328:72: lung-cancer risk was no lower for smokers of very low-tar or low-tar cigarettes than for medium-tar', u: 'https://doi.org/10.1136/bmj.37936.585382.44' },
  whoEcig:  { t: 'WHO, Tobacco: E-cigarettes, questions and answers (2024): e-cigarettes are harmful and their long-term effects are not yet known', u: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-e-cigarettes' },
};
/* Official wording of the European Code Against Cancer, 5th edition. Not paraphrased. */
const CODE = {
  c1:  { n: 1,  h: 'Do not smoke', t: 'Do not smoke. Do not use any form of tobacco, or vaping products. If you smoke, you should quit.' },
  c2:  { n: 2,  h: 'Keep your home and car smoke-free', t: 'Keep your home and car free of tobacco smoke.' },
  c9:  { n: 9,  h: 'Protect yourself at work', t: 'Inform yourself about cancer-causing factors at work, and call on your employer to protect you against them. Always follow health and safety instructions at your workplace.' },
  c10: { n: 10, h: 'Check your radon exposure', t: 'Inform yourself about radon gas levels in your area by checking a local radon map. Seek professional help to measure levels in your home and, if necessary, reduce them.' },
  c11: { n: 11, h: 'Reduce air pollution exposure', t: 'Take action to reduce exposure to air pollution by: Using public transportation, and walking or cycling instead of using a car. Choosing low-traffic routes when walking, cycling, or exercising. Keeping your home free of smoke by not burning materials such as coal or wood. Supporting policies that improve air quality.' },
  c14: { n: 14, h: 'Take part in screening', t: 'Take part in organized cancer screening programmes, as recommended in your country, for: Bowel cancer. Breast cancer. Cervical cancer. Lung cancer.' },
};
const BINS = [
  { id: 'known',    label: 'Known cause',    sub: 'IARC Group 1: strong evidence in people' },
  { id: 'probable', label: 'Probable cause', sub: 'IARC Group 2A: probably causes cancer' },
  { id: 'none',     label: 'No evidence',    sub: 'Not shown to cause lung cancer' },
];

/* ------------------------------------------------------------------ clues */
const CLUES = {
  ashtray: { scene: 0, name: 'Ashtray on the coffee table', bin: 'known',
    desc: 'Cigarette ends, and the sofa smells of smoke. Somebody smokes in here most evenings, and everybody else in the flat breathes it.',
    why: 'Tobacco smoke is a known cause of lung cancer, and so is breathing other people’s smoke. Smoking causes most lung cancers: WHO puts tobacco’s share at 60 to 70% of preventable cases worldwide, and in Europe it is higher. People who never smoked but live with a smoker have a risk around a fifth to a third higher.',
    hint: 'This is the single best-established cause of lung cancer there is.',
    src: ['who', 'm100e', 'm83'], code: 'c2',
    fix: { label: 'Make the flat smoke-free', result: 'Smoking moves outside, windows open. The flat is smoke-free for everyone who lives here.' } },
  radon: { scene: 0, name: 'The basement', bin: 'known', special: 'radon',
    desc: 'A dry cellar under the flat, used as a bedroom. The building stands on granite. Radon, a natural radioactive gas, seeps up from the ground and can collect in rooms like this one. Place the detector to see.',
    why: 'Radon is a known cause of lung cancer, and in many countries the second most important one after smoking. Risk rises by about 16% for every 100 Bq/m³ of long-term average radon, and the absolute risk is about 25 times higher in smokers. WHO recommends a reference level of 100 Bq/m³ and says national reference levels should not exceed 300. This room read 340, above both.',
    hint: 'A radioactive gas from the ground. IARC has classified it since 1988.',
    src: ['darby', 'whoRadon'], code: 'c10',
    fix: { label: 'Seal the floor and ventilate', result: 'A sealed floor, a small fan under it, and the reading falls to 60 Bq/m³.' } },
  frying: { scene: 0, name: 'Pan on the stove, extractor off', bin: 'probable',
    desc: 'Oil smoking in a hot pan, the extractor hood switched off, the window shut. The kitchen fills with fumes every time someone cooks.',
    why: 'Emissions from frying at high temperature are a probable cause of lung cancer (IARC Group 2A). The evidence comes mostly from kitchens with poor ventilation. Using the extractor and opening a window keeps the fumes out of the air you breathe.',
    hint: 'IARC evaluated this in 2006 and published it in 2010: strong evidence, but short of certain.',
    src: ['m95'], code: null,
    fix: { label: 'Extractor on, window open', result: 'The fumes go outside instead of into the room.' } },
  coffee: { scene: 0, name: 'The coffee machine', bin: 'none',
    desc: 'A note on the machine, in the flatmate’s handwriting: “Coffee causes cancer, I read it online.”',
    why: 'IARC reviewed more than 1,000 studies in 2016 and found the evidence inadequate to say whether drinking coffee causes cancer. It is filed as Group 3 (“not classifiable”), which is a statement about the evidence rather than a finding of safety. What IARC did flag is very hot drinks, above 65°C, as a probable cause of cancer of the oesophagus, which is about temperature and has nothing to do with lungs.',
    hint: 'IARC reviewed this in 2016. Think about what they found.',
    src: ['coffee'], code: null, fix: null },
  bus: { scene: 1, name: 'Buses idling at the stop', bin: 'known',
    desc: 'The bus stop sits on the ring road. Two diesel buses idle at the kerb and the traffic never stops. A grey haze hangs over the pavement.',
    why: 'Outdoor air pollution, and the fine particles in it, are a known cause of lung cancer. Diesel engine exhaust is a known cause on its own. The relative risk is far smaller than for smoking, but nearly everyone in a city is exposed, so the number of cases adds up.',
    hint: 'IARC classified this in 2013, and diesel exhaust the year before.',
    src: ['loomis', 'm105'], code: 'c11',
    fix: { label: 'Idle-free stop, cleaner buses', result: 'Engines off at the stop and the route moved to low-emission buses. Less to breathe for everyone waiting.' } },
  terrace: { scene: 1, name: 'Smoke over the café terrace', bin: 'known',
    desc: 'A man smokes at the next table. Beside him, a family with two children finish their lunch in his smoke.',
    why: 'Second-hand smoke is a known cause of lung cancer. People who never smoked but live with a smoker have a risk about 20 to 30% higher, and exposure at work raises it by about 12 to 19%. Children are the ones least able to move away.',
    hint: 'Nobody at that table lit a cigarette, and it still counts.',
    src: ['m100e', 'm83'], code: 'c2',
    fix: { label: 'Smoke-free terrace', result: 'The café makes its terrace smoke-free. Smokers step onto the pavement; the family finishes lunch in clean air.' } },
  woodsmoke: { scene: 1, name: 'The wood stove in the corner house', bin: 'probable',
    desc: 'The house on the corner heats with a wood stove all winter. Smoke leaks into the living room every time the stove door opens, and rolls down the street from the chimney on still days.',
    why: 'Smoke from burning wood and other biomass inside the home is a probable cause of lung cancer (Group 2A); indoor smoke from burning coal is a known cause (Group 1). Outside, the same smoke joins outdoor air pollution, itself a known cause. The Code Against Cancer asks people to keep their homes free of smoke from burning coal or wood.',
    hint: 'IARC filed coal smoke and wood smoke differently. Which is this?',
    src: ['m95'], code: 'c11',
    fix: { label: 'Cleaner heating', result: 'The stove is replaced with a cleaner heater. No more smoke rolling down the street.' } },
  poster: { scene: 1, name: 'Poster: “Stress gives you cancer”', bin: 'none',
    desc: 'A poster for a relaxation app claims that stress causes cancer, lung cancer included.',
    why: 'When 116,000 European workers were followed for 12 years, those with the most stressful jobs were no more likely, within the study’s precision, to develop lung cancer than the rest. Stress is worth managing for many reasons, and there is no good evidence that it causes lung cancer.',
    hint: 'What happened when researchers actually followed stressed workers for years?',
    src: ['stress'], code: null, fix: null },
  silica: { scene: 2, name: 'Dry-cutting paving stones', bin: 'known',
    desc: 'A worker cuts paving stones with a dry saw. A cloud of fine dust drifts across the yard. No water, no extraction, no mask.',
    why: 'Fine crystalline silica dust, from cutting stone, concrete or brick, is a known cause of lung cancer. Wet cutting, dust extraction and a proper respirator keep it out of the lungs. In the EU, employers are legally required to control these exposures.',
    hint: 'The dust from stone, concrete and sand. IARC Group 1 since 1997.',
    src: ['m100c'], code: 'c9',
    fix: { label: 'Wet cutting, extraction, respirator', result: 'Water on the blade, a vacuum on the saw and a respirator on the worker. The cloud is gone.' } },
  asbestos: { scene: 2, name: 'Stripping an old corrugated roof', bin: 'known',
    desc: 'Grey corrugated sheets from the 1970s, being pulled off by hand. The sheets crack and shed fibres.',
    why: 'Asbestos, in every form, is a known cause of lung cancer and of mesothelioma. Old cement-asbestos roofing releases few fibres while intact and many when it is broken, cut or weathered. Removal is a job for licensed specialists with protective equipment.',
    hint: 'A mineral fibre that was in roofs, pipes and brakes for decades.',
    src: ['m100c'], code: 'c9',
    fix: { label: 'Stop work, licensed removal', result: 'The site stops. A licensed team removes the sheets sealed and wet, and nobody breathes the fibres.' } },
  welding: { scene: 2, name: 'Welding inside a closed shed', bin: 'known',
    desc: 'Sparks fly in a shed with the door shut. The welder wears a visor but the fumes have nowhere to go.',
    why: 'Welding fumes are a known cause of lung cancer (IARC, 2017), whatever the metal. Local exhaust ventilation at the torch and a respirator take most of the fume away.',
    hint: 'IARC upgraded welding fumes to Group 1 in 2017, published in 2018.',
    src: ['m118'], code: 'c9',
    fix: { label: 'Extraction hood and respirator', result: 'A fume extractor at the torch, the door open, a respirator under the visor.' } },
  bitumen: { scene: 2, name: 'Hot bitumen on the roof', bin: 'probable',
    desc: 'A kettle of bitumen boils for the flat roof. The roofers work in its fumes all afternoon.',
    why: 'Exposure to oxidized bitumen and its fumes during roofing is a probable cause of lung cancer (Group 2A). Keeping the kettle cooler, working upwind and using respirators reduces the exposure.',
    hint: 'IARC evaluated roofers’ exposure in 2011 and stopped one step short of certain.',
    src: ['m103'], code: 'c9',
    fix: { label: 'Cooler kettle, respirators', result: 'Temperature down, kettle moved downwind, respirators on. Far less fume reaches the roofers.' } },
};
const CLUE_ORDER = { 0: ['ashtray', 'radon', 'frying', 'coffee'], 1: ['bus', 'terrace', 'woodsmoke', 'poster'], 2: ['silica', 'asbestos', 'welding', 'bitumen'] };

/* ------------------------------------------------------------------ talks */
const TALKS = {
  flatmate: { scene: 0, who: 'Your flatmate', line: '“I only smoke a few a day, and I’m young. That’s fine, right?”',
    choices: [
      { t: 'Even a few a day carries a large risk. The earlier someone stops, the more of that risk is never taken on.', ok: true,
        fb: 'Right. In a US cohort, people who smoked fewer than one cigarette a day still had about nine times the lung-cancer death rate of never-smokers. Stopping before middle age avoids more than 90% of the extra risk that smoking would have caused. The Code Against Cancer puts it simply: if you smoke, you should quit.' },
      { t: 'It’s fine as long as you don’t inhale deeply.', ok: false,
        fb: 'There is no safe way to smoke. Smoke reaches the lungs whether or not you notice it.' },
      { t: 'Switch to “light” cigarettes, they’re safer.', ok: false,
        fb: '“Light” and “mild” cigarettes were never safer. Smokers inhale more deeply to get the same nicotine, and their lung-cancer risk is no lower.' },
    ], src: ['few', 'peto', 'light', 'code'], code: 'c1' },
  vapeshop: { scene: 1, who: 'The vape-shop owner', line: '“Vaping is harmless. It’s just flavoured water vapour.”',
    choices: [
      { t: 'It isn’t harmless. The aerosol contains toxic substances, the long-term risk is not yet known, and if you don’t smoke there is no reason to start vaping.', ok: true,
        fb: 'Right. The European Code Against Cancer asks people not to use any form of tobacco, or vaping products. Vaping is not water vapour, and its long-term effects on the lungs are still being studied.' },
      { t: 'Vaping is exactly as bad as smoking.', ok: false,
        fb: 'That overstates it. The aerosol generally carries fewer toxic substances than tobacco smoke, but it is still harmful, its long-term effects are unknown, and the Code asks people to use neither tobacco nor vaping products.' },
      { t: 'You’re right, it’s only vapour.', ok: false,
        fb: 'The aerosol is not water vapour. It carries nicotine, flavourings and other chemicals into the lungs.' },
    ], src: ['whoEcig', 'code'], code: 'c1' },
  foreman: { scene: 2, who: 'The foreman', line: '“I’ve smoked for 20 years. The damage is done, so there’s no point quitting now.”',
    choices: [
      { t: 'Quitting still avoids most of the risk. In a UK study, men who stopped at 50 lowered their risk of lung cancer by age 75 from about 16% to 6%.', ok: true,
        fb: 'Right. Peto and colleagues showed that former smokers had only a fraction of the lung-cancer rate of those who continued, and that the fraction fell the longer they had stopped. Men who stopped at 60 still lowered their risk by 75 from about 16% to 10%.' },
      { t: 'You’re right, the damage is done.', ok: false,
        fb: 'The opposite is true. The extra risk stops piling up as soon as someone stops, at any age, and the gap from those who keep smoking widens every year.' },
      { t: 'Just cut down to five a day.', ok: false,
        fb: 'Cutting down helps far less than stopping: heavy smokers who halved their intake lowered their risk only a little, while those who stopped lowered it a great deal. The Code Against Cancer is clear: if you smoke, you should quit.' },
    ], src: ['peto', 'cutdown', 'code'], code: 'c1' },
};
const TALK_ORDER = { 0: 'flatmate', 1: 'vapeshop', 2: 'foreman' };

/* ------------------------------------------------------------------ scenes */
const SCENES = [
  { name: 'The flat', intro: 'A shared flat on the second floor. Somebody here has a cough that will not go away. Find what is in the air.' },
  { name: 'The street', intro: 'The ring road, a café, a row of houses. Everybody breathes this street. Find what is in it.' },
  { name: 'The building yard', intro: 'A renovation site behind the houses. Work is where many lung cancers begin. Find what the workers are breathing.' },
];

/* ------------------------------------------------------------------ art layer
   Warm, layered flat-vector scenes. Everything below up to the end of ART is
   illustration only; the game logic never reads it. Palette matches the site:
   paper, ink, terracotta, ochre, teal, sage, dusty blue and warm greys. */
const P = {
  paper: '#F5F4F0', paperDeep: '#EBEAE3', chalk: '#FFFFFF', ink: '#161713', inkSoft: '#454740', inkFaint: '#6B6E65',
  terra: '#ba4c38', terraDeep: '#8F3A2A', ochre: '#d27a35', ochreLight: '#E8A96B', teal: '#315f5a', tealDeep: '#23443F', tealLight: '#5E8C86',
  sage: '#8EA092', sageDeep: '#5F7C58', sageLight: '#C9D3B8', blue: '#7E98A8', blueLight: '#B9CBD6', blueDeep: '#3E5C7A',
  grey: '#9A9A94', greyDark: '#5D5F5C', greyWarm: '#B9B0A0', greyLight: '#D6D5CE', slate: '#5F6A6E',
  wood: '#B48A5A', woodDeep: '#7C5F3E', woodLight: '#D6B98C', brick: '#C9967E', brickDeep: '#A9705A', plaster: '#E9DFCD',
  skin: '#EBC7A6', skin2: '#D1A07C', skin3: '#9C6A48', skin4: '#6E4630', hairDark: '#2B2622', hairBrown: '#6B4A32', hairBlond: '#D8B26E', hairGrey: '#B5B1A8', hairRed: '#A0522D',
  hiVis: '#F2C14E', hiVisO: '#F08A3E', denim: '#4B6078', metal: '#8C949A', metalDark: '#43494E', smoke: '#8C8F87', dust: '#DDD3BD',
};

/* Shared <defs>: gradients and filters. `p` prefixes the ids so that a scene never
   collides with the title illustration that lives in index.html. */
function defs(p, extra = '') {
  return `<defs>
    <linearGradient id="${p}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FB8C9"/><stop offset=".55" stop-color="#CDDBE1"/><stop offset="1" stop-color="#EFE7D8"/></linearGradient>
    <linearGradient id="${p}-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4DCCB"/><stop offset="1" stop-color="#F0E9DB"/></linearGradient>
    <linearGradient id="${p}-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9C9AA"/><stop offset="1" stop-color="#BFA986"/></linearGradient>
    <linearGradient id="${p}-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A6C68"/><stop offset="1" stop-color="#4E504C"/></linearGradient>
    <linearGradient id="${p}-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CDBFA2"/><stop offset="1" stop-color="#B09B78"/></linearGradient>
    <linearGradient id="${p}-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A9B0B5"/><stop offset=".5" stop-color="#7F878C"/><stop offset="1" stop-color="#9AA1A6"/></linearGradient>
    <linearGradient id="${p}-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#DCE9EE"/><stop offset=".5" stop-color="#B9CFD8"/><stop offset="1" stop-color="#CFE0E6"/></linearGradient>
    <radialGradient id="${p}-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF4D6" stop-opacity=".9"/><stop offset="1" stop-color="#FFF4D6" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-light" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-ember" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD27A"/><stop offset=".5" stop-color="#E8863A"/><stop offset="1" stop-color="#E8863A" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-arc" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".25" stop-color="#DDF3FF"/><stop offset="1" stop-color="#8AC6FF" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".6" stop-color="#FFFFFF" stop-opacity=".45"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <filter id="${p}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    <filter id="${p}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="${p}-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5"/></filter>
    <filter id="${p}-shadow" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="6" dy="8" stdDeviation="6" flood-color="#161713" flood-opacity=".18"/></filter>
    <filter id="${p}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    ${extra}
  </defs>`;
}
const grain = p => `<rect width="960" height="540" filter="url(#${p}-grain)" opacity=".06" style="mix-blend-mode:multiply" pointer-events="none"/>`;
const vignette = () => `<rect width="960" height="540" fill="none" stroke="#161713" stroke-width="60" opacity=".05" style="filter:blur(24px)" pointer-events="none"/>`;
const shadow = (cx, cy, rx, ry, op = .14) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#161713" opacity="${op}"/>`;
/* long soft directional shadow cast to the right of an object standing on the ground */
const castShadow = (x, y, w, len, op = .12) => `<path d="M${x} ${y} h${w} l${len} -${len * .22} h-${w * .9} z" fill="#161713" opacity="${op}"/>`;

/* Smoke: a static soft plume (visible even with animation off) plus rising puffs that
   only show while the animation runs. */
function smoke(x, y, o = {}) {
  const { n = 4, col = P.smoke, dx = 14, dy = -95, r = 8, dur = 5, op = .5, grow = 2.2, p = 's' } = o;
  let s = `<g class="plume" opacity=".75">`;
  for (let i = 0; i < 4; i++) {
    const t = (i + .6) / 4;
    s += `<ellipse cx="${(x + dx * t * t + (i % 2 ? 7 : -5)).toFixed(1)}" cy="${(y + dy * t * .75).toFixed(1)}" rx="${(r * (1 + t * 1.8)).toFixed(1)}" ry="${(r * (.8 + t * 1.3)).toFixed(1)}" fill="${col}" opacity="${(op * (1 - t) * .8).toFixed(2)}" filter="url(#${p}-soft)"/>`;
  }
  s += '</g>';
  for (let i = 0; i < n; i++) {
    s += `<circle class="puff" cx="${x + (i % 2 ? 5 : -4)}" cy="${y}" r="${r + i}" fill="${col}" opacity="0" style="--dx:${dx + (i % 2 ? 8 : -6)}px;--dy:${dy}px;--op:${op};--grow:${grow};animation-delay:${(-(dur * i) / n).toFixed(2)}s;animation-duration:${dur}s"/>`;
  }
  return s;
}
/* Thin curling wisps, for cigarettes and pans. */
function wisps(x, y, o = {}) {
  const { n = 3, col = P.smoke, h = 60, w = 2.2, gap = 8, op = .6 } = o;
  let s = '';
  for (let i = 0; i < n; i++) {
    const xi = x + i * gap - (n - 1) * gap / 2;
    s += `<path class="wisp" style="animation-delay:${(-i * 1.3).toFixed(1)}s" d="M${xi} ${y} c-9 -${h * .25} 9 -${h * .4} -1 -${h * .62} c-8 -${h * .2} 6 -${h * .3} 0 -${h * .5}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${(op - i * .14).toFixed(2)}"/>`;
  }
  return s;
}
/* Cloud of dust that breathes. */
function dustCloud(x, y, o = {}) {
  const { col = P.dust, s = 1, op = .85, p = 's' } = o;
  const blobs = [[0, 0, 34, 24], [36, -14, 30, 22], [66, -4, 26, 20], [22, 18, 30, 18], [56, 20, 24, 16], [90, 8, 20, 14], [-14, 14, 20, 14], [104, -8, 16, 12]];
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="dust" opacity="${op}">
    <g filter="url(#${p}-blur)">${blobs.map(([bx, by, rx, ry]) => `<ellipse cx="${bx + 3}" cy="${by + 4}" rx="${rx + 2}" ry="${ry + 2}" fill="#A99C84" opacity=".35"/>`).join('')}${blobs.map(([bx, by, rx, ry]) => `<ellipse cx="${bx}" cy="${by}" rx="${rx}" ry="${ry}" fill="${col}"/>`).join('')}</g>
    ${blobs.slice(0, 5).map(([bx, by, rx, ry]) => `<ellipse cx="${bx - 4}" cy="${by - 5}" rx="${rx * .55}" ry="${ry * .5}" fill="#FFFFFF" opacity=".35"/>`).join('')}
  </g></g>`;
}

/* ---- characters. All figures are drawn facing right in a local frame whose origin is
   the ground point between the feet; `f:-1` flips them. */
function head(cx, cy, o = {}) {
  const { r = 15, skin = P.skin, hair = P.hairDark, style = 'short', face = 'smile', f = 1, beard = null, glasses = false, hat = '', hatCol = P.hiVis, phones = false, blush = true } = o;
  const k = r / 15;
  let back = '', front = '';
  if (style === 'long') back += `<path d="M-17 -2 A17 17 0 0 1 17 -5 L19 28 Q0 34 -19 28 Z" fill="${hair}"/>`;
  if (style === 'bun') back += `<circle cx="-11" cy="-15" r="7" fill="${hair}"/>`;
  if (style === 'pony') back += `<path d="M-14 -6 q-14 10 -10 34 q4 4 8 0 q-4 -20 6 -28z" fill="${hair}"/>`;
  front += `<circle cx="-13" cy="1" r="4.2" fill="${skin}"/>`;
  front += `<circle cx="0" cy="0" r="15" fill="${skin}"/>`;
  if (style === 'short' || style === 'bun' || style === 'pony') front += `<path d="M-15.5 -1 A15.5 15.5 0 0 1 15 -5 Q12 -7 7 -9 Q-1 -12 -9 -8 Q-14 -5 -15.5 3 Z" fill="${hair}"/>`;
  if (style === 'bob') front += `<path d="M-16 -1 A16 16 0 0 1 16 -4 L16 8 Q14 12 11 10 L11 -3 Q4 -11 -5 -9 Q-11 -7 -11 2 L-11 10 Q-14 13 -16 10 Z" fill="${hair}"/>`;
  if (style === 'long') front += `<path d="M-16 -1 A16 16 0 0 1 16 -4 Q10 -9 2 -10 Q-8 -11 -13 -2 Z" fill="${hair}"/>`;
  if (style === 'curly') front += `<g fill="${hair}"><circle cx="-12" cy="-6" r="6"/><circle cx="-5" cy="-13" r="6.5"/><circle cx="4" cy="-14" r="6.5"/><circle cx="12" cy="-9" r="6"/><circle cx="-14" cy="3" r="4.5"/><path d="M-13 -4 A14 14 0 0 1 13 -6 Q6 -9 -2 -9 Q-9 -8 -13 0Z"/></g>`;
  if (style === 'bald') front += `<path d="M-15 -2 q-2 6 0 10 q3 -6 2 -10z M-15.5 -1 A15.5 15.5 0 0 1 -2 -14 Q-9 -11 -13 -3Z" fill="${hair}"/>`;
  if (style === 'grey') front += `<path d="M-15.5 -1 A15.5 15.5 0 0 1 15 -5 Q12 -7 7 -9 Q-1 -12 -9 -8 Q-14 -5 -15.5 3 Z" fill="${P.hairGrey}"/>`;
  if (style === 'cap') front += `<path d="M-15.5 -2 A15.5 15.5 0 0 1 15.5 -2 Z" fill="${hatCol}"/><path d="M6 -3 Q18 -4 26 0 Q18 3 6 2 Z" fill="${hatCol}"/><rect x="-16" y="-4" width="32" height="3" rx="1.5" fill="#161713" opacity=".18"/>`;
  if (style === 'beanie') front += `<path d="M-16 0 A16 16 0 0 1 16 0 Z" fill="${hatCol}"/><rect x="-16.5" y="-4" width="33" height="6" rx="2" fill="${hatCol}" style="filter:brightness(.85)"/>`;
  // eyes, brows, mouth (3/4 view: features sit toward the facing side)
  front += `<circle cx="2" cy="-1" r="1.8" fill="#161713"/><circle cx="9.5" cy="-1" r="1.8" fill="#161713"/>`;
  if (face === 'worried' || face === 'frown') front += `<path d="M-1 -6 l6 -1 M7 -7 l5 1" stroke="#161713" stroke-width="1.4" stroke-linecap="round"/>`;
  else front += `<path d="M-1 -6 l6 1 M7 -5 l5 -1" stroke="#161713" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`;
  if (face === 'smile') front += `<path d="M3 6 q4 3.5 8 0" fill="none" stroke="#161713" stroke-width="1.5" stroke-linecap="round"/>`;
  if (face === 'grin') front += `<path d="M2 5 q5 6 10 0z" fill="#161713"/>`;
  if (face === 'flat') front += `<path d="M4 7 h7" stroke="#161713" stroke-width="1.5" stroke-linecap="round"/>`;
  if (face === 'frown' || face === 'worried') front += `<path d="M3 8 q4 -3 8 0" fill="none" stroke="#161713" stroke-width="1.5" stroke-linecap="round"/>`;
  if (face === 'o') front += `<ellipse cx="8" cy="7" rx="2.2" ry="2.8" fill="#161713"/>`;
  if (face === 'cough') front += `<ellipse cx="9" cy="7" rx="2.6" ry="2.2" fill="#161713"/><path d="M0 -8 l7 -1 M7 -9 l5 2" stroke="#161713" stroke-width="1.4" stroke-linecap="round"/>`;
  if (blush) front += `<circle cx="-1" cy="4" r="2.6" fill="${P.terra}" opacity=".14"/><circle cx="12" cy="4" r="2.6" fill="${P.terra}" opacity=".14"/>`;
  if (beard) front += `<path d="M-9 5 Q-4 18 8 15 Q15 13 15.5 3 Q12 12 4 12 Q-4 12 -9 5Z" fill="${beard}"/>`;
  if (glasses) front += `<g fill="none" stroke="#161713" stroke-width="1.3"><circle cx="2" cy="-1" r="4.5"/><circle cx="10" cy="-1" r="4.5"/><path d="M6.5 -1 h-0.5 M-2.5 -2 l-10 -2"/></g>`;
  if (phones) front += `<path d="M-15 -4 A15 15 0 0 1 15 -6" fill="none" stroke="#161713" stroke-width="3"/><rect x="-19" y="-6" width="7" height="12" rx="3" fill="#161713"/><rect x="12" y="-8" width="7" height="12" rx="3" fill="#161713"/>`;
  if (hat === 'hard') front += `<path d="M-17 -4 A17 17 0 0 1 17 -4 Z" fill="${hatCol}"/><rect x="-19" y="-6" width="42" height="4.5" rx="2" fill="${hatCol}" style="filter:brightness(.88)"/><path d="M-6 -17 q6 -3 12 0" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity=".5"/>`;
  if (hat === 'fedora') front += `<path d="M-15 -6 Q-13 -20 0 -20 Q13 -20 15 -6 Z" fill="${hatCol}"/><path d="M-22 -6 Q0 -2 24 -8 Q0 -12 -22 -6Z" fill="${hatCol}" style="filter:brightness(.85)"/><rect x="-14" y="-10" width="28" height="3" fill="${P.terra}"/>`;
  if (hat === 'visor') front += `<path d="M-16 -18 H16 Q22 -18 22 -12 V14 Q22 20 16 20 H-16 Q-22 20 -22 14 V-12 Q-22 -18 -16 -18Z" fill="#2E3438"/><rect x="0" y="-6" width="18" height="10" rx="2" fill="#7FB2C9"/><rect x="2" y="-4" width="6" height="2" fill="#FFFFFF" opacity=".6"/>`;
  if (hat === 'earmuffs') front += `<path d="M-15 -4 A15 15 0 0 1 15 -6" fill="none" stroke="#F2C14E" stroke-width="3"/><rect x="-19" y="-5" width="7" height="13" rx="3" fill="#F2C14E"/><rect x="12" y="-7" width="7" height="13" rx="3" fill="#F2C14E"/>`;
  return `<g transform="translate(${cx} ${cy}) scale(${f * k} ${k})">${back}${front}</g>`;
}

/* Standing figure. Options: skin, hair, style, top, sleeve, bottom, shoes, vest, hat, hatCol,
   face, f (facing), s (scale), arms: down | crossed | clip | pockets | bucket | mop | bag | hips | wave | reach, lean (deg). */
function stand(x, y, o = {}) {
  const { skin = P.skin, hair = P.hairDark, style = 'short', top = P.teal, sleeve = top, bottom = P.denim, shoes = P.ink, vest = false, hat = '', hatCol = P.hiVis, face = 'smile', f = 1, s = 1, arms = 'down', lean = 0, beard = null, glasses = false, r = 15, apron = null, phones = false, sh = true } = o;
  let g = sh ? shadow(6, 0, 26, 6, .16) : '';
  // legs and shoes
  g += `<rect x="-13" y="-60" width="12" height="58" rx="5" fill="${bottom}" style="filter:brightness(.85)"/><rect x="1" y="-60" width="12" height="58" rx="5" fill="${bottom}"/>`;
  g += `<rect x="-15" y="-8" width="15" height="9" rx="4" fill="${shoes}"/><rect x="0" y="-8" width="18" height="9" rx="4" fill="${shoes}"/>`;
  let body = '';
  const torso = `M-18 -110 Q-18 -118 -10 -118 H10 Q18 -118 18 -110 L16 -56 H-16 Z`;
  // back arm
  const backArm = { down: `<rect x="-25" y="-114" width="11" height="50" rx="5.5" fill="${sleeve}" style="filter:brightness(.85)"/><circle cx="-19.5" cy="-64" r="5.5" fill="${skin}"/>`, reach: `<rect x="-16" y="-114" width="11" height="50" rx="5.5" fill="${sleeve}" style="filter:brightness(.85)" transform="rotate(-70 -12 -112)"/>` };
  body += backArm[arms === 'reach' ? 'reach' : 'down'];
  body += `<path d="${torso}" fill="${top}"/>`;
  if (vest) body += `<path d="${torso}" fill="${P.hiVis}"/><rect x="-6" y="-118" width="12" height="62" fill="${top}"/><rect x="-18" y="-92" width="36" height="6" fill="#DCDCD6"/><rect x="-18" y="-72" width="36" height="6" fill="#DCDCD6"/>`;
  if (apron) body += `<path d="M-13 -104 H13 V-58 H-13Z" fill="${apron}"/><path d="M-13 -104 q13 8 26 0" fill="none" stroke="${apron}" stroke-width="3"/>`;
  body += `<rect x="-5" y="-126" width="10" height="14" fill="${skin}"/>`;
  // front arm
  const front = {
    down: `<rect x="14" y="-114" width="11" height="50" rx="5.5" fill="${sleeve}"/><circle cx="19.5" cy="-64" r="5.5" fill="${skin}"/>`,
    pockets: `<rect x="14" y="-114" width="11" height="36" rx="5.5" fill="${sleeve}"/>`,
    crossed: `<rect x="-18" y="-96" width="36" height="12" rx="6" fill="${sleeve}"/><circle cx="-14" cy="-90" r="5" fill="${skin}"/><rect x="14" y="-114" width="11" height="24" rx="5.5" fill="${sleeve}"/>`,
    hips: `<path d="M20 -110 l10 20 l-10 22" fill="none" stroke="${sleeve}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18" cy="-68" r="5" fill="${skin}"/>`,
    clip: `<rect x="14" y="-114" width="11" height="30" rx="5.5" fill="${sleeve}"/><rect x="-4" y="-92" width="32" height="10" rx="5" fill="${sleeve}"/><g transform="rotate(-8 6 -100)"><rect x="-6" y="-116" width="24" height="32" rx="2" fill="#F5F4F0" stroke="#B9B0A0"/><rect x="0" y="-119" width="12" height="6" rx="2" fill="#43494E"/><path d="M-1 -106 h14 M-1 -100 h14 M-1 -94 h10" stroke="#B9B0A0" stroke-width="1.5"/></g><circle cx="24" cy="-88" r="5" fill="${skin}"/>`,
    bucket: `<rect x="14" y="-114" width="11" height="54" rx="5.5" fill="${sleeve}"/><circle cx="19.5" cy="-60" r="5.5" fill="${skin}"/><path d="M12 -56 q8 -10 16 0" fill="none" stroke="#43494E" stroke-width="2"/><path d="M8 -50 h24 l-3 26 h-18z" fill="#43494E"/><ellipse cx="20" cy="-50" rx="12" ry="3" fill="#2B2B28"/>`,
    mop: `<rect x="14" y="-114" width="11" height="40" rx="5.5" fill="${sleeve}"/><circle cx="19.5" cy="-74" r="5.5" fill="${skin}"/><rect x="24" y="-150" width="4" height="150" rx="2" fill="${P.woodDeep}"/><rect x="18" y="-4" width="16" height="6" rx="2" fill="#2B2B28"/>`,
    bag: `<rect x="14" y="-114" width="11" height="50" rx="5.5" fill="${sleeve}"/><circle cx="19.5" cy="-64" r="5.5" fill="${skin}"/><path d="M-4 -112 l22 0" stroke="${P.terra}" stroke-width="3"/><rect x="-22" y="-74" width="26" height="22" rx="4" fill="${P.terra}"/>`,
    wave: `<path d="M18 -110 l12 -8 l4 -22" fill="none" stroke="${sleeve}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><circle cx="35" cy="-142" r="5.5" fill="${skin}"/>`,
    reach: `<rect x="14" y="-114" width="11" height="50" rx="5.5" fill="${sleeve}" transform="rotate(-75 19 -112)"/><circle cx="19" cy="-64" r="5.5" fill="${skin}" transform="rotate(-75 19 -112)"/>`,
    phone: `<rect x="14" y="-114" width="11" height="28" rx="5.5" fill="${sleeve}"/><rect x="10" y="-96" width="12" height="28" rx="5.5" fill="${sleeve}" transform="rotate(35 16 -92)"/><circle cx="26" cy="-116" r="5.5" fill="${skin}"/><rect x="20" y="-127" width="11" height="20" rx="2" fill="#2B2B28"/>`,
  };
  body += front[arms] || front.down;
  body += head(0, -132, { r, skin, hair, style, face, f: 1, beard, glasses, hat, hatCol, phones });
  g += lean ? `<g transform="translate(0 -58) rotate(${lean}) translate(0 58)">${body}</g>` : body;
  return `<g transform="translate(${x} ${y}) scale(${f * s} ${s})">${g}</g>`;
}

/* Seated figure in profile; the origin is on the ground under the hips, `seat` is the seat height.
   arms: lap | table | cig | cup | phone | crossed | spoon */
function sit(x, y, o = {}) {
  const { skin = P.skin, hair = P.hairDark, style = 'short', top = P.teal, sleeve = top, bottom = P.denim, shoes = P.ink, face = 'smile', f = 1, s = 1, arms = 'lap', seat = 46, r = 15, beard = null, glasses = false, hat = '', hatCol = P.hiVis, sh = true } = o;
  const h = -seat;
  let g = sh ? shadow(16, 0, 16, 4, .14) : '';
  g += `<rect x="8" y="${h - 4}" width="12" height="${seat + 4}" rx="5" fill="${bottom}" style="filter:brightness(.85)"/><rect x="17" y="${h - 2}" width="12" height="${seat + 2}" rx="5" fill="${bottom}"/>`;
  g += `<rect x="12" y="-8" width="16" height="8" rx="3" fill="${shoes}" style="filter:brightness(.85)"/><rect x="18" y="-8" width="18" height="9" rx="4" fill="${shoes}"/>`;
  g += `<rect x="-14" y="${h - 14}" width="42" height="16" rx="7" fill="${bottom}"/>`;
  const sy = h - 14; // hips top
  const torso = `M-17 ${sy - 48} Q-17 ${sy - 56} -9 ${sy - 56} H10 Q18 ${sy - 56} 18 ${sy - 48} L17 ${sy + 2} H-15 Z`;
  g += `<rect x="-22" y="${sy - 52}" width="11" height="40" rx="5.5" fill="${sleeve}" style="filter:brightness(.85)"/>`;
  g += `<path d="${torso}" fill="${top}"/><rect x="-4" y="${sy - 66}" width="10" height="16" fill="${skin}"/>`;
  const shoulder = sy - 50;
  const front = {
    lap: `<rect x="12" y="${shoulder}" width="11" height="30" rx="5.5" fill="${sleeve}"/><rect x="10" y="${shoulder + 24}" width="26" height="10" rx="5" fill="${sleeve}"/><circle cx="36" cy="${shoulder + 29}" r="5.5" fill="${skin}"/>`,
    table: `<rect x="12" y="${shoulder}" width="11" height="24" rx="5.5" fill="${sleeve}"/><rect x="12" y="${shoulder + 16}" width="30" height="10" rx="5" fill="${sleeve}"/><circle cx="42" cy="${shoulder + 21}" r="5.5" fill="${skin}"/>`,
    cig: `<rect x="12" y="${shoulder}" width="11" height="28" rx="5.5" fill="${sleeve}"/><rect x="15" y="${shoulder - 12}" width="10" height="38" rx="5" fill="${sleeve}"/><circle cx="20" cy="${shoulder - 14}" r="5.5" fill="${skin}"/><g transform="rotate(35 22 ${shoulder - 18})"><rect x="20.5" y="${shoulder - 36}" width="3.2" height="20" rx="1.2" fill="#F5F4F0"/><rect x="20.5" y="${shoulder - 36}" width="3.2" height="4" fill="#E1502E"/></g>`,
    cup: `<rect x="12" y="${shoulder}" width="11" height="22" rx="5.5" fill="${sleeve}"/><rect x="12" y="${shoulder + 14}" width="26" height="10" rx="5" fill="${sleeve}"/><circle cx="38" cy="${shoulder + 19}" r="5.5" fill="${skin}"/><path d="M34 ${shoulder + 12} h14 l-2 12 h-10z" fill="#F5F4F0" stroke="#B9B0A0"/>`,
    phone: `<rect x="12" y="${shoulder}" width="11" height="22" rx="5.5" fill="${sleeve}"/><rect x="14" y="${shoulder + 6}" width="30" height="10" rx="5" fill="${sleeve}" transform="rotate(-40 16 ${shoulder + 12})"/><circle cx="36" cy="${shoulder - 6}" r="5.5" fill="${skin}"/><rect x="30" y="${shoulder - 26}" width="12" height="22" rx="2" fill="#2B2B28" transform="rotate(-12 36 ${shoulder - 15})"/><rect x="32" y="${shoulder - 24}" width="8" height="16" rx="1" fill="#7FB2C9" opacity=".6" transform="rotate(-12 36 ${shoulder - 15})"/>`,
    crossed: `<rect x="-14" y="${shoulder + 16}" width="32" height="11" rx="5.5" fill="${sleeve}"/><rect x="12" y="${shoulder}" width="11" height="22" rx="5.5" fill="${sleeve}"/><circle cx="-12" cy="${shoulder + 21}" r="5" fill="${skin}"/>`,
    spoon: `<rect x="12" y="${shoulder}" width="11" height="22" rx="5.5" fill="${sleeve}"/><rect x="12" y="${shoulder + 14}" width="24" height="10" rx="5" fill="${sleeve}"/><circle cx="36" cy="${shoulder + 19}" r="5.5" fill="${skin}"/><path d="M38 ${shoulder + 16} l6 -14" stroke="#B9B0A0" stroke-width="2.5" stroke-linecap="round"/>`,
  };
  g += front[arms] || front.lap;
  g += head(0, sy - 70, { r, skin, hair, style, face, f: 1, beard, glasses, hat, hatCol });
  return `<g transform="translate(${x} ${y}) scale(${f * s} ${s})">${g}</g>`;
}

/* Kneeling figure (profile), origin at the knee on the surface. arms 'pull' reaches down-forward. */
function kneel(x, y, o = {}) {
  const { skin = P.skin2, hair = P.hairDark, style = 'short', top = P.sageDeep, sleeve = top, bottom = P.denim, shoes = P.ink, hat = 'hard', hatCol = '#FFFFFF', face = 'flat', f = 1, s = 1, vest = false } = o;
  let g = shadow(8, 2, 28, 5, .16);
  g += `<rect x="-30" y="-10" width="36" height="11" rx="5" fill="${bottom}"/><rect x="-36" y="-9" width="12" height="10" rx="4" fill="${shoes}"/>`;
  g += `<rect x="-8" y="-46" width="15" height="40" rx="6" fill="${bottom}" style="filter:brightness(1.05)"/>`;
  const torso = `M-14 -96 Q-14 -104 -6 -104 H10 Q18 -104 18 -96 L16 -44 H-14 Z`;
  let body = `<rect x="-22" y="-100" width="11" height="46" rx="5.5" fill="${sleeve}" style="filter:brightness(.85)" transform="rotate(-55 -16 -98)"/>`;
  body += `<path d="${torso}" fill="${top}"/>`;
  if (vest) body += `<path d="${torso}" fill="${P.hiVis}"/><rect x="-3" y="-104" width="10" height="60" fill="${top}"/><rect x="-14" y="-80" width="32" height="5" fill="#DCDCD6"/>`;
  body += `<rect x="-3" y="-112" width="10" height="14" fill="${skin}"/>`;
  body += `<rect x="14" y="-100" width="11" height="52" rx="5.5" fill="${sleeve}" transform="rotate(-60 19 -98)"/><circle cx="19" cy="-48" r="5.5" fill="${skin}" transform="rotate(-60 19 -98)"/>`;
  body += head(2, -118, { skin, hair, style, face, hat, hatCol });
  g += `<g transform="translate(0 -44) rotate(28) translate(0 44)">${body}</g>`;
  return `<g transform="translate(${x} ${y}) scale(${f * s} ${s})">${g}</g>`;
}

/* Crouching welder facing right, origin at the ground under the hips. The arc sits at about (58,-38). */
function welder(x, y, o = {}) {
  const { skin = P.skin3, top = '#6F6A62', bottom = '#4A4A46', f = 1, s = 1 } = o;
  let g = shadow(14, 0, 30, 6, .3);
  g += `<rect x="-6" y="-46" width="40" height="15" rx="7" fill="${bottom}"/><rect x="22" y="-44" width="13" height="44" rx="5" fill="${bottom}" style="filter:brightness(.9)"/><rect x="18" y="-8" width="22" height="9" rx="4" fill="#2B2B28"/>`;
  g += `<g transform="translate(0 -44) rotate(18) translate(0 44)"><path d="M-18 -100 Q-18 -108 -10 -108 H12 Q20 -108 20 -100 L18 -44 H-16Z" fill="${top}"/><path d="M-16 -100 h34 v22 h-34z" fill="#8A8479"/><rect x="-4" y="-116" width="10" height="14" fill="${skin}"/>
    <rect x="-14" y="-96" width="48" height="11" rx="5.5" fill="${top}" style="filter:brightness(.8)" transform="rotate(22 -10 -92)"/>
    <rect x="12" y="-98" width="46" height="11" rx="5.5" fill="${top}" transform="rotate(22 14 -94)"/><circle cx="54" cy="-76" r="6" fill="#6B4A32"/>
    <g transform="translate(56 -74) rotate(40)"><rect x="-5" y="-6" width="10" height="20" rx="3" fill="#43494E"/><rect x="-2.5" y="12" width="5" height="18" fill="#B9B0A0"/><rect x="-1.5" y="28" width="3" height="10" fill="#7A7A74"/></g>
    ${head(2, -122, { skin, hat: 'visor' })}</g>`;
  return `<g transform="translate(${x} ${y}) scale(${f * s} ${s})">${g}</g>`;
}

/* Hotspot: keeps the contract the logic relies on (.hot > .halo, art, .ring, .badge)
   and adds a hover/focus tooltip (.tip) plus a second, static ring. */
function hot(id, cx, cy, r, inner, label) {
  const short = label.replace(/^Inspect:\s*/i, '').replace(/^\w/, c => c.toUpperCase());
  const w = Math.round(short.length * 6.9 + 22);
  const above = cy - r - 34 > 8;
  const ty = above ? cy - r - 30 : cy + r + 20;
  const tx = Math.max(w / 2 + 6, Math.min(960 - w / 2 - 6, cx));
  return `<g class="hot" data-id="${id}" tabindex="0" role="button" aria-label="${esc(label)}">
    <circle class="halo" cx="${cx}" cy="${cy}" r="${r + 26}" fill="url(#halo)"/>${inner}
    <circle class="ring2" cx="${cx}" cy="${cy}" r="${r}"/>
    <circle class="ring" cx="${cx}" cy="${cy}" r="${r}"/>
    <g class="tip" transform="translate(${tx} ${ty})"><path d="M-5 ${above ? 10 : -10} l5 ${above ? 6 : -6} l5 ${above ? -6 : 6}z" fill="#161713"/><rect x="${-w / 2}" y="-10" width="${w}" height="20" rx="10" fill="#161713"/><text x="0" y="4" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="11" letter-spacing=".08em" fill="#F5F4F0">${esc(short.toUpperCase())}</text></g>
    <g class="badge" transform="translate(${cx + r * .7} ${cy - r * .7})"><g class="badge-in"><rect x="-6" y="-11" width="58" height="22" rx="11" fill="#161713"/><circle cx="6" cy="0" r="7" fill="#F5F4F0"/><path d="M2 0 l3 3 l5 -6" fill="none" stroke="#161713" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="17" y="4" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="10" letter-spacing=".1em" fill="#F5F4F0">FILED</text></g></g>
  </g>`;
}
function label(x, y, text, cls = 'txt small') { return `<text class="${cls}" x="${x}" y="${y}">${esc(text)}</text>`; }
/* speech mark above a person you can talk to */
const talkMark = (x, y) => `<g class="talk"><path d="M${x - 16} ${y - 12} h32 a6 6 0 0 1 6 6 v14 a6 6 0 0 1 -6 6 h-18 l-8 8 v-8 h-6 a6 6 0 0 1 -6 -6 v-14 a6 6 0 0 1 6 -6z" fill="#F5F4F0" stroke="#161713" stroke-width="1.6"/><g fill="#161713"><circle cx="${x - 8}" cy="${y + 1}" r="2"/><circle cx="${x}" cy="${y + 1}" r="2"/><circle cx="${x + 8}" cy="${y + 1}" r="2"/></g></g>`;
/* legacy names kept for readability of the scenes */
function person(x, y, col, scale = 1) { return stand(x, y, { top: col, s: scale }); }
function child(x, y, col) { return stand(x, y, { top: col, s: .62, r: 18 }); }

/* ---- scene 0: the flat. Light comes from the window on the left. */
function sceneFlat() {
  const p = 'f';
  const boards = Array.from({ length: 22 }, (_, i) => { const x = -240 + i * 72; return `<path d="M${x} 540 L${(480 + (x - 480) * .58).toFixed(0)} 402" stroke="#8F7A58" stroke-width="1.2" opacity=".28"/>`; }).join('');
  const boardTicks = [[60, 470], [300, 445], [520, 500], [760, 460], [900, 512], [200, 520], [660, 425]].map(([x, y]) => `<path d="M${x} ${y} h34" stroke="#8F7A58" stroke-width="1.2" opacity=".28"/>`).join('');
  const tiles = Array.from({ length: 9 }, (_, i) => `<path d="M745 ${204 + i * 12} H960" stroke="#FFFFFF" stroke-width="1" opacity=".55"/>`).join('') + Array.from({ length: 9 }, (_, i) => `<path d="M${758 + i * 26} 196 V300" stroke="#FFFFFF" stroke-width="1" opacity=".55"/>`).join('');
  const rugStripes = [0, 1, 2, 3].map(i => `<path d="M${348 + i * 4} ${436 + i * 18} L${606 + i * 6} ${436 + i * 18}" stroke="#F1DCC9" stroke-width="${i % 2 ? 2 : 4}" opacity=".7"/>`).join('');
  return `<svg viewBox="0 0 960 540" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A flat: a living room with a sofa, a coffee table with an ashtray, a basement door, and a kitchen corner with a smoking pan and a coffee machine">
    ${defs(p, `<radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".6" stop-color="#FFFFFF" stop-opacity=".45"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>`)}
    <!-- background: wall, rail, floor -->
    <rect width="960" height="402" fill="url(#${p}-wall)"/>
    <rect x="0" y="0" width="520" height="402" fill="url(#${p}-light)" opacity=".5"/>
    <path d="M0 92 H960" stroke="#D5CBB9" stroke-width="3"/>
    <rect y="402" width="960" height="138" fill="url(#${p}-floor)"/>
    ${boards}${boardTicks}
    <path d="M110 402 H300 L470 540 H20 Z" fill="#FFFFFF" opacity=".16"/>
    <rect y="392" width="960" height="12" fill="#EDE6D8"/><path d="M0 404 H960" stroke="#161713" stroke-width="3" opacity=".12"/>
    <!-- rug -->
    <path d="M336 416 H616 L660 522 H290 Z" fill="#C48B72"/><path d="M350 428 H602 L636 510 H314 Z" fill="none" stroke="#F1DCC9" stroke-width="3" opacity=".7"/>${rugStripes}
    <!-- window with curtains and a view -->
    <rect x="30" y="44" width="292" height="6" rx="3" fill="${P.woodDeep}"/><circle cx="30" cy="47" r="5" fill="${P.woodDeep}"/><circle cx="322" cy="47" r="5" fill="${P.woodDeep}"/>
    <rect x="56" y="56" width="238" height="198" rx="4" fill="#F3EFE6" filter="url(#${p}-shadow)"/>
    <rect x="72" y="72" width="206" height="166" fill="url(#${p}-sky)"/>
    <g opacity=".9"><path d="M72 190 l30 -22 l24 12 l30 -30 l26 14 l32 -20 l38 24 l26 -10 v80 H72z" fill="#AFC2CB"/><path d="M72 208 l40 -14 l36 10 l44 -18 l40 14 l46 -10 v48 H72z" fill="#93A9B4"/><g fill="#F5F4F0" opacity=".6"><rect x="110" y="182" width="6" height="8"/><rect x="150" y="176" width="6" height="8"/><rect x="200" y="182" width="6" height="8"/><rect x="238" y="192" width="6" height="8"/></g></g>
    <circle cx="228" cy="104" r="14" fill="#FFF4D6" opacity=".9"/><ellipse cx="120" cy="100" rx="26" ry="9" fill="#FFFFFF" opacity=".7"/><ellipse cx="140" cy="106" rx="18" ry="7" fill="#FFFFFF" opacity=".7"/>
    <path d="M100 238 q6 -50 22 -66 q10 40 0 66z" fill="#5F7C58" opacity=".85"/><path d="M92 238 q0 -30 14 -46 q6 26 0 46z" fill="#7A9A72" opacity=".9"/>
    <rect x="172" y="72" width="6" height="166" fill="#F3EFE6"/><rect x="72" y="152" width="206" height="6" fill="#F3EFE6"/>
    <rect x="170" y="150" width="10" height="16" rx="2" fill="#B9B0A0"/><rect x="176" y="154" width="14" height="4" rx="2" fill="#8C8F87"/>
    <rect x="48" y="252" width="254" height="12" rx="2" fill="#F3EFE6"/><path d="M48 264 H302" stroke="#161713" stroke-width="4" opacity=".1"/>
    <g class="curtain"><path d="M40 50 h50 v250 q-14 6 -28 0 q-12 6 -22 0 z" fill="#93A9B7"/><path d="M52 52 v246 M66 52 v246 M80 52 v246" stroke="#7E98A8" stroke-width="3" opacity=".6"/></g>
    <path d="M262 50 h50 v250 q-10 6 -22 0 q-14 6 -28 0 z" fill="#93A9B7"/><path d="M274 52 v246 M288 52 v246 M302 52 v246" stroke="#7E98A8" stroke-width="3" opacity=".6"/>
    <path d="M232 252 l3 -30 h24 l3 30z" fill="${P.terra}"/><path d="M228 222 h40" stroke="${P.terraDeep}" stroke-width="4"/><path d="M247 222 q-18 -10 -20 -34 q18 6 20 34z M247 222 q16 -14 24 -30 q-4 24 -24 30z M247 222 q-2 -22 6 -38 q8 20 -6 38z" fill="${P.sageDeep}"/>
    <!-- pictures and clock -->
    <g filter="url(#${p}-shadow)"><rect x="398" y="116" width="86" height="72" rx="2" fill="${P.woodDeep}"/><rect x="406" y="124" width="70" height="56" fill="#DCE6EA"/><path d="M406 166 l18 -14 l14 8 l20 -18 l18 12 v26 H406z" fill="${P.teal}"/><circle cx="458" cy="140" r="6" fill="#F2C14E"/></g>
    <g filter="url(#${p}-shadow)"><rect x="498" y="134" width="46" height="54" rx="2" fill="#F3EFE6" stroke="#B9B0A0"/><path d="M506 180 q15 -32 30 -8" fill="none" stroke="${P.terra}" stroke-width="3"/><circle cx="520" cy="152" r="5" fill="${P.ochre}"/></g>
    <g filter="url(#${p}-shadow)"><circle cx="677" cy="132" r="22" fill="#F5F4F0" stroke="#161713" stroke-width="2.5"/><path d="M677 132 v-14 M677 132 l10 6" stroke="#161713" stroke-width="2.5" stroke-linecap="round"/><circle cx="677" cy="132" r="2" fill="${P.terra}"/></g>
    <!-- sofa with the flatmate -->
    ${shadow(190, 408, 160, 9, .18)}
    <rect x="52" y="288" width="266" height="70" rx="14" fill="#557A72"/>
    <rect x="66" y="296" width="120" height="48" rx="10" fill="#4C6E67"/><rect x="190" y="296" width="116" height="48" rx="10" fill="#4C6E67"/>
    <g transform="rotate(-8 100 322)"><rect x="72" y="298" width="52" height="46" rx="8" fill="${P.ochre}"/><rect x="80" y="306" width="36" height="30" rx="5" fill="none" stroke="#F2C14E" stroke-width="2" opacity=".6"/></g>
    <rect x="132" y="304" width="46" height="40" rx="8" fill="#EDE6D8"/><path d="M140 314 h30 M140 324 h30 M140 334 h30" stroke="${P.terra}" stroke-width="2" opacity=".5"/>
    <rect x="40" y="364" width="290" height="36" rx="8" fill="#456660"/>
    <rect x="56" y="336" width="126" height="34" rx="9" fill="#6A8F86"/><rect x="188" y="336" width="124" height="34" rx="9" fill="#6A8F86"/>
    <rect x="34" y="316" width="30" height="84" rx="13" fill="#557A72"/><rect x="306" y="316" width="30" height="84" rx="13" fill="#557A72"/>
    <path d="M306 318 q20 -8 30 10 v40 q-16 -4 -30 6z" fill="${P.terra}"/><path d="M312 330 h20 M312 344 h20 M312 358 h18" stroke="#F1DCC9" stroke-width="2" opacity=".6"/>
    <rect x="48" y="398" width="12" height="10" rx="2" fill="#2B2B28"/><rect x="310" y="398" width="12" height="10" rx="2" fill="#2B2B28"/>
    <g><ellipse cx="50" cy="308" rx="16" ry="10" fill="#8C8F87"/><circle cx="36" cy="298" r="8" fill="#8C8F87"/><path d="M30 292 l-1 -8 l6 5z M38 291 l3 -8 l3 8z" fill="#8C8F87"/><path d="M64 306 q14 -4 12 -18" fill="none" stroke="#8C8F87" stroke-width="4" stroke-linecap="round"/><circle cx="33" cy="297" r="1.2" fill="#161713"/><circle cx="39" cy="297" r="1.2" fill="#161713"/></g>
    ${hot('flatmate', 216, 316, 52, `${sit(200, 396, { seat: 56, arms: 'phone', style: 'bun', top: '#A995C6', bottom: '#5E6E82', shoes: '#F5F4F0', face: 'smile', skin: P.skin2, phones: false })}${talkMark(216, 232)}`, 'Talk to your flatmate')}
    <!-- coffee table with the ashtray (closer to the viewer, on the rug) -->
    <g transform="translate(0 46)">
    ${shadow(470, 404, 118, 7, .18)}
    <rect x="372" y="374" width="10" height="30" fill="${P.woodDeep}"/><rect x="558" y="374" width="10" height="30" fill="${P.woodDeep}"/>
    <rect x="356" y="356" width="228" height="20" rx="8" fill="${P.wood}"/><path d="M356 372 h228" stroke="${P.woodDeep}" stroke-width="4" opacity=".7"/>
    <g transform="rotate(-6 400 352)"><rect x="378" y="342" width="48" height="16" rx="2" fill="#F5F4F0" stroke="#B9B0A0"/><rect x="384" y="346" width="18" height="8" fill="${P.teal}"/><path d="M406 348 h14 M406 352 h12" stroke="#B9B0A0" stroke-width="1.5"/></g>
    <rect x="520" y="336" width="22" height="22" rx="4" fill="#F5F4F0" stroke="#B9B0A0"/><path d="M542 342 q10 3 0 12" fill="none" stroke="#B9B0A0" stroke-width="3"/><ellipse cx="531" cy="338" rx="8" ry="2.5" fill="#6B4A32"/>
    <rect x="490" y="348" width="9" height="16" rx="2" fill="${P.terra}" transform="rotate(20 494 356)"/>
    ${hot('ashtray', 446, 344, 34, `<ellipse cx="446" cy="352" rx="30" ry="10" fill="#4E4E4A"/><ellipse cx="446" cy="348" rx="24" ry="7" fill="#8C8F87"/><ellipse cx="446" cy="348" rx="14" ry="4" fill="#5D5F5C"/><g fill="#F5F4F0"><rect x="428" y="342" width="12" height="3" rx="1" transform="rotate(-30 434 343)"/><rect x="440" y="340" width="10" height="3" rx="1" transform="rotate(20 445 341)"/><rect x="452" y="346" width="9" height="3" rx="1" transform="rotate(-70 456 347)"/></g><g transform="rotate(-22 470 343)"><rect x="458" y="341" width="30" height="4.5" rx="2" fill="#F5F4F0"/><rect x="458" y="341" width="7" height="4.5" rx="2" fill="#D9A35B"/><rect x="484" y="341" width="4" height="4.5" fill="#E1502E"/></g>${wisps(486, 330, { n: 3, h: 70, col: '#9A9A94', gap: 7 })}`, 'Inspect: ashtray on the coffee table')}
    </g>
    <!-- books and mug by the sofa -->
    <g transform="translate(70 500)">${shadow(30, 34, 34, 5, .14)}<rect x="0" y="18" width="56" height="10" rx="2" fill="${P.teal}"/><rect x="6" y="8" width="48" height="10" rx="2" fill="${P.ochre}"/><rect x="2" y="-2" width="50" height="10" rx="2" fill="#F5F4F0" stroke="#B9B0A0"/><rect x="66" y="8" width="18" height="20" rx="3" fill="#F5F4F0" stroke="#B9B0A0"/><path d="M84 12 q8 4 0 12" fill="none" stroke="#B9B0A0" stroke-width="2.5"/></g>
    <!-- floor lamp -->
    <ellipse cx="604" cy="404" rx="20" ry="5" fill="#2B2B28"/><rect x="601" y="212" width="6" height="192" fill="#2B2B28"/><path d="M566 216 L580 176 H628 L642 216 Z" fill="${P.ochre}"/><path d="M566 216 H642" stroke="${P.terraDeep}" stroke-width="3"/>
    <!-- basement door -->
    <rect x="620" y="174" width="114" height="230" rx="3" fill="#EDE6D8"/><path d="M620 404 H734" stroke="#161713" stroke-width="2" opacity=".2"/>
    <rect x="630" y="184" width="94" height="220" fill="#4E6B63"/><rect x="630" y="184" width="94" height="220" fill="url(#${p}-light)" opacity=".25"/>
    <rect x="642" y="200" width="70" height="78" rx="2" fill="none" stroke="#3B544D" stroke-width="3"/><rect x="642" y="296" width="70" height="92" rx="2" fill="none" stroke="#3B544D" stroke-width="3"/>
    <text x="677" y="232" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="12" font-weight="700" letter-spacing="2" fill="#F5F4F0" opacity=".9">BASEMENT</text><path d="M677 240 v18 m-5 -6 l5 6 l5 -6" fill="none" stroke="#F5F4F0" stroke-width="2" stroke-linecap="round" opacity=".9"/>
    <circle cx="710" cy="306" r="5" fill="#D9A35B"/><rect x="706" y="316" width="8" height="10" rx="2" fill="#2B2B28"/>
    <rect x="630" y="398" width="94" height="6" fill="#161713" opacity=".6"/>
    ${hot('radon', 677, 300, 50, `<g class="radon">${wisps(660, 398, { n: 2, h: 90, col: '#9A8FBF', gap: 10, w: 2.4, op: .55 })}${wisps(700, 398, { n: 2, h: 72, col: '#9A8FBF', gap: 10, w: 2.4, op: .55 })}<ellipse cx="677" cy="396" rx="40" ry="8" fill="#9A8FBF" opacity=".3" filter="url(#${p}-soft)"/></g>`, 'Inspect: the basement door')}
    <!-- kitchen corner -->
    <rect x="745" y="196" width="215" height="104" fill="#D5E1DE"/>${tiles}
    <rect x="745" y="304" width="215" height="100" fill="#E7E1D4"/><path d="M805 304 v100 M865 304 v100 M925 304 v100 M745 340 h215" stroke="#D2C9B8" stroke-width="2"/>
    <g fill="#43494E"><rect x="768" y="316" width="24" height="4" rx="2"/><rect x="828" y="316" width="24" height="4" rx="2"/><rect x="888" y="316" width="24" height="4" rx="2"/><rect x="770" y="366" width="4" height="20" rx="2"/><rect x="830" y="366" width="4" height="20" rx="2"/><rect x="890" y="366" width="4" height="20" rx="2"/></g>
    <rect x="740" y="296" width="220" height="10" rx="2" fill="#DED8CC"/><path d="M740 306 H960" stroke="#161713" stroke-width="3" opacity=".12"/>
    <!-- extractor hood, switched off -->
    <rect x="806" y="96" width="50" height="60" fill="#A9B0B5"/><path d="M806 156 h50" stroke="#7F878C" stroke-width="2"/>
    <g filter="url(#${p}-shadow)"><path d="M758 202 H904 V184 L882 148 H780 L758 184 Z" fill="url(#${p}-metal)"/><rect x="758" y="196" width="146" height="8" fill="#5D5F5C"/></g>
    <rect x="790" y="187" width="82" height="9" rx="2" fill="#43494E"/><circle cx="866" cy="191.5" r="3" fill="#E1502E"/><text x="852" y="194.5" text-anchor="end" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="7" letter-spacing="1" fill="#F5F4F0">OFF</text>
    <!-- hob and pan -->
    <rect x="768" y="290" width="124" height="8" rx="2" fill="#2B2B28"/><circle cx="800" cy="294" r="14" fill="none" stroke="#5D5F5C" stroke-width="1.5"/><circle cx="852" cy="294" r="12" fill="none" stroke="#5D5F5C" stroke-width="1.5"/>
    ${hot('frying', 814, 262, 38, `<g class="flame"><path d="M786 292 q4 -10 8 0 q4 -8 8 0 q4 -10 8 0 q4 -8 8 0 q4 -10 8 0 q4 -8 8 0" fill="none" stroke="#F2A14E" stroke-width="3" stroke-linecap="round"/><path d="M790 292 q3 -6 6 0 q3 -5 6 0 q3 -6 6 0 q3 -5 6 0 q3 -6 6 0" fill="none" stroke="#7FB2C9" stroke-width="2" stroke-linecap="round"/></g><path d="M782 266 h62 v14 q0 8 -8 8 h-46 q-8 0 -8 -8z" fill="#3B3A36"/><ellipse cx="813" cy="268" rx="31" ry="7" fill="#57554F"/><ellipse cx="813" cy="269" rx="24" ry="4.5" fill="#D9A35B"/><ellipse cx="808" cy="268" rx="10" ry="2" fill="#F2C14E" opacity=".8"/><g transform="rotate(-10 844 272)"><rect x="842" y="268" width="46" height="7" rx="3.5" fill="#2B2B28"/><rect x="876" y="267" width="12" height="9" rx="3" fill="#43494E"/></g><g class="shimmer">${wisps(812, 258, { n: 4, h: 78, col: '#A6A6A0', gap: 9, w: 2.6, op: .55 })}</g><ellipse cx="816" cy="226" rx="34" ry="14" fill="#B9B9B3" opacity=".3" filter="url(#${p}-soft)"/>`, 'Inspect: the pan on the stove')}
    <!-- coffee machine with the note -->
    ${hot('coffee', 920, 262, 32, `<g transform="translate(-6 0)"><rect x="902" y="232" width="50" height="66" rx="6" fill="#2E2E2B"/><rect x="908" y="222" width="38" height="14" rx="3" fill="#55554F"/><rect x="908" y="288" width="38" height="8" rx="2" fill="#43494E"/><rect x="898" y="258" width="14" height="6" rx="3" fill="#2B2B28"/><rect x="884" y="256" width="18" height="6" rx="3" fill="#8C8F87"/><rect x="918" y="278" width="14" height="10" rx="2" fill="#F5F4F0"/><path d="M932 281 q5 2 0 6" fill="none" stroke="#F5F4F0" stroke-width="2"/><rect x="922" y="264" width="6" height="14" fill="#8C8F87"/><circle cx="944" cy="240" r="2" fill="#7FB2C9"/><g transform="rotate(5 928 254)"><rect x="906" y="240" width="44" height="30" fill="#FFF8DC" filter="url(#${p}-shadow)"/><rect x="920" y="236" width="16" height="7" fill="#FFFFFF" opacity=".5"/><text x="928" y="253" text-anchor="middle" font-family="'Bradley Hand','Segoe Print','Comic Sans MS',cursive" font-size="8.5" font-style="italic" fill="#161713">coffee causes</text><text x="928" y="264" text-anchor="middle" font-family="'Bradley Hand','Segoe Print','Comic Sans MS',cursive" font-size="9" font-weight="700" font-style="italic" fill="${P.terra}">CANCER!!</text></g></g>`, 'Inspect: the coffee machine')}
    <!-- foreground plant -->
    <ellipse cx="912" cy="536" rx="46" ry="8" fill="#161713" opacity=".16"/><path d="M878 470 h68 l-8 66 h-52z" fill="${P.terra}"/><path d="M874 466 h76 v10 h-76z" fill="${P.terraDeep}"/>
    <g fill="#4F6E4C"><path d="M912 470 q-40 -30 -44 -80 q40 20 44 80z"/><path d="M912 470 q30 -40 60 -60 q-20 50 -60 60z"/><path d="M912 470 q-10 -50 10 -96 q24 50 -10 96z"/><path d="M912 470 q-46 -6 -70 -40 q46 0 70 40z"/></g>
    <g fill="#5F7C58"><path d="M912 470 q-30 -32 -30 -70 q26 26 30 70z"/><path d="M912 470 q20 -36 48 -46 q-14 40 -48 46z"/></g>
    ${grain(p)}${vignette()}
  </svg>`;
}

/* ---- scene 1: the street. Afternoon sun from the upper right. */
function bus(x, y, o = {}) {
  const { w = 344, num = '12', dest = 'RING ROAD', col = '#3E5C7A', p = 's' } = o;
  const heads = [[40, P.skin2, 'short', P.hairDark], [96, P.skin, 'bob', P.hairBlond], [150, P.skin3, 'curly', P.hairDark], [210, P.skin, 'grey', P.hairGrey], [258, P.skin2, 'beanie', P.hairDark]];
  return `<g transform="translate(${x} ${y})">
    ${shadow(w / 2, 100, w / 2 + 10, 8, .28)}
    <rect x="0" y="0" width="${w}" height="98" rx="12" fill="${col}" filter="url(#${p}-shadow)"/>
    <rect x="0" y="66" width="${w}" height="8" fill="#F5F4F0" opacity=".85"/><rect x="0" y="74" width="${w}" height="16" fill="#2F4860"/>
    <rect x="14" y="12" width="${w - 82}" height="40" rx="5" fill="url(#${p}-glass)"/>
    ${Array.from({ length: Math.floor((w - 82) / 52) }, (_, i) => `<path d="M${66 + i * 52} 12 v40" stroke="${col}" stroke-width="4"/>`).join('')}
    ${heads.map(([hx, skin, style, hair], i) => hx < w - 100 ? head(hx + 16, 40, { r: 11, skin, style, hair, face: i % 2 ? 'flat' : 'smile', f: 1, blush: false, hatCol: P.terra }) : '').join('')}
    <rect x="14" y="12" width="${w - 82}" height="40" rx="5" fill="#FFFFFF" opacity=".12"/>
    <rect x="${w - 60}" y="10" width="46" height="44" rx="5" fill="url(#${p}-glass)"/>${head(w - 34, 42, { r: 11, skin: P.skin, style: 'short', hair: P.hairBrown, face: 'flat', f: 1, blush: false })}<rect x="${w - 60}" y="10" width="46" height="44" rx="5" fill="#FFFFFF" opacity=".12"/>
    <rect x="${w - 62}" y="-2" width="54" height="14" rx="3" fill="#161713"/><text x="${w - 35}" y="8.5" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="8" letter-spacing="1" fill="#F2C14E">${num} ${dest}</text>
    <rect x="${w - 112}" y="16" width="30" height="80" rx="3" fill="#2F4860"/><path d="M${w - 97} 20 v72" stroke="#F5F4F0" stroke-width="1.5" opacity=".5"/><rect x="${w - 108}" y="22" width="22" height="30" rx="2" fill="url(#${p}-glass)"/>
    <rect x="${w - 3}" y="44" width="5" height="22" rx="2" fill="#F2C14E"/><rect x="${w - 8}" y="78" width="10" height="8" rx="2" fill="#FFF4D6"/>
    <rect x="${w / 2 - 20}" y="80" width="40" height="9" rx="2" fill="#F5F4F0"/><text x="${w / 2}" y="87" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="6.5" fill="#161713">BX-${num}4 KL</text>
    <g class="wheel"><circle cx="54" cy="98" r="17" fill="#2B2B28"/><circle cx="54" cy="98" r="8" fill="#8C949A"/><circle cx="54" cy="98" r="3" fill="#43494E"/></g>
    <g class="wheel"><circle cx="${w - 60}" cy="98" r="17" fill="#2B2B28"/><circle cx="${w - 60}" cy="98" r="8" fill="#8C949A"/><circle cx="${w - 60}" cy="98" r="3" fill="#43494E"/></g>
    <rect x="-8" y="88" width="14" height="6" rx="2" fill="#43494E"/>
  </g>`;
}
function bistroTable(x, y) {
  return `${shadow(x - 6, y + 34, 34, 5, .16)}<rect x="${x - 3}" y="${y}" width="6" height="32" fill="#43494E"/><ellipse cx="${x}" cy="${y + 32}" rx="16" ry="4" fill="#43494E"/><ellipse cx="${x}" cy="${y}" rx="32" ry="8" fill="#F5F4F0"/><ellipse cx="${x}" cy="${y - 2}" rx="32" ry="8" fill="#FFFFFF"/><ellipse cx="${x}" cy="${y - 2}" rx="26" ry="5" fill="none" stroke="#D6D5CE"/>`;
}
function bistroChair(x, y, f = 1) {
  return `<g transform="translate(${x} ${y}) scale(${f} 1)"><rect x="-14" y="-40" width="4" height="40" rx="1" fill="#43494E"/><rect x="12" y="-40" width="4" height="40" rx="1" fill="#43494E"/><rect x="-16" y="-42" width="32" height="5" rx="2" fill="#5D5F5C"/><rect x="-20" y="-78" width="5" height="40" rx="2" fill="#43494E"/><path d="M-20 -76 q10 -8 20 0" fill="none" stroke="#43494E" stroke-width="4"/></g>`;
}
function sceneStreet() {
  const p = 's';
  const courses = Array.from({ length: 16 }, (_, i) => `<path d="M322 ${176 + i * 10} H548" stroke="#B4806C" stroke-width="1" opacity=".55"/>`).join('') + Array.from({ length: 8 }, (_, i) => `<path d="M${340 + i * 26} ${176 + (i % 2) * 10} v10 M${352 + i * 26} ${196 + (i % 2) * 10} v10 M${346 + i * 26} ${236 + (i % 2) * 10} v10 M${358 + i * 26} ${276 + (i % 2) * 10} v10 M${344 + i * 26} ${306 + (i % 2) * 10} v10" stroke="#B4806C" stroke-width="1" opacity=".5"/>`).join('');
  const slabs = Array.from({ length: 21 }, (_, i) => `<path d="M${i * 48} 330 V408" stroke="#B9B2A3" stroke-width="1.2" opacity=".7"/>`).join('') + `<path d="M0 370 H960" stroke="#B9B2A3" stroke-width="1.2" opacity=".7"/>`;
  const skyline = `<g fill="#B3C2CA"><rect x="0" y="210" width="70" height="130"/><rect x="60" y="180" width="50" height="160"/><path d="M110 240 h60 v100 h-60z M170 200 h40 v140 h-40z"/><rect x="300" y="160" width="40" height="180"/><path d="M340 150 l20 -30 l20 30 v190 h-40z"/><rect x="560" y="190" width="60" height="150"/><rect x="620" y="220" width="90" height="120"/><rect x="760" y="170" width="46" height="170"/><path d="M806 200 h60 v140 h-60z M866 150 h20 v190 h-20z M886 190 h74 v150 h-74z"/></g><g fill="#F5F4F0" opacity=".55">${[[14, 230], [30, 230], [72, 200], [90, 200], [310, 180], [322, 180], [570, 210], [590, 210], [770, 190], [786, 190], [820, 220], [840, 220], [900, 210], [920, 210], [14, 260], [30, 260], [72, 240], [90, 240], [310, 220], [322, 220], [570, 250], [590, 250]].map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="10"/>`).join('')}</g>`;
  const scallops = Array.from({ length: 12 }, (_, i) => `<path d="M${22 + i * 24} 248 a12 8 0 0 0 24 0z" fill="${i % 2 ? P.terra : '#F5F4F0'}"/>`).join('');
  const stripes = Array.from({ length: 12 }, (_, i) => `<rect x="${22 + i * 24}" y="226" width="24" height="22" fill="${i % 2 ? P.terra : '#F5F4F0'}"/>`).join('');
  const bottles = [[578, '#7FE3D6'], [592, '#FF8FB1'], [606, '#F2C14E'], [620, '#7FB2C9'], [634, '#B5A0C8'], [648, '#7FE3D6'], [662, '#FF8FB1']].map(([x, c]) => `<rect x="${x}" y="286" width="9" height="20" rx="2" fill="${c}"/><rect x="${x + 2}" y="282" width="5" height="5" fill="#2B2B28"/>`).join('') + [[582, '#2B2B28'], [604, '#5D5F5C'], [626, '#2B2B28'], [648, '#5D5F5C']].map(([x, c]) => `<rect x="${x}" y="254" width="6" height="18" rx="2" fill="${c}"/><rect x="${x + 10}" y="258" width="12" height="14" rx="2" fill="${c}"/>`).join('');
  return `<svg viewBox="0 0 960 540" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A street: a café terrace where a man smokes next to a family, a corner house with a wood stove and a smoking chimney, a vape shop, a poster on a wall, and two diesel buses idling at a stop">
    ${defs(p, `<radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".6" stop-color="#FFFFFF" stop-opacity=".45"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
      <filter id="${p}-neon" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`)}
    <!-- sky, sun, clouds, distant town -->
    <rect width="960" height="540" fill="url(#${p}-sky)"/>
    <circle cx="790" cy="80" r="150" fill="url(#${p}-sun)"/><circle cx="790" cy="80" r="26" fill="#FFF4D6"/>
    <g class="cloud" opacity=".8"><ellipse cx="160" cy="70" rx="60" ry="14" fill="#FFFFFF"/><ellipse cx="190" cy="60" rx="30" ry="14" fill="#FFFFFF"/><ellipse cx="620" cy="96" rx="50" ry="11" fill="#FFFFFF"/><ellipse cx="640" cy="88" rx="22" ry="10" fill="#FFFFFF"/><ellipse cx="900" cy="150" rx="46" ry="10" fill="#FFFFFF" opacity=".8"/></g>
    ${skyline}
    <!-- pavement and road -->
    <rect y="330" width="960" height="82" fill="#CFC8BA"/>${slabs}
    <rect y="408" width="960" height="10" fill="#B5AE9F"/><path d="M0 418 H960" stroke="#161713" stroke-width="2" opacity=".25"/>
    <rect y="418" width="960" height="122" fill="url(#${p}-road)"/>
    <path d="M0 482 H960" stroke="#E8E2D6" stroke-width="4" stroke-dasharray="34 26" opacity=".6"/>
    <g fill="#3B3D3A"><rect x="410" y="426" width="36" height="8" rx="2"/><path d="M414 428 h28 M414 431 h28" stroke="#6A6C68" stroke-width="1"/></g>
    <!-- café -->
    <rect x="10" y="98" width="308" height="10" fill="#C9B79C"/><rect x="16" y="106" width="296" height="224" fill="#E8D9C6"/><rect x="16" y="252" width="296" height="78" fill="#DCCBB3"/>
    ${[40, 132, 224].map(x => `<rect x="${x - 10}" y="122" width="10" height="66" fill="${P.tealLight}"/><rect x="${x + 46}" y="122" width="10" height="66" fill="${P.tealLight}"/><rect x="${x}" y="122" width="46" height="66" fill="#F5F4F0"/><rect x="${x + 4}" y="126" width="38" height="58" fill="url(#${p}-glass)"/><path d="M${x + 23} 126 v58" stroke="#F5F4F0" stroke-width="3"/><rect x="${x - 4}" y="186" width="54" height="10" rx="2" fill="${P.terraDeep}"/><g fill="${P.terra}"><circle cx="${x + 8}" cy="184" r="4"/><circle cx="${x + 22}" cy="182" r="4"/><circle cx="${x + 36}" cy="184" r="4"/></g><g fill="${P.sageDeep}"><circle cx="${x + 15}" cy="186" r="3.5"/><circle cx="${x + 29}" cy="186" r="3.5"/></g>`).join('')}
    <rect x="16" y="196" width="296" height="30" fill="${P.teal}"/><text x="164" y="217" text-anchor="middle" font-family="Literata,Georgia,serif" font-size="17" font-weight="600" letter-spacing="4" fill="#F5F4F0">CAFÉ DU COIN</text>
    <g filter="url(#${p}-shadow)">${stripes}${scallops}</g><path d="M22 226 H310" stroke="#161713" stroke-width="2" opacity=".3"/>
    <rect x="32" y="258" width="136" height="72" fill="#F5F4F0"/><rect x="38" y="264" width="124" height="66" fill="#6B5A4A"/><rect x="38" y="264" width="124" height="66" fill="url(#${p}-glass)" opacity=".55"/><rect x="44" y="300" width="112" height="6" fill="#B48A5A"/><g fill="#F5F4F0" opacity=".8"><rect x="52" y="284" width="8" height="16" rx="2"/><rect x="66" y="280" width="8" height="20" rx="2"/><rect x="80" y="286" width="8" height="14" rx="2"/><circle cx="130" cy="290" r="9"/></g><path d="M100 264 v66" stroke="#F5F4F0" stroke-width="4"/>
    <rect x="196" y="252" width="68" height="78" fill="#F5F4F0"/><rect x="202" y="258" width="56" height="72" fill="${P.teal}"/><rect x="208" y="264" width="44" height="34" rx="2" fill="url(#${p}-glass)"/><circle cx="250" cy="312" r="3" fill="#D9A35B"/><rect x="196" y="328" width="68" height="4" fill="#B5AE9F"/>
    <g transform="rotate(2 288 288)"><rect x="272" y="262" width="34" height="52" rx="2" fill="#2B2B28"/><rect x="275" y="265" width="28" height="46" fill="none" stroke="#B48A5A" stroke-width="2"/><text x="289" y="278" text-anchor="middle" font-family="Literata,Georgia,serif" font-size="8" fill="#F5F4F0">Menu</text><path d="M279 284 h20 M279 290 h16 M279 296 h20 M279 302 h12" stroke="#F5F4F0" stroke-width="1.5" opacity=".7"/></g>
    <!-- planters framing the terrace -->
    <g><rect x="12" y="380" width="40" height="26" rx="3" fill="${P.terraDeep}"/><path d="M14 380 q18 -30 36 0z" fill="${P.sageDeep}"/><path d="M20 380 q12 -20 24 0z" fill="${P.sage}"/></g>
    <g><rect x="332" y="380" width="40" height="26" rx="3" fill="${P.terraDeep}"/><path d="M334 380 q18 -30 36 0z" fill="${P.sageDeep}"/><path d="M340 380 q12 -20 24 0z" fill="${P.sage}"/></g>
    <!-- terrace: the smoker and the family -->
    ${hot('terrace', 172, 344, 60, `
      ${bistroChair(62, 404, 1)}${bistroChair(322, 404, -1)}${bistroChair(178, 404, 1)}
      ${bistroTable(112, 366)}${bistroTable(246, 366)}
      <rect x="92" y="352" width="10" height="12" rx="2" fill="#F5F4F0" stroke="#B9B0A0"/><ellipse cx="128" cy="361" rx="10" ry="3" fill="#F5F4F0" stroke="#B9B0A0"/><rect x="124" y="350" width="8" height="11" rx="2" fill="#F5F4F0" stroke="#B9B0A0"/>
      <ellipse cx="230" cy="362" rx="12" ry="3.5" fill="#F5F4F0" stroke="#B9B0A0"/><ellipse cx="230" cy="361" rx="6" ry="1.8" fill="${P.ochre}"/><ellipse cx="262" cy="362" rx="12" ry="3.5" fill="#F5F4F0" stroke="#B9B0A0"/><rect x="242" y="350" width="8" height="12" rx="2" fill="#F5F4F0" stroke="#B9B0A0"/><rect x="254" y="346" width="6" height="16" rx="3" fill="${P.terra}" opacity=".9"/>
      ${sit(64, 404, { seat: 40, arms: 'cig', style: 'short', hair: P.hairBrown, beard: P.hairBrown, top: '#5F6A6E', bottom: '#43494E', face: 'flat', skin: P.skin })}
      ${sit(184, 404, { seat: 40, s: .66, r: 18, arms: 'spoon', style: 'curly', hair: P.hairDark, top: P.ochre, bottom: P.denim, face: 'grin', skin: P.skin3 })}
      ${sit(318, 404, { seat: 40, f: -1, arms: 'cup', style: 'long', hair: P.hairDark, top: P.terra, bottom: '#5E6E82', face: 'worried', skin: P.skin3 })}
      ${stand(258, 404, { s: .6, r: 18, f: -1, arms: 'wave', style: 'bob', hair: P.hairDark, top: P.sage, bottom: P.denim, face: 'o', skin: P.skin3, sh: false })}
      <path d="M239 316 q-4 -30 0 -60" stroke="#161713" stroke-width="1" fill="none"/><ellipse cx="240" cy="246" rx="12" ry="15" fill="${P.terra}"/><path d="M240 260 l-3 5 h6z" fill="${P.terra}"/>
      ${smoke(78, 262, { n: 5, col: '#A6A6A0', dx: 70, dy: -40, r: 6, dur: 6, op: .5, grow: 2.6, p })}
    `, 'Inspect: the café terrace')}
    <!-- corner house with the wood stove -->
    <rect x="478" y="60" width="30" height="120" fill="${P.brickDeep}"/><rect x="474" y="56" width="38" height="10" fill="#8F5F4C"/><rect x="482" y="48" width="8" height="10" fill="#5D5F5C"/><rect x="496" y="48" width="8" height="10" fill="#5D5F5C"/>
    ${smoke(493, 48, { n: 5, col: '#7F7F78', dx: 44, dy: -46, r: 9, dur: 6, op: .6, grow: 3, p })}
    <rect x="322" y="172" width="226" height="158" fill="${P.brick}"/>${courses}
    <path d="M312 176 L435 66 L558 176 Z" fill="${P.slate}"/><path d="M318 174 L435 72 L552 174" fill="none" stroke="#7B868A" stroke-width="3"/>
    ${[100, 122, 144].map(y => `<path d="M${435 - (y - 66) * 1.1} ${y} H${435 + (y - 66) * 1.1}" stroke="#4E585C" stroke-width="1.2" opacity=".8"/>`).join('')}
    <rect x="308" y="172" width="254" height="8" fill="#F5F4F0"/>
    <rect x="392" y="190" width="42" height="36" fill="#F5F4F0"/><rect x="396" y="194" width="34" height="28" fill="url(#${p}-glass)"/><path d="M396 194 q8 14 0 28 M430 194 q-8 14 0 28" fill="none" stroke="#F5F4F0" stroke-width="3"/>
    ${hot('woodsmoke', 411, 268, 52, `<rect x="362" y="228" width="98" height="84" fill="#F5F4F0" filter="url(#${p}-shadow)"/><rect x="368" y="234" width="86" height="72" fill="#5A4034"/>
      <rect x="402" y="234" width="6" height="30" fill="#2B2B28"/><path d="M386 262 q0 -8 8 -8 h26 q8 0 8 8 v36 h-42z" fill="#2B2B28"/><rect x="392" y="266" width="30" height="20" rx="2" fill="url(#${p}-ember)"/><rect x="392" y="266" width="30" height="20" rx="2" fill="none" stroke="#5D5F5C" stroke-width="2"/><rect x="384" y="298" width="46" height="4" fill="#43494E"/><rect x="388" y="302" width="6" height="6" fill="#2B2B28"/><rect x="420" y="302" width="6" height="6" fill="#2B2B28"/>
      <ellipse cx="426" cy="248" rx="30" ry="12" fill="#B5B1A8" opacity=".55" filter="url(#${p}-soft)"/><ellipse cx="392" cy="242" rx="24" ry="10" fill="#B5B1A8" opacity=".5" filter="url(#${p}-soft)"/>
      ${wisps(426, 270, { n: 3, h: 40, col: '#C9C5BC', gap: 8, w: 2, op: .7 })}
      <rect x="368" y="234" width="86" height="72" fill="url(#${p}-glass)" opacity=".2"/><path d="M411 234 v72" stroke="#F5F4F0" stroke-width="3"/>
      <path d="M368 234 h22 v60 q-6 6 -22 4z" fill="#C48B72" opacity=".9"/><path d="M454 234 h-22 v60 q6 6 22 4z" fill="#C48B72" opacity=".9"/>
      <rect x="358" y="312" width="106" height="8" rx="2" fill="${P.terraDeep}"/><g fill="${P.sageDeep}"><circle cx="376" cy="310" r="5"/><circle cx="392" cy="308" r="5"/><circle cx="430" cy="308" r="5"/><circle cx="446" cy="310" r="5"/></g><g fill="${P.ochre}"><circle cx="384" cy="306" r="3.5"/><circle cx="438" cy="306" r="3.5"/></g>`, 'Inspect: the wood stove and its chimney')}
    <rect x="482" y="236" width="52" height="94" fill="#F5F4F0"/><rect x="487" y="241" width="42" height="89" fill="${P.terra}"/><path d="M491 246 a17 17 0 0 1 34 0z" fill="url(#${p}-glass)"/><rect x="493" y="268" width="30" height="52" rx="2" fill="none" stroke="${P.terraDeep}" stroke-width="2"/><circle cx="522" cy="292" r="3" fill="#D9A35B"/><rect x="480" y="328" width="56" height="6" fill="#B5AE9F"/>
    <text x="508" y="261" text-anchor="middle" font-family="Literata,Georgia,serif" font-size="10" font-weight="600" fill="#F5F4F0">12</text>
    <!-- vape shop -->
    <rect x="556" y="118" width="214" height="212" fill="#D9CFC0"/><rect x="552" y="112" width="222" height="8" fill="#C9B79C"/>
    ${[590, 690].map(x => `<rect x="${x}" y="136" width="40" height="52" fill="#F5F4F0"/><rect x="${x + 4}" y="140" width="32" height="44" fill="url(#${p}-glass)"/><path d="M${x + 20} 140 v44" stroke="#F5F4F0" stroke-width="3"/>`).join('')}
    <rect x="556" y="196" width="214" height="40" fill="#23443F"/><rect x="556" y="196" width="214" height="40" fill="url(#${p}-light)" opacity=".15"/>
    <g class="neon"><text x="640" y="226" text-anchor="middle" font-family="Literata,Georgia,serif" font-size="26" font-weight="800" letter-spacing="6" fill="#7FE3D6" filter="url(#${p}-neon)">VAPE</text><text x="640" y="226" text-anchor="middle" font-family="Literata,Georgia,serif" font-size="26" font-weight="800" letter-spacing="6" fill="#EFFFFC">VAPE</text></g>
    <rect x="566" y="240" width="124" height="82" fill="#F5F4F0"/><rect x="570" y="244" width="116" height="78" fill="#2E3A3A"/>
    <rect x="574" y="272" width="108" height="3" fill="#8C949A"/><rect x="574" y="306" width="108" height="3" fill="#8C949A"/>${bottles}
    <g class="neon"><text x="628" y="266" text-anchor="middle" font-family="'Brush Script MT','Snell Roundhand','Bradley Hand',cursive" font-style="italic" font-size="19" fill="#FF8FB1" filter="url(#${p}-neon)">harmless</text><text x="628" y="266" text-anchor="middle" font-family="'Brush Script MT','Snell Roundhand','Bradley Hand',cursive" font-style="italic" font-size="19" fill="#FFE3EC">harmless</text></g>
    <rect x="570" y="244" width="116" height="78" fill="url(#${p}-glass)" opacity=".18"/>
    <rect x="700" y="236" width="64" height="94" fill="#F5F4F0"/><rect x="706" y="242" width="52" height="88" fill="#1E2A2A"/><rect x="706" y="242" width="52" height="88" fill="url(#${p}-light)" opacity=".2"/><rect x="756" y="236" width="8" height="94" fill="#23443F"/>
    ${hot('vapeshop', 738, 270, 52, `${stand(732, 330, { arms: 'crossed', style: 'cap', hatCol: P.ink, hair: P.hairDark, top: '#8A7BB5', bottom: '#2B2B28', shoes: '#F5F4F0', face: 'smile', beard: P.hairDark, skin: P.skin2, lean: -9 })}${talkMark(738, 168)}`, 'Talk to the vape-shop owner')}
    <g transform="translate(596 344)"><path d="M0 62 l6 -62 h26 l6 62z" fill="#F5F4F0" stroke="#43494E" stroke-width="2"/><text x="19" y="22" text-anchor="middle" font-family="Literata,Georgia,serif" font-size="9" font-weight="700" fill="#161713">0% TAR</text><text x="19" y="36" text-anchor="middle" font-family="Literata,Georgia,serif" font-size="8" font-style="italic" fill="${P.teal}">no smoke,</text><text x="19" y="47" text-anchor="middle" font-family="Literata,Georgia,serif" font-size="8" font-style="italic" fill="${P.teal}">no worries</text></g>
    <!-- wall with the poster, lamppost, bus stop -->
    <rect x="776" y="126" width="184" height="204" fill="#D2C6B4"/><rect x="772" y="120" width="192" height="8" fill="#C9B79C"/>
    ${Array.from({ length: 10 }, (_, i) => `<path d="M776 ${146 + i * 20} H960" stroke="#C4B7A3" stroke-width="1" opacity=".7"/>`).join('')}
    <rect x="946" y="128" width="8" height="202" fill="#8C949A"/><rect x="942" y="300" width="16" height="6" fill="#6B747B"/>
    ${hot('poster', 872, 206, 58, `<g transform="translate(0 -34) rotate(-1.5 872 240)" filter="url(#${p}-shadow)"><path d="M812 176 H932 V290 L918 304 H812 Z" fill="#F7F3E8"/><path d="M932 290 L918 304 V290 Z" fill="#DCD5C6"/>
      <text x="872" y="194" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="7" letter-spacing="2" fill="#6B6E65">BREATHE · THE RELAXATION APP</text>
      <text x="872" y="226" text-anchor="middle" font-family="Literata,Georgia,serif" font-size="27" font-weight="800" fill="#161713">STRESS</text>
      <text x="872" y="243" text-anchor="middle" font-family="Literata,Georgia,serif" font-size="12" font-style="italic" fill="#454740">gives you</text>
      <text x="872" y="270" text-anchor="middle" font-family="Literata,Georgia,serif" font-size="26" font-weight="800" fill="${P.terra}">CANCER</text>
      <circle cx="872" cy="284" r="7" fill="none" stroke="${P.teal}" stroke-width="1.5"/><path d="M872 278 q5 6 0 12 q-5 -6 0 -12z" fill="${P.teal}"/>
      <text x="872" y="299" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="6.5" letter-spacing="1.5" fill="#6B6E65">7 DAYS FREE · DOWNLOAD NOW</text>
      <rect x="806" y="172" width="18" height="8" fill="#FFFFFF" opacity=".55" transform="rotate(-30 815 176)"/><rect x="920" y="172" width="18" height="8" fill="#FFFFFF" opacity=".55" transform="rotate(30 929 176)"/></g>`, 'Inspect: the poster on the wall')}
    ${shadow(792, 410, 14, 3, .2)}<rect x="788" y="150" width="8" height="260" fill="#43494E"/><path d="M780 150 h24 l-4 -22 h-16z" fill="#2B2B28"/><rect x="783" y="132" width="18" height="10" fill="#FFF4D6" opacity=".7"/><rect x="784" y="404" width="16" height="8" rx="2" fill="#2B2B28"/>
    <g>${shadow(822, 410, 16, 3, .2)}<rect x="810" y="366" width="24" height="44" rx="3" fill="${P.teal}"/><rect x="808" y="362" width="28" height="6" rx="2" fill="${P.tealDeep}"/><path d="M816 376 h12 M816 384 h12 M816 392 h12" stroke="#F5F4F0" stroke-width="1.5" opacity=".6"/></g>
    <g>${shadow(906, 410, 10, 3, .2)}<rect x="903" y="300" width="6" height="110" fill="#43494E"/><rect x="886" y="282" width="40" height="22" rx="3" fill="#F5F4F0" stroke="#161713" stroke-width="2"/><text x="906" y="297" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="10" font-weight="700" letter-spacing="1" fill="#161713">BUS</text></g>
    ${stand(858, 404, { arms: 'bag', style: 'long', hair: P.hairBlond, top: '#F5F4F0', bottom: P.denim, face: 'flat', f: 1, s: .95, skin: P.skin })}
    <!-- haze over the pavement and the road -->
    <rect x="380" y="380" width="600" height="60" fill="#8C8F87" opacity=".18" filter="url(#${p}-soft)"/>
    <!-- cyclist -->
    <g transform="translate(96 470)">${shadow(16, 44, 46, 5, .25)}
      <g fill="none" stroke="#2B2B28" stroke-width="3"><circle cx="-16" cy="30" r="15"/><circle cx="46" cy="30" r="15"/><path d="M-16 30 L6 2 L46 30 M6 2 L18 30 M6 2 L34 0 M18 30 L-16 30 M34 0 L44 -14 L50 -12"/></g><circle cx="18" cy="30" r="3" fill="#2B2B28"/><rect x="-2" y="-2" width="16" height="5" rx="2" fill="#2B2B28"/>
      <path d="M6 0 L20 14 L22 30" fill="none" stroke="${P.denim}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><rect x="14" y="26" width="16" height="8" rx="3" fill="#F5F4F0"/>
      <g transform="translate(6 -2) rotate(52)"><path d="M-14 -50 Q-14 -58 -6 -58 H12 Q20 -58 20 -50 L18 -2 H-14Z" fill="${P.ochre}"/><rect x="-3" y="-66" width="10" height="14" fill="${P.skin2}"/>${head(3, -72, { skin: P.skin2, style: 'cap', hatCol: P.teal, face: 'flat' })}</g>
      <path d="M28 -34 L42 -22 L46 -12" fill="none" stroke="${P.ochre}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="47" cy="-12" r="4.5" fill="${P.skin2}"/>
    </g>
    <!-- buses on the road -->
    ${bus(252, 414, { w: 334, num: '7', dest: 'STATION', col: '#3E5C7A', p })}
    ${smoke(246, 500, { n: 4, col: '#4E4E4A', dx: -50, dy: -28, r: 7, dur: 3.2, op: .55, grow: 2.4, p })}
    ${hot('bus', 706, 462, 56, `${bus(600, 414, { w: 340, num: '12', dest: 'RING ROAD', col: '#3E5C7A', p })}<g class="exhaust">${smoke(592, 500, { n: 5, col: '#4E4E4A', dx: -60, dy: -30, r: 8, dur: 3, op: .6, grow: 2.6, p })}</g>`, 'Inspect: the buses at the stop')}
    ${grain(p)}${vignette()}
  </svg>`;
}

/* ---- scene 2: the building yard. Light from the upper left. */
function sceneYard() {
  const p = 'y';
  const courses = Array.from({ length: 14 }, (_, i) => `<path d="M0 ${214 + i * 9} H960" stroke="#A9705A" stroke-width="1" opacity=".5"/>`).join('') + Array.from({ length: 30 }, (_, i) => `<path d="M${18 + i * 32} 205 v9 M${34 + i * 32} 223 v9 M${18 + i * 32} 241 v9 M${34 + i * 32} 259 v9 M${18 + i * 32} 277 v9 M${34 + i * 32} 295 v9 M${18 + i * 32} 313 v9 M${34 + i * 32} 331 v9" stroke="#A9705A" stroke-width="1" opacity=".45"/>`).join('');
  const corrug = Array.from({ length: 15 }, (_, i) => `<path d="M${332 + i * 14} 178 v72" stroke="#7F878C" stroke-width="1.5" opacity=".8"/><path d="M${339 + i * 14} 178 v72" stroke="#C4CACD" stroke-width="1.5" opacity=".8"/>`).join('');
  const shedLines = Array.from({ length: 12 }, (_, i) => `<path d="M${662 + i * 12} 204 V340" stroke="#3E4A4E" stroke-width="1.5" opacity=".7"/>`).join('');
  const tracks = `<g fill="none" stroke="#9A8664" stroke-width="7" stroke-dasharray="10 8" opacity=".35"><path d="M120 540 Q300 470 560 456 Q760 446 960 470"/><path d="M60 540 Q300 500 560 486 Q760 476 960 500"/></g>`;
  const gravel = [[70, 420], [150, 470], [250, 430], [420, 470], [640, 440], [720, 500], [880, 520], [330, 520], [500, 520], [800, 430], [210, 505], [910, 410]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2" fill="#8F7A58" opacity=".5"/>`).join('');
  const sparks = [[-18, -14], [14, -22], [24, 6], [-8, 18], [30, -8], [-26, 4], [8, -30], [18, 22], [-14, -28], [34, 14]].map(([dx, dy], i) => `<path class="spark" d="M778 276 l${dx} ${dy}" stroke="${i % 3 ? '#FFE9A8' : '#FFFFFF'}" stroke-width="${i % 2 ? 1.6 : 2.2}" stroke-linecap="round"/>`).join('');
  return `<svg viewBox="0 0 960 540" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A building yard: a worker dry-cutting paving stones in a cloud of dust, an old corrugated roof being stripped by hand, a welder in a closed shed, a fuming bitumen kettle beside roofers, and the foreman">
    ${defs(p, `<radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".6" stop-color="#FFFFFF" stop-opacity=".45"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>`)}
    <!-- sky, crane, rooftops behind the wall -->
    <rect width="960" height="540" fill="url(#${p}-sky)"/>
    <circle cx="150" cy="70" r="150" fill="url(#${p}-sun)"/>
    <g class="cloud" opacity=".8"><ellipse cx="420" cy="52" rx="56" ry="12" fill="#FFFFFF"/><ellipse cx="450" cy="44" rx="26" ry="12" fill="#FFFFFF"/><ellipse cx="860" cy="120" rx="44" ry="10" fill="#FFFFFF" opacity=".8"/></g>
    <g fill="none" stroke="#A9B7BF" stroke-width="3"><path d="M848 200 V36 M862 200 V36"/><path d="M848 60 l14 -14 M848 84 l14 -14 M848 108 l14 -14 M848 132 l14 -14 M848 156 l14 -14 M848 180 l14 -14"/><path d="M690 46 H930 M690 56 H930"/><path d="M700 46 l10 10 M720 56 l10 -10 M740 46 l10 10 M760 56 l10 -10 M780 46 l10 10 M800 56 l10 -10 M820 46 l10 10 M880 46 l10 10 M900 56 l10 -10"/><path d="M855 36 L800 46 M855 36 L905 46"/><path d="M730 56 V130"/></g><rect x="842" y="30" width="26" height="10" fill="#A9B7BF"/><path d="M724 130 h12 v6 q-6 8 -12 0z" fill="#A9B7BF"/><rect x="910" y="40" width="24" height="16" fill="#A9B7BF"/>
    <g fill="#B3C2CA"><rect x="0" y="150" width="80" height="60"/><path d="M80 170 h60 v40 h-60z M140 140 l30 -20 l30 20 v70 h-60z"/><rect x="200" y="160" width="50" height="50"/><rect x="700" y="150" width="60" height="60"/><rect x="760" y="130" width="40" height="80"/></g>
    <!-- building under renovation with scaffolding -->
    <rect x="300" y="60" width="360" height="146" fill="#D9CFC0"/><rect x="296" y="54" width="368" height="8" fill="#C9B79C"/>
    ${[330, 400, 470, 540, 610].map(x => `<rect x="${x}" y="80" width="30" height="40" fill="#5A4A3E"/><rect x="${x}" y="140" width="30" height="40" fill="#5A4A3E"/>`).join('')}
    <path d="M540 60 h120 v96 h-120z" fill="#7E98A8" opacity=".85"/><path d="M548 68 l104 80 M652 68 l-104 80" stroke="#F5F4F0" stroke-width="1.5" opacity=".5"/>
    <g stroke="#8C949A" stroke-width="4"><path d="M312 206 V50 M372 206 V50 M432 206 V50 M492 206 V50 M552 206 V50 M612 206 V50 M652 206 V50"/><path d="M306 100 H660 M306 150 H660"/></g>
    <g fill="${P.wood}"><rect x="306" y="102" width="354" height="7"/><rect x="306" y="152" width="354" height="7"/></g><g stroke="#8C949A" stroke-width="2" opacity=".8"><path d="M312 100 l60 -50 M372 150 l60 -50 M492 100 l60 -50 M552 150 l60 -50"/></g>
    <path d="M330 110 H370 V126 H330z M330 126 H370 V142 H330z" fill="#F2C14E" opacity=".9"/><text x="350" y="122" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="8" font-weight="700" fill="#161713">SITE</text><text x="350" y="138" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="6" letter-spacing="1" fill="#161713">HARD HATS</text>
    <!-- back wall -->
    <rect y="204" width="960" height="140" fill="#C9967E"/>${courses}<rect y="196" width="960" height="10" fill="#B9B0A0"/><path d="M0 206 H960" stroke="#161713" stroke-width="2" opacity=".15"/>
    <g transform="rotate(-2 80 240)"><rect x="30" y="216" width="100" height="46" rx="2" fill="#F2C14E" filter="url(#${p}-shadow)"/><rect x="34" y="220" width="92" height="38" fill="none" stroke="#161713" stroke-width="2"/><text x="80" y="236" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" letter-spacing="1" fill="#161713">DANGER</text><text x="80" y="250" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="7" letter-spacing="1" fill="#161713">WORKS IN PROGRESS</text></g>
    <!-- ground -->
    <rect y="340" width="960" height="200" fill="url(#${p}-ground)"/><path d="M0 342 H960" stroke="#161713" stroke-width="3" opacity=".12"/>
    ${tracks}${gravel}
    <ellipse cx="420" cy="500" rx="70" ry="10" fill="#93A9B4" opacity=".7"/><ellipse cx="410" cy="498" rx="40" ry="4" fill="#FFFFFF" opacity=".35"/>
    <!-- outbuilding with the old roof -->
    ${shadow(480, 344, 160, 6, .18)}
    <rect x="336" y="250" width="290" height="92" fill="#D9CFC0"/><rect x="336" y="250" width="290" height="92" fill="url(#${p}-light)" opacity=".2"/><rect x="380" y="280" width="40" height="62" fill="#5A4A3E"/><rect x="470" y="276" width="46" height="30" fill="#5A4A3E"/><path d="M336 250 H626" stroke="#161713" stroke-width="3" opacity=".25"/>
    <g fill="${P.woodDeep}"><rect x="330" y="176" width="300" height="6"/><rect x="330" y="212" width="300" height="5"/><rect x="330" y="246" width="300" height="6"/></g>
    <g fill="none" stroke="${P.wood}" stroke-width="5">${[350, 400, 450, 500, 550, 600].map(x => `<path d="M${x} 178 V250"/>`).join('')}</g>
    <rect x="330" y="176" width="220" height="74" fill="#9AA0A0"/>${corrug}
    <rect x="550" y="176" width="80" height="74" fill="#5A4A3E" opacity=".35"/>
    <path d="M330 176 h220 v74 h-220z" fill="none" stroke="#6E7478" stroke-width="2"/>
    ${[344, 386, 428, 470, 512].map(x => `<path d="M${x} 176 v74" stroke="#6E7478" stroke-width="1.5" opacity=".7"/>`).join('')}
    ${hot('asbestos', 494, 226, 54, `<g transform="rotate(-24 546 246)"><rect x="500" y="200" width="60" height="50" fill="#A8AEAE"/>${Array.from({ length: 4 }, (_, i) => `<path d="M${508 + i * 14} 202 v46" stroke="#7F878C" stroke-width="1.5"/><path d="M${515 + i * 14} 202 v46" stroke="#C4CACD" stroke-width="1.5"/>`).join('')}<path d="M500 200 h60 v50 h-60z" fill="none" stroke="#6E7478" stroke-width="2"/><path d="M528 200 l6 14 l-8 10 l10 12 l-6 14" fill="none" stroke="#5D5F5C" stroke-width="1.5"/></g>
      ${kneel(470, 232, { s: .88, vest: true, top: P.sageDeep, bottom: P.denim, hat: 'hard', hatCol: '#F5F4F0', skin: P.skin2, face: 'flat' })}
      <g class="dust" opacity=".7"><ellipse cx="536" cy="240" rx="26" ry="10" fill="#C9CBC6" filter="url(#${p}-blur)"/><ellipse cx="560" cy="226" rx="20" ry="8" fill="#C9CBC6" filter="url(#${p}-blur)"/></g>
      ${[[530, 230], [548, 222], [560, 238], [574, 226], [542, 248]].map(([x, y]) => `<path d="M${x} ${y} l4 -3 l3 3" stroke="#F5F4F0" stroke-width="1.2" fill="none" opacity=".9"/>`).join('')}`, 'Inspect: the roof being stripped')}
    <g transform="translate(600 250)"><rect x="6" y="0" width="5" height="150" fill="${P.wood}" transform="skewX(-8)"/><rect x="34" y="0" width="5" height="150" fill="${P.wood}" transform="skewX(-8)"/>${[16, 40, 64, 88, 112, 136].map(y => `<rect x="${7 - y * .14}" y="${y}" width="32" height="4" fill="${P.woodDeep}"/>`).join('')}</g>
    <g transform="translate(560 366)">${shadow(36, 34, 46, 6, .2)}<path d="M0 26 l6 -18 h62 l6 18z" fill="#9AA0A0"/><path d="M4 12 l6 -14 h50 l8 14z" fill="#A8AEAE"/><path d="M20 -2 l30 -10 l12 12 l-30 10z" fill="#9AA0A0"/><path d="M0 26 h74 M8 20 h60" stroke="#6E7478" stroke-width="1.5"/><path d="M28 0 l8 -6 M40 4 l8 -6 M52 8 l8 -6" stroke="#C4CACD" stroke-width="1.5"/></g>
    <!-- cutting bench, worker, dust -->
    <g>${shadow(70, 404, 46, 6, .2)}${[0, 1, 2, 3, 4].map(i => `<rect x="${28 + (i % 2) * 4}" y="${384 - i * 12}" width="84" height="11" rx="1" fill="${i % 2 ? '#A8AEAE' : '#9AA0A0'}"/><path d="M${28 + (i % 2) * 4} ${395 - i * 12} h84" stroke="#6E7478" stroke-width="1.5"/>`).join('')}</g>
    ${hot('silica', 200, 342, 58, `
      ${stand(134, 402, { lean: 40, arms: 'reach', vest: true, hat: 'hard', hatCol: P.hiVis, face: 'flat', top: '#5D5F5C', bottom: P.denim, skin: P.skin2, style: 'short', sh: true })}
      ${shadow(210, 406, 100, 7, .2)}
      <g fill="${P.woodDeep}"><path d="M118 350 l-10 54 h6 l8 -48 M150 350 l10 54 h-6 l-8 -48"/><path d="M262 350 l-10 54 h6 l8 -48 M294 350 l10 54 h-6 l-8 -48"/></g><rect x="120" y="386" width="30" height="4" fill="${P.woodDeep}"/><rect x="264" y="386" width="30" height="4" fill="${P.woodDeep}"/>
      <rect x="106" y="338" width="204" height="14" rx="2" fill="${P.wood}"/><path d="M106 350 h204" stroke="${P.woodDeep}" stroke-width="3"/>
      <rect x="150" y="322" width="112" height="16" fill="#A8AEAE"/><path d="M150 338 h112" stroke="#6E7478" stroke-width="2"/><path d="M228 322 v16" stroke="#5D5F5C" stroke-width="2"/>
      <g transform="translate(244 310)"><circle cx="0" cy="0" r="27" fill="#43494E"/><circle cx="0" cy="0" r="27" fill="none" stroke="#C4CACD" stroke-width="3" stroke-dasharray="4 5"/><circle cx="0" cy="0" r="6" fill="#8C949A"/><path d="M-30 -4 A30 30 0 0 1 30 -4 L30 6 A30 30 0 0 0 -30 6z" fill="#F08A3E"/><rect x="-42" y="-24" width="40" height="22" rx="6" fill="#F08A3E"/><rect x="-38" y="-20" width="14" height="8" rx="2" fill="#2B2B28"/><rect x="-62" y="-14" width="26" height="9" rx="4" fill="#2B2B28"/><rect x="-30" y="-2" width="10" height="20" rx="3" fill="#2B2B28"/></g>
      ${dustCloud(276, 312, { s: 1.15, op: .95, p, col: '#EEE9DE' })}
    `, 'Inspect: the worker cutting stone')}
    <!-- welding shed, door shut -->
    <g transform="translate(-22 0)">
    ${shadow(730, 344, 90, 6, .2)}
    <rect x="652" y="204" width="152" height="136" fill="#4E5A5E"/>${shedLines}<path d="M646 204 H810 L804 186 H652z" fill="#2E3438"/><path d="M646 204 H810" stroke="#161713" stroke-width="2" opacity=".3"/>
    <rect x="660" y="236" width="48" height="104" rx="2" fill="#3E4A4E"/><rect x="664" y="240" width="40" height="96" fill="none" stroke="#2E3438" stroke-width="2"/><circle cx="700" cy="292" r="3" fill="#B9B0A0"/><rect x="668" y="248" width="32" height="18" fill="#F2C14E"/><text x="684" y="256" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="5.5" font-weight="700" fill="#161713">KEEP DOOR</text><text x="684" y="263" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="5.5" font-weight="700" fill="#161713">SHUT</text>
    </g>
    ${hot('welding', 738, 264, 50, `<g transform="translate(-22 0)"><rect x="716" y="220" width="84" height="84" fill="#1B2124"/>
      <circle cx="778" cy="276" r="46" fill="url(#${p}-arc)" class="arc" opacity=".9"/>
      ${welder(742, 300, { s: .62 })}
      <ellipse cx="750" cy="236" rx="30" ry="10" fill="#8C8F87" opacity=".55" filter="url(#${p}-soft)"/><ellipse cx="776" cy="228" rx="22" ry="8" fill="#8C8F87" opacity=".5" filter="url(#${p}-soft)"/>
      ${smoke(770, 270, { n: 3, col: '#9A9A94', dx: -10, dy: -40, r: 6, dur: 4, op: .45, grow: 2, p })}
      <g class="arc">${sparks}<circle cx="778" cy="276" r="5" fill="#FFFFFF"/></g>
      <rect x="716" y="220" width="84" height="84" fill="url(#${p}-glass)" opacity=".12"/><path d="M758 220 v84 M716 262 h84" stroke="#2E3438" stroke-width="4"/><rect x="712" y="216" width="92" height="92" fill="none" stroke="#2E3438" stroke-width="6"/>
      <path d="M716 304 L700 342 H816 L800 304z" fill="#DDF3FF" opacity=".16" class="arc"/></g>`, 'Inspect: the welding shed')}
    <!-- bitumen kettle and roofers -->
    ${hot('bitumen', 898, 282, 54, `
      ${stand(804, 406, { arms: 'mop', style: 'beanie', hatCol: P.ink, top: P.ochre, bottom: '#43494E', face: 'cough', skin: P.skin, vest: false, s: .95 })}
      ${stand(842, 384, { arms: 'bucket', style: 'short', hair: P.hairBrown, top: P.blueDeep, bottom: P.denim, face: 'frown', skin: P.skin3, hat: 'hard', hatCol: P.hiVis, s: .8 })}
      ${shadow(900, 346, 56, 7, .25)}
      <rect x="860" y="200" width="6" height="62" fill="#43494E"/><path d="M852 200 h22" stroke="#43494E" stroke-width="4"/><rect x="928" y="212" width="12" height="60" fill="#2B2B28"/><rect x="924" y="206" width="20" height="8" rx="2" fill="#43494E"/>
      <rect x="850" y="256" width="94" height="76" rx="16" fill="#2B2B28"/><rect x="850" y="256" width="94" height="76" rx="16" fill="url(#${p}-light)" opacity=".2"/><rect x="850" y="284" width="94" height="6" fill="#43494E"/><rect x="850" y="310" width="94" height="4" fill="#43494E"/>
      <g transform="rotate(-38 858 262)"><rect x="854" y="252" width="60" height="10" rx="3" fill="#43494E"/></g><ellipse cx="892" cy="260" rx="34" ry="6" fill="#161713"/><ellipse cx="892" cy="260" rx="26" ry="4" fill="#3B3A36"/>
      <path class="flame" d="M868 332 q4 -12 8 0 q4 -10 8 0 q4 -12 8 0 q4 -10 8 0 q4 -12 8 0" fill="none" stroke="#7FB2C9" stroke-width="3" stroke-linecap="round"/>
      <circle cx="868" cy="340" r="11" fill="#2B2B28"/><circle cx="868" cy="340" r="4" fill="#8C949A"/><circle cx="926" cy="340" r="11" fill="#2B2B28"/><circle cx="926" cy="340" r="4" fill="#8C949A"/><path d="M850 300 l-22 30" stroke="#43494E" stroke-width="5" stroke-linecap="round"/>
      <rect x="936" y="300" width="18" height="44" rx="4" fill="#F08A3E"/><rect x="941" y="294" width="8" height="8" fill="#43494E"/>
      ${smoke(892, 254, { n: 5, col: '#5A534A', dx: 26, dy: -80, r: 9, dur: 4.5, op: .6, grow: 2.6, p })}
      ${smoke(934, 208, { n: 3, col: '#5A534A', dx: 18, dy: -60, r: 6, dur: 4, op: .5, grow: 2.2, p })}
    `, 'Inspect: the bitumen kettle')}
    <!-- foreground: wheelbarrow, cable reel, cone, pallet, and the foreman -->
    <g transform="translate(40 440)">${shadow(40, 76, 44, 6, .2)}<circle cx="40" cy="40" r="36" fill="${P.wood}"/><circle cx="40" cy="40" r="36" fill="none" stroke="${P.woodDeep}" stroke-width="4"/><circle cx="40" cy="40" r="22" fill="${P.woodLight}"/><circle cx="40" cy="40" r="6" fill="${P.woodDeep}"/><path d="M40 4 v72 M4 40 h72 M15 15 l50 50 M65 15 l-50 50" stroke="${P.woodDeep}" stroke-width="2.5"/><rect x="36" y="30" width="44" height="22" rx="3" fill="#2B2B28" opacity=".85"/><rect x="42" y="36" width="34" height="10" rx="2" fill="#F08A3E"/></g>
    <g transform="translate(300 424)">${shadow(50, 76, 60, 6, .2)}<path d="M6 24 h96 l-14 40 h-66z" fill="#5D5F5C"/><path d="M6 24 h96" stroke="#43494E" stroke-width="4"/><path d="M22 64 l-6 12 M86 64 l6 12" stroke="#43494E" stroke-width="4"/><circle cx="106" cy="70" r="11" fill="#2B2B28"/><circle cx="106" cy="70" r="4" fill="#8C949A"/><path d="M102 44 l40 22" stroke="#43494E" stroke-width="5"/><path d="M6 24 q-24 -4 -40 -20" stroke="#43494E" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M14 24 q40 -22 84 0z" fill="#A8AEAE"/></g>
    <g transform="translate(690 458)">${shadow(14, 34, 22, 4, .2)}<path d="M4 32 l6 -30 h8 l6 30z" fill="#F08A3E"/><rect x="0" y="30" width="28" height="5" rx="2" fill="#F08A3E"/><rect x="7" y="12" width="14" height="6" fill="#F5F4F0"/></g>
    <g transform="translate(770 450)">${shadow(60, 56, 70, 6, .2)}<rect x="0" y="44" width="120" height="8" fill="${P.wood}"/><rect x="6" y="52" width="10" height="6" fill="${P.woodDeep}"/><rect x="104" y="52" width="10" height="6" fill="${P.woodDeep}"/>${Array.from({ length: 3 }, (_, r) => Array.from({ length: 5 }, (_, c) => `<rect x="${6 + c * 22 + (r % 2) * 6}" y="${16 + r * 10}" width="20" height="9" fill="${r % 2 ? P.brick : P.brickDeep}"/>`).join('')).join('')}</g>
    ${hot('foreman', 562, 416, 62, `${stand(560, 486, { s: 1.15, arms: 'clip', vest: true, hat: 'hard', hatCol: '#F5F4F0', style: 'grey', hair: P.hairGrey, top: P.blueDeep, bottom: '#43494E', face: 'flat', skin: P.skin, glasses: true, beard: P.hairGrey })}${talkMark(562, 316)}`, 'Talk to the foreman')}
    ${grain(p)}${vignette()}
  </svg>`;
}

const ART = [sceneFlat, sceneStreet, sceneYard];

/* ------------------------------------------------------------------ state */
const KEY = 'epi-lung-detective';
const state = { scene: 0, filed: {}, fixed: {}, talked: {}, tries: {}, firstRight: 0, radonRead: false, settings: {} };
let activeHotspot = null;

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

function show(screen) {
  $('#app').dataset.screen = screen;
  ['title', 'play', 'report'].forEach(s => { $('#screen-' + s).hidden = s !== screen; });
}

/* ------------------------------------------------------------------ scene render */
function renderScene() {
  const s = SCENES[state.scene];
  $('#hud-scene').textContent = s.name;
  $('#scene').innerHTML = ART[state.scene]();
  $('#scene-hint').textContent = s.intro + ' Click a pulsing ring, or press Tab to reach it and Enter to inspect.';
  $$('#scene .hot').forEach(el => {
    const id = el.dataset.id;
    if (state.filed[id] || state.talked[id]) el.classList.add('done');
    const open = () => { activeHotspot = el; TALKS[id] ? openTalk(id) : openClue(id); };
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  updateHud();
}
function updateHud() {
  const ids = CLUE_ORDER[state.scene];
  $('#hud-found').textContent = ids.filter(id => state.filed[id]).length;
  $('#hud-total').textContent = ids.length;
  const fixable = Object.values(CLUES).filter(c => c.fix).length;
  const fixed = Object.keys(state.fixed).length;
  $('#hud-air').textContent = fixed + '/' + fixable;
  $('#hud-air-bar').style.width = Math.round(100 * fixed / fixable) + '%';
}

/* ------------------------------------------------------------------ panel */
function srcHtml(keys) {
  return `<div class="src"><b>Sources.</b> ${keys.map(k => `<a href="${SRC[k].u}" target="_blank" rel="noopener">${esc(SRC[k].t)}</a>`).join(' · ')}</div>`;
}
function codeHtml(k) {
  if (!k) return '';
  const c = CODE[k];
  // The heading is this game's own label; only the sentence below it is the Code's official wording.
  return `<div class="code"><p class="kicker">European Code Against Cancer · recommendation ${c.n} · ${esc(c.h)}</p><p class="code-t">${esc(c.t)}</p></div>`;
}
function openPanel(kicker, title, text, body) {
  $('#panel-kicker').textContent = kicker;
  $('#panel-title').textContent = title;
  $('#panel-text').textContent = text;
  $('#panel-body').innerHTML = body;
  const p = $('#panel'); p.hidden = false; p.scrollTop = 0;
  const first = p.querySelector('button, a'); if (first) first.focus();
}
function closePanel() {
  $('#panel').hidden = true;
  if (activeHotspot) { activeHotspot.classList.toggle('done', !!(state.filed[activeHotspot.dataset.id] || state.talked[activeHotspot.dataset.id])); activeHotspot.focus(); }
  checkScene();
}

function binsHtml(clue) {
  return `<p class="kicker" style="margin-top:14px">How do you file it?</p><div class="bins">${BINS.map(b =>
    `<button type="button" class="choice ${b.id}" data-bin="${b.id}"><b>${b.label}</b><span>${b.sub}</span></button>`).join('')}</div>`;
}
function openClue(id) {
  const c = CLUES[id];
  if (state.filed[id]) { return openPanel('Case file · filed', c.name, c.desc, verdictHtml(c, id, true)); }
  if (c.special === 'radon' && !state.radonRead) {
    openPanel('Case file', c.name, c.desc, `<div class="actions"><button type="button" class="btn primary" id="btn-measure">Place the detector</button></div>`);
    $('#btn-measure').addEventListener('click', () => {
      $('#panel-body').innerHTML = `<div class="reading"><span id="rd">0</span> <small>Bq/m³</small></div><div class="gauge"><i id="rd-pin"></i></div><div class="gauge-lab"><span>0</span><span>100 WHO reference</span><span>300 upper limit</span><span>400+</span></div><p id="rd-note" class="fine">Measuring…</p>`;
      animateReading(340, () => {
        $('#rd-note').textContent = '340 Bq/m³. Above the WHO reference level of 100, and above the 300 that WHO says national reference levels should not exceed.';
        state.radonRead = true;
        $('#panel-body').insertAdjacentHTML('beforeend', binsHtml(c));
        wireBins(c, id);
      });
    });
    return;
  }
  openPanel('Case file', c.name, c.desc, binsHtml(c));
  wireBins(c, id);
}
function animateReading(target, done) {
  const el = $('#rd'), pin = $('#rd-pin'); const t0 = performance.now(); const still = $('#app').classList.contains('still');
  const dur = still ? 0 : 1400;
  const f = now => { const t = dur ? Math.min(1, (now - t0) / dur) : 1; const e = 1 - Math.pow(1 - t, 3); const v = Math.round(target * e);
    el.textContent = v; pin.style.left = Math.min(100, v / 4) + '%'; if (t < 1) requestAnimationFrame(f); else done(); };
  requestAnimationFrame(f);
}
function wireBins(c, id) {
  $$('#panel .choice').forEach(btn => btn.addEventListener('click', () => {
    state.tries[id] = (state.tries[id] || 0) + 1;
    if (btn.dataset.bin === c.bin) {
      if (state.tries[id] === 1) state.firstRight++;
      state.filed[id] = true;
      $$('#panel .choice').forEach(b => { b.disabled = true; b.classList.toggle('right', b === btn); });
      $('#panel-body').insertAdjacentHTML('beforeend', verdictHtml(c, id, false));
      wireFix(c, id);
      updateHud();
      const v = $('#panel .verdict'); if (v) v.scrollIntoView({ block: 'nearest' });
    } else {
      btn.classList.add('wrong'); btn.disabled = true;
      let n = $('#panel .nudge'); if (!n) { n = document.createElement('div'); n.className = 'verdict no nudge'; $('#panel-body').appendChild(n); }
      n.innerHTML = `<h3>Not that one.</h3><p>${esc(c.hint)} Try again.</p>`;
    }
  }));
}
function verdictHtml(c, id, filedBefore) {
  const bin = BINS.find(b => b.id === c.bin);
  const fixPart = c.fix ? (state.fixed[id]
    ? `<div class="verdict ok"><h3>Fixed.</h3><p>${esc(c.fix.result)}</p></div>`
    : `<div class="actions"><button type="button" class="btn primary" id="btn-fix">${esc(c.fix.label)}</button></div>`)
    : '';
  return `<div class="verdict ok"><h3>${filedBefore ? 'Filed as' : 'Correct:'} ${esc(bin.label)}. <span class="tally ${c.bin}">${esc(bin.sub)}</span></h3><p>${esc(c.why)}</p></div>
    ${codeHtml(c.code)}${fixPart}${srcHtml(c.src)}
    <div class="actions"><button type="button" class="btn" id="btn-back">Back to the scene</button></div>`;
}
function wireFix(c, id) {
  const b = $('#btn-fix');
  if (b) b.addEventListener('click', () => {
    state.fixed[id] = true; updateHud();
    let extra = '';
    if (c.special === 'radon') extra = `<div class="reading"><span>60</span> <small>Bq/m³ after the fix</small></div><div class="gauge"><i style="left:15%"></i></div>`;
    b.closest('.actions').outerHTML = `<div class="verdict ok"><h3>Fixed. Clean-air score +1.</h3>${extra}<p>${esc(c.fix.result)}</p></div>`;
  });
  const back = $('#btn-back'); if (back) back.addEventListener('click', closePanel);
}

/* ------------------------------------------------------------------ talks */
function openTalk(id) {
  const t = TALKS[id];
  const done = state.talked[id];
  const choices = t.choices.map((ch, i) => `<button type="button" class="choice ${done && ch.ok ? 'right' : ''}" data-i="${i}" ${done ? 'disabled' : ''}><b>${esc(ch.t)}</b></button>`).join('');
  openPanel('A conversation', t.who, t.line, `<p class="kicker" style="margin-top:14px">What do you say?</p><div class="bins">${choices}</div>${done ? talkVerdict(t, t.choices.find(c => c.ok)) : ''}`);
  if (done) { $('#btn-back').addEventListener('click', closePanel); return; }
  $$('#panel .choice').forEach(btn => btn.addEventListener('click', () => {
    const ch = t.choices[+btn.dataset.i];
    state.tries[id] = (state.tries[id] || 0) + 1;
    if (ch.ok) {
      if (state.tries[id] === 1) state.firstRight++;
      state.talked[id] = true;
      $$('#panel .choice').forEach(b => { b.disabled = true; b.classList.toggle('right', b === btn); });
      $('#panel-body').insertAdjacentHTML('beforeend', talkVerdict(t, ch));
      $('#btn-back').addEventListener('click', closePanel);
    } else {
      btn.classList.add('wrong'); btn.disabled = true;
      let n = $('#panel .nudge'); if (!n) { n = document.createElement('div'); n.className = 'verdict no nudge'; $('#panel-body').appendChild(n); }
      n.innerHTML = `<h3>Hmm.</h3><p>${esc(ch.fb)} Try another reply.</p>`;
    }
  }));
}
function talkVerdict(t, ch) {
  return `<div class="verdict ok"><h3>That’s the one.</h3><p>${esc(ch.fb)}</p></div>${codeHtml(t.code)}${srcHtml(t.src)}<div class="actions"><button type="button" class="btn" id="btn-back">Back to the scene</button></div>`;
}

/* ------------------------------------------------------------------ progression */
function checkScene() {
  const ids = CLUE_ORDER[state.scene];
  const talk = TALK_ORDER[state.scene];
  if (!ids.every(id => state.filed[id]) || !state.talked[talk]) return;
  const fixedHere = ids.filter(id => state.fixed[id]).length, fixable = ids.filter(id => CLUES[id].fix).length;
  const last = state.scene === SCENES.length - 1;
  const counts = { known: 0, probable: 0, none: 0 }; ids.forEach(id => counts[CLUES[id].bin]++);
  openPanel('Case closed', SCENES[state.scene].name,
    `Four clues filed: ${counts.known} known cause${counts.known === 1 ? '' : 's'}, ${counts.probable} probable, ${counts.none} with no evidence. ${fixedHere} of ${fixable} hazards fixed.`,
    `<div class="actions"><button type="button" class="btn primary" id="btn-next">${last ? 'Read the report' : 'Open the next case'}</button></div>`);
  $('#btn-next').addEventListener('click', () => {
    $('#panel').hidden = true;
    if (last) return report();
    state.scene++; renderScene(); window.scrollTo({ top: 0 });
  });
}
function report() {
  const clueIds = Object.keys(CLUES); const fixable = clueIds.filter(id => CLUES[id].fix).length;
  const fixed = Object.keys(state.fixed).length;
  const total = clueIds.length + Object.keys(TALKS).length;
  $('#report-grid').innerHTML = [
    ['12', 'clues filed'], [state.firstRight + '/' + total, 'right first time'], [fixed + '/' + fixable, 'hazards fixed'],
    [Math.round(100 * fixed / fixable) + '%', 'clean-air score']].map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('');
  const learned = [
    'Smoking causes most lung cancers, and stopping helps at every age: in a UK study, men who stopped at 50 lowered their risk of lung cancer by age 75 from about 16% to 6%.',
    'People who never smoked but live with a smoker have a risk about 20 to 30% higher. A smoke-free home and car protects everyone in them.',
    'Radon is the second most important cause in many countries. WHO recommends a reference level of 100 Bq/m³, with national levels set no higher than 300; measuring is cheap and fixing is possible.',
    'Outdoor air pollution and diesel exhaust are known causes. Wood smoke from stoves and fumes from high-temperature frying are probable ones.',
    'At work, silica dust, asbestos and welding fumes are known causes. Employers have to control them, and in the EU the law requires it.',
    'Neither coffee nor work stress has been shown to cause lung cancer. The evidence decides what goes in each file.',
  ];
  $('#report-body').innerHTML = `<p class="kicker">What the detective learned</p><ul class="learned">${learned.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
    ${codeHtml('c1')}${codeHtml('c14')}
    <p class="fine">This game shows whether something can cause lung cancer in people in general, a population-level hazard. It cannot tell anyone what caused their own illness, and most people with these exposures never develop lung cancer. Classifications are those of the IARC Monographs; the recommendations are the official wording of the European Code Against Cancer, 5th edition.</p>
    ${srcHtml(['who', 'm100e', 'm83', 'darby', 'whoRadon', 'peto', 'few', 'cutdown', 'light', 'whoEcig', 'loomis', 'm105', 'm95', 'm100c', 'm118', 'm103', 'coffee', 'stress', 'code'])}`;
  show('report'); window.scrollTo({ top: 0 });
}
function reset() {
  Object.assign(state, { scene: 0, filed: {}, fixed: {}, talked: {}, tries: {}, firstRight: 0, radonRead: false });
}

/* ------------------------------------------------------------------ wiring */
function openModal(id) { $(id).hidden = false; const f = $(id).querySelector('input, button'); if (f) f.focus(); }
function closeModals() { $$('.modal').forEach(m => { m.hidden = true; }); }
$('#btn-start').addEventListener('click', () => { reset(); show('play'); renderScene(); });
$('#btn-again').addEventListener('click', () => { reset(); show('play'); renderScene(); window.scrollTo({ top: 0 }); });
$('#btn-how').addEventListener('click', () => openModal('#modal-how'));
$('#btn-settings').addEventListener('click', () => openModal('#modal-settings'));
$('#btn-settings-2').addEventListener('click', () => openModal('#modal-settings'));
$$('[data-close]').forEach(b => b.addEventListener('click', closeModals));
$$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModals(); }));
$('#panel-close').addEventListener('click', closePanel);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModals(); if (!$('#panel').hidden) closePanel(); } });
['contrast', 'large', 'font', 'motion'].forEach(k => $('#opt-' + k).addEventListener('change', e => { state.settings[k] = e.target.checked; saveSettings(); loadSettings(); }));
loadSettings();
show('title');
})();
