import content from '../../data/ch01.puzzles.json' with { type: 'json' };
import { docs, endings, seasonChapters, seasonDialogues, seasonEvidence, seasonItems, seasonPuzzles } from '../content/season.ts';
import type { ChapterDef, Dialogue, PuzzleDef, ViewDef } from '../content/season.ts';
export type { Dialogue } from '../content/season.ts';

export const CONTENT_VERSION = 's1.1';
export type SceneId = string;
export type Timer = { kind:'cave'; remainingMs:number|null; checkpoint:string[] };
export type GameState = {
  schemaVersion:2; contentVersion:string; chapterId:string;
  sceneId:SceneId; viewId:string; completedPuzzleIds:string[];
  inventory:Record<string,number>; evidenceIds:string[]; flags:Record<string,boolean>;
  readClueIds:string[]; seenDialogueIds:string[]; dialogueQueue:Dialogue[];
  visitedViews:string[]; playTimeMs:number;
  choices:Record<string,string>; tide:number; timer:Timer|null;
};
export type Puzzle = PuzzleDef;
export type ChapterInfo = { id:string; no:number; title:string; place:string; summary:string; thumb:string; completeId:string; map:{x:number;y:number}; def?:ChapterDef };

const ch01Puzzles = content.puzzles.map(p=>({ ...p, chapter:'CH01', effects:{ ...p.effects, ...(p.id==='P25'?{ completeChapter:true }:{}) } })) as unknown as PuzzleDef[];
export const puzzles:Puzzle[] = [...ch01Puzzles, ...seasonPuzzles];
const puzzleById = new Map(puzzles.map(p=>[p.id,p]));
export const puzzle = (id:string) => puzzleById.get(id);
const itemDefs = [...content.items.map(i=>({ ...i, art:i.id, desc:'', persistUntil:undefined as string|undefined })), ...seasonItems];
export const itemNames:Record<string,string> = Object.fromEntries(itemDefs.map(i=>[i.id,i.name]));
export const itemArt:Record<string,string> = Object.fromEntries(itemDefs.map(i=>[i.id,i.art]));
const persistUntil:Record<string,string|undefined> = Object.fromEntries(itemDefs.map(i=>[i.id,i.persistUntil]));
export const chapters:ChapterInfo[] = [
  { id:'CH01', no:1, title:'각성', place:'폐창고', summary:'묶인 의자에서 깨어나 창고를 벗어난다.', thumb:'CH01_R01_A', completeId:'P25', map:{ x:27, y:44 } },
  ...seasonChapters.map(def=>({ id:def.id, no:def.no, title:def.title, place:def.place, summary:def.summary, thumb:def.thumb, completeId:def.completeId, map:def.map, def }))
];
export const chapterIndex = (id:string) => chapters.findIndex(c=>c.id===id);
export const chapterInfo = (id:string) => chapters[chapterIndex(id)];
export const has = (s:GameState, id:string) => s.completedPuzzleIds.includes(id);
export const owns = (s:GameState, id:string) => (s.inventory[id]||0)>0;
const ch01Views:Record<string,string[]> = { R01:['A','B','C','D'],R02:['A','B','C'],R03:['A','B','C'],R04:['A'] };
export const views:Record<SceneId,string[]> = { ...ch01Views, ...Object.fromEntries(seasonChapters.map(c=>[c.scene,c.views.map(v=>v.id)])) };
export function chapterOfScene(scene:SceneId):ChapterInfo|undefined {
  if(scene in ch01Views)return chapters[0];
  return chapters.find(c=>c.def?.scene===scene);
}
export function viewDef(scene:SceneId, view:string):ViewDef|undefined {
  return chapterOfScene(scene)?.def?.views.find(v=>v.id===view);
}
export const isLegacyScene = (scene:SceneId) => scene in ch01Views;
export const locationChapter = (s:GameState) => chapterOfScene(s.sceneId)?.id || s.chapterId;

