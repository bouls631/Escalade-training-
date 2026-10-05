// Vérifie le moteur de niveau, le plan, les chronos et le coach (node test_plan.js)
const fs = require('fs');
const assert = require('assert');

const code = fs.readFileSync('index.html', 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];

// Stub DOM minimal : le script n'écrit que dans des éléments
const makeEl = () => ({
    textContent: '', innerHTML: '', value: '', className: '', disabled: false, dataset: {},
    style: {}, closest: () => null, children: [], parentNode: null, id: '',
    addEventListener() {},
    appendChild(c) { c.parentNode = this; this.children.push(c); },
    classList: {
        set: new Set(),
        add(c) { this.set.add(c); }, remove(c) { this.set.delete(c); },
        toggle(c, on) { on ? this.set.add(c) : this.set.delete(c); },
        has(c) { return this.set.has(c); }
    }
});
const els = {};
global.document = {
    getElementById: id => (els[id] = els[id] || Object.assign(makeEl(), { id })),
    createElement: () => makeEl(),
    querySelectorAll: () => [],
    addEventListener() {}
};
global.localStorage = {
    s: {},
    getItem(k) { return this.s[k] ?? null; },
    setItem(k, v) { this.s[k] = String(v); },
    removeItem(k) { delete this.s[k]; }
};
global.navigator = {};
global.window = { scrollTo() {}, addEventListener() {} };
global.confirm = () => true;

const api = {};
new Function('api', code + [
    'api.get = () => ({ GRADES, PLAN, SETUP, DAYS, cfg, phase, deload, vol, vol2, fingerSets, fingerWork, fingerRest, homeSets, homeRest, homeMinutes, seqFinger, seqHome, autoWeek, syncWeek, weakProfile, profileStats, profileTable, coachVerdict, cycleRate, fingerBest, currentWeek: () => currentWeek });',
    'api.render = () => render();',
    'api.setLevel = n => setLevel(n);',
    'api.day = (n, from) => pickDay(n, from);',
    'api.check = i => toggleItem(i);',
    'api.finish = () => finishDay();',
    'api.start = iso => { store("climbingStart", iso); store("climbingWeekOffset", 0); syncWeek(); };',
    'api.logFinger = () => { document.getElementById("fingerKg").value = "12"; logFinger(); };',
    'api.newCycle = n => newCycle(n);',
    'api.nudgeWeek = n => nudgeWeek(n);',
    'api.toSec = t => toSec(t);',
    'api.restAdj = n => { restLeft = 180; restAdj(n); };',
    'api.paintRest = () => paintRest();',
    'api.chrono = d => chronoFor(d);',
    'api.tick = (fn, ms) => tick(fn, ms);'
].join('\n'))(api);

const G = api.get();
const iso = d => d.toLocaleDateString('sv');
const back = n => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return iso(d);
};

/* ---------- échelle ---------- */
assert.ok(!G.GRADES.includes('6d') && !G.GRADES.includes('7d'), 'pas de cotation en "d" dans l\'échelle');
assert.strictEqual(G.cfg().grade, '6c', 'le niveau par défaut doit être 6c');
api.setLevel(1);
assert.strictEqual(G.cfg().grade, '5b', 'niveau 1 = 5b');
api.setLevel(9);
assert.strictEqual(G.cfg().grade, '8a', 'niveau 9 = 8a');

for (let lv = 1; lv <= 9; lv++) {
    for (let w = 1; w <= 12; w++) {
        api.setLevel(lv);
        api.start(back((w - 1) * 7 + 3));           // en plein milieu de la semaine w
        assert.strictEqual(G.currentWeek(), w, 'semaine auto fausse en S' + w + ' niveau ' + lv);
        G.PLAN.forEach((day, i) => {
            api.day(i + 1);
            const items = day.items(G.cfg());
            assert.ok(items.length > 0, day.d + ' : pas d\'exercices');
            items.forEach(it => it.p.forEach(([k, v]) => {
                assert.ok(String(v ?? '').length, day.d + ' : paramètre vide ' + k);
            }));
        });
    }
}
console.log('ok — échelle sans 6d, 5b → 8a, semaine auto sur 9 niveaux × 12 semaines × 7 jours');

