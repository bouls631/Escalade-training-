// Vérifie le moteur de niveau + le plan (node test_plan.js)
const fs = require('fs');
const assert = require('assert');

const code = fs.readFileSync('index.html', 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];

// Stub DOM minimal : le script n'écrit que dans des éléments
const makeEl = () => ({
    textContent: '', innerHTML: '', value: '', className: '', disabled: false, dataset: {},
    style: {}, closest: () => null, children: [],
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
global.localStorage = {
    s: {},
    getItem(k) { return this.s[k] ?? null; },
    setItem(k, v) { this.s[k] = String(v); },
    removeItem(k) { delete this.s[k]; }
};
let alerted = null;
global.alert = m => { alerted = m; };
global.confirm = () => true;
global.navigator = {};
global.window = { scrollTo() {}, addEventListener() {} };

const api = {};
new Function('api', code + [
    'api.get = () => ({ GRADES, cfg, PLAN, PHASES, phase, deload, vol, fingerSets, fingerWork, ringSets, ringsMinutes, todayIdx });',
    'api.setLevel = n => setLevel(n);',
    'api.week = n => { currentWeek = n; render(); };',
    'api.day = (n, from) => pickDay(n, from);',
    'api.ask = () => askCoach();',
    'api.check = i => toggleItem(i);',
    'api.finish = () => finishDay();'
].join('\n'))(api);
const { GRADES, cfg, PLAN, PHASES, phase, deload, vol, fingerSets, fingerWork, ringSets, ringsMinutes } = api.get();

// Échelle française : pas de 6d, 6c au milieu, bornes 5b → 8a
assert.ok(!GRADES.includes('6d') && !GRADES.includes('7d'), 'pas de cotation en "d" dans l\'échelle');
assert.strictEqual(cfg().grade, '6c', 'le niveau par défaut doit être 6c');
api.setLevel(1);
assert.strictEqual(cfg().grade, '5b', 'niveau 1 = 5b');
api.setLevel(9);
assert.strictEqual(cfg().grade, '8a', 'niveau 9 = 8a');

// Toute cotation produite par le plan existe dans l'échelle
for (let lv = 1; lv <= 9; lv++) {
    for (let w = 1; w <= 12; w++) {
        localStorage.setItem('climbingLevel', lv);
        localStorage.setItem('climbingWeek', w);
        api.setLevel(lv);
        PLAN.forEach((day, i) => {
            api.day(i + 1);
            const items = day.items(cfg());
            assert.ok(items.length > 0, day.d + ' : pas d\'exercices');
            items.forEach(it => {
                it.p.forEach(([k, v]) => {
                    GRADES.forEach(gr => {
                        if (String(v).split(' ').includes(gr)) assert.ok(GRADES.includes(gr));
                    });
                });
            });
        });
    }
}
console.log('ok — échelle sans 6d, 5b → 8a, toutes les cotations du plan sont valides');

// 7 jours, chacun avec un brief et des exercices
assert.strictEqual(PLAN.length, 7);
PLAN.forEach(day => {
    assert.ok(day.brief(cfg()).length > 30, day.d + ' : brief manquant');
    assert.ok(day.items(cfg()).every(it => it.t && it.d && it.n), day.d + ' : exercice incomplet');
});

// Le volume monte avec le niveau et baisse en semaine de décharge
api.setLevel(1);
const low = vol(cfg());
api.setLevel(9);
assert.ok(vol(cfg()) > low, 'le volume ne monte pas avec le niveau');
api.week(4);
assert.ok(deload() && vol(cfg()) < 6, 'S4 doit être une semaine de décharge');
assert.ok(ringSets() >= 2 && fingerSets() >= 2, 'jamais moins de 2 séries');
assert.ok(ringsMinutes() >= 25, 'séance anneaux trop courte');
api.week(1);
console.log('ok — décharge S4/S8/S12, volume progressif, séries garanties');
console.log('    phase ' + phase() + ' · ' + PHASES[phase()].name + ' · doigt ' + fingerSets() + '×' + fingerWork() + 's');

// La séance du jour se coche et se valide
localStorage.setItem('climbingWeek', '1');
api.setLevel(5);
api.day(2);
const nb = PLAN[1].items(cfg()).length;
api.check(0);
assert.strictEqual(els.todayPct.textContent, Math.round(1 / nb * 100) + ' %', 'la progression ne suit pas');
api.finish();
assert.strictEqual(els.todayPct.textContent, '100 %', 'la séance ne se valide pas');
assert.strictEqual(JSON.parse(localStorage.getItem('climbingSessions')).length, 1, 'séance non enregistrée');
assert.ok(els.weekStrip.innerHTML.includes('✓'), 'la semaine ne marque pas la séance faite');
console.log('ok — checklist, validation de séance et suivi dans la semaine');

// Avis du coach : monte si ça flashe, descend si ça ne passe pas, ne bouge pas entre les deux
const seed = statuses => localStorage.setItem('climbingRoutes', JSON.stringify(
    statuses.map((status, i) => ({ name: 'v' + i, grade: '6c', status, profile: 'Dalle', notes: '' }))));
[['flash', 6], ['fail', 4], ['work', 4], ['mix', 5]].forEach(([caso, expected]) => {
    api.setLevel(5);
    seed(caso === 'mix' ? [...Array(5).fill('flash'), ...Array(5).fill('work')] : Array(10).fill(caso));
    api.ask();
    assert.strictEqual(parseInt(localStorage.getItem('climbingLevel'), 10), expected, 'coach : mauvais niveau pour le cas ' + caso);
    assert.ok(alerted, 'coach : aucun avis rendu');
});
localStorage.setItem('climbingRoutes', '[]');
api.setLevel(5);
api.ask();
assert.strictEqual(parseInt(localStorage.getItem('climbingLevel'), 10), 5, 'coach : il doit demander des données');
console.log('ok — avis du coach : 100 % flash → on monte, 0 % ou que du work → on descend, 50 % → on garde');