const ch01Dialogues:Record<string,Dialogue[]> = {
  start:[
    { id:'D01_001',speaker:'도윤',text:'손목이… 묶여 있다. 여긴 어디지?' },
    { id:'D01_002',speaker:'스피커',text:'기억해 내면 보내 줄게.',broadcast:true },
    { id:'D01_003',speaker:'도윤',text:'누구야? 내가 뭘 기억해야 한다는 거야?' }
  ],
  P03:[{id:'D01_004',speaker:'도윤',text:'풀렸다. 이 끈은 챙겨 두자.'}],
  P10:[{id:'D01_005',speaker:'도윤',text:'관리실이다. 여기라면 밖으로 나갈 방법이 있을지도.'}],
  P11:[{id:'D01_006',speaker:'도윤',text:'이 서명… 본 적이 있다. 그런데 이름이 떠오르지 않는다.'}],
  P15:[{id:'D01_007',speaker:'스피커',text:'불을 켜는 법은 기억하는군.',broadcast:true}],
  P23:[{id:'D01_008',speaker:'도윤',text:'맨눈으로는 안 보였던 숫자다. 순서는 명판에 있다.'}],
  P25:[{id:'D01_009',speaker:'도윤',text:'파도 소리… 건물 바깥은 섬이었어.'},{id:'D01_010',speaker:'스피커',text:'네가 떠난 곳을 기억하나?',broadcast:true}]
};
const dialogues:Record<string,Dialogue[]> = { ...ch01Dialogues, ...seasonDialogues };
export const allDialogues:Dialogue[] = [...Object.values(dialogues).flat(), ...seasonChapters.flatMap(c=>c.intro)];
const knownDialogue = new Map(allDialogues.map(d=>[d.id,d]));
const knownClues = new Set(['note_a','calendar','duty_roster','shelf_numbers',...Object.keys(docs)]);
const knownEvidence = new Set(['circuit_plan','drain_procedure','exit_cipher',...seasonEvidence]);
const knownViews = new Set(Object.entries(views).flatMap(([scene,list])=>list.map(v=>scene+'_'+v)));
export const keyEvidence = ['E01','E02','E03','E04'];

export function newGame():GameState {
  return {schemaVersion:2,contentVersion:CONTENT_VERSION,chapterId:'CH01',sceneId:'R01',viewId:'A',completedPuzzleIds:[],inventory:{},evidenceIds:[],flags:{},readClueIds:[],seenDialogueIds:[],dialogueQueue:[...ch01Dialogues.start],visitedViews:['R01_A'],playTimeMs:0,choices:{},tide:0,timer:null};
}
export function advanceDialogue(s:GameState):GameState {
  const first=s.dialogueQueue[0];
  return first?{...s,seenDialogueIds:[...new Set([...s.seenDialogueIds,first.id])],dialogueQueue:s.dialogueQueue.slice(1)}:s;
}

/* ---------- tide and cave (CH03) ---------- */
export type TidePhase = 'LOW'|'RISING'|'HIGH'|'FALLING';
export const tidePhase = (tick:number):TidePhase => tick<4?'LOW':tick<6?'RISING':tick<10?'HIGH':'FALLING';
export const tideNames:Record<TidePhase,string> = { LOW:'썰물', RISING:'밀물', HIGH:'만조', FALLING:'낙조' };
export const ticksToLow = (tick:number) => tidePhase(tick)==='LOW'?0:12-tick;
const CAVE_START_TICK = 6;
export const inCave = (s:GameState) => s.timer?.kind==='cave';