/* ---------- bornes de semaine ---------- */
api.start(back(7 * 40));
assert.strictEqual(G.currentWeek(), 12, 'la semaine doit être plafonnée à 12');
assert.strictEqual(G.autoWeek(), 12, 'autoWeek doit plafonner');
api.start(iso(new Date()));
assert.strictEqual(G.currentWeek(), 1, 'un cycle démarré aujourd\'hui est en semaine 1');
api.start(back(7 * 3));
api.nudgeWeek(2);
assert.strictEqual(G.currentWeek(), 6, 'l\'ajustement manuel doit décaler la semaine');
assert.strictEqual(G.deload(), false, 'S6 n\'est pas une décharge');
api.nudgeWeek(4);
assert.strictEqual(G.currentWeek(), 10, 'l\'ajustement doit suivre le déplacement demandé');
api.nudgeWeek(20);
assert.strictEqual(G.currentWeek(), 12, 'l\'ajustement ne doit pas dépasser 12');
console.log('ok — semaine bornée 1-12, ajustement manuel sans dépassement');

/* ---------- séquence fingerboard ---------- */
api.setLevel(5);
api.start(iso(new Date()));
const f = G.seqFinger();
assert.strictEqual(f[0].k, 'count');
assert.strictEqual(f[0].d, G.SETUP, 'la première phase doit être la mise en place');
assert.ok(f[0].t.includes('Mise en place'), 'la première phase doit être nommément la mise en place');
assert.strictEqual(f[1].d, G.fingerWork(), 'la deuxième phase est le travail');
assert.strictEqual(f[2].d, G.fingerRest(), 'la troisième phase est le repos');
assert.strictEqual(f.length, G.fingerSets() * 3 - 1, 'il manque une phase dans la séquence fingerboard');
assert.ok(!f.some(p => p.t.includes('Mise en place') && p.d !== G.SETUP), 'toutes les mises en place durent 10 s');
console.log('ok — fingerboard : mise en place ' + G.SETUP + ' s avant chaque série (' + f.length + ' phases)');

/* ---------- deux jours de salle seulement : mardi et jeudi ---------- */
const mur = G.PLAN.map((d, i) => ({ day: G.DAYS[i], kind: d.kind })).filter(x => x.kind === 'mur');
assert.deepStrictEqual(mur.map(x => x.day), ['Mardi', 'Jeudi'], 'les seules séances de salle doivent être mardi et jeudi');
assert.strictEqual(G.PLAN.filter(d => d.kind === 'maison').length, 2, 'vendredi et samedi doivent être des séances à la maison');
assert.ok(G.PLAN[5].name.includes('Endurance'), 'le samedi doit être de l\'endurance à la maison');
const maison = G.PLAN[4].items(G.cfg());
assert.ok(maison.every(it => !/barre|chaise/i.test(it.t + it.n)), 'la séance du vendredi ne doit dépendre ni d\'une barre ni d\'une chaise');
assert.ok(maison.filter(it => /anneaux/i.test(it.t)).length >= 2, 'les anneaux doivent remplacer la barre et les dips sur chaise');
assert.ok(maison.every(it => it.t.length && it.rest >= 45), 'chaque exercice maison doit être complet');
api.setLevel(5);
api.start(iso(new Date()));
assert.ok(G.vol2(G.cfg()) < G.vol(G.cfg()), 'le jeudi doit être plus léger que le mardi');
assert.ok(G.PLAN[1].items(G.cfg())[1].p.some(p => /^[\d]+$/.test(String(p[1]))), 'la lecture de voie garde le volume du mardi');
console.log('ok — salle mardi et jeudi uniquement, vendredi et samedi à la maison (' +
    G.vol(G.cfg()) + ' voies mardi, ' + G.vol2(G.cfg()) + ' jeudi)');

