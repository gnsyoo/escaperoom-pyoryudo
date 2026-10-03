import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pack = JSON.parse(readFileSync(resolve(root, 'data/ch01.puzzles.json'), 'utf8'));
const ids = new Set(pack.puzzles.map(p => p.id));
const itemIds = new Set(pack.items.map(i => i.id));
assert.equal(pack.schemaVersion, 1);
assert.equal(pack.puzzles.length, 25);
assert.equal(ids.size, 25);
assert.equal(pack.items.length, 13);
assert.equal(itemIds.size, 13);
assert.equal(pack.puzzles.filter(p => p.category === 'core').length, 12);
assert.equal(pack.puzzles.filter(p => p.category === 'action').length, 13);
for (let i = 1; i <= 25; i++) assert(ids.has(`P${String(i).padStart(2, '0')}`));
const modes = new Set(['inspect', 'repeat', 'use', 'code', 'combine', 'arrange', 'switch', 'valves', 'move']);
for (const p of pack.puzzles) {
  assert(modes.has(p.mode), `${p.id}: unknown mode`);
  assert.equal(p.hints.length, 3, `${p.id}: hints`);
  for (const text of [...p.hints, p.clue, p.failText, p.repeatText]) assert(typeof text === 'string' && text.length > 0);
  for (const id of p.requiresCompleted) assert(ids.has(id) && id !== p.id, `${p.id}: invalid dependency ${id}`);
  for (const id of [...p.requiresItems, ...p.effects.consumeItems, ...p.effects.grantItems]) assert(itemIds.has(id), `${p.id}: invalid item ${id}`);
  for (const id of p.effects.consumeItems) assert(p.requiresItems.includes(id), `${p.id}: consume without item requirement`);
  if (['code', 'switch'].includes(p.mode)) assert.equal(typeof p.expectedAnswer, 'string');
  if (['inspect', 'move'].includes(p.mode)) assert.equal(p.expectedAnswer, true);
  if (p.mode === 'repeat') assert.equal(p.expectedAnswer, 3);
  if (['combine', 'arrange'].includes(p.mode)) assert(Array.isArray(p.expectedAnswer) && p.expectedAnswer.length === 2);
  if (p.mode === 'use') assert(itemIds.has(p.expectedAnswer.itemId) && typeof p.expectedAnswer.targetId === 'string');
  if (p.mode === 'valves') assert.deepEqual(p.expectedAnswer, {sea:'closed',tank:'closed',outlet:'open'});
}
function simulate(order) {
  const done = new Set(), inventory = new Map(), evidence = new Set();
  for (const id of order) {
    const p = pack.puzzles.find(p => p.id === id);
    assert(p && !done.has(id));
    assert(p.requiresCompleted.every(dep => done.has(dep)), `${id}: dependency order`);
    for (const item of p.requiresItems) assert((inventory.get(item) || 0) >= 1, `${id}: unavailable ${item}`);
    const access = {R02:'P10',R03:'P17',R04:'P21'}[p.location.sceneId];
    if (access) assert(done.has(access), `${id}: inaccessible scene`);
    for (const item of p.effects.consumeItems) {
      inventory.set(item, inventory.get(item) - 1);
      assert(inventory.get(item) >= 0);
    }
    for (const item of p.effects.grantItems) inventory.set(item, (inventory.get(item) || 0) + 1);
    for (const item of p.effects.grantEvidence) evidence.add(item);
    done.add(id);
  }
  assert(done.has('P25'));
  assert(evidence.has('circuit_plan') && evidence.has('drain_procedure') && evidence.has('exit_cipher'));
  return {done, inventory};
}
simulate(pack.puzzles.map(p => p.id));
simulate(['P01','P02','P03','P04','P05','P06','P13','P08','P07','P09','P10','P11','P12','P14','P15','P17','P18','P20','P16','P21','P22','P19','P23','P24','P25']);
for (let seed = 1; seed <= 200; seed++) {
  let rng = seed, remaining = [...pack.puzzles], done = new Set(), order = [];
  while (remaining.length) {
    const ready = remaining.filter(p => p.requiresCompleted.every(dep => done.has(dep)));
    assert(ready.length > 0, 'dependency cycle');
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    const p = ready[rng % ready.length];
    done.add(p.id); order.push(p.id); remaining = remaining.filter(q => q.id !== p.id);
  }
  simulate(order);
}
const ch01 = readFileSync(resolve(root, 'docs/02_CHAPTER01_SPEC.md'), 'utf8');
for (const id of ids) assert(ch01.includes(`| ${id} |`), `missing chapter table ${id}`);
for (const id of ['P05','P16','P24']) {
  const p = pack.puzzles.find(p => p.id === id);
  const row = ch01.split('\n').find(line => line.startsWith(`| ${id} |`));
  assert(row.includes(p.expectedAnswer), `${id}: document answer mismatch`);
}
for (const name of ['README.md','docs/00_MASTER_SPEC.md','docs/01_GAME_DESIGN.md','docs/02_CHAPTER01_SPEC.md','docs/03_ART_UI_GUIDE.md','docs/04_TECH_SPEC.md','docs/05_AI_IMPLEMENTATION_TASKS.md','docs/06_QA_CHECKLIST.md']) {
  if (!existsSync(resolve(root, name))) { assert(name === 'docs/00_MASTER_SPEC.md'); continue; }
  const body = readFileSync(resolve(root, name), 'utf8');
  assert(!body.includes('\uFFFD'), `${name}: replacement character`);
  assert.equal((body.match(/^```/gm) || []).length % 2, 0, `${name}: unclosed fence`);
  for (const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    assert(existsSync(resolve(dirname(resolve(root, name)), target)), `${name}: broken link ${target}`);
  }
}
console.log('PASS: 25 steps, 12 core puzzles, 13 items; references and answer shapes valid.');
console.log('PASS: canonical path, alternate path and 200 dependency-valid orders have sufficient items and scene access.');
console.log('PASS: chapter table answers, local document links and code fences.');
console.log('Scope: static content validation only; no game runtime or device tests performed.');