/* ---------- access ---------- */
export const revisitOpen = (s:GameState) => chapterIndex(s.chapterId)>=chapterIndex('CH05') && chapterIndex(s.chapterId)<=chapterIndex('CH08') && has(s,'C04_07');
export function canVisit(s:GameState,scene:SceneId,view:string):boolean {
  if(!views[scene]?.includes(view))return false;
  if(isLegacyScene(scene)){
    if(s.chapterId!=='CH01')return false;
    if(scene==='R01')return view==='A'||has(s,'P03');
    if(scene==='R02')return has(s,'P10');
    if(scene==='R03')return has(s,'P17');
    return has(s,'P21');
  }
  const chapter=chapterOfScene(scene)!, v=viewDef(scene,view)!;
  const ci=chapterIndex(chapter.id), cur=chapterIndex(s.chapterId);
  if(ci>cur)return false;
  if(ci<cur&&!(chapter.def?.revisit&&revisitOpen(s)))return false;
  if(!(v.requires||[]).every(id=>has(s,id)))return false;
  const done=has(s,chapter.completeId);
  if(v.cave&&!done&&!inCave(s))return false;
  if(v.outside&&inCave(s))return false;
  return true;
}
export function moveTo(s:GameState,scene:SceneId,view:string):GameState {
  if(s.dialogueQueue.length||!canVisit(s,scene,view))return s;
  return {...s,sceneId:scene,viewId:view,visitedViews:[...new Set([...s.visitedViews,scene+'_'+view])]};
}
export function readClue(s:GameState,id:string):GameState {
  return s.readClueIds.includes(id)?s:{...s,readClueIds:[...s.readClueIds,id]};
}
export const prerequisitesMet = (s:GameState,p:Puzzle) => p.requiresCompleted.every(id=>has(s,id))&&p.requiresItems.every(id=>owns(s,id));
export function availablePuzzles(s:GameState):Puzzle[] {
  const here=locationChapter(s);
  return puzzles.filter(p=>!has(s,p.id)&&(p.chapter===here||(p.location.sceneId==='ANY'&&p.chapter===s.chapterId))&&prerequisitesMet(s,p))
    .sort((a,b)=>Number(a.category==='optional')-Number(b.category==='optional'));
}
export function objective(s:GameState):string {
  if(s.chapterId==='CH01'){
    if(has(s,'P25'))return '창고를 벗어났다';
    if(has(s,'P24'))return '열린 게이트로 밖으로 나가자';
    if(has(s,'P21'))return '명판을 조사하고 게이트를 열자';
    if(has(s,'P15'))return '설비실에서 출구로 가는 길을 찾자';
    if(has(s,'P10'))return '창고 설비의 전원을 복구하자';
    if(has(s,'P03'))return '관리실 문을 열 방법을 찾자';
    return '결박에서 벗어나자';
  }
  if(locationChapter(s)!==s.chapterId)return '놓친 기록을 찾고 현재 장으로 돌아가자';
  const list=chapterInfo(s.chapterId).def!.objectives;
  let text=list[0].text;
  for(const o of list)if(o.after.every(id=>has(s,id)))text=o.text;
  return text;
}
export function chapterProgress(s:GameState,chapterId=s.chapterId){
  const list=puzzles.filter(p=>p.chapter===chapterId&&p.category!=='optional');
  return {done:list.filter(p=>has(s,p.id)).length,total:list.length};
}
export const chapterComplete = (s:GameState) => has(s,chapterInfo(s.chapterId).completeId);