/* ---------- séquence de la séance maison ---------- */
const r = G.seqHome();
const items = G.PLAN[4].items(G.cfg());
const waits = r.filter(p => p.k === 'wait');
const counts = r.filter(p => p.k === 'count');
assert.strictEqual(waits.length, items.reduce((n, it) => n + it.sets, 0), 'un passage par série');
assert.strictEqual(waits.length - 1, counts.length, 'chaque repos doit suivre une série, sauf la dernière');
items.forEach(it => {
    assert.ok(it.rest >= 45, 'repos trop court sur ' + it.t);
    assert.ok(r.some(p => p.k === 'count' && p.d === it.rest), 'repos manquant pour ' + it.t);
});
assert.ok(counts.every(p => p.float), 'chaque repos doit afficher le chrono flottant');
assert.ok(G.homeMinutes() > 10, 'durée de séance maison incohérente');
console.log('ok — séance maison : ' + waits.length + ' séries, ' + counts.length + ' repos (tractions ' +
    G.homeRest(0) + ' s, pompes ' + G.homeRest(1) + ' s), environ ' + G.homeMinutes() + ' min');

/* ---------- force de doigt ---------- */
localStorage.removeItem('climbingFinger');
api.logFinger();
let log = JSON.parse(localStorage.getItem('climbingFinger'));
assert.strictEqual(log.length, 1);
assert.strictEqual(log[0].kg, 12);
assert.strictEqual(log[0].hold, G.cfg().hold);
assert.strictEqual(G.fingerBest()[G.cfg().hold], 12, 'le record doit être 12 kg');
localStorage.setItem('climbingFinger', JSON.stringify([
    { date: back(10), hold: '10mm', kg: 8, sets: 5, work: 7, week: 1 },
    { date: back(2), hold: '10mm', kg: 14, sets: 5, work: 7, week: 2 },
    { date: back(1), hold: '15mm', kg: 5, sets: 5, work: 7, week: 2 }
]));
assert.strictEqual(G.fingerBest()['10mm'], 14, 'le record retient le meilleur poids');
assert.strictEqual(G.fingerBest()['15mm'], 5, 'chaque prise a son propre record');
console.log('ok — force de doigt : log du poids et record par prise');

/* ---------- profil faible ---------- */
localStorage.removeItem('climbingRoutes');
assert.strictEqual(G.weakProfile(), null, 'aucun profil faible sans données');
localStorage.setItem('climbingRoutes', JSON.stringify([
    { name: 'a', grade: '6c', profile: 'Dévers', status: 'fail', date: new Date().toISOString() },
    { name: 'b', grade: '6c', profile: 'Dévers', status: 'work', date: new Date().toISOString() },
    { name: 'c', grade: '6c', profile: 'Dalle', status: 'flash', date: new Date().toISOString() },
    { name: 'd', grade: '6c', profile: 'Dalle', status: 'flash', date: new Date().toISOString() }
]));
assert.strictEqual(G.weakProfile().p, 'Dévers', 'le profil le moins flashé doit être désigné');
assert.strictEqual(G.weakProfile().f, 0);
assert.strictEqual(G.profileStats().length, 2, 'les deux profils doivent être comptés');
assert.ok(G.PLAN[3].brief(G.cfg()).includes('dévers'), 'le brief du jeudi doit citer la priorité');
assert.ok(G.PLAN[3].items(G.cfg())[1].p.some(p => p[1] === 'Dévers'), 'les essais flash doivent prioriser le profil faible');
assert.ok(G.profileTable().includes('Dévers'), 'le bilan doit lister les taux par profil');
api.render();
assert.ok(els.stProfiles.innerHTML.includes('Dévers'), 'la carte bilan doit afficher les profils');
localStorage.setItem('climbingRoutes', JSON.stringify([
    { name: 'a', grade: '6c', profile: 'Toit', status: 'fail', date: new Date().toISOString() },
    { name: 'b', grade: '6c', profile: 'Toit', status: 'fail', date: new Date().toISOString() }
]));
assert.strictEqual(G.weakProfile(), null, 'un seul profil ne permet pas de conclure');
console.log('ok — profil faible : désigné seulement avec 2 profils et 2 voies chacun, priorisé au jeudi');

