import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceChapter, advanceDialogue, attempt, canVisit, caveTimeout, chapterComplete, chapters, enterCave, ending, has, leaveCave, moveTo, newGame, owns, puzzles, retryFinal, revisitOpen, tidePhase, validateState, waitTide } from '../../src/domain/game.ts';
import type { GameState } from '../../src/domain/game.ts';
import { docs } from '../../src/content/season.ts';

const drain=(s:GameState)=>{while(s.dialogueQueue.length)s=advanceDialogue(s);return s;};
function solve(s:GameState,id:string,answer?:unknown){
  const p=puzzles.find(p=>p.id===id)!;
  if(p.location.sceneId!=='ANY'&&(s.sceneId!==p.location.sceneId||s.viewId!==p.location.viewId)){
    const moved=moveTo(s,p.location.sceneId,p.location.viewId);
    assert.notStrictEqual(moved,s,id+': cannot reach '+p.location.sceneId+' '+p.location.viewId);
    s=moved;
  }
  const r=attempt(s,id,answer===undefined?p.expectedAnswer:answer);
  assert.equal(r.status,'success',id+': '+r.message);
  return drain(r.state);
}
type Plan = { skip?:string[]; answers?:Record<string,unknown> };
function playChapter(s:GameState,chapterId:string,plan:Plan={}){
  assert.equal(s.chapterId,chapterId);
  for(const p of puzzles.filter(p=>p.chapter===chapterId)){
    if(plan.skip?.includes(p.id))continue;
    if(p.id==='C03_02'){
      assert.equal(enterCave(s,180000).status,'wrong','cave is closed at high tide');
      s=waitTide(s,true);assert.equal(tidePhase(s.tide),'LOW');
      const r=enterCave(s,180000);assert.equal(r.status,'success',r.message);s=drain(r.state);continue;
    }
    s=solve(s,p.id,plan.answers?.[p.id]);
    assert.deepEqual(validateState(s),s,'save replay after '+p.id);
  }
  assert.ok(chapterComplete(s),chapterId+' complete');
  return s;
}
function playTo(chapterId:string,plan:Plan={}){
  let s=drain(newGame());
  for(const c of chapters){
    s=playChapter(s,c.id,plan);
    if(c.id===chapterId)return s;
    s=drain(advanceChapter(s));
    assert.deepEqual(validateState(s),s,'save replay after entering '+s.chapterId);
  }
  return s;
}

test('every season puzzle references real places, items, clues and dialogue',()=>{
  const ids=new Set<string>();
  for(const p of puzzles){
    assert.ok(!ids.has(p.id),'duplicate '+p.id);ids.add(p.id);
    assert.equal(p.hints.length,3,p.id+' hints');
    for(const id of p.requiresCompleted)assert.ok(puzzles.some(q=>q.id===id),p.id+' requires '+id);
    for(const id of p.effects.clues||[])assert.ok(id in docs,p.id+' clue '+id);
    for(const id of p.ui?.docs||[])assert.ok(id in docs,p.id+' doc '+id);
    if(p.chapter==='CH01'||p.location.sceneId==='ANY')continue;
    const chapter=chapters.find(c=>c.id===p.chapter)!.def!;
    const view=chapter.views.find(v=>v.id===p.location.viewId);
    assert.ok(view,p.id+' view');
    assert.ok(view!.hotspots.some(h=>h.id===p.location.hotspotId),p.id+' hotspot '+p.location.hotspotId);
  }
});

test('the whole season can be finished in order with the true ending and every save replays',()=>{
  const s=playTo('CH10');
  assert.equal(ending(s),'T');
  assert.deepEqual([...s.evidenceIds].filter(id=>/^E0/.test(id)).sort(),['E01','E02','E03','E04']);
  assert.equal(s.flags.acknowledged_responsibility,true);assert.equal(s.flags.all_rescued,true);
  assert.equal(advanceChapter(s),s,'no chapter after CH10');
});

test('choices and missing records lead to the normal ending, violence to the bad ending with retry',()=>{
  let s=playTo('CH10',{answers:{C08_12:'deny'}});
  assert.equal(ending(s),'N');
  s=playTo('CH10',{skip:['C02_08']});assert.equal(ending(s),'N');
  s=playTo('CH10',{answers:{C10_12:'violence'}});assert.equal(ending(s),'B');
  s=retryFinal(s);assert.equal(has(s,'C10_12'),false);assert.deepEqual(validateState(s),s);
  s=solve(s,'C10_12','nonviolent');assert.equal(ending(s),'T');
});

test('missed optional records can be recovered by a safe revisit between CH05 and CH08',()=>{
  let s=playTo('CH04',{skip:['C02_08','C04_08']});
  s=drain(advanceChapter(s));
  assert.equal(s.chapterId,'CH05');assert.ok(revisitOpen(s));
  assert.ok(canVisit(s,'C02','A'));assert.equal(canVisit(s,'C03','A'),false,'cave chapter is not a revisit target');
  s=solve(s,'C02_08');s=solve(s,'C04_08');
  assert.ok(s.evidenceIds.includes('E01')&&s.evidenceIds.includes('E02'));
  assert.deepEqual(validateState(s),s);
  s=moveTo(s,'C05','A');assert.equal(s.sceneId,'C05');
});

test('the cave timer rolls back progress made inside and closes the entrance until low tide',()=>{
  let s=playTo('CH02');s=drain(advanceChapter(s));
  s=solve(s,'C03_01');
  assert.equal(canVisit(s,'C03','B'),false);
  s=waitTide(s,true);s=drain(enterCave(s,180000).state);
  assert.equal(s.viewId,'B');
  s=solve(s,'C03_03');s=solve(s,'C03_04');
  assert.deepEqual(validateState(s),s);
  s=caveTimeout(s);
  assert.equal(s.viewId,'A');assert.equal(s.timer,null);assert.equal(has(s,'C03_04'),false);assert.equal(owns(s,'reflector_disk'),false);
  assert.equal(tidePhase(s.tide),'HIGH');assert.equal(enterCave(s,180000).status,'wrong');
  assert.deepEqual(validateState(s),s);
  s=waitTide(s,true);s=drain(enterCave(s,null).state);s=solve(s,'C03_03');
  s=leaveCave(s);assert.equal(s.viewId,'A');assert.ok(owns(s,'reflector_disk'),'leaving voluntarily keeps progress');
  assert.equal(tidePhase(s.tide),'RISING');
});

test('wrong answers in the new puzzle types keep state and items',()=>{
  let s=playTo('CH05');s=drain(advanceChapter(s));
  s=solve(s,'C06_01');s=solve(s,'C06_02');s=solve(s,'C06_03');
  for(const answer of [['lever','pin_high','detach'],['pin_mid','lever','detach'],['pin_high','lever','cut']]){
    const r=attempt(s,'C06_04',answer);assert.equal(r.status,'wrong');assert.strictEqual(r.state,s);assert.ok(owns(s,'safety_pin'));
  }
  assert.match(attempt(s,'C06_04',['lever']).message,/핀 없이/);
});

test('version 1 chapter-one saves are migrated',()=>{
  const v2=drain(newGame());
  const {choices,tide,timer,...rest}=v2;void choices;void tide;void timer;
  const v1={...rest,schemaVersion:1,contentVersion:'ch01.1'};
  assert.deepEqual(validateState(v1),v2);
});