/* ---------- puzzle rules ---------- */
function option(p:Puzzle,answer:unknown){return p.ui?.options?.find(o=>o.id===answer);}
function correct(p:Puzzle, answer:unknown):boolean {
  if(p.mode==='combine')return Array.isArray(answer)&&answer.length===2&&JSON.stringify([...answer].sort())===JSON.stringify([...(p.expectedAnswer as string[])].sort());
  if(p.mode==='valves') {
    const a=answer as Record<string,unknown>|null,expected=p.expectedAnswer as Record<string,unknown>;
    return !!a&&typeof a==='object'&&['sea','tank','outlet'].every(key=>a[key]===expected[key]);
  }
  if(p.mode==='use') {
    const a=answer as Record<string,unknown>|null,expected=p.expectedAnswer as Record<string,unknown>;
    return !!a&&a.itemId===expected.itemId&&a.targetId===expected.targetId;
  }
  if(p.mode==='repeat')return typeof answer==='number'&&answer>=(p.expectedAnswer as number);
  if(p.mode==='choice'){const o=option(p,answer);return !!o&&o.correct!==false;}
  if(p.mode==='code'&&typeof answer==='string')return answer.toUpperCase()===String(p.expectedAnswer).toUpperCase();
  return JSON.stringify(answer)===JSON.stringify(p.expectedAnswer);
}
type Derived = { inventory:Record<string,number>; evidenceIds:string[]; flags:Record<string,boolean> };
function applyEffects(d:Derived,p:Puzzle,choice?:string):Derived|null {
  const inventory={...d.inventory};
  for(const id of p.effects.consumeItems){if((inventory[id]||0)<1)return null;inventory[id]--;if(!inventory[id])delete inventory[id];}
  for(const id of p.effects.grantItems)inventory[id]=(inventory[id]||0)+1;
  if(p.effects.completeChapter)for(const id of Object.keys(inventory)){const until=persistUntil[id];if(!until||until<=p.chapter)delete inventory[id];}
  const flags={...d.flags,...p.effects.setFlags,...(choice?option(p,choice)?.flags||{}:{})};
  return {inventory,evidenceIds:[...new Set([...d.evidenceIds,...p.effects.grantEvidence])],flags};
}
export function derive(completed:string[],choices:Record<string,string>):Derived {
  let d:Derived={inventory:{},evidenceIds:[],flags:{}};
  for(const id of completed){const next=applyEffects(d,puzzle(id)!,choices[id]);if(next)d=next;}
  return d;
}
export type Result = { state:GameState; status:'success'|'repeat'|'blocked'|'wrong'; message:string; rewards:string[] };
export function attempt(s:GameState,puzzleId:string,answer:unknown):Result {
  const p=puzzle(puzzleId);
  const fail=(status:Result['status'],message:string):Result=>({state:s,status,message,rewards:[]});
  if(!p)return fail('blocked','조사할 대상을 찾을 수 없다.');
  if(s.dialogueQueue.length)return fail('blocked','대화를 먼저 읽자.');
  if(p.location.sceneId==='ANY'){if(p.chapter!==s.chapterId)return fail('blocked','지금은 쓸 수 없는 조합이다.');}
  else if(s.sceneId!==p.location.sceneId||s.viewId!==p.location.viewId)return fail('blocked','그 장소에서 확인해야 한다.');
  if(has(s,p.id))return fail('repeat',p.repeatText);
  if(!prerequisitesMet(s,p))return fail('blocked',p.failText);
  if(p.id==='C03_02'&&tidePhase(s.tide)!=='LOW')return fail('wrong',p.failText);
  if(!correct(p,answer))return fail('wrong',p.explain?.(answer)||p.failText);
  const choice=p.mode==='choice'?String(answer):undefined;
  const applied=applyEffects(s,p,choice);
  if(!applied)return fail('blocked','필요한 물건이 없다.');
  const transition=p.effects.transition;
  const sceneId=transition?transition.sceneId:s.sceneId, viewId=transition?transition.viewId:s.viewId;
  const queue=[...(dialogues[p.id]||[]),...(choice?dialogues[p.id+':'+choice]||[]:[])].filter(d=>!s.seenDialogueIds.includes(d.id));
  const clues=[...(p.id==='P04'?['note_a']:[]),...(p.effects.clues||[])];
  const next:GameState={...s,...applied,sceneId,viewId,completedPuzzleIds:[...s.completedPuzzleIds,p.id],
    choices:choice?{...s.choices,[p.id]:choice}:s.choices,
    timer:p.effects.stopTimer?null:s.timer,
    dialogueQueue:[...s.dialogueQueue,...queue],visitedViews:[...new Set([...s.visitedViews,sceneId+'_'+viewId])],
    readClueIds:[...new Set([...s.readClueIds,...clues])]};
  return {state:next,status:'success',message:successMessage(p),rewards:p.effects.grantItems};
}
// Picks 을/를, 은/는 and similar particles from the final syllable of a Korean word.
export function josa(word:string,withBatchim:string,without:string):string {
  const code=word.charCodeAt(word.length-1)-0xac00;
  return word+(code>=0&&code<=11171&&code%28!==0?withBatchim:without);
}
function successMessage(p:Puzzle):string {
  if(p.chapter==='CH01')return p.repeatText;
  if(p.effects.grantItems.length)return josa(p.effects.grantItems.map(id=>itemNames[id]).join(', '),'을','를')+' 챙겼다.';
  if(p.effects.grantEvidence.length)return '증거 확보 — '+p.effects.grantEvidence.map(id=>docs[id]?.title).join(', ');
  if(p.effects.clues?.length)return '수첩에 기록했다 — '+p.effects.clues.map(id=>docs[id]?.title).join(', ');
  return p.repeatText;
}