/* ---------- coach ---------- */
const routesAt = (statuses, grade = '6c', days = 4) => statuses.map((status, i) => ({
    name: 'v' + i,
    grade,
    profile: 'Dévers',
    status,
    date: iso(new Date(Date.now() - (i % days) * 864e5)) + 'T10:00:00.000Z'
}));
api.setLevel(5);
localStorage.setItem('climbingRoutes', JSON.stringify(routesAt(['flash', 'flash', 'work'])));
let v = G.coachVerdict();
assert.ok(v.need !== undefined, '3 voies ne suffisent pas pour un avis');
assert.strictEqual(v.need, 3);
localStorage.setItem('climbingRoutes', JSON.stringify(routesAt(Array(8).fill('flash'))));
v = G.coachVerdict();
assert.ok(v.up, '8 flash à la cotation cible doivent proposer de monter');
assert.strictEqual(v.rate, 1);
localStorage.setItem('climbingRoutes', JSON.stringify(routesAt(Array(8).fill('fail'))));
assert.ok(G.coachVerdict().down, '0 % de flash doit proposer de descendre');
localStorage.setItem('climbingRoutes', JSON.stringify(routesAt(['flash', 'flash', 'flash', 'work', 'fail'])));
assert.ok(G.coachVerdict().hold, 'un taux intermédiaire doit conserver le niveau');
const others = routesAt(Array(8).fill('flash'), '7a');
localStorage.setItem('climbingRoutes', JSON.stringify(others));
assert.ok(G.coachVerdict().need !== undefined, 'les voies d\'une autre cotation ne comptent pas');
const stale = routesAt(Array(8).fill('flash')).map(x => ({ ...x, date: x.date.slice(0, 10) }));
localStorage.setItem('climbingRoutes', JSON.stringify(routesAt(Array(8).fill('flash')).map((x, i) => ({ ...x, date: back(40 + i) }))));
assert.ok(G.coachVerdict().need !== undefined, 'les voies de plus de 3 semaines sont ignorées');
console.log('ok — coach : 5 voies et 3 jours minimum, à la bonne cotation, moins de 3 semaines');

/* ---------- fin de cycle ---------- */
localStorage.setItem('climbingRoutes', JSON.stringify(routesAt(Array(8).fill('flash'))));
api.setLevel(5);
assert.ok(G.cycleRate().rate === 1, 'le taux du cycle doit être calculé');
api.start(back(7 * 11));
api.setLevel(5);
api.render();
assert.ok(els.cycleCard.innerHTML.includes('Cycle de 12 semaines terminé'), 'la carte de fin de cycle doit apparaître en S12');
assert.ok(els.cycleCard.innerHTML.includes('monter'), 'un cycle réussi doit proposer de monter');
api.start(back(7 * 5));
api.render();
assert.strictEqual(els.cycleCard.innerHTML, '', 'pas de carte de fin de cycle avant S12');
api.start(back(7 * 11));
api.setLevel(5);
api.newCycle(1);
assert.strictEqual(JSON.parse(localStorage.getItem('climbingStart')), iso(new Date()), 'le cycle doit repartir d\'aujourd\'hui');
assert.strictEqual(JSON.parse(localStorage.getItem('climbingLevel')), 6, 'un cycle réussi doit monter d\'un cran');
assert.strictEqual(G.currentWeek(), 1, 'le nouveau cycle doit repartir en semaine 1');
api.newCycle(0);
assert.strictEqual(JSON.parse(localStorage.getItem('climbingLevel')), 6, 'rester au même niveau ne change rien');
console.log('ok — fin de cycle : remise à zéro du cycle et montée d\'un cran si le taux est bon');

/* ---------- checklist ---------- */
localStorage.removeItem('climbingRoutes');
api.setLevel(5);
api.start(iso(new Date()));
api.day(2);
const nb = G.PLAN[1].items(G.cfg()).length;
api.check(0);
assert.strictEqual(els.todayPct.textContent, Math.round(1 / nb * 100) + ' %', 'la progression ne suit pas');
api.finish();
assert.strictEqual(els.todayPct.textContent, '100 %', 'la séance ne se valide pas');
assert.strictEqual(JSON.parse(localStorage.getItem('climbingSessions')).length, 1, 'séance non enregistrée');
assert.ok(els.weekStrip.innerHTML.includes('✓'), 'la semaine ne marque pas la séance faite');
console.log('ok — checklist, validation de séance et suivi dans la semaine');

