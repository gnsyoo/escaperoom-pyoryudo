import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceDialogue, attempt, canVisit, moveTo, newGame, puzzles, validateState } from '../../src/domain/game.ts';
import type { GameState, SceneId } from '../../src/domain/game.ts';
const drain=(s:GameState)=>{while(s.dialogueQueue.length)s=advanceDialogue(s);return s;};
function solve(s:GameState,id:string,answer?:unknown){const p=puzzles.find(p=>p.id===id)!;if(p.location.sceneId!=='ANY')s=moveTo(s,p.location.sceneId as SceneId,p.location.viewId);const r=attempt(s,id,answer??p.expectedAnswer);assert.equal(r.status,'success',id+': '+r.message);return drain(r.state);}
function prefix(n:number){let s=drain(newGame());for(const p of puzzles.slice(0,n))s=solve(s,p.id);return s;}
// CH01 occupies the first 25 entries of the season puzzle list.
test('all 25 stages complete with coherent items, evidence, transitions and save replay',()=>{
 let s=drain(newGame());for(const p of puzzles.filter(p=>p.chapter==='CH01')){s=solve(s,p.id);assert.deepEqual(validateState(s),s);if(p.id==='P24')assert.equal(s.inventory.uv_lamp_ready,1);}
 assert.equal(s.sceneId,'R04');assert.equal(s.completedPuzzleIds.length,25);assert.equal(s.evidenceIds.length,3);
 assert.equal(s.inventory.metal_shard,undefined);assert.equal(s.inventory.valve_handle,undefined);assert.deepEqual(s.inventory,{},'chapter items stay in the warehouse');
});
test('optional orders and reversed combinations stay solvable',()=>{
 let s=prefix(6);for(const id of ['P08','P07','P09','P10','P12','P11','P13','P14','P15','P16','P17','P18','P19','P20','P21','P22','P23','P24','P25']){
 const p=puzzles.find(p=>p.id===id)!;s=solve(s,id,p.mode==='combine'?[...(p.expectedAnswer as string[])].reverse():undefined);}
 assert.equal(s.completedPuzzleIds.length,25);assert.deepEqual(validateState(s),s);
});
test('wrong code, paper order, fuse socket and valve arrangement do not consume items',()=>{
 for(const [n,id,answer] of [[4,'P05','714'],[10,'P11',['lower_desk','upper_a']],[13,'P14',{itemId:'fuse',targetId:'F1'}],[20,'P21',{sea:'open',tank:'closed',outlet:'open'}]] as const){
 let s=prefix(n);const p=puzzles.find(p=>p.id===id)!;s=moveTo(s,p.location.sceneId as SceneId,p.location.viewId);
 const before=structuredClone(s),r=attempt(s,id,answer);assert.equal(r.status,'wrong');assert.deepEqual(r.state,before);assert.strictEqual(r.state,s);
 }
});
test('dialogue, location and prerequisites prevent bypassing locks',()=>{
 assert.equal(attempt(newGame(),'P01',true).status,'blocked');let s=drain(newGame());assert.equal(canVisit(s,'R01','B'),false);assert.equal(canVisit(s,'R02','A'),false);
 assert.strictEqual(moveTo(s,'R04','A'),s);assert.equal(attempt(s,'P25',true).status,'blocked');assert.equal(attempt(s,'P03',{itemId:'metal_shard',targetId:'binding'}).status,'blocked');
});
test('double completion does not duplicate rewards or broadcast',()=>{
 let s=prefix(5);s=solve(s,'P06');const r=attempt(s,'P06',true);assert.equal(r.status,'repeat');assert.deepEqual(r.state,s);assert.equal(s.inventory.magnet,1);
 s=prefix(14);s=moveTo(s,'R01','C');const first=attempt(s,'P15','ON');assert.equal(first.state.dialogueQueue[0].id,'D01_007');const resumed=validateState(first.state);assert.deepEqual(resumed.dialogueQueue,first.state.dialogueQueue);const read=drain(resumed);assert.equal(attempt(read,'P15','ON').status,'repeat');assert.equal(read.dialogueQueue.length,0);
});
test('save validation rejects mismatched rewards, unknown items, duplicate stages and inaccessible places',()=>{
 const s=prefix(15);for(const invalid of [{...s,inventory:{...s.inventory,unknown:1}},{...s,inventory:{}},{...s,completedPuzzleIds:[...s.completedPuzzleIds,'P15']},{...s,sceneId:'R04'},{...s,flags:{}},{...s,evidenceIds:[]},{...s,contentVersion:'old'}])assert.throws(()=>validateState(invalid));
 const clone=validateState(s);clone.inventory.screwdriver=0;assert.equal(s.inventory.screwdriver,1);
});
