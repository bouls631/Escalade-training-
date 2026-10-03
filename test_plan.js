// Vérifie le moteur de niveau + plan (node test_plan.js)
const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];

// Stub DOM minimal : le script ne fait qu'écrire dans des éléments
const makeEl = () => ({
    textContent: '', innerHTML: '', value: '', className: '', disabled: false, style: {},
    addEventListener() {}, appendChild() {},
    classList: { add() {}, remove() {}, toggle() {} }
});
let ready = null;
const els = {};
global.document = {
    addEventListener: (ev, cb) => { if (ev === 'DOMContentLoaded') ready = cb; },
    getElementById: id => (els[id] = els[id] || makeEl()),
    createElement: () => makeEl(),
    querySelectorAll: () => []
};
global.querySelectorAll = () => [];
global.localStorage = { store: {}, getItem(k) { return this.store[k] ?? null; }, setItem(k, v) { this.store[k] = String(v); }, removeItem(k) { delete this.store[k]; } };
let alerted = null;
global.alert = m => { alerted = m; };
global.navigator = {};

const api = {};
new Function('api', code + '\napi.get = () => ({ GRADES, shiftGrade, levelCfg, PLAN, DAYS, isDeload, weekVolume, ringsPresets, fingerProtocol }); api.day = n => selectDay(n); api.ask = () => coachSuggest(); api.setLevel = n => setLevel(n);')(api);
const { GRADES, shiftGrade, levelCfg, PLAN, DAYS, isDeload, weekVolume, ringsPresets, fingerProtocol } = api.get();

// Le plan couvre bien 7 jours et chaque jour a un brief + des exercices
assert.strictEqual(PLAN.length, 7);
PLAN.forEach(day => {
    assert.ok(day.brief(levelCfg()).length > 20, day.short + ' : brief manquant');
    assert.ok(day.build(levelCfg(), 3, fingerProtocol(), ringsPresets(levelCfg())).length > 0, day.short + ' : pas d\'exercices');
});

// La cotation suit le niveau : 1 → 5+, 5 → 6c, 9 → 7c
assert.strictEqual(shiftGrade('6c', 0), '6c');
assert.strictEqual(shiftGrade('6c', -4), '5+');
assert.strictEqual(shiftGrade('6c', 4), '7c');
assert.strictEqual(shiftGrade('6c', -99), GRADES[0], 'bornage bas');
assert.strictEqual(shiftGrade('6c', 99), GRADES[GRADES.length - 1], 'bornage haut');

[1, 5, 9].forEach(lv => {
    localStorage.setItem('climbingLevel', lv);
    ready();
    assert.strictEqual(levelCfg().grade, lv === 5 ? '6c' : lv < 5 ? '5+' : '7c', 'niveau ' + lv);
    assert.ok(GRADES.includes(levelCfg().easy), 'cotation hors échelle au niveau ' + lv);
});

// Volume : plus on monte, plus il y a de voies, et S4/S8/S12 sont des semaines de décharge
localStorage.setItem('climbingLevel', '1'); ready();
const lowVolume = weekVolume(levelCfg());
localStorage.setItem('climbingLevel', '9'); ready();
assert.ok(weekVolume(levelCfg()) > lowVolume, 'le volume ne monte pas avec le niveau');
localStorage.setItem('climbingWeek', '4'); ready();
assert.ok(isDeload() && weekVolume(levelCfg()) < 6, 'S4 doit être une semaine de décharge');
console.log('ok — 7 jours, cotations ' + GRADES[0] + '→' + GRADES[GRADES.length - 1] + ', décharge S4/S8/S12');

// Rendu complet : 9 niveaux × 12 semaines × 7 jours
for (let lv = 1; lv <= 9; lv++) {
    localStorage.setItem('climbingLevel', lv);
    for (let w = 1; w <= 12; w++) {
        localStorage.setItem('climbingWeek', w);
        ready();
        for (let d = 1; d <= 7; d++) {
            api.day(d);
            assert.ok(els.dayPlan.innerHTML.includes(DAYS[d - 1]), 'jour ' + d + ' non rendu en S' + w + ' niveau ' + lv);
        }
    }
}
assert.ok(!/[^\x00-\x7F]/.test(els.coachBox.innerHTML.replace(/[·≈→×–—éèêàçùôâîïûÉÈÀ]/g, '')), 'caractères suspects dans le texte du coach');
console.log('ok — rendu complet sur 9 niveaux × 12 semaines × 7 jours');

// Avis du coach : monte si ça flashe, descend si ça ne passe pas, ne bouge pas entre les deux
const seed = statuses => {
    localStorage.setItem('climbingRoutes', JSON.stringify(
        statuses.map((status, i) => ({ name: 'v' + i, grade: '6c', status, profile: 'dalle', notes: '' }))));
};
[['flash', 10, '6'], ['fail', 10, '4'], ['work', 10, '4'], ['mix', 0, '5']].forEach(([caso, count, expected]) => {
    localStorage.setItem('climbingLevel', '5');
    ready();
    if (caso === 'mix') seed([...Array(5).fill('flash'), ...Array(5).fill('work')]);
    else seed(Array(count).fill(caso));
    api.ask();
    assert.strictEqual(localStorage.getItem('climbingLevel'), expected, 'coach : mauvais niveau pour le cas ' + caso);
    assert.ok(alerted, 'coach : aucun avis rendu');
});
localStorage.setItem('climbingRoutes', '[]');
localStorage.setItem('climbingLevel', '5'); ready();
api.ask();
assert.strictEqual(localStorage.getItem('climbingLevel'), '5', 'coach : doit demander des données au lieu de changer le niveau');
console.log('ok — avis du coach : 100% flash → on monte, 0% ou que du work → on descend, 50% → on garde');