/* ---------- cave timer, tide waiting ---------- */
export function waitTide(s:GameState,untilLow=false):GameState {
  if(s.dialogueQueue.length||s.sceneId!=='C03'||inCave(s)||has(s,'C03_08'))return s;
  return {...s,tide:untilLow?0:(s.tide+1)%12};
}
export function enterCave(s:GameState,remainingMs:number|null):Result {
  if(s.sceneId!=='C03'||s.viewId!=='A'||inCave(s)||has(s,'C03_08'))return {state:s,status:'blocked',message:'지금은 들어갈 수 없다.',rewards:[]};
  if(s.dialogueQueue.length)return {state:s,status:'blocked',message:'대화를 먼저 읽자.',rewards:[]};
  let next=s;
  if(!has(s,'C03_02')){
    const r=attempt(s,'C03_02',true);
    if(r.status!=='success')return r;
    next=r.state;
  } else if(tidePhase(s.tide)!=='LOW')return {state:s,status:'wrong',message:puzzle('C03_02')!.failText,rewards:[]};
  // The checkpoint is taken after the first-entry step so a timeout never undoes the entry itself.
  next={...next,timer:{kind:'cave',remainingMs,checkpoint:[...next.completedPuzzleIds]},sceneId:'C03',viewId:'B',visitedViews:[...new Set([...next.visitedViews,'C03_B'])]};
  return {state:next,status:'success',message:'썰물이다. 동굴 안으로 들어왔다.',rewards:[]};
}
export function leaveCave(s:GameState):GameState {
  if(!inCave(s)||s.dialogueQueue.length)return s;
  return {...s,timer:null,tide:4,sceneId:'C03',viewId:'A'};
}
export function caveTimeout(s:GameState):GameState {
  if(!s.timer)return s;
  const completed=s.timer.checkpoint;
  return {...s,...derive(completed,s.choices),completedPuzzleIds:[...completed],timer:null,tide:CAVE_START_TICK,sceneId:'C03',viewId:'A',dialogueQueue:[]};
}
export function tickTimer(s:GameState,elapsed:number):GameState {
  if(!s.timer||s.timer.remainingMs===null)return s;
  const remainingMs=Math.max(0,s.timer.remainingMs-elapsed);
  return remainingMs<=0?caveTimeout(s):{...s,timer:{...s.timer,remainingMs}};
}

/* ---------- chapters and endings ---------- */
export function advanceChapter(s:GameState):GameState {
  const i=chapterIndex(s.chapterId);
  if(!chapterComplete(s)||i>=chapters.length-1||s.dialogueQueue.length)return s;
  const def=chapters[i+1].def!;
  const intro=def.intro.filter(d=>!s.seenDialogueIds.includes(d.id));
  return {...s,chapterId:def.id,sceneId:def.scene,viewId:def.startView,timer:null,tide:def.id==='CH03'?CAVE_START_TICK:0,
    dialogueQueue:intro,visitedViews:[...new Set([...s.visitedViews,def.scene+'_'+def.startView])],
    readClueIds:[...new Set([...s.readClueIds,...(def.introClues||[])])]};
}
export type EndingId = keyof typeof endings;
export function ending(s:GameState):EndingId|null {
  if(!has(s,'C10_12'))return null;
  if(s.choices.C10_12==='violence')return 'B';
  return keyEvidence.every(id=>s.evidenceIds.includes(id))&&s.flags.acknowledged_responsibility&&s.flags.all_rescued?'T':'N';
}
export function retryFinal(s:GameState):GameState {
  if(!has(s,'C10_12'))return s;
  const completedPuzzleIds=s.completedPuzzleIds.filter(id=>id!=='C10_12');
  const choices={...s.choices};delete choices.C10_12;
  return {...s,...derive(completedPuzzleIds,choices),completedPuzzleIds,choices,dialogueQueue:[]};
}
export function recordStatus(s:GameState){
  const found=keyEvidence.filter(id=>s.evidenceIds.includes(id)).length;
  return {found,missing:keyEvidence.length-found};
}