/* ---------- chrono sur tous les temps demandés ---------- */
[['20 min', 1200], ['Repos 5 min', 300], ['3 min max', 180], ['7s', 7], ['8 h', 28800],
 ['1,5 min', 90], ['Étirement 30 s', 30], ['3 × 15 s', 15]].forEach(([txt, s]) => {
    assert.strictEqual(api.toSec(txt), s, 'temps mal lu : ' + txt);
});
[['6c', 'cotation'], ['15mm', 'taille de prise'], ['Repos', 'mot seul'],
 ['90/90, cercles', 'exercices'], ['1 semaine de repos', 'texte'],
 ['3 × 6', 'séries sans unité'], ['Voies', 'nombre de voies']].forEach(([txt, why]) => {
    assert.strictEqual(api.toSec(txt), 0, why + ' ne doit pas démarrer un chrono : ' + txt);
});

let cliquables = 0;
G.PLAN.forEach(day => day.items(G.cfg()).forEach(it => {
    if (api.toSec(it.d) > 0) cliquables++;
    it.p.forEach(([k, v]) => { if (api.toSec(v) > 0) cliquables++; });
}));
assert.ok(cliquables > 25, 'les durées du programme doivent être cliquables (' + cliquables + ')');

api.restAdj(1);
assert.strictEqual(els.restVal.textContent, '3:30', 'le chrono doit se rallonger');
api.restAdj(-1);
api.restAdj(-1);
assert.strictEqual(els.restVal.textContent, '2:30', 'le chrono doit se raccourcir');
console.log('ok — chrono : ' + cliquables + ' durées du programme lançables et modifiables');

/* ---------- le chrono vit sur la page du jour ---------- */
assert.strictEqual(api.chrono(1), 'finger', 'le lundi doit afficher le chrono doigts');
assert.strictEqual(api.chrono(5), 'home', 'le vendredi doit afficher le chrono maison');
[2, 3, 4, 6, 7].forEach(d => {
    assert.strictEqual(api.chrono(d), null, 'aucun chrono le ' + G.DAYS[d - 1]);
});
assert.ok(G.seqFinger().length > 1 && G.seqHome().length > 1, 'les deux séquences doivent exister');

const shown = id => !els[id].classList.has('hidden');
api.day(1);
assert.ok(shown('todayFinger') && shown('todayFingerLog') && !shown('todayHome'), 'le lundi montre le chrono doigts');
api.day(5);
assert.ok(shown('todayHome') && !shown('todayFinger'), 'le vendredi montre le chrono maison');
api.day(3);
assert.ok(!shown('todayFinger') && !shown('todayHome'), 'aucun chrono le mercredi');
assert.strictEqual(els.vForce, undefined, 'l\'onglet Force doit être supprimé : tout est dans l\'onglet Auj.');
console.log('ok — chronos et fingerboard sur la page du jour, onglet Force supprimé');

/* ---------- un chrono arrêté ne doit jamais repartir ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
    let fired = 0;
    const ctl = api.tick(() => { fired++; if (fired === 1) ctl.stop(); }, 10);   // stop() depuis le callback
    await sleep(150);
    assert.strictEqual(fired, 1, 'un chrono arrêté depuis son callback se relance et compte 2× trop vite');

    let n = 0;
    const c2 = api.tick(() => n++, 10);
    await sleep(150);
    c2.stop();
    const seen = n;
    await sleep(80);
    assert.strictEqual(n, seen, 'un chrono arrêté doit rester arrêté');

    const phases = G.seqFinger().length;
    assert.ok(phases > 1, 'la séquence doit avoir plusieurs phases');
    console.log('ok — aucun décompte fantôme : une phase = une seconde');
})().catch(e => { console.error(e); process.exit(1); });