/* ---------- saves ---------- */
function migrate(value:unknown):unknown {
  const v=value as Record<string,unknown>|null;
  if(v&&v.schemaVersion===1&&v.contentVersion===content.contentVersion&&v.chapterId==='CH01')
    return {...v,schemaVersion:2,contentVersion:CONTENT_VERSION,choices:{},tide:0,timer:null};
  return value;
}
export function validateState(value:unknown):GameState {
  value=migrate(value);
  if(!value||typeof value!=='object')throw new Error('저장 형식이 올바르지 않습니다.');
  const s=value as GameState;
  if(s.schemaVersion!==2||s.contentVersion!==CONTENT_VERSION||chapterIndex(s.chapterId)<0)throw new Error('지원하지 않는 저장 버전입니다.');
  const strings=(x:unknown):x is string[]=>Array.isArray(x)&&x.every(v=>typeof v==='string')&&new Set(x).size===x.length;
  if(!strings(s.completedPuzzleIds)||s.completedPuzzleIds.some(id=>!puzzleById.has(id)))throw new Error('완료 기록이 손상됐습니다.');
  if(!s.inventory||typeof s.inventory!=='object'||Array.isArray(s.inventory)||Object.entries(s.inventory).some(([id,n])=>!(id in itemNames)||!Number.isSafeInteger(n)||n<1||n>1))throw new Error('아이템 기록이 손상됐습니다.');
  if(!strings(s.evidenceIds)||s.evidenceIds.some(id=>!knownEvidence.has(id)))throw new Error('증거 기록이 손상됐습니다.');
  if(!strings(s.readClueIds)||s.readClueIds.some(id=>!knownClues.has(id)))throw new Error('단서 기록이 손상됐습니다.');
  if(!strings(s.seenDialogueIds)||s.seenDialogueIds.some(id=>!knownDialogue.has(id))||!Array.isArray(s.dialogueQueue)||s.dialogueQueue.some(d=>{const k=knownDialogue.get(d?.id);return !k||k.text!==d.text||k.speaker!==d.speaker;}))throw new Error('대화 기록이 손상됐습니다.');
  if(new Set(s.dialogueQueue.map(d=>d.id)).size!==s.dialogueQueue.length||s.dialogueQueue.some(d=>s.seenDialogueIds.includes(d.id)))throw new Error('중복 대화 기록입니다.');
  if(!s.flags||typeof s.flags!=='object'||Object.values(s.flags).some(v=>typeof v!=='boolean')||!strings(s.visitedViews)||s.visitedViews.some(key=>!knownViews.has(key)))throw new Error('공간 기록이 손상됐습니다.');
  if(!s.choices||typeof s.choices!=='object'||Object.entries(s.choices).some(([id,c])=>{const p=puzzle(id);return !p||p.mode!=='choice'||!has(s,id)||!p.ui?.options?.some(o=>o.id===c&&o.correct!==false);})||puzzles.some(p=>p.mode==='choice'&&has(s,p.id)&&!(p.id in s.choices)))throw new Error('선택 기록이 손상됐습니다.');
  if(!Number.isSafeInteger(s.tide)||s.tide<0||s.tide>11)throw new Error('조수 기록이 손상됐습니다.');
  if(s.timer!==null&&(!s.timer||s.timer.kind!=='cave'||s.chapterId!=='CH03'||!(s.timer.remainingMs===null||(Number.isFinite(s.timer.remainingMs)&&s.timer.remainingMs>=0))||!strings(s.timer.checkpoint)||s.timer.checkpoint.some((id,i)=>s.completedPuzzleIds[i]!==id)))throw new Error('제한 시간 기록이 손상됐습니다.');
  const ci=chapterIndex(s.chapterId);
  if(chapters.slice(0,ci).some(c=>!has(s,c.completeId)))throw new Error('챕터 진행 기록이 손상됐습니다.');
  if(s.completedPuzzleIds.some(id=>{const p=puzzle(id)!;return chapterIndex(p.chapter)>ci;}))throw new Error('아직 도달하지 않은 챕터의 기록입니다.');
  if(!Number.isFinite(s.playTimeMs)||s.playTimeMs<0||!canVisit(s,s.sceneId,s.viewId))throw new Error('접근할 수 없는 장소의 저장입니다.');
  let d:Derived={inventory:{},evidenceIds:[],flags:{}};
  const seen=new Set<string>();
  for(const id of s.completedPuzzleIds){
    const p=puzzle(id)!;
    if(p.requiresCompleted.some(req=>!seen.has(req)))throw new Error('선행 퍼즐 기록이 없습니다.');
    if(p.requiresItems.some(item=>(d.inventory[item]||0)<1))throw new Error('필수 아이템 획득 기록이 없습니다.');
    const next=applyEffects(d,p,s.choices[id]);
    if(!next)throw new Error('아이템 소모 기록이 맞지 않습니다.');
    d=next;seen.add(id);
  }
  const sorted=(obj:Record<string,unknown>)=>JSON.stringify(Object.entries(obj).sort(([a],[b])=>a.localeCompare(b)));
  if(sorted(d.inventory)!==sorted(s.inventory)||sorted(d.flags)!==sorted(s.flags)||JSON.stringify([...d.evidenceIds].sort())!==JSON.stringify([...s.evidenceIds].sort()))throw new Error('보상과 진행 기록이 일치하지 않습니다.');
  return structuredClone(s);
}
