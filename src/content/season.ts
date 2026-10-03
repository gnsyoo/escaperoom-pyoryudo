// Season 1 content for CH02-CH10. CH01 keeps its data in data/ch01.puzzles.json.
// Answers here are production data; the UI never prints them before the player solves a step.

export type Rect = { x:number; y:number; w:number; h:number };
export type Dialogue = { id:string; speaker:string; text:string; broadcast?:boolean; portrait?:string; memory?:boolean; radio?:boolean };
export type Mode = 'inspect'|'use'|'combine'|'code'|'dials'|'sequence'|'choice'|'chase'|'repeat'|'move'|'arrange'|'valves'|'switch';
export type Category = 'core'|'action'|'optional'|'story';
export type ChoiceOption = { id:string; label:string; detail?:string; correct?:boolean; flags?:Record<string,boolean> };
export type PuzzleUI = {
  button?:string;              // move / inspect confirm / use label
  need?:string;                // shown when the required item is missing
  length?:number; charset?:'digits'|'letters'; prompt?:string;
  dials?:{ label:string; options:{id:string;label:string}[]; initial:string }[];
  preview?:'beam';
  actions?:{ id:string; label:string }[];
  options?:ChoiceOption[];
  rounds?:{ cue:string }[]; spots?:{ id:string; label:string }[];
  count?:number;
  docs?:string[];              // documents rendered inside the puzzle panel
  status?:boolean;             // final-choice record summary
};
export type Effects = {
  consumeItems:string[]; grantItems:string[]; grantEvidence:string[]; setFlags:Record<string,boolean>;
  transition?:{ sceneId:string; viewId:string }; clues?:string[]; completeChapter?:boolean; stopTimer?:boolean;
};
export type PuzzleDef = {
  id:string; chapter:string; title:string; category:Category; mode:Mode;
  location:{ sceneId:string; viewId:string; hotspotId:string };
  requiresCompleted:string[]; requiresItems:string[];
  expectedAnswer:unknown; effects:Effects;
  hints:string[]; failText:string; repeatText:string;
  ui?:PuzzleUI; explain?:(answer:unknown)=>string|undefined;
};
export type HotspotDef = { id:string; name:string; rect:Rect; opens?:string; caption?:string; after?:{ id:string; text:string }[]; hideAfter?:string; showAfter?:string };
export type ViewDef = { id:string; name:string; asset:string; requires?:string[]; cave?:boolean; outside?:boolean; stateAssets?:{ when:string; asset:string }[]; hotspots:HotspotDef[] };
export type ChapterDef = {
  id:string; no:number; title:string; place:string; summary:string; scene:string; thumb:string;
  views:ViewDef[]; startView:string; completeId:string; revisit?:boolean; map:{ x:number; y:number };
  intro:Dialogue[]; introClues?:string[]; objectives:{ after:string[]; text:string }[];
};
export type ItemDef = { id:string; name:string; desc:string; art:string; persistUntil?:string };
export type DocDef = {
  title:string; kind?:'paper'|'screen'|'wall'|'memory'|'board'|'evidence';
  intro?:string; lines?:string[]; table?:{ head:string[]; rows:string[][] }; note?:string;
  special?:'class_photo'|'seating_chart'|'morse'|'island_map'|'cctv';
};

const lines = (key:string, rows:[string,string,Partial<Dialogue>?][]):Dialogue[] =>
  rows.map(([speaker,text,o],i)=>({ id:key+'_'+String(i+1).padStart(2,'0'), speaker, text, ...(o||{}) }));
const SPK = { broadcast:true } as const;
const RADIO = (portrait:string) => ({ radio:true, portrait });

type PzInput = {
  title:string; category?:Category; mode:Mode; at:string; req?:string[]; items?:string[]; answer?:unknown;
  consume?:string[]; grant?:string[]; evidence?:string[]; flags?:Record<string,boolean>; clues?:string[];
  to?:string; complete?:boolean; stopTimer?:boolean; hints:[string,string,string]; fail:string; repeat:string;
  ui?:PuzzleUI; explain?:(answer:unknown)=>string|undefined;
};
function chapterPuzzles(chapter:string, scene:string, list:[string,PzInput][]):PuzzleDef[] {
  return list.map(([id,p])=>{
    const [viewId,hotspotId] = p.at==='ANY' ? ['ANY','inventory'] : p.at.split(':');
    const expected = p.answer ?? (p.mode==='use' ? { itemId:(p.items||[])[0], targetId:hotspotId } : true);
    return {
      id, chapter, title:p.title, category:p.category||'action', mode:p.mode,
      location:{ sceneId:p.at==='ANY'?'ANY':scene, viewId, hotspotId },
      requiresCompleted:p.req||[], requiresItems:p.items||[], expectedAnswer:expected,
      effects:{ consumeItems:p.consume||[], grantItems:p.grant||[], grantEvidence:p.evidence||[], setFlags:p.flags||{},
        ...(p.to?{ transition:{ sceneId:scene, viewId:p.to } }:{}), ...(p.clues?{ clues:p.clues }:{}),
        ...(p.complete?{ completeChapter:true }:{}), ...(p.stopTimer?{ stopTimer:true }:{}) },
      hints:p.hints, failText:p.fail, repeatText:p.repeat, ...(p.ui?{ ui:p.ui }:{}), ...(p.explain?{ explain:p.explain }:{})
    };
  });
}
const arr = (a:unknown) => Array.isArray(a) ? a as string[] : [];
const dirOptions = [['n','↑ 북'],['ne','↗ 북동'],['e','→ 동'],['se','↘ 남동'],['s','↓ 남'],['sw','↙ 남서'],['w','← 서'],['nw','↖ 북서']].map(([id,label])=>({ id, label }));

/* ---------- items ---------- */
export const seasonItems:ItemDef[] = [
  { id:'pump_key', name:'펌프실 열쇠', art:'office_key', desc:'관리동 서류함에 있던 열쇠. 꼬리표에 ‘펌프실’이라고 적혀 있다.' },
  { id:'tide_watch', name:'조수 관측 시계', art:'tide_watch', persistUntil:'CH03', desc:'썰물·밀물·만조·낙조 네 구간을 바늘로 보여 주는 관측 시계. 동굴에 들어갈 때를 알려 준다.' },
  { id:'reflector_disk', name:'예비 반사판', art:'reflector_disk', desc:'동굴 상자에 있던 둥근 반사판. 금이 간 반사판과 바꿔 끼울 수 있다.' },
  { id:'relay_key', name:'중계 열쇠', art:'relay_key', persistUntil:'CH04', desc:'동굴 비상 연락함에 있던 놋쇠 열쇠. 등대 중계함에 맞을 것 같다.' },
  { id:'lens_crank', name:'렌즈 조절 손잡이', art:'lens_crank', desc:'등대 렌즈 받침을 돌리는 분리형 손잡이.' },
  { id:'staff_key', name:'교무실 열쇠', art:'office_key', desc:'신발장 선생님 칸에 남아 있던 열쇠.' },
  { id:'archive_key', name:'자료실 열쇠', art:'archive_key', desc:'사물함 안쪽에 테이프로 붙어 있던 열쇠. 꼬리표는 비어 있다.' },
  { id:'forest_key', name:'숲길 문 열쇠', art:'relay_key', desc:'혜진이 건넨 열쇠. 분교 뒷문과 높은 숲길을 잇는 문에 맞는다.' },
  { id:'safety_pin', name:'덫 안전 고정핀', art:'safety_pin', desc:'고리가 달린 짧은 강철 핀. 장력 장치를 고정할 수 있다.' },
  { id:'vine_rope', name:'울타리 끈', art:'rope', desc:'울타리에 감겨 있던 튼튼한 끈.' },
  { id:'repair_plank', name:'보강 판자', art:'repair_plank', desc:'모서리를 다듬은 짧은 판자. 다리의 빈자리에 맞을 것 같다.' },
  { id:'lashed_plank', name:'끈 묶은 판자', art:'repair_plank', desc:'양 끝에 끈을 감아 고정할 수 있게 만든 판자.' },
  { id:'radio_connector', name:'통신 접점', art:'radio_connector', desc:'무전기 안테나 단자에 끼우는 작은 동축 어댑터.' },
  { id:'monitor_key', name:'모니터실 열쇠', art:'office_key', desc:'거실 그릇에 놓여 있던 열쇠. 안쪽 문에 맞을 것 같다.' },
  { id:'backup_drive', name:'원본 백업 드라이브', art:'backup_drive', persistUntil:'CH10', desc:'작업실 케이스에 있던 휴대용 드라이브. 원본을 옮겨 담을 수 있다.' },
  { id:'generator_fuse', name:'발전기 퓨즈', art:'generator_fuse', desc:'굵은 세라믹 카트리지 퓨즈. 발전기 퓨즈함 규격이다.' },
  { id:'fuel_hose', name:'연료 호스', art:'fuel_hose', desc:'프라이밍 벌브가 달린 보트용 연료 호스.' },
  { id:'contact_tool', name:'접점 정비 도구', art:'contact_tool', desc:'가는 강철 끝으로 접점의 소금기를 긁어낼 수 있다.' },
  { id:'boat_key', name:'보트 시동 열쇠', art:'boat_key', desc:'바랜 주황색 부표 고리가 달린 시동 열쇠.' }
];

/* ---------- documents, clues and evidence ---------- */
export const docs:Record<string,DocDef> = {
  c02_log:{ title:'관측 일지 (8년 전 9월)', kind:'paper', intro:'표지 안쪽: 해안길 배수 기준 — 주 수조 수위를 표식 2까지 낮추면 해안길이 드러난다. 표식 1 아래로 내리지 말 것(펌프 흡입구 노출).',
    table:{ head:['날짜','수위','수질','비고'], rows:[['9월 12일','정상','정상','—'],['9월 13일','정상','정상','—'],['9월 14일','정상','정상','정기 점검'],['9월 15일','위험(표식 3 초과)','이상—폐수 흔적?','두 줄로 지워짐'],['9월 16일~','—','—','페이지가 찢겨 나감']] },
    note:'맨 아래 연필 메모: “서랍 번호 = 마지막 ‘정상’ 기록일, 월·일 네 자리.”' },
  c02_gauge:{ title:'주 수조 수위계', kind:'board', lines:['표식은 위에서부터 3 · 2 · 1.','현재 수위: 표식 3 (만수).','수위계 아래 관측함은 물에 잠겨 열 수 없다.'] },
  c02_pipe:{ title:'펌프실 배관도', kind:'board', lines:['주 펌프: 바다 → 수조 (급수). 운전 중에는 우회 밸브가 잠긴다(인터록).','파란 우회 밸브: 수조 → 바다 (배출 우회).','빨간 우회 밸브: 바다 → 수조 (유입 우회).','배출 우회만 열었을 때 10분마다 수위 표식 1칸 하강.'] },
  c02_tidewatch:{ title:'조수 관측 시계 사용법', kind:'paper', lines:['바늘이 네 구간을 돈다: 썰물 → 밀물 → 만조 → 낙조.','썰물 4칸 · 밀물 2칸 · 만조 4칸 · 낙조 2칸. 한 칸은 약 5분.','“썰물에 들어가고, 밀물이 오기 전에 나온다.”'] },
  E01:{ title:'훼손된 관리 일지 (E01)', kind:'evidence', lines:['찢겨 나간 9월 16일 면이 서랍 안에 접혀 있었다.','“본사 지시: 15일 관측치 삭제, 수질 ‘정상’으로 재기재. 현장 조사 보고서는 축약본으로 제출.”','서명: 운영 관리 책임자 강민석'], note:'엔딩에 영향을 주는 핵심 증거' },
  c03_tide_board:{ title:'동굴 통행 안내판', kind:'board', lines:['동굴 출입은 썰물 구간에만.','물때가 바뀌기 시작하면 즉시 입구로 대피.','안쪽 반사판으로 표적을 비추면 윗선반 사다리 고정쇠가 풀린다.'] },
  c03_evac:{ title:'벽에 새겨진 대피 표식', kind:'wall', lines:['9.17 19:35 — 해안길 잠김. 주민 여섯 명 동굴로.','20:05 — 마지막 인원 도착. 등대 쪽에서 온 남자가 데려옴.','방송은 없었다. 우리는 스스로 왔다.'], note:'공식 발표는 ‘주민의 무단 진입과 자연재해’였다.' },
  c04_landmarks:{ title:'등대 해도 액자', kind:'paper', table:{ head:['장소','표적 기호','호출부호'], rows:[['폐창고','◇','CHG'],['양식장','□','YAN'],['분교','△','HAK'],['선착장','○','BAE'],['군 초소','☆','CHO']] }, note:'등대 렌즈 회전 고리에도 같은 기호가 새겨져 있다.' },
  c04_morse:{ title:'중계 단말 — 수신 신호', kind:'screen', special:'morse' },
  c04_relay_log:{ title:'등대 중계 기록 (출력지)', kind:'screen', lines:['9월 17일 18:40 — 연무도 이장 → 등대 중계: 저지대 대피 방송 요청 접수','9월 17일 19:10 — 해담 관제(HD) → 등대 중계: 방송 보류 지시','9월 17일 20:05 — 수동 방송 개시 (등대 중계 경유)','현재 — 확인 부호 HAK 수신. 렌즈 정렬 대기: 호출 지점의 표적을 비출 것.'] },
  island_map:{ title:'연무도 전체 지도', kind:'evidence', special:'island_map', note:'지도 버튼에서 섬 전체와 안전하게 다시 갈 수 있는 곳을 확인할 수 있다.' },
  E02:{ title:'대피 요청 접수 원본 (E02)', kind:'evidence', lines:['접수 시각: 9월 17일 18:40','요청자: 연무도 이장 — 태풍 접근, 저지대 주민 대피 방송 요청','처리: 19:10 해담 관제 지시로 보류. 담당 서명란은 비어 있다.'], note:'엔딩에 영향을 주는 핵심 증거' },
  c05_photo:{ title:'게시판의 학급 사진', kind:'paper', special:'class_photo', note:'사진 아래 글씨: “9월 17일 아침 — 칠판 앞에서 찍음.”' },
  c05_seats:{ title:'교실 자리표', kind:'paper', special:'seating_chart', note:'교실 뒤에서 칠판을 바라보고 그린 자리표.' },
  c05_register:{ title:'출석부', kind:'paper', table:{ head:['번호','이름'], rows:[['1','김민지'],['2','이준호'],['3','박소윤'],['4','최하루'],['5','정다은'],['6','한태민']] }, note:'9월 17일 칸: “사진 촬영 후 저지대 거주 3명 조퇴 — 서희 인솔. 명단은 사진 참고.”' },
  c05_album:{ title:'사진첩 — 조사팀 방문', kind:'memory', lines:['“현장 조사팀 방문 — 9월 16일”','사진 속 회색 셔츠의 남자. 오른손에 흉터. …나다.','옆의 보조교사 윤서희가 무언가를 간절히 부탁하는 얼굴이다.'] },
  c06_signpost:{ title:'이정표', kind:'board', lines:['↗ 초소 · 오르막','↙ 해안 · 내리막','기둥 꼬리표: “덫 안전핀 — 장력 표시와 같은 구멍에.”'] },
  c06_rig:{ title:'장력 장치 표찰', kind:'board', lines:['장력 표시: 빨강 — 고(高)','고정핀 구멍: 저 · 중 · 고','해제 절차 ① 장력 표시와 같은 구멍에 고정핀 ② 장력 레버 풀기 ③ 줄 분리','고정핀 없이 줄을 건드리지 말 것.'] },
  c07_freq:{ title:'현장 주파수표', kind:'board', table:{ head:['대역','용도','호출부호'], rows:[['A','어업 무선','FN'],['B','등대 중계','LH'],['C','해경 비상','CG'],['D','시설 내부(해담)','HD']] }, note:'구조 요청은 해경 비상 대역으로. 상대 호출부호를 맞출 것.' },
  c07_patch:{ title:'배선반', kind:'board', lines:['녹음 보관 장치 ← D 회선 연결','A · B · C 회선 단자는 비어 있다.','바깥 안테나 회선: 단선 표시등 점등'] },
  c07_codebook:{ title:'난수표', kind:'paper', table:{ head:['날짜','FN','LH','CG','HD'], rows:[['9/15','4821','1176','9034','2650'],['9/16','7315','6408','2291','5187'],['9/17','3962','8540','1703','7246'],['9/18','6097','2835','4419','9378']] }, note:'보관 녹음 열람: 날짜 행과 연결 회선 호출부호 열이 만나는 수.' },
  E03:{ title:'방송 보류 서명 로그 (E03)', kind:'evidence', lines:['[19:10] HD 관제 → 등대 중계: 대피 방송 보류하라.','근거: 현장 조사 보고서(서명 한도윤) — 저지대 위험도 “낮음”.','집행 승인: 운영 관리 책임자 강민석','[19:12] 등대 중계: 확인, 보류.'], note:'엔딩에 영향을 주는 핵심 증거' },
  c07_cable:{ title:'벽을 뚫고 나가는 케이블', kind:'board', lines:['굵은 케이블이 숲 위쪽 집으로 이어진다.','방송 스피커와 CCTV 신호가 모두 이 선을 탄다.'] },
  c08_jacket:{ title:'작업 점퍼의 명찰', kind:'paper', lines:['윤태오 — 연무도 발전설비','주머니 속 오래된 사진: 분교 앞에서 웃는 여자.'] },
  c08_cam_note:{ title:'모니터실 메모판', kind:'board', lines:['1번 카메라(해안길) — 표준시 자동 동기.','2번 카메라(분교 앞 확성기 기둥) — 시계 오차 미보정. 기록과 대조해 맞출 것.'] },
  c08_playback:{ title:'재생 콘솔', kind:'screen', special:'cctv' },
  c08_cctv:{ title:'동기화한 CCTV', kind:'screen', lines:['19:35 해안길이 잠긴다. (1번)','20:05 확성기 경광등이 켜지고 수동 방송이 시작된다. (2번, 보정)','20:06 회색 셔츠의 남자가 주민들을 동굴 쪽으로 이끈다. 오른손의 흉터. (1번)','20:14 아이를 안은 보조교사가 해안길로 다시 돌아간다. (2번)'] },
  c08_files:{ title:'사건 파일 네 권', kind:'paper', table:{ head:['이름','기록'], rows:[['강민석','방송 보류 집행 · 본사 보고'],['오혜진','보고서 검토 · 수정 지시 메일 보관'],['한도윤','현장 조사 · 축약 보고서 서명'],['윤서희','분교 보조교사 · 대피 안내 중 사망']] } },
  c08_seohee:{ title:'펼친 파일 — 윤서희', kind:'paper', lines:['윤서희(25). 분교 보조교사.','9월 17일 밤, 저지대 주민 대피를 안내하다 사망.','여백의 손글씨: “작업실 번호는 누나를 잃은 날.”'] },
  E04:{ title:'원본 CCTV 백업 (E04)', kind:'evidence', lines:['두 카메라 원본을 보정해 하나로 맞춘 기록.','방송이 19:10에 보류되고 20:05에야 수동으로 나갔다는 사실, 그리고 그 사이의 시간이 고스란히 담겨 있다.'], note:'엔딩에 영향을 주는 핵심 증거' },
  c09_hide_rule:{ title:'서린의 무전', kind:'paper', lines:['계단 쪽 발소리 → 두꺼운 기둥 뒤','철문 여닫는 소리 → 사물함 안','가까운 무전 잡음 → 작업 수레 뒤에 엎드리기'] },
  c09_manual:{ title:'발전기 재가동 지침', kind:'paper', lines:['① 부하 스위치 1·2·3을 모두 내린다.','② 발전기 퓨즈를 교체한다.','③ 연료 밸브를 연다.','④ 시동 버튼을 누른다.','⑤ 피난실 회로(3)를 먼저, 조명 회로(2)를 다음에 올린다.','※ 1번(외부 송신)은 폭풍 중 올리지 말 것.'] },
  c10_manual:{ title:'보트 정비 설명서', kind:'paper', lines:['① 연료 호스를 탱크와 엔진 연결구에 끼운다.','② 프라이밍 벌브를 단단해질 때까지 세 번 누른다.','③ 점화 접점의 소금기를 접점 도구로 닦는다.','④ 조타석에서 시동 열쇠를 돌린다.'] },
  c10_tide:{ title:'조수표 — 오늘 새벽', kind:'board', table:{ head:['시각','예상 수심'], rows:[['04:30','1.2m'],['05:00','1.4m'],['05:30','1.7m'],['06:00','2.1m'],['06:30','2.3m']] }, note:'출항 조건: 수심 1.5m 이상 · 등대 신호 녹색(암초 수로 확인)' },
  c10_signal:{ title:'등대 신호 일정', kind:'board', lines:['다시 돌기 시작한 등대. 관측대 카드에 자동 신호 일정이 적혀 있다.','04:00~05:15 적색','05:15~05:50 녹색 — 암초 수로 확인 가능','05:50 이후 적색 — 폭풍 뒤 너울 경보'] }
};
export const seasonEvidence = ['E01','E02','E03','E04','island_map'];

/* ---------- chapters ---------- */
export const seasonChapters:ChapterDef[] = [
  { id:'CH02', no:2, title:'수면 아래', place:'폐양식장 관리동', scene:'C02', thumb:'CH02_B', summary:'수조의 물을 빼 해안길을 연다.', startView:'A', completeId:'C02_09', revisit:true, map:{ x:15, y:52 },
    views:[
      { id:'A', name:'관리동 사무실', asset:'CH02_A', hotspots:[
        { id:'ops_ledger', name:'관측 일지', rect:{x:.35,y:.46,w:.33,h:.09}, caption:'책상 가운데 펼쳐진 오래된 일지. 8년 전 9월의 기록이다.' },
        { id:'desk_tray', name:'서류함', rect:{x:.7,y:.47,w:.14,h:.08}, caption:'서류함에 열쇠가 하나 끼어 있다.', after:[{id:'C02_02',text:'서류함에는 빈 결재 서류뿐이다.'}] },
        { id:'locked_drawer', name:'잠긴 서랍', rect:{x:.56,y:.61,w:.23,h:.21}, caption:'네 자리 번호 자물쇠가 달린 서랍. 일지에 번호 단서가 있을지도 모른다.', after:[{id:'C02_08',text:'열린 서랍. 찢겨 나갔던 일지 한 면이 들어 있었다.'}] },
        { id:'glass_cabinet', name:'유리 비품장', rect:{x:0,y:.06,w:.18,h:.5}, caption:'구명조끼와 깨진 측정컵. 측정컵으로는 수위를 잴 수 없겠다.' },
        { id:'office_speaker', name:'벽 스피커', rect:{x:.9,y:.12,w:.08,h:.09}, caption:'창고의 것과 같은 유선 스피커. 섬 곳곳에 이어져 있는 듯하다.' }
      ]},
      { id:'B', name:'양식 수조 구역', asset:'CH02_B', hotspots:[
        { id:'level_gauge', name:'수위계', rect:{x:.21,y:.27,w:.12,h:.3}, caption:'수조 옆 세로 수위계. 표식 세 개가 있다.', after:[{id:'C02_06',text:'수위가 표식 2에 맞춰졌다. 아래쪽 관측함이 물 밖으로 드러났다.'},{id:'C02_07',text:'수위는 표식 2. 관측함은 비어 있다.'}] },
        { id:'pump_shed', name:'펌프실 건물', rect:{x:.36,y:.08,w:.2,h:.2}, caption:'수조 너머 펌프실. 문이 잠겨 있다.', after:[{id:'C02_03',text:'펌프실 문이 열려 있다.'}] },
        { id:'main_tank', name:'주 수조', rect:{x:.36,y:.56,w:.6,h:.36}, caption:'물이 가득 차 수조 벽 위까지 출렁인다.', after:[{id:'C02_06',text:'수위가 내려가자 수조 너머로 해안길이 드러났다.'}] },
        { id:'coast_road', name:'해안길', rect:{x:.72,y:.17,w:.26,h:.12}, caption:'수조 너머 해안길. 지금은 물에 잠겨 있다.', after:[{id:'C02_06',text:'물이 빠진 해안길이 동굴 쪽으로 이어진다.'}] }
      ]},
      { id:'C', name:'펌프실', asset:'CH02_C', requires:['C02_03'], hotspots:[
        { id:'pipe_plate', name:'배관도 판', rect:{x:.27,y:.12,w:.14,h:.22}, caption:'벽에 붙은 배관도. 색이 바랬지만 읽을 수 있다.' },
        { id:'pump_panel', name:'주 펌프 조작부', rect:{x:.45,y:.55,w:.42,h:.28}, caption:'주 펌프는 아직 돌고 있다. 조작부에서 밸브와 배수 시간을 정할 수 있다.' },
        { id:'bypass_blue', name:'파란 우회 밸브', rect:{x:.43,y:.21,w:.11,h:.11}, opens:'pump_panel' },
        { id:'bypass_red', name:'빨간 우회 밸브', rect:{x:.75,y:.21,w:.11,h:.11}, opens:'pump_panel' }
      ]}
    ],
    intro:lines('D02_IN',[['도윤','창고 옆은 양식장이었다. 짙은 바닷물 냄새.'],['스피커','해안길은 물에 잠겼어. 길을 내고 싶으면 수조부터 비워.',SPK],['도윤','섬 전체에 스피커가 깔려 있는 건가. …누가, 왜.']]),
    objectives:[{after:[],text:'해안길을 열 방법을 찾자'},{after:['C02_03'],text:'펌프실에서 수조 수위를 낮추자'},{after:['C02_06'],text:'드러난 수위계 관측함을 살펴보자'},{after:['C02_07'],text:'드러난 해안길로 나가자'},{after:['C02_09'],text:'양식장을 벗어났다'}] },

  { id:'CH03', no:3, title:'바다가 닫히기 전에', place:'해안 동굴', scene:'C03', thumb:'CH03_B', summary:'썰물에 동굴로 들어가 중계 열쇠를 찾는다.', startView:'A', completeId:'C03_08', map:{ x:83, y:35 },
    views:[
      { id:'A', name:'동굴 입구', asset:'CH03_A', outside:true, hotspots:[
        { id:'tide_gauge', name:'조위 표척', rect:{x:.06,y:.4,w:.11,h:.28}, caption:'바위에 고정된 조위 표척과 안내판.' },
        { id:'cave_mouth', name:'동굴 입구', rect:{x:.5,y:.3,w:.4,h:.26}, caption:'모래 길이 동굴 안으로 이어진다. 물때에 따라 길이 잠긴다.' },
        { id:'cave_cctv', name:'감시 카메라', rect:{x:.52,y:.21,w:.07,h:.07}, caption:'동굴 입구에도 카메라가 있다. 빨간 불이 깜빡인다.' }
      ]},
      { id:'B', name:'반사판 구역', asset:'CH03_B', cave:true, hotspots:[
        { id:'reflector_1', name:'첫째 반사판', rect:{x:.03,y:.15,w:.18,h:.22}, opens:'reflectors' },
        { id:'reflector_2', name:'가운데 반사판', rect:{x:.43,y:.27,w:.15,h:.16}, caption:'가운데 반사판에 금이 가 있다. 빛이 흩어진다.', after:[{id:'C03_04',text:'새 반사판으로 갈아 끼웠다.'}] },
        { id:'reflector_3', name:'셋째 반사판', rect:{x:.83,y:.18,w:.15,h:.16}, opens:'reflectors' },
        { id:'reflectors', name:'벽의 표적', rect:{x:.6,y:.14,w:.16,h:.14}, caption:'동굴 바닥에 분필로 그린 평면도가 있다. 세 반사판으로 햇빛을 표적까지 보내야 한다.' },
        { id:'supply_crate', name:'나무 상자', rect:{x:0,y:.7,w:.14,h:.16}, caption:'정비용 나무 상자.', after:[{id:'C03_03',text:'상자는 비어 있다.'}] }
      ]},
      { id:'C', name:'안전 대피 선반', asset:'CH03_C', cave:true, requires:['C03_05'], hotspots:[
        { id:'relay_box', name:'비상 연락함', rect:{x:.24,y:.18,w:.22,h:.19}, caption:'벽에 박힌 비상 연락함. 덮개 새김: “열쇠 — 마지막 인원 도착 시각”. 네 자리 숫자.', after:[{id:'C03_07',text:'열린 연락함. 안은 비었다.'}] },
        { id:'evac_marks', name:'벽의 대피 표식', rect:{x:.5,y:.28,w:.28,h:.22}, caption:'바위벽에 무언가가 새겨져 있다.' },
        { id:'ledge_exit', name:'바깥 선반길', rect:{x:.8,y:.2,w:.2,h:.5}, caption:'바깥으로 이어지는 높은 선반길. 등대 쪽으로 이어진다.' },
        { id:'lantern', name:'오래된 랜턴', rect:{x:.02,y:.28,w:.07,h:.13}, caption:'누군가 오래전에 두고 간 랜턴. 기름이 말라 있다.' }
      ]}
    ],
    intro:lines('D03_IN',[['도윤','해안길 끝에 동굴이 입을 벌리고 있다.'],['도윤','조수 시계 바늘이 ‘만조’를 가리킨다. 지금은 물이 길을 덮었다.'],['스피커','중계 열쇠는 동굴 안에 있어. 바다가 닫히기 전에 나와.',SPK]]),
    objectives:[{after:[],text:'썰물을 기다려 동굴에 들어가자'},{after:['C03_02'],text:'반사판으로 표적을 비추자'},{after:['C03_05'],text:'윗선반에서 중계 열쇠를 찾자'},{after:['C03_07'],text:'바깥 선반길로 빠져나가자'},{after:['C03_08'],text:'동굴을 빠져나왔다'}] },

  { id:'CH04', no:4, title:'꺼진 등대', place:'등대', scene:'C04', thumb:'CH04_C', summary:'중계 장치를 살리고 렌즈를 맞춘다.', startView:'A', completeId:'C04_09', revisit:true, map:{ x:93, y:47 },
    views:[
      { id:'A', name:'등대 입구', asset:'CH04_A', hotspots:[
        { id:'maint_cabinet', name:'정비함', rect:{x:.48,y:.35,w:.18,h:.33}, caption:'세이지색 정비함.', after:[{id:'C04_01',text:'정비함에는 기름 걸레뿐이다.'}] },
        { id:'landmark_frame', name:'해도 액자', rect:{x:.92,y:.15,w:.08,h:.26}, caption:'벽에 걸린 오래된 해도 액자.' },
        { id:'stair_gate', name:'계단 철문', rect:{x:.67,y:.16,w:.23,h:.52}, caption:'위층으로 가는 계단 철문. 빗장이 걸려 있다.', after:[{id:'C04_03',text:'철문이 열려 있다.'}] },
        { id:'outer_door', name:'바깥 문', rect:{x:.08,y:.08,w:.29,h:.7}, caption:'바다 빛이 들어오는 문. 분교로 가는 길은 지도를 확인한 뒤에 찾자.' }
      ]},
      { id:'B', name:'등대 계단', asset:'CH04_B', requires:['C04_03'], hotspots:[
        { id:'relay_cabinet', name:'중계함', rect:{x:.79,y:.3,w:.15,h:.22}, caption:'층계참의 중계함. 놋쇠 열쇠 구멍이 있다.', after:[{id:'C04_04',text:'중계함에 전원이 들어와 있다.'}] }
      ]},
      { id:'C', name:'렌즈실', asset:'CH04_C', requires:['C04_03'], hotspots:[
        { id:'relay_terminal', name:'중계 단말', rect:{x:.83,y:.44,w:.15,h:.12}, caption:'작은 단말. 화면이 꺼져 있다.', after:[{id:'C04_04',text:'단말에 불빛 신호가 반복해서 깜빡인다.'}] },
        { id:'lens_collar', name:'렌즈 회전 고리', rect:{x:.26,y:.5,w:.42,h:.13}, caption:'렌즈 받침의 회전 고리. 기호 눈금이 새겨져 있고 손잡이를 꽂는 축이 있다.' },
        { id:'big_lens', name:'프레넬 렌즈', rect:{x:.26,y:.02,w:.38,h:.46}, caption:'커다란 렌즈. 8년 동안 꺼져 있었다.', after:[{id:'C04_06',text:'렌즈가 천천히 돌며 섬을 비춘다.'}] }
      ]},
      { id:'D', name:'기록실', asset:'CH04_D', requires:['C04_04'], hotspots:[
        { id:'map_board', name:'지도판', rect:{x:.3,y:.12,w:.52,h:.28}, caption:'커다란 지도판.' },
        { id:'file_drawer', name:'서류 서랍', rect:{x:.83,y:.28,w:.15,h:.4}, caption:'서랍 표찰: “접수 원본 — 접수 시각 순 보관”. 네 자리 숫자 자물쇠.', after:[{id:'C04_08',text:'열린 서랍. 접수 원본을 챙겼다.'}] },
        { id:'logbook', name:'등대 일지', rect:{x:.4,y:.44,w:.16,h:.07}, caption:'등대 일지는 9월 17일 이후로 비어 있다.' },
        { id:'receiver', name:'신호 수신기', rect:{x:.57,y:.4,w:.12,h:.09}, caption:'수신기 바늘이 미세하게 떨린다. 단말과 연결되어 있다.' }
      ]}
    ],
    intro:lines('D04_IN',[['도윤','동굴 위 선반길이 등대로 이어졌다. 불이 꺼진 등대.'],['스피커','그날 등대는 요청을 받았어. 그런데 방송은 왜 늦었을까?',SPK],['도윤','중계 열쇠… 여기 중계 장치에 쓰라는 건가.']]),
    objectives:[{after:[],text:'등대 안을 살펴보자'},{after:['C04_03'],text:'중계 장치에 전원을 넣자'},{after:['C04_04'],text:'단말의 신호를 해독하자'},{after:['C04_05'],text:'렌즈를 호출 지점에 맞추자'},{after:['C04_06'],text:'기록실에서 섬 지도를 확보하자'},{after:['C04_06','C04_07'],text:'분교로 향하자'},{after:['C04_09'],text:'등대에 다시 불이 켜졌다'}] },

  { id:'CH05', no:5, title:'마지막 출석', place:'분교', scene:'C05', thumb:'CH05_B', summary:'사진과 자리표로 사물함 순서를 찾는다.', startView:'A', completeId:'C05_10', map:{ x:53, y:34 },
    views:[
      { id:'A', name:'분교 복도', asset:'CH05_A', hotspots:[
        { id:'display_board', name:'게시판의 학급 사진', rect:{x:.84,y:.12,w:.15,h:.43}, caption:'게시판에 학급 사진이 꽂혀 있다.' },
        { id:'shoe_cabinet', name:'신발장', rect:{x:0,y:.5,w:.2,h:.45}, caption:'아이들 신발장. 맨 위 선생님 칸에 무언가 있다.', after:[{id:'C05_03',text:'신발장은 비어 있다.'}] },
        { id:'staff_door', name:'교무실 문', rect:{x:.42,y:.2,w:.14,h:.34}, caption:'계단 옆 교무실 문. 잠겨 있다.', after:[{id:'C05_04',text:'교무실 문이 열려 있다.'}] },
        { id:'back_gate', name:'뒷문', rect:{x:.24,y:.21,w:.15,h:.25}, caption:'복도 끝 뒷문. 높은 숲길로 이어진다. 열쇠가 필요하다.' }
      ]},
      { id:'B', name:'교실', asset:'CH05_B', hotspots:[
        { id:'seating_chart', name:'자리표', rect:{x:.74,y:.16,w:.11,h:.15}, caption:'칠판 옆에 붙은 자리표.' },
        { id:'chalkboard', name:'칠판', rect:{x:.27,y:.13,w:.46,h:.27}, caption:'칠판 구석에 희미한 글씨: “9/17 태풍 — 조퇴 지도”.' },
        { id:'teacher_desk', name:'교탁', rect:{x:.38,y:.42,w:.26,h:.13}, caption:'교탁 위에 출석 도장과 빈 꽃병. 서랍은 비어 있다.' }
      ]},
      { id:'C', name:'교무실', asset:'CH05_C', requires:['C05_04'], hotspots:[
        { id:'attendance', name:'출석부', rect:{x:.15,y:.63,w:.5,h:.14}, caption:'책상 위에 펼쳐진 출석부.' },
        { id:'lockers', name:'아이들 사물함', rect:{x:.57,y:.22,w:.42,h:.38}, caption:'1~8번 사물함. 손잡이에 쪽지: “조퇴한 아이들 사물함 — 출석번호 순서대로 열 것. 틀리면 처음부터.”', after:[{id:'C05_06',text:'열린 사물함들. 숙제 봉투가 그대로 들어 있다.'}] },
        { id:'archive_door', name:'자료실 문', rect:{x:.32,y:.1,w:.18,h:.45}, caption:'안쪽 자료실 문. 잠겨 있다. 안에서 사람 소리가 난다.', after:[{id:'C05_07',text:'자료실 문이 열려 있다.'}] },
        { id:'photo_frame', name:'빈 액자', rect:{x:.63,y:.02,w:.33,h:.18}, caption:'단체 사진이 있던 자리. 액자만 남았다.' }
      ]},
      { id:'D', name:'자료실', asset:'CH05_D', requires:['C05_07'], hotspots:[
        { id:'photo_album', name:'사진첩', rect:{x:.24,y:.6,w:.6,h:.17}, caption:'탁자 위에 펼쳐진 사진첩.' },
        { id:'hyejin', name:'오혜진', rect:{x:0,y:.32,w:.22,h:.4}, caption:'창가에 기대 앉은 혜진. 손목에 붕대를 감았다.' },
        { id:'storage_cabinet', name:'보관장', rect:{x:.24,y:.24,w:.27,h:.3}, caption:'보관장 안에는 오래된 학적부 상자들뿐이다.' }
      ]}
    ],
    intro:lines('D05_IN',[['도윤','등대 지도대로 섬 가운데에 분교가 있다.'],['스피커','마지막 출석을 기억해? 그날 아이들은 몇 명이었지?',SPK],['도윤','…안쪽 어딘가에서 사람 목소리가 들린다.']]),
    objectives:[{after:[],text:'분교를 살펴 목소리의 주인을 찾자'},{after:['C05_04'],text:'잠긴 자료실 열쇠를 찾자'},{after:['C05_07'],text:'자료실의 사람을 도와주자'},{after:['C05_09'],text:'뒷문으로 높은 숲길에 오르자'},{after:['C05_10'],text:'분교를 떠났다'}] },

  { id:'CH06', no:6, title:'숲의 목격자', place:'높은 숲길', scene:'C06', thumb:'CH06_B', summary:'덫을 해제하고 다리를 보강한다.', startView:'A', completeId:'C06_08', map:{ x:34, y:16 },
    views:[
      { id:'A', name:'숲길 갈림길', asset:'CH06_A', hotspots:[
        { id:'signpost', name:'이정표', rect:{x:.46,y:.32,w:.22,h:.22}, caption:'나무 이정표.' },
        { id:'fence', name:'낡은 울타리', rect:{x:0,y:.46,w:.38,h:.16}, caption:'울타리에 튼튼한 끈이 감겨 있다.', after:[{id:'C06_02',text:'끈을 풀어낸 울타리.'}] }
      ]},
      { id:'B', name:'덫 설치 지점', asset:'CH06_B', hotspots:[
        { id:'trip_line', name:'발목 높이의 줄', rect:{x:.08,y:.33,w:.62,h:.08}, opens:'tension_rig' },
        { id:'tension_rig', name:'장력 장치', rect:{x:.72,y:.32,w:.24,h:.24}, caption:'기둥에 달린 장력 장치. 줄이 팽팽하게 당겨져 있다.', after:[{id:'C06_04',text:'고정핀이 꽂힌 채 줄이 풀려 있다.'}] }
      ]},
      { id:'C', name:'임시 다리', asset:'CH06_C', requires:['C06_04'], hotspots:[
        { id:'bridge_gap', name:'부서진 다리', rect:{x:.22,y:.38,w:.64,h:.2}, caption:'가운데 판자가 빠진 작은 다리.', after:[{id:'C06_07',text:'새 판자로 보강한 다리.'}] },
        { id:'plank_pile', name:'판자 더미', rect:{x:.65,y:.69,w:.3,h:.18}, caption:'쓸 만한 판자가 몇 장 있다.', after:[{id:'C06_05',text:'남은 판자는 썩었다.'}] },
        { id:'far_path', name:'건너편 길', rect:{x:.78,y:.05,w:.22,h:.28}, caption:'다리 건너 초소로 오르는 길.' }
      ]}
    ],
    intro:lines('D06_IN',[['도윤','분교 뒷문 너머로 높은 숲길이 이어진다. 해가 기울기 시작했다.'],['도윤','혜진 씨는 다친 손목 때문에 분교에서 기다리기로 했다.'],['스피커','숲에는 내가 놓아 둔 것들이 있어. 조심해, 기록 담당.',SPK]]),
    objectives:[{after:[],text:'초소로 가는 길을 찾자'},{after:['C06_04'],text:'부서진 다리를 보강하자'},{after:['C06_07'],text:'다리를 건너 초소로 가자'},{after:['C06_08'],text:'숲길을 건넜다'}] },

  { id:'CH07', no:7, title:'응답 없는 주파수', place:'군 초소', scene:'C07', thumb:'CH07_B', summary:'무전 기록을 복구하고 감시선을 추적한다.', startView:'A', completeId:'C07_09', map:{ x:76, y:7 },
    views:[
      { id:'A', name:'초소 입구', asset:'CH07_A', hotspots:[
        { id:'post_door', name:'초소 철문', rect:{x:.6,y:.29,w:.17,h:.28}, caption:'바깥에서 빗장이 걸린 철문. 안에서 누군가 두드린다.', after:[{id:'C07_02',text:'열린 철문.'}] },
        { id:'ammo_box', name:'철제 상자', rect:{x:.73,y:.67,w:.13,h:.14}, caption:'벤치 옆 철제 상자.', after:[{id:'C07_01',text:'빈 상자.'}] },
        { id:'door_panel', name:'전기함', rect:{x:.83,y:.35,w:.07,h:.08}, caption:'외등 전기함. 안테나 선이 끊겨 늘어져 있다.' }
      ]},
      { id:'B', name:'무전실', asset:'CH07_B', requires:['C07_02'], hotspots:[
        { id:'transceiver', name:'무전기', rect:{x:.46,y:.35,w:.29,h:.11}, caption:'아날로그 무전기. 안테나 단자의 접점이 빠져 있다.', after:[{id:'C07_03',text:'접점을 끼운 무전기. 대역과 호출부호를 고를 수 있다.'},{id:'C07_05',text:'안테나 단선 경고등이 켜져 있다.'}] },
        { id:'freq_chart', name:'주파수표', rect:{x:.42,y:.11,w:.29,h:.21}, caption:'벽의 현장 주파수표.' },
        { id:'minseok', name:'강민석', rect:{x:.02,y:.44,w:.2,h:.36}, caption:'구겨진 와이셔츠의 남자, 강민석. 벽에 기대 숨을 고른다.' }
      ]},
      { id:'C', name:'통신 자료실', asset:'CH07_C', requires:['C07_02'], hotspots:[
        { id:'patch_panel', name:'배선반', rect:{x:.55,y:.1,w:.26,h:.28}, caption:'회선 단자가 늘어선 배선반.' },
        { id:'codebook', name:'녹음 보관 장치', rect:{x:.47,y:.57,w:.42,h:.17}, caption:'책상 위 녹음 보관 장치와 난수표. 화면: “9월 17일 녹음 1건(태풍 경보) — 열람 번호 입력”.' },
        { id:'wall_cable', name:'벽 케이블', rect:{x:.8,y:.14,w:.15,h:.13}, caption:'굵은 케이블이 벽을 뚫고 밖으로 나간다.' }
      ]}
    ],
    intro:lines('D07_IN',[['도윤','숲길 끝, 절벽 위에 낡은 초소가 있다.'],['서린','초소엔 무전기가 있을 거예요. 바깥에 구조를 요청할 수 있으면…',{portrait:'seorin_questioning'}],['스피커','무전기는 고쳐도 소용없어. 그날도 응답은 없었으니까.',SPK]]),
    objectives:[{after:[],text:'초소 안으로 들어가자'},{after:['C07_02'],text:'무전기로 구조를 요청하자'},{after:['C07_05'],text:'자료실에서 그날의 녹음을 찾자'},{after:['C07_07'],text:'방송 케이블이 이어진 곳을 확인하자'},{after:['C07_08'],text:'케이블을 따라 감시자의 집으로 가자'},{after:['C07_09'],text:'초소를 떠났다'}] },

  { id:'CH08', no:8, title:'감시자의 방', place:'감시자의 거처', scene:'C08', thumb:'CH08_B', summary:'감시자의 정체와 원본을 확보한다.', startView:'A', completeId:'C08_12', map:{ x:50, y:21 },
    views:[
      { id:'A', name:'거실', asset:'CH08_A', hotspots:[
        { id:'work_jacket', name:'작업 점퍼', rect:{x:.4,y:.13,w:.11,h:.21}, caption:'문 옆에 걸린 세이지색 작업 점퍼.' },
        { id:'key_bowl', name:'나무 그릇', rect:{x:.33,y:.7,w:.16,h:.08}, caption:'탁자 위 나무 그릇에 열쇠가 있다.', after:[{id:'C08_02',text:'빈 그릇.'}] },
        { id:'inner_door', name:'안쪽 문', rect:{x:.53,y:.16,w:.2,h:.39}, caption:'잠긴 안쪽 문.', after:[{id:'C08_03',text:'안쪽 문이 열려 있다.'}] },
        { id:'table_notebook', name:'탁자 위 수첩', rect:{x:.18,y:.79,w:.23,h:.09}, caption:'수첩에는 같은 문장이 수십 번 적혀 있다. “기억해 내면 보내 줄게.”' }
      ]},
      { id:'B', name:'감시 모니터실', asset:'CH08_B', requires:['C08_03'], hotspots:[
        { id:'playback', name:'재생 콘솔', rect:{x:.32,y:.44,w:.27,h:.07}, caption:'두 카메라의 9월 17일 녹화본이 걸려 있다. 시각 보정 다이얼이 있다.' },
        { id:'monitors', name:'모니터', rect:{x:.17,y:.31,w:.53,h:.13}, opens:'playback' },
        { id:'corkboard', name:'메모판', rect:{x:.65,y:.15,w:.18,h:.22}, caption:'메모와 등대 사진이 꽂힌 메모판.' }
      ]},
      { id:'C', name:'피해자 기록실', asset:'CH08_C', requires:['C08_03'], hotspots:[
        { id:'case_folders', name:'사건 파일', rect:{x:.02,y:.59,w:.6,h:.12}, caption:'나란히 놓인 파일 네 권.' },
        { id:'open_folder', name:'펼친 파일', rect:{x:.62,y:.62,w:.33,h:.12}, caption:'한 권만 펼쳐져 있다.' },
        { id:'work_door', name:'작업실 문', rect:{x:.68,y:.12,w:.27,h:.55}, caption:'번호 잠금이 달린 작업실 문. 네 자리.', after:[{id:'C08_08',text:'작업실 문이 열려 있다.'}] }
      ]},
      { id:'D', name:'원본 보관 작업실', asset:'CH08_D', requires:['C08_08'], hotspots:[
        { id:'computer', name:'컴퓨터', rect:{x:.33,y:.31,w:.22,h:.17}, caption:'원본 파일이 담긴 컴퓨터. 드라이브를 꽂을 단자가 비어 있다.' },
        { id:'photo_frame', name:'엎어 둔 액자', rect:{x:.55,y:.39,w:.1,h:.09}, caption:'책상 위에 엎어 둔 액자.' },
        { id:'gray_case', name:'회청색 케이스', rect:{x:0,y:.61,w:.14,h:.18}, caption:'단단한 회청색 케이스.', after:[{id:'C08_09',text:'빈 케이스.'}] }
      ]}
    ],
    intro:lines('D08_IN',[['서린','케이블이 저 집 안으로 들어가요. 그 사람이 사는 곳이에요.',{portrait:'seorin_worried'}],['도윤','민석은 초소에 남겠다고 했다. 이제 우리 둘뿐이다.'],['스피커','…거기까지 왔구나. 기억해 냈어?',SPK]]),
    objectives:[{after:[],text:'감시자의 집을 조사하자'},{after:['C08_03'],text:'두 카메라의 시각을 맞추자'},{after:['C08_05'],text:'잠긴 작업실을 열자'},{after:['C08_08'],text:'원본을 백업하자'},{after:['C08_11'],text:'기록 앞에서 결정을 내리자'},{after:['C08_12'],text:'원본을 확보했다'}] },

  { id:'CH09', no:9, title:'폭풍의 밤', place:'중앙 발전실', scene:'C09', thumb:'CH09_A', summary:'정전된 섬에서 발전기를 살리고 동료를 구한다.', startView:'C', completeId:'C09_06', map:{ x:63, y:68 },
    views:[
      { id:'A', name:'중앙 발전실', asset:'CH09_A', requires:['C09_03'], stateAssets:[{when:'C09_04',asset:'CH09_A_POWER'}], hotspots:[
        { id:'generator', name:'발전기', rect:{x:.42,y:.5,w:.4,h:.25}, caption:'멈춘 발전기. 지침대로 순서를 지켜야 한다.', after:[{id:'C09_04',text:'발전기가 안정적으로 돌고 있다.'}] },
        { id:'switch_bank', name:'부하 스위치', rect:{x:.61,y:.38,w:.18,h:.11}, opens:'generator' },
        { id:'fuel_valve', name:'연료 밸브', rect:{x:.76,y:.19,w:.16,h:.09}, opens:'generator' },
        { id:'fuse_box', name:'퓨즈함', rect:{x:.17,y:.24,w:.08,h:.12}, opens:'generator' }
      ]},
      { id:'B', name:'피난 대기실', asset:'CH09_B', requires:['C09_04'], hotspots:[
        { id:'shelter_door', name:'피난실 문', rect:{x:.71,y:.12,w:.24,h:.43}, caption:'피난실 문 앞. 복도에서 젖은 발소리가 다가온다.' },
        { id:'medical_cupboard', name:'구급함', rect:{x:.36,y:.15,w:.22,h:.33}, caption:'구급함. 혜진의 손목에 새 붕대를 감았다.' },
        { id:'table_map', name:'탁자 위 지도', rect:{x:.22,y:.55,w:.28,h:.1}, caption:'서린이 펼쳐 둔 섬 지도. 선착장에 동그라미가 그려져 있다.' }
      ]},
      { id:'C', name:'은신 통로', asset:'CH09_C', hotspots:[
        { id:'cart', name:'작업 수레', rect:{x:.87,y:.48,w:.13,h:.34}, caption:'바퀴 달린 작업 수레.', after:[{id:'C09_01',text:'수레에는 공구 몇 개뿐이다.'}] },
        { id:'closet', name:'사물함', rect:{x:.02,y:.1,w:.35,h:.68}, caption:'커다란 설비 사물함.' },
        { id:'doorway', name:'발전실 쪽 출입구', rect:{x:.62,y:.24,w:.24,h:.36}, caption:'발전실로 이어지는 통로. 손전등 불빛이 오간다.' },
        { id:'column', name:'두꺼운 기둥', rect:{x:.37,y:.12,w:.15,h:.56}, caption:'통로 가운데 두꺼운 기둥.' }
      ]}
    ],
    intro:lines('D09_IN',[['도윤','폭풍이 섬을 덮쳤다. 정전. 모든 스피커가 한꺼번에 끊겼다.'],['서린','도윤 씨, 들려요? 혜진 씨랑 피난실에 있어요. 문이 전기 잠금이라 안 열려요.',RADIO('seorin_worried')],['서린','그 사람이 손전등을 들고 통로를 돌아요. 잘 들어요.',RADIO('seorin_worried')],['서린','계단 쪽 발소리면 기둥 뒤. 철문 소리면 사물함 안. 무전 잡음이 가까우면 수레 뒤에 엎드려요.',RADIO('seorin_questioning')]]),
    introClues:['c09_hide_rule'],
    objectives:[{after:[],text:'발전실로 가는 길을 확보하자'},{after:['C09_03'],text:'지침대로 발전기를 재가동하자'},{after:['C09_04'],text:'피난실의 동료들과 합류하자'},{after:['C09_05'],text:'태오와 마주했다. 결정하자'},{after:['C09_06'],text:'폭풍이 잦아들었다'}] },

  { id:'CH10', no:10, title:'새벽의 선착장', place:'선착장', scene:'C10', thumb:'CH10_A', summary:'보트를 고치고 안전한 출항 시각을 찾는다.', startView:'A', completeId:'C10_12', map:{ x:36, y:76 },
    views:[
      { id:'A', name:'새벽 선착장', asset:'CH10_A', hotspots:[
        { id:'net_crates', name:'그물 상자', rect:{x:.14,y:.52,w:.22,h:.16}, caption:'그물과 부표가 담긴 상자.', after:[{id:'C10_01',text:'그물뿐이다.'}] },
        { id:'pier_box', name:'선착장 관리함', rect:{x:.12,y:.26,w:.1,h:.13}, caption:'벽의 관리함.', after:[{id:'C10_02',text:'빈 관리함.'}] },
        { id:'boat', name:'모터보트', rect:{x:.5,y:.4,w:.47,h:.3}, caption:'작은 모터보트. 엔진 덮개가 열려 있다. 정비는 배 위에서 해야 한다.' }
      ]},
      { id:'B', name:'보트 정비', asset:'CH10_B', hotspots:[
        { id:'manual_holder', name:'정비 설명서', rect:{x:.23,y:.37,w:.12,h:.13}, caption:'선실 벽 설명서 꽂이.' },
        { id:'fuel_port', name:'연료 연결구', rect:{x:.4,y:.4,w:.17,h:.14}, caption:'엔진 연료 연결구. 호스가 빠져 있다.', after:[{id:'C10_05',text:'호스가 연결됐다. 프라이밍 벌브가 말랑하다.'},{id:'C10_06',text:'벌브가 단단해졌다. 연료가 찼다.'}] },
        { id:'contact_point', name:'점화 접점', rect:{x:.62,y:.3,w:.2,h:.16}, caption:'점화 접점에 하얀 소금기가 끼어 있다.', after:[{id:'C10_07',text:'접점이 반짝인다.'}] },
        { id:'tool_bench', name:'공구 상자', rect:{x:0,y:.57,w:.3,h:.18}, caption:'갑판의 공구 상자.', after:[{id:'C10_04',text:'남은 건 녹슨 드라이버뿐이다.'}] },
        { id:'helm', name:'조타석', rect:{x:0,y:.17,w:.24,h:.18}, caption:'조타석 시동 열쇠 구멍.', after:[{id:'C10_08',text:'엔진이 낮게 울리고 있다.'}] }
      ]},
      { id:'C', name:'출항 관측 구역', asset:'CH10_C', hotspots:[
        { id:'tide_board', name:'조수표 게시판', rect:{x:.06,y:.14,w:.2,h:.31}, caption:'관측대 게시판의 조수표.' },
        { id:'lighthouse', name:'먼 등대', rect:{x:.83,y:.26,w:.12,h:.14}, caption:'건너편 등대가 다시 돌고 있다.' },
        { id:'mooring', name:'계류줄', rect:{x:.48,y:.74,w:.28,h:.16}, caption:'보트를 묶어 둔 계류줄. 출항 시각을 정하고 풀어야 한다.' }
      ]}
    ],
    intro:lines('D10_IN',[['도윤','새벽. 폭풍이 지나간 바다가 낮게 숨을 쉰다.'],['서린','선착장에 보트가 있어요. 엔진만 살리면 육지까지 갈 수 있어요.',{portrait:'seorin_relieved'}],['도윤','원본은 내 손에 있다. 이제 나가기만 하면 된다.']]),
    objectives:[{after:[],text:'보트를 정비하자'},{after:['C10_08'],text:'안전한 출항 시각을 찾자'},{after:['C10_11'],text:'마지막 결정을 내리자'},{after:['C10_12'],text:'새벽이 밝았다'}] }
];

/* ---------- puzzles ---------- */
export const seasonPuzzles:PuzzleDef[] = [
  ...chapterPuzzles('CH02','C02',[
    ['C02_01',{ title:'관측 일지 읽기', mode:'inspect', at:'A:ops_ledger', clues:['c02_log'], hints:['사무실 책상 위를 보자.','일지 표지 안쪽에 배수 기준이 있다.','관측 일지를 조사해 수첩에 기록한다.'], fail:'일지를 먼저 살펴보자.', repeat:'일지 내용은 수첩에 기록했다.' }],
    ['C02_02',{ title:'펌프실 열쇠 찾기', mode:'inspect', at:'A:desk_tray', grant:['pump_key'], hints:['책상 오른쪽 서류함을 보자.','서류 사이에 열쇠가 끼어 있다.','서류함을 조사해 펌프실 열쇠를 챙긴다.'], fail:'서류함을 다시 보자.', repeat:'펌프실 열쇠를 이미 챙겼다.' }],
    ['C02_03',{ title:'펌프실 열기', mode:'use', at:'B:pump_shed', items:['pump_key'], to:'C', flags:{pump_room_open:true}, ui:{button:'펌프실 열쇠로 열기',need:'문을 열 열쇠가 필요하다.'}, hints:['수조 너머 펌프실 건물을 보자.','관리동에서 찾은 열쇠의 꼬리표를 떠올리자.','펌프실 열쇠를 펌프실 건물에 사용한다.'], fail:'문이 잠겨 있다. 맞는 열쇠가 필요하다.', repeat:'펌프실 문은 열려 있다.' }],
    ['C02_04',{ title:'수위계 확인', mode:'inspect', at:'B:level_gauge', clues:['c02_gauge'], hints:['수조 옆 세로 수위계를 보자.','표식 세 개 중 지금 수위가 어디인지 확인한다.','수위계를 조사해 현재 수위를 기록한다.'], fail:'수위계를 살펴보자.', repeat:'현재 수위는 수첩에 있다.' }],
    ['C02_05',{ title:'배관도 읽기', mode:'inspect', at:'C:pipe_plate', clues:['c02_pipe'], hints:['펌프실 벽의 배관도를 보자.','두 우회 밸브의 방향이 다르다.','배관도를 조사해 수첩에 기록한다.'], fail:'배관도를 살펴보자.', repeat:'배관도는 수첩에 있다.' }],
    ['C02_06',{ title:'목표 수위까지 배수', category:'core', mode:'dials', at:'C:pump_panel', answer:['off','open','closed','10'], flags:{tank_drained:true},
      ui:{ button:'배수 시작', dials:[
        { label:'주 펌프', initial:'on', options:[{id:'on',label:'가동'},{id:'off',label:'정지'}] },
        { label:'파란 우회 밸브', initial:'closed', options:[{id:'open',label:'열림'},{id:'closed',label:'닫힘'}] },
        { label:'빨간 우회 밸브', initial:'open', options:[{id:'open',label:'열림'},{id:'closed',label:'닫힘'}] },
        { label:'배수 시간', initial:'30', options:[{id:'10',label:'10분'},{id:'20',label:'20분'},{id:'30',label:'30분'}] } ] },
      explain:a=>{const [pump,blue,red,time]=arr(a);
        if(pump==='on')return '펌프가 돌고 있어 우회 밸브가 잠겨 움직이지 않는다. 인터록 표시등이 깜빡인다.';
        if(blue!=='open')return '배출 쪽이 닫혀 있어 물이 빠질 곳이 없다.';
        if(red==='open')return '빨간 밸브로 바닷물이 계속 들어와 수위가 그대로다.';
        if(time!=='10')return '이대로면 수위가 표식 1 아래로 떨어진다. 일지의 경고와 배관도의 하강 속도를 다시 보자.';
        return undefined;},
      hints:['수위계·관측 일지·배관도를 함께 보자.','펌프를 멈추고 배출 쪽 우회만 연다. 표식 3에서 2까지는 한 칸이다.','펌프 정지 · 파란 밸브 열림 · 빨간 밸브 닫힘 · 10분으로 배수를 시작한다.'], fail:'수위가 목표에 맞지 않는다.', repeat:'수위는 표식 2에 맞춰졌다.' }],
    ['C02_07',{ title:'관측함의 시계', mode:'inspect', at:'B:level_gauge', req:['C02_06'], grant:['tide_watch'], clues:['c02_tidewatch'], hints:['물이 빠진 수위계 아래를 보자.','관측함이 물 밖으로 드러났다.','수위계를 다시 조사해 관측 시계를 챙긴다.'], fail:'관측함이 아직 물에 잠겨 있다.', repeat:'조수 관측 시계를 이미 챙겼다.' }],
    ['C02_08',{ title:'잠긴 서랍 (선택)', category:'optional', mode:'code', at:'A:locked_drawer', answer:'0914', evidence:['E01'], ui:{length:4,charset:'digits',prompt:'서랍 번호'}, hints:['관측 일지 맨 아래 메모를 보자.','‘정상’이라고 적힌 마지막 날짜를 찾는다.','서랍에 0914를 입력한다.'], fail:'자물쇠가 꿈쩍하지 않는다.', repeat:'서랍 속 일지 한 면은 수첩 증거에 있다.' }],
    ['C02_09',{ title:'해안길로 나가기', mode:'move', at:'B:coast_road', req:['C02_06','C02_07'], complete:true, ui:{button:'해안길로 나간다'}, hints:['물이 빠진 해안길을 보자.','관측 시계도 챙겼는지 확인하자.','해안길을 조사하고 나간다를 선택한다.'], fail:'아직 길이 물에 잠겨 있거나 챙길 것이 남았다.', repeat:'2장을 마쳤다.' }]
  ]),
  ...chapterPuzzles('CH03','C03',[
    ['C03_01',{ title:'조위 표척 읽기', mode:'inspect', at:'A:tide_gauge', clues:['c03_tide_board'], hints:['동굴 왼쪽 표척을 보자.','안내판에 동굴 출입 조건이 있다.','조위 표척을 조사해 기록한다.'], fail:'표척을 살펴보자.', repeat:'안내판 내용은 수첩에 있다.' }],
    ['C03_02',{ title:'썰물에 동굴 들어가기', category:'core', mode:'move', at:'A:cave_mouth', items:['tide_watch'], ui:{button:'동굴로 들어간다'}, hints:['조수 시계의 구간을 보자.','썰물일 때만 모래 길이 드러난다. 기다리기로 시간을 보낼 수 있다.','썰물이 될 때까지 기다린 뒤 동굴 입구로 들어간다.'], fail:'물이 길을 덮고 있다. 조수 시계를 보며 썰물을 기다리자.', repeat:'썰물이면 다시 들어갈 수 있다.' }],
    ['C03_03',{ title:'예비 반사판 찾기', mode:'inspect', at:'B:supply_crate', grant:['reflector_disk'], hints:['반사판 구역 아래쪽 상자를 보자.','정비용 예비 부품이 있다.','나무 상자를 조사해 예비 반사판을 챙긴다.'], fail:'상자를 살펴보자.', repeat:'예비 반사판을 이미 챙겼다.' }],
    ['C03_04',{ title:'금 간 반사판 교체', mode:'use', at:'B:reflector_2', items:['reflector_disk'], consume:['reflector_disk'], ui:{button:'예비 반사판으로 교체',need:'바꿔 끼울 반사판이 필요하다.'}, hints:['가운데 반사판을 자세히 보자.','금이 간 반사판은 빛을 흩뜨린다.','예비 반사판을 가운데 반사판에 사용한다.'], fail:'금이 간 반사판은 빛을 흩뜨린다. 바꿔 끼울 것이 필요하다.', repeat:'가운데 반사판은 새것이다.' }],
    ['C03_05',{ title:'반사판으로 표적 비추기', category:'core', mode:'dials', at:'B:reflectors', req:['C03_04'], answer:['se','e','n'], flags:{target_lit:true},
      ui:{ button:'빛 보내기', preview:'beam', dials:[{label:'첫째 반사판',initial:'e',options:dirOptions},{label:'가운데 반사판',initial:'n',options:dirOptions},{label:'셋째 반사판',initial:'w',options:dirOptions}] },
      hints:['바닥 평면도에서 빛이 들어오는 쪽과 표적의 위치를 보자.','빛은 첫째 → 가운데 → 셋째 반사판을 거쳐야 표적에 닿는다.','첫째 남동, 가운데 동, 셋째 북으로 맞춘다.'], fail:'빛이 표적에 닿지 않는다.', repeat:'표적이 빛나고 사다리가 내려와 있다.' }],
    ['C03_06',{ title:'대피 표식 읽기', mode:'inspect', at:'C:evac_marks', clues:['c03_evac'], hints:['윗선반 바위벽을 보자.','누군가 시각을 새겨 두었다.','대피 표식을 조사해 기록한다.'], fail:'벽을 살펴보자.', repeat:'대피 표식은 수첩에 있다.' }],
    ['C03_07',{ title:'비상 연락함 열기', category:'core', mode:'code', at:'C:relay_box', answer:'2005', grant:['relay_key'], ui:{length:4,charset:'digits',prompt:'도착 시각'}, hints:['연락함 덮개의 새김을 보자.','벽의 대피 표식에 마지막 인원이 도착한 시각이 있다.','연락함에 2005를 입력한다.'], fail:'연락함이 열리지 않는다.', repeat:'중계 열쇠를 챙겼다.' }],
    ['C03_08',{ title:'선반길로 빠져나가기', mode:'move', at:'C:ledge_exit', items:['relay_key'], complete:true, stopTimer:true, ui:{button:'선반길로 나간다'}, hints:['윗선반 바깥쪽 길을 보자.','중계 열쇠를 챙겼다면 동굴을 나갈 때다.','바깥 선반길로 나간다.'], fail:'아직 챙기지 못한 것이 있다.', repeat:'3장을 마쳤다.' }]
  ]),
  ...chapterPuzzles('CH04','C04',[
    ['C04_01',{ title:'렌즈 손잡이 찾기', mode:'inspect', at:'A:maint_cabinet', grant:['lens_crank'], hints:['입구의 정비함을 보자.','등대 정비 도구가 남아 있다.','정비함을 조사해 렌즈 조절 손잡이를 챙긴다.'], fail:'정비함을 살펴보자.', repeat:'렌즈 조절 손잡이를 챙겼다.' }],
    ['C04_02',{ title:'해도 액자 보기', mode:'inspect', at:'A:landmark_frame', clues:['c04_landmarks'], hints:['입구 벽의 액자를 보자.','장소마다 기호와 호출부호가 있다.','해도 액자를 조사해 기록한다.'], fail:'액자를 살펴보자.', repeat:'해도 내용은 수첩에 있다.' }],
    ['C04_03',{ title:'계단 철문 열기', mode:'move', at:'A:stair_gate', flags:{stairs_open:true}, to:'B', ui:{button:'빗장을 들어 올린다'}, hints:['안쪽 계단 철문을 보자.','빗장만 걸려 있다.','철문을 조사해 빗장을 들어 올린다.'], fail:'철문이 꿈쩍하지 않는다.', repeat:'계단 철문은 열려 있다.' }],
    ['C04_04',{ title:'중계함 전원 넣기', mode:'use', at:'B:relay_cabinet', items:['relay_key'], consume:['relay_key'], flags:{relay_power:true}, ui:{button:'중계 열쇠를 꽂아 돌린다',need:'놋쇠 열쇠 구멍이다.'}, hints:['계단 층계참의 중계함을 보자.','동굴에서 가져온 열쇠의 이름을 떠올리자.','중계 열쇠를 중계함에 사용한다.'], fail:'중계함이 잠겨 있다.', repeat:'중계함에 전원이 들어와 있다.' }],
    ['C04_05',{ title:'모스 신호 해독', category:'core', mode:'code', at:'C:relay_terminal', req:['C04_04'], answer:'HAK', clues:['c04_relay_log'], ui:{length:3,charset:'letters',prompt:'확인 부호',docs:['c04_morse']}, hints:['단말 화면의 깜빡임과 대응표를 보자.','긴 신호와 짧은 신호를 끊어서 세 글자로 읽는다.','단말에 HAK를 입력한다.'], fail:'“확인 부호 불일치.”', repeat:'중계 기록은 수첩에 있다.' }],
    ['C04_06',{ title:'렌즈 정렬', category:'core', mode:'dials', at:'C:lens_collar', req:['C04_05'], items:['lens_crank'], answer:['tri'], flags:{lighthouse_lit:true},
      ui:{ button:'렌즈를 고정한다', dials:[{label:'렌즈 회전 고리',initial:'dia',options:[{id:'dia',label:'◇'},{id:'sq',label:'□'},{id:'tri',label:'△'},{id:'cir',label:'○'},{id:'star',label:'☆'}]}], need:'고리를 돌릴 손잡이가 필요하다.' },
      hints:['단말이 요청한 호출부호를 떠올리자.','입구 해도 액자에서 호출부호에 맞는 표적 기호를 찾는다.','렌즈 회전 고리를 △에 맞춘다.'], fail:'빛이 엉뚱한 곳을 비춘다. 호출 지점의 표적 기호를 찾자.', repeat:'렌즈가 분교 쪽을 비추고 있다.' }],
    ['C04_07',{ title:'섬 지도 확보', category:'core', mode:'inspect', at:'D:map_board', req:['C04_06'], evidence:['island_map'], flags:{map_full:true}, hints:['기록실 지도판을 보자.','렌즈가 돌자 지도판에 형광 표식이 드러났다.','지도판을 조사해 섬 지도를 확보한다.'], fail:'지도판의 표식이 흐려 읽을 수 없다. 렌즈에 불이 들어와야 할 것 같다.', repeat:'섬 지도는 증거와 지도 버튼에 있다.' }],
    ['C04_08',{ title:'접수 원본 서랍 (선택)', category:'optional', mode:'code', at:'D:file_drawer', answer:'1840', evidence:['E02'], ui:{length:4,charset:'digits',prompt:'서랍 번호'}, hints:['서랍 표찰과 단말의 중계 기록을 보자.','대피 방송 요청이 접수된 시각이다.','서랍에 1840을 입력한다.'], fail:'서랍이 열리지 않는다.', repeat:'접수 원본은 수첩 증거에 있다.' }],
    ['C04_09',{ title:'분교로 향하기', mode:'move', at:'A:outer_door', req:['C04_06','C04_07'], complete:true, ui:{button:'분교로 향한다'}, hints:['입구 바깥 문을 보자.','렌즈와 지도를 모두 마쳤다면 떠날 수 있다.','바깥 문에서 분교로 향한다.'], fail:'등대에서 할 일이 남았다.', repeat:'4장을 마쳤다.' }]
  ]),
  ...chapterPuzzles('CH05','C05',[
    ['C05_01',{ title:'학급 사진 보기', mode:'inspect', at:'A:display_board', clues:['c05_photo'], hints:['복도 게시판을 보자.','빈자리가 있는 학급 사진이다.','게시판의 사진을 조사해 기록한다.'], fail:'게시판을 살펴보자.', repeat:'학급 사진은 수첩에 있다.' }],
    ['C05_02',{ title:'자리표 보기', mode:'inspect', at:'B:seating_chart', clues:['c05_seats'], hints:['교실 칠판 옆을 보자.','자리표는 교실 뒤에서 본 모습이다.','자리표를 조사해 기록한다.'], fail:'자리표를 살펴보자.', repeat:'자리표는 수첩에 있다.' }],
    ['C05_03',{ title:'교무실 열쇠 찾기', mode:'inspect', at:'A:shoe_cabinet', grant:['staff_key'], hints:['복도 신발장을 보자.','맨 위 선생님 칸이다.','신발장을 조사해 교무실 열쇠를 챙긴다.'], fail:'신발장을 살펴보자.', repeat:'교무실 열쇠를 챙겼다.' }],
    ['C05_04',{ title:'교무실 열기', mode:'use', at:'A:staff_door', items:['staff_key'], to:'C', ui:{button:'교무실 열쇠로 연다',need:'문이 잠겨 있다.'}, hints:['계단 옆 교무실 문을 보자.','신발장에서 찾은 열쇠다.','교무실 열쇠를 교무실 문에 사용한다.'], fail:'문이 잠겨 있다.', repeat:'교무실 문은 열려 있다.' }],
    ['C05_05',{ title:'출석부 보기', mode:'inspect', at:'C:attendance', clues:['c05_register'], hints:['교무실 책상의 출석부를 보자.','번호와 9월 17일 메모가 있다.','출석부를 조사해 기록한다.'], fail:'출석부를 살펴보자.', repeat:'출석부는 수첩에 있다.' }],
    ['C05_06',{ title:'조퇴한 아이들의 사물함', category:'core', mode:'sequence', at:'C:lockers', answer:['3','5','6'], grant:['archive_key'],
      ui:{ button:'열어 본다', actions:['1','2','3','4','5','6','7','8'].map(n=>({id:n,label:n+'번'})) },
      hints:['사진의 빈자리, 자리표, 출석부를 함께 보자.','사진은 칠판 앞에서 찍었고 자리표는 교실 뒤에서 그렸다. 창문 위치로 좌우를 맞춘다.','3번 → 5번 → 6번 순서로 연다.'], fail:'철컥— 잠금이 처음으로 돌아갔다.', repeat:'자료실 열쇠를 챙겼다.' }],
    ['C05_07',{ title:'자료실 열기', mode:'use', at:'C:archive_door', items:['archive_key'], to:'D', flags:{hyejin_found:true}, ui:{button:'자료실 열쇠로 연다',need:'잠겨 있다. 안에서 사람 소리가 난다.'}, hints:['교무실 안쪽 문을 보자.','사물함에서 찾은 열쇠다.','자료실 열쇠를 자료실 문에 사용한다.'], fail:'문이 잠겨 있다.', repeat:'자료실 문은 열려 있다.' }],
    ['C05_08',{ title:'사진첩의 기억', mode:'inspect', at:'D:photo_album', clues:['c05_album'], hints:['자료실 탁자의 사진첩을 보자.','조사팀 방문 사진이다.','사진첩을 조사한다.'], fail:'사진첩을 살펴보자.', repeat:'사진첩의 기억은 수첩에 있다.' }],
    ['C05_09',{ title:'혜진의 증언', category:'story', mode:'inspect', at:'D:hyejin', req:['C05_08'], grant:['forest_key'], flags:{hyejin_rescued:true}, hints:['자료실의 혜진에게 말을 걸자.','사진첩을 먼저 보면 할 이야기가 생긴다.','혜진을 조사해 이야기를 듣는다.'], fail:'혜진이 사진첩 쪽을 가리킨다. “저것부터 봐요.”', repeat:'혜진은 분교에서 기다리기로 했다.' }],
    ['C05_10',{ title:'높은 숲길로', mode:'use', at:'A:back_gate', items:['forest_key'], complete:true, ui:{button:'숲길 문 열쇠로 연다',need:'잠겨 있다.'}, hints:['복도 끝 뒷문을 보자.','혜진이 건넨 열쇠다.','숲길 문 열쇠를 뒷문에 사용한다.'], fail:'뒷문이 잠겨 있다.', repeat:'5장을 마쳤다.' }]
  ]),
  ...chapterPuzzles('CH06','C06',[
    ['C06_01',{ title:'이정표와 고정핀', mode:'inspect', at:'A:signpost', clues:['c06_signpost'], grant:['safety_pin'], hints:['갈림길 이정표를 보자.','기둥에 꼬리표와 핀이 걸려 있다.','이정표를 조사해 고정핀을 챙긴다.'], fail:'이정표를 살펴보자.', repeat:'고정핀을 챙겼다.' }],
    ['C06_02',{ title:'울타리 끈 풀기', mode:'inspect', at:'A:fence', grant:['vine_rope'], hints:['길 옆 울타리를 보자.','튼튼한 끈이 감겨 있다.','울타리를 조사해 끈을 챙긴다.'], fail:'울타리를 살펴보자.', repeat:'끈을 챙겼다.' }],
    ['C06_03',{ title:'장력 장치 살피기', mode:'inspect', at:'B:tension_rig', clues:['c06_rig'], hints:['덫 옆 장력 장치를 보자.','표찰에 해제 절차가 있다.','장력 장치를 조사해 기록한다.'], fail:'장력 장치를 살펴보자.', repeat:'해제 절차는 수첩에 있다.' }],
    ['C06_04',{ title:'덫 해제', category:'core', mode:'sequence', at:'B:tension_rig', req:['C06_03'], items:['safety_pin'], consume:['safety_pin'], answer:['pin_high','lever','detach'], flags:{trap_disarmed:true},
      ui:{ button:'절차 실행', need:'고정핀 없이 건드리면 줄이 튕긴다.', actions:[{id:'pin_low',label:'핀 → 저 구멍'},{id:'pin_mid',label:'핀 → 중 구멍'},{id:'pin_high',label:'핀 → 고 구멍'},{id:'lever',label:'장력 레버 풀기'},{id:'detach',label:'줄 분리'},{id:'cut',label:'줄 끊기'}] },
      explain:a=>{const s=arr(a);if(!s[0]?.startsWith('pin'))return '핀 없이 건드리자 줄이 튕기려 한다. 얼른 손을 뗐다.';if(s[0]!=='pin_high')return '핀이 헐겁다. 장력 표시와 같은 구멍이 아니다.';if(s.includes('cut'))return '팽팽한 줄을 끊으면 반동이 온다. 표찰의 절차를 따르자.';return undefined;},
      hints:['장력 표시의 색과 표찰의 절차를 보자.','장력이 ‘고’다. 핀을 먼저 꽂고 레버, 그다음 줄이다.','핀 → 고 구멍, 장력 레버 풀기, 줄 분리 순서로 실행한다.'], fail:'순서가 맞지 않는다. 표찰의 절차를 다시 보자.', repeat:'덫은 해제됐다.' }],
    ['C06_05',{ title:'보강 판자 고르기', mode:'inspect', at:'C:plank_pile', grant:['repair_plank'], hints:['다리 옆 판자 더미를 보자.','쓸 만한 판자가 있다.','판자 더미를 조사해 보강 판자를 챙긴다.'], fail:'판자 더미를 살펴보자.', repeat:'보강 판자를 챙겼다.' }],
    ['C06_06',{ title:'판자에 끈 묶기', category:'core', mode:'combine', at:'ANY', req:['C06_02','C06_05'], items:['repair_plank','vine_rope'], answer:['repair_plank','vine_rope'], consume:['repair_plank','vine_rope'], grant:['lashed_plank'], hints:['판자만 올려 두면 미끄러진다.','고정할 끈과 판자를 합치자.','보강 판자와 울타리 끈을 조합한다.'], fail:'이 둘을 연결할 방법이 없다.', repeat:'끈 묶은 판자를 만들었다.' }],
    ['C06_07',{ title:'다리 보강', mode:'use', at:'C:bridge_gap', items:['lashed_plank'], consume:['lashed_plank'], flags:{bridge_fixed:true}, ui:{button:'판자를 묶어 고정한다',need:'빈자리에 맞는 판자와 고정할 끈이 필요하다.'}, hints:['다리 가운데 빈자리를 보자.','판자만으로는 미끄러진다. 끈으로 고정해야 한다.','끈 묶은 판자를 부서진 다리에 사용한다.'], fail:'그대로는 판자가 미끄러진다.', repeat:'다리는 튼튼하다.' }],
    ['C06_08',{ title:'다리를 건너 초소로', mode:'move', at:'C:far_path', req:['C06_07'], complete:true, ui:{button:'다리를 건넌다'}, hints:['건너편 길을 보자.','보강한 다리로 건널 수 있다.','건너편 길로 이동한다.'], fail:'다리가 아직 부서져 있다.', repeat:'6장을 마쳤다.' }]
  ]),
  ...chapterPuzzles('CH07','C07',[
    ['C07_01',{ title:'철제 상자 열기', mode:'inspect', at:'A:ammo_box', grant:['radio_connector'], hints:['초소 앞 벤치 옆 상자를 보자.','통신 부품이 들어 있다.','철제 상자를 조사해 통신 접점을 챙긴다.'], fail:'상자를 살펴보자.', repeat:'통신 접점을 챙겼다.' }],
    ['C07_02',{ title:'초소 철문 열기', mode:'move', at:'A:post_door', to:'B', flags:{minseok_found:true}, ui:{button:'빗장을 풀고 들어간다'}, hints:['초소 철문을 보자.','바깥 빗장만 걸려 있다.','철문의 빗장을 풀고 들어간다.'], fail:'철문이 열리지 않는다.', repeat:'초소 철문은 열려 있다.' }],
    ['C07_03',{ title:'무전기 수리', mode:'use', at:'B:transceiver', items:['radio_connector'], consume:['radio_connector'], flags:{radio_fixed:true}, ui:{button:'통신 접점을 끼운다',need:'안테나 단자의 접점이 빠져 있다.'}, hints:['무전기 뒷면 단자를 보자.','빠진 부품이 있다.','통신 접점을 무전기에 사용한다.'], fail:'단자에 맞는 부품이 필요하다.', repeat:'무전기 단자는 고쳤다.' }],
    ['C07_04',{ title:'주파수표 읽기', mode:'inspect', at:'B:freq_chart', clues:['c07_freq'], hints:['무전기 위 주파수표를 보자.','대역마다 용도와 호출부호가 있다.','주파수표를 조사해 기록한다.'], fail:'주파수표를 살펴보자.', repeat:'주파수표는 수첩에 있다.' }],
    ['C07_05',{ title:'구조 요청 송신', category:'core', mode:'dials', at:'B:transceiver', req:['C07_03'], answer:['C','CG'], flags:{rescue_failed:true},
      ui:{ button:'송신', dials:[{label:'대역',initial:'A',options:['A','B','C','D'].map(id=>({id,label:id}))},{label:'상대 호출부호',initial:'FN',options:['FN','LH','CG','HD'].map(id=>({id,label:id}))}] },
      hints:['주파수표의 구조 요청 안내를 보자.','해경 비상 대역과 그 호출부호를 고른다.','대역 C, 호출부호 CG로 송신한다.'], fail:'잡음뿐이다. 구조 요청에 맞는 대역과 호출부호가 아니다.', repeat:'응답은 없었다. 바깥 안테나가 끊겨 있다.' }],
    ['C07_06',{ title:'배선반 확인', mode:'inspect', at:'C:patch_panel', clues:['c07_patch'], hints:['자료실 벽 배선반을 보자.','녹음 장치가 어느 회선에 연결됐는지 적혀 있다.','배선반을 조사해 기록한다.'], fail:'배선반을 살펴보자.', repeat:'배선반 내용은 수첩에 있다.' }],
    ['C07_07',{ title:'그날의 녹음 열람', category:'core', mode:'code', at:'C:codebook', answer:'7246', evidence:['E03'], ui:{length:4,charset:'digits',prompt:'열람 번호',docs:['c07_codebook']}, hints:['녹음 장치 화면, 배선반, 주파수표, 난수표를 같이 보자.','날짜는 9/17, 열은 녹음 장치가 연결된 D 회선의 호출부호다.','열람 번호 7246을 입력한다.'], fail:'“열람 번호 불일치.”', repeat:'방송 보류 로그는 수첩 증거에 있다.' }],
    ['C07_08',{ title:'케이블 추적', mode:'inspect', at:'C:wall_cable', req:['C07_07'], clues:['c07_cable'], hints:['벽을 뚫고 나가는 케이블을 보자.','방송과 CCTV가 어디서 오는지 알 수 있다.','벽 케이블을 조사한다.'], fail:'지금은 녹음 장치가 먼저다.', repeat:'케이블은 숲 위쪽 집으로 이어진다.' }],
    ['C07_09',{ title:'감시자의 집으로', mode:'move', at:'C:wall_cable', req:['C07_08'], complete:true, ui:{button:'케이블을 따라간다'}, hints:['케이블이 향하는 곳으로 가자.','방송의 주인이 있는 곳이다.','벽 케이블에서 따라간다를 선택한다.'], fail:'아직 케이블을 확인하지 않았다.', repeat:'7장을 마쳤다.' }]
  ]),
  ...chapterPuzzles('CH08','C08',[
    ['C08_01',{ title:'작업 점퍼의 명찰', mode:'inspect', at:'A:work_jacket', clues:['c08_jacket'], flags:{taeo_identified:true}, hints:['거실 문 옆 점퍼를 보자.','명찰이 달려 있다.','작업 점퍼를 조사한다.'], fail:'점퍼를 살펴보자.', repeat:'명찰은 수첩에 있다.' }],
    ['C08_02',{ title:'그릇 속 열쇠', mode:'inspect', at:'A:key_bowl', grant:['monitor_key'], hints:['탁자 위 나무 그릇을 보자.','열쇠가 하나 있다.','나무 그릇을 조사해 열쇠를 챙긴다.'], fail:'그릇을 살펴보자.', repeat:'모니터실 열쇠를 챙겼다.' }],
    ['C08_03',{ title:'안쪽 문 열기', mode:'use', at:'A:inner_door', items:['monitor_key'], to:'B', ui:{button:'열쇠로 연다',need:'잠겨 있다.'}, hints:['거실 안쪽 문을 보자.','그릇에서 찾은 열쇠다.','모니터실 열쇠를 안쪽 문에 사용한다.'], fail:'문이 잠겨 있다.', repeat:'안쪽 문은 열려 있다.' }],
    ['C08_04',{ title:'메모판 읽기', mode:'inspect', at:'B:corkboard', clues:['c08_cam_note'], hints:['모니터실 메모판을 보자.','두 카메라의 시계 상태가 다르다.','메모판을 조사해 기록한다.'], fail:'메모판을 살펴보자.', repeat:'메모 내용은 수첩에 있다.' }],
    ['C08_05',{ title:'CCTV 시각 보정', category:'core', mode:'dials', at:'B:playback', req:['C08_04'], answer:['-12'], clues:['c08_cctv'],
      ui:{ button:'보정 적용', docs:['c08_playback'], dials:[{label:'2번 카메라 보정',initial:'0',options:Array.from({length:31},(_,i)=>{const v=i-15;return {id:String(v),label:(v>0?'+':v<0?'−':'±')+Math.abs(v)+'분'};})}] },
      hints:['2번 카메라가 찍은 사건과 수첩의 중계 기록을 비교하자.','수동 방송은 기록상 20:05, 화면에서는 20:17이다.','2번 카메라를 −12분으로 보정한다.'], fail:'두 화면의 사건이 맞지 않는다.', repeat:'두 카메라가 같은 시각으로 맞춰졌다.' }],
    ['C08_06',{ title:'사건 파일 네 권', mode:'inspect', at:'C:case_folders', clues:['c08_files'], hints:['기록실 책상의 파일을 보자.','태오가 모은 사람들의 기록이다.','사건 파일을 조사한다.'], fail:'파일을 살펴보자.', repeat:'파일 내용은 수첩에 있다.' }],
    ['C08_07',{ title:'펼친 파일', mode:'inspect', at:'C:open_folder', clues:['c08_seohee'], hints:['펼쳐진 파일 한 권을 보자.','여백에 손글씨가 있다.','펼친 파일을 조사한다.'], fail:'파일을 살펴보자.', repeat:'윤서희의 파일은 수첩에 있다.' }],
    ['C08_08',{ title:'작업실 번호', category:'core', mode:'code', at:'C:work_door', answer:'0917', to:'D', ui:{length:4,charset:'digits',prompt:'작업실 번호'}, hints:['펼친 파일의 손글씨를 보자.','태오가 누나를 잃은 날짜를 월·일 네 자리로.','작업실 문에 0917을 입력한다.'], fail:'잠금이 풀리지 않는다.', repeat:'작업실 문은 열려 있다.' }],
    ['C08_09',{ title:'백업 드라이브', mode:'inspect', at:'D:gray_case', grant:['backup_drive'], hints:['작업실 아래 케이스를 보자.','원본을 담을 수 있는 장치가 있다.','회청색 케이스를 조사해 드라이브를 챙긴다.'], fail:'케이스를 살펴보자.', repeat:'백업 드라이브를 챙겼다.' }],
    ['C08_10',{ title:'엎어 둔 액자', category:'story', mode:'inspect', at:'D:photo_frame', hints:['책상 위 액자를 보자.','엎어 둔 이유가 있을 것이다.','엎어 둔 액자를 조사한다.'], fail:'액자를 살펴보자.', repeat:'분교 앞에서 웃는 윤서희의 사진이다.' }],
    ['C08_11',{ title:'원본 백업', category:'core', mode:'choice', at:'D:computer', req:['C08_05'], items:['backup_drive'], answer:'sync', evidence:['E04'],
      ui:{ options:[{id:'edit',label:'0917_제출본_final.mp4',detail:'해담개발 제출본',correct:false},{id:'cam1',label:'0917_cam1_원본.raw',detail:'1번 카메라 원본',correct:false},{id:'sync',label:'0917_cam1+cam2_보정.raw',detail:'방금 보정한 두 카메라 원본'},{id:'visit',label:'0916_조사팀_방문.mp4',detail:'사건 전날',correct:false}], need:'원본을 옮겨 담을 장치가 필요하다.' },
      explain:a=>({edit:'편집본이다. 19:50~20:20 구간이 잘려 있다.',cam1:'1번 카메라만으로는 방송 시각을 증명할 수 없다. 두 구간이 함께 필요하다.',visit:'사건 전날 영상이다.'} as Record<string,string>)[String(a)],
      hints:['백업할 파일 목록을 보자.','편집되지 않았고 두 카메라가 함께 담긴 파일이어야 한다.','0917_cam1+cam2_보정.raw를 백업한다.'], fail:'이 파일로는 증명할 수 없다.', repeat:'원본은 드라이브에 백업했다.' }],
    ['C08_12',{ title:'서명의 무게', category:'story', mode:'choice', at:'D:computer', req:['C08_11'], answer:'ack', complete:true,
      ui:{ options:[{id:'ack',label:'“내 서명이 방송을 늦췄다.”',detail:'원본과 함께 내 책임도 밝힌다.',flags:{acknowledged_responsibility:true}},{id:'deny',label:'“나는 시키는 대로 서명했을 뿐이다.”',detail:'책임은 지시한 사람들에게 있다.',flags:{acknowledged_responsibility:false}}] },
      hints:['원본을 확보했다. 이제 도윤 자신의 기억과 마주할 차례다.','어느 쪽을 골라도 이야기는 이어진다.','컴퓨터 앞에서 하나를 선택한다.'], fail:'아직 결정을 내릴 수 없다.', repeat:'8장을 마쳤다.' }]
  ]),
  ...chapterPuzzles('CH09','C09',[
    ['C09_01',{ title:'수레 위의 퓨즈', mode:'inspect', at:'C:cart', grant:['generator_fuse'], hints:['통로의 작업 수레를 보자.','발전기 부품이 있다.','작업 수레를 조사해 발전기 퓨즈를 챙긴다.'], fail:'수레를 살펴보자.', repeat:'발전기 퓨즈를 챙겼다.' }],
    ['C09_02',{ title:'재가동 지침', mode:'inspect', at:'C:closet', clues:['c09_manual'], hints:['통로의 큰 사물함을 보자.','문 안쪽에 지침이 붙어 있다.','사물함을 조사해 지침을 기록한다.'], fail:'사물함을 살펴보자.', repeat:'재가동 지침은 수첩에 있다.' }],
    ['C09_03',{ title:'손전등을 피해서', category:'core', mode:'chase', at:'C:doorway', answer:['column','closet','cart'], to:'A',
      ui:{ rounds:[{cue:'계단 쪽에서 무거운 발소리가 내려온다.'},{cue:'발전실 쪽 철문이 끼익— 열린다.'},{cue:'바로 가까이에서 무전 잡음이 치직거린다.'}], spots:[{id:'column',label:'두꺼운 기둥 뒤'},{id:'closet',label:'사물함 안'},{id:'cart',label:'수레 뒤에 엎드리기'},{id:'run',label:'출입구로 달리기'}] },
      hints:['서린의 무전 내용을 떠올리자. 수첩에 있다.','소리마다 숨을 곳이 정해져 있다.','기둥 뒤 → 사물함 안 → 수레 뒤 순서로 숨는다.'], fail:'손전등 빛이 스쳤다. 들키기 전에 통로 입구로 물러났다.', repeat:'발전실로 가는 길이 열렸다.' }],
    ['C09_04',{ title:'발전기 재가동', category:'core', mode:'sequence', at:'A:generator', req:['C09_02'], items:['generator_fuse'], consume:['generator_fuse'], answer:['all_off','fuse','fuel','start','sw3','sw2'], flags:{power_restored:true},
      ui:{ button:'지침대로 실행', need:'퓨즈함이 비어 있다.', actions:[{id:'all_off',label:'스위치 1·2·3 내리기'},{id:'fuse',label:'발전기 퓨즈 교체'},{id:'fuel',label:'연료 밸브 열기'},{id:'start',label:'시동 버튼'},{id:'sw1',label:'스위치 1 올리기'},{id:'sw2',label:'스위치 2 올리기'},{id:'sw3',label:'스위치 3 올리기'}] },
      explain:a=>{const s=arr(a);if(s.includes('sw1'))return '외부 송신 회로는 폭풍 중 올리지 말라고 했다.';if(s[0]!=='all_off')return '부하가 걸린 채로는 위험하다. 스위치부터 내리자.';const f=s.indexOf('fuel'),st=s.indexOf('start');if(st>=0&&(f<0||f>st))return '연료가 공급되지 않아 시동이 걸리지 않는다.';return undefined;},
      hints:['사물함 안쪽의 재가동 지침을 보자.','차단 → 퓨즈 → 연료 → 시동 → 피난실 회로 → 조명 회로.','스위치 내리기, 퓨즈 교체, 연료 밸브, 시동, 스위치 3, 스위치 2 순서로 실행한다.'], fail:'순서가 지침과 다르다.', repeat:'발전기가 돌고 있다.' }],
    ['C09_05',{ title:'피난실 문 앞', category:'story', mode:'inspect', at:'B:shelter_door', hints:['피난실 문 쪽을 보자.','누군가 다가오고 있다.','피난실 문을 조사한다.'], fail:'문 쪽을 살펴보자.', repeat:'태오가 문 앞에 서 있다.' }],
    ['C09_06',{ title:'협력 또는 강행', category:'story', mode:'choice', at:'B:shelter_door', req:['C09_05'], answer:'cooperate', complete:true,
      ui:{ options:[{id:'cooperate',label:'“같이 나가서, 같이 밝히자.”',detail:'원본을 보여 주고 태오에게 손을 내민다.',flags:{all_rescued:true}},{id:'force',label:'“비켜. 우린 나간다.”',detail:'태오를 밀어내고 문을 잠근다.',flags:{all_rescued:false}}] },
      hints:['태오는 지쳐 있다. 무엇을 내밀지 생각해 보자.','어느 쪽을 골라도 이야기는 이어진다.','피난실 문 앞에서 하나를 선택한다.'], fail:'아직 결정을 내릴 수 없다.', repeat:'9장을 마쳤다.' }]
  ]),
  ...chapterPuzzles('CH10','C10',[
    ['C10_01',{ title:'연료 호스 찾기', mode:'inspect', at:'A:net_crates', grant:['fuel_hose'], hints:['선착장의 그물 상자를 보자.','보트 부품이 섞여 있다.','그물 상자를 조사해 연료 호스를 챙긴다.'], fail:'상자를 살펴보자.', repeat:'연료 호스를 챙겼다.' }],
    ['C10_02',{ title:'시동 열쇠 찾기', mode:'inspect', at:'A:pier_box', grant:['boat_key'], hints:['벽의 선착장 관리함을 보자.','보트 열쇠는 보통 여기 둔다.','관리함을 조사해 시동 열쇠를 챙긴다.'], fail:'관리함을 살펴보자.', repeat:'시동 열쇠를 챙겼다.' }],
    ['C10_03',{ title:'정비 설명서', mode:'inspect', at:'B:manual_holder', clues:['c10_manual'], hints:['선실 벽 설명서 꽂이를 보자.','정비 순서가 적혀 있다.','정비 설명서를 조사해 기록한다.'], fail:'설명서를 살펴보자.', repeat:'정비 순서는 수첩에 있다.' }],
    ['C10_04',{ title:'접점 도구 찾기', mode:'inspect', at:'B:tool_bench', grant:['contact_tool'], hints:['갑판 공구 상자를 보자.','접점을 닦을 도구가 있다.','공구 상자를 조사해 접점 정비 도구를 챙긴다.'], fail:'공구 상자를 살펴보자.', repeat:'접점 정비 도구를 챙겼다.' }],
    ['C10_05',{ title:'연료 호스 연결', mode:'use', at:'B:fuel_port', items:['fuel_hose'], consume:['fuel_hose'], flags:{hose_connected:true}, ui:{button:'연료 호스를 끼운다',need:'연료를 보낼 호스가 없다.'}, hints:['엔진 연료 연결구를 보자.','호스가 빠져 있다.','연료 호스를 연료 연결구에 사용한다.'], fail:'연결할 호스가 필요하다.', repeat:'연료 호스가 연결됐다.' }],
    ['C10_06',{ title:'프라이밍 벌브', mode:'repeat', at:'B:fuel_port', req:['C10_05'], answer:3, ui:{count:3,button:'벌브 누르기'}, hints:['연결한 호스의 벌브를 보자.','설명서에 누르는 횟수가 있다.','벌브를 세 번 누른다.'], fail:'벌브가 아직 말랑하다.', repeat:'벌브가 단단해졌다.' }],
    ['C10_07',{ title:'점화 접점 청소', mode:'use', at:'B:contact_point', items:['contact_tool'], flags:{contacts_clean:true}, ui:{button:'접점 도구로 닦는다',need:'손으로는 소금기가 떨어지지 않는다.'}, hints:['엔진의 점화 접점을 보자.','하얀 소금기가 끼어 있다.','접점 정비 도구를 점화 접점에 사용한다.'], fail:'손으로는 소금기가 떨어지지 않는다.', repeat:'접점이 깨끗하다.' }],
    ['C10_08',{ title:'시동 시험', category:'core', mode:'use', at:'B:helm', req:['C10_06','C10_07'], items:['boat_key'], flags:{engine_ready:true}, ui:{button:'시동 열쇠를 돌린다',need:'시동 열쇠가 필요하다.'}, hints:['조타석을 보자.','연료와 접점 정비를 마쳤다면 시동을 걸 차례다.','시동 열쇠를 조타석에 사용한다.'], fail:'엔진이 콜록거리다 멈춘다. 설명서의 정비가 남았다.', repeat:'엔진이 준비됐다.' }],
    ['C10_09',{ title:'조수표 읽기', mode:'inspect', at:'C:tide_board', clues:['c10_tide'], hints:['관측대 게시판을 보자.','시각마다 예상 수심이 있다.','조수표를 조사해 기록한다.'], fail:'게시판을 살펴보자.', repeat:'조수표는 수첩에 있다.' }],
    ['C10_10',{ title:'등대 신호 확인', mode:'inspect', at:'C:lighthouse', clues:['c10_signal'], hints:['건너편 등대를 보자.','관측대 카드에 신호 일정이 있다.','먼 등대를 조사해 기록한다.'], fail:'등대를 살펴보자.', repeat:'신호 일정은 수첩에 있다.' }],
    ['C10_11',{ title:'출항 시각 정하기', category:'core', mode:'dials', at:'C:mooring', req:['C10_08'], answer:['0530'], flags:{departure_set:true},
      ui:{ button:'출항 시각 확정', dials:[{label:'출항 시각',initial:'0430',options:['0430','0500','0530','0600','0630'].map(id=>({id,label:id.slice(0,2)+':'+id.slice(2)}))}] },
      explain:a=>{const t=arr(a)[0];if(t==='0430'||t==='0500')return '수심이 얕아 프로펠러가 암초에 걸린다. 조수표를 다시 보자.';if(t==='0600'||t==='0630')return '그 시각 등대는 적색이다. 암초 수로가 보이지 않는다.';return undefined;},
      hints:['조수표와 등대 신호 일정을 함께 보자.','수심 1.5m 이상이면서 등대가 녹색인 시각이다.','출항 시각을 05:30으로 정한다.'], fail:'안전한 출항 시각이 아니다.', repeat:'05:30에 출항한다.' }],
    ['C10_12',{ title:'마지막 대면', category:'story', mode:'choice', at:'C:mooring', req:['C10_11'], answer:'nonviolent', complete:true,
      ui:{ status:true, options:[{id:'nonviolent',label:'“같이 가서, 전부 말합시다.”',detail:'민석을 설득한다. 원본도, 내 서명도 숨기지 않는다.',flags:{ending_violence:false}},{id:'violence',label:'“비켜.”',detail:'민석을 밀쳐내고 계류줄을 끊는다.',flags:{ending_violence:true}}] },
      hints:['민석이 계류줄을 붙잡고 있다.','결말은 지금까지 확보한 기록과 선택에 따라 달라진다.','계류줄 앞에서 하나를 선택한다.'], fail:'아직 출항 준비가 끝나지 않았다.', repeat:'새벽이 밝았다.' }]
  ])
];

/* ---------- dialogues triggered by puzzles (key = puzzle id or puzzleId:optionId) ---------- */
export const seasonDialogues:Record<string,Dialogue[]> = {
  C02_01:lines('D02_01',[['도윤','‘수위 표식 2’… 해안길을 열려면 수조 물을 빼야 한다.']]),
  C02_06:lines('D02_06',[['도윤','배수구가 울리고 수위가 한 칸 내려갔다. 수조 너머로 길이 드러난다.'],['스피커','물이 빠지면 길이 보이지. 그날도 그랬어. 다만 너무 늦었지.',SPK],['도윤','그날…? 무슨 날을 말하는 거지.']]),
  C02_07:lines('D02_07',[['도윤','관측함 안에 시계가 있었다. 바늘이 네 구간을 돈다.'],['도윤','썰물, 밀물, 만조, 낙조. 동굴 같은 곳에서 필요하겠다.']]),
  C02_08:lines('D02_08',[['도윤','“15일 관측치 삭제, 수질 ‘정상’으로 재기재.” 서명… 강민석.'],['도윤','강민석. 이 이름, 어디서 들었더라.',{portrait:'doyun_distressed'}]]),
  C02_09:lines('D02_09',[['스피커','바다가 닫히기 전에 동굴로 가. 그날 사람들도 그렇게 했어.',SPK]]),
  C03_05:lines('D03_05',[['도윤','빛이 세 번 꺾여 표적 한가운데 모였다.'],['도윤','철컥— 윗선반 사다리 고정쇠가 풀렸다.']]),
  C03_06:lines('D03_06',[['도윤','“방송은 없었다. 우리는 스스로 왔다.”'],['도윤','등대 쪽에서 온 남자… 누가 이 사람들을 데려온 걸까.',{portrait:'doyun_distressed'}]]),
  C03_08:lines('D03_08',[['도윤','등 뒤에서 바다가 동굴 입구를 삼켰다. 아슬아슬했다.'],['스피커','늦지 않았네. 그날 누군가는 늦었는데.',SPK]]),
  C04_04:lines('D04_04',[['도윤','중계함에 불이 들어왔다. 위층에서 단말이 깨어나는 소리.']]),
  C04_05:lines('D04_05',[['도윤','“18:40 대피 방송 요청 접수. 19:10 방송 보류 지시.”'],['도윤','요청은 제때 들어왔다. 그런데 누군가 30분 만에 막았다.']]),
  C04_06:lines('D04_06',[['도윤','렌즈가 돌아간다. 빛이 숲 너머 분교 지붕을 쓸고 지나간다.'],['스피커','불이 켜졌네. 8년 만이야.',SPK],['도윤','8년… 그 일이 8년 전이었나.']]),
  C04_07:lines('D04_07',[['도윤','섬 전체 지도다. 양식장, 동굴, 등대, 분교… 그리고 북쪽의 집 한 채.']]),
  C04_08:lines('D04_08',[['도윤','대피 요청 접수 원본. 18:40. 담당 서명란은 비어 있다.']]),
  C05_06:lines('D05_06',[['도윤','마지막 사물함 안쪽에 테이프로 붙인 열쇠가 있다.'],['도윤','숙제 봉투엔 서툰 글씨로 “선생님 고맙습니다”라고 적혀 있다.']]),
  C05_07:lines('D05_07',[['혜진','누구… 누구세요? 그 사람 아니죠?',{portrait:'hyejin_concerned'}],['도윤','괜찮습니다. 저도 갇혀 있다가 나왔어요. 한도윤입니다.'],['혜진','한도윤… 조사 보고서의 한도윤 씨?',{portrait:'hyejin_analytical'}]]),
  C05_08:lines('D05_08',[['서희','보고서에 위험하다고 써 주세요. 아이들이 저지대에 살아요.',{portrait:'seohee_concerned',memory:true}],['도윤','…제가 할 수 있는 건 기록하는 것뿐이에요.',{memory:true}],['도윤','나는 그 보고서에 서명했다. 위험도 ‘낮음’이라고 고쳐진 축약본에.',{portrait:'doyun_distressed'}]]),
  C05_09:lines('D05_09',[['혜진','저는 그 보고서를 검토했어요. 본사가 숫자를 고치라고 한 메일, 지금도 갖고 있어요.',{portrait:'hyejin_analytical'}],['혜진','하지만 메일만으론 부족해요. 방송이 왜 늦었는지는 다른 기록이 있어야 해요.',{portrait:'hyejin_concerned'}],['혜진','이 열쇠, 저를 데려온 사람이 떨어뜨렸어요. 뒷문 너머 숲길 문 열쇠 같아요.',{portrait:'hyejin_neutral'}],['혜진','저는 손목 때문에 여기서 기다릴게요. 꼭… 기록을 찾아요.',{portrait:'hyejin_relieved'}]]),
  C05_10:lines('D05_10',[['스피커','기억이 돌아오고 있구나. 숲으로 와.',SPK]]),
  C06_04:lines('D06_04',[['도윤','핀이 맞물리고 줄이 느슨해졌다.'],['서린','…움직이지 마요. 덫을 푼 거, 당신이에요?',{portrait:'seorin_questioning'}],['서린','박서린. 기자예요. 이 섬 사건을 쫓다가 여기까지 왔어요.',{portrait:'seorin_neutral'}],['서린','당신 얼굴, 알아요. 한도윤. 보고서에 서명한 사람.',{portrait:'seorin_questioning'}],['도윤','…맞아요. 그래서 끝까지 확인하려는 겁니다.']]),
  C06_07:lines('D06_07',[['서린','판자 끝을 끈으로 감았네요. 이 정도면 건널 수 있겠어요.',{portrait:'seorin_neutral'}]]),
  C06_08:lines('D06_08',[['서린','원본과 수정본이 둘 다 있어야 해요. 하나만으론 그냥 ‘말’일 뿐이에요.',{portrait:'seorin_questioning'}],['도윤','같이 가죠. 초소에 무전기가 있다면 기록도 있을 겁니다.']]),
  C07_02:lines('D07_02',[['민석','누, 누구야! …사람이네. 살았다.',{portrait:'minseok_alarmed'}],['도윤','강민석 씨?'],['민석','나를 알아? 난 아무것도 몰라. 그냥 끌려왔을 뿐이야.',{portrait:'minseok_defensive'}]]),
  C07_05:lines('D07_05',[['도윤','…치직. 응답 없음. 바깥 안테나 단선 경고등이 켜졌다.'],['민석','봐. 소용없어. 여긴 아무도 안 와.',{portrait:'minseok_defensive'}],['서린','그럼 여기 남은 기록이라도 찾아요. 녹음 장치가 있을 거예요.',{portrait:'seorin_worried'}]]),
  C07_07:lines('D07_07',[['도윤','[19:10] “대피 방송 보류하라. 현장 조사 보고서상 위험도 낮음. 책임자 강민석.”'],['민석','…본사가 그러라고 했어. 보고서가 괜찮다고 했잖아!',{portrait:'minseok_alarmed'}],['도윤','그 보고서에 서명한 건 나예요.',{portrait:'doyun_resolved'}],['민석','…그래, 다들 서명만 했지. 나도.',{portrait:'minseok_ashamed'}]]),
  C07_09:lines('D07_09',[['민석','난 여기 있겠어. 나가서 할 말이 아직 정리가 안 돼.',{portrait:'minseok_ashamed'}],['서린','케이블을 따라가요. 방송의 주인이 거기 있어요.',{portrait:'seorin_worried'}]]),
  C08_01:lines('D08_01',[['도윤','윤태오. 연무도 발전설비.'],['서린','윤… 윤서희 선생님 동생이에요. 분교 보조교사였던.',{portrait:'seorin_worried'}],['도윤','방송 속 목소리의 주인이다.']]),
  C08_05:lines('D08_05',[['도윤','두 화면이 같은 시각을 가리킨다.'],['도윤','20:06. 회색 셔츠의 남자가 주민들을 동굴로 이끈다. 오른손의 흉터.',{portrait:'doyun_alert'}],['서린','…당신이네요. 그날 사람들을 데려간 게.',{portrait:'seorin_questioning'}],['도윤','서명은 내가 했다. 그리고 뒤늦게 뛰어갔다. 둘 다 사실이다.',{portrait:'doyun_distressed'}]]),
  C08_07:lines('D08_07',[['도윤','“작업실 번호는 누나를 잃은 날.”']]),
  C08_10:lines('D08_10',[['서희','도윤 씨, 기록하는 사람은 마지막까지 보는 사람이래요.',{portrait:'seohee_warm',memory:true}],['도윤','분교 앞에서 웃는 사진. 태오는 이걸 엎어 두고 매일 이 앞에 앉았을 것이다.']]),
  C08_11:lines('D08_11',[['도윤','원본이 드라이브로 옮겨졌다. 편집본에서 잘려 나갔던 30분이 그대로 있다.'],['스피커','…그걸 가져가서 뭘 할 건데.',SPK]]),
  'C08_12:ack':lines('D08_12A',[['도윤','내 서명이 방송을 늦췄다. 원본과 함께 그것도 말할 거야.',{portrait:'doyun_resolved'}],['서린','…알겠어요. 그 말, 기사에 그대로 쓸게요.',{portrait:'seorin_relieved'}],['스피커','…….',SPK],['도윤','창밖에서 바람이 거세진다. 폭풍이 온다.']]),
  'C08_12:deny':lines('D08_12D',[['도윤','나는 시키는 대로 했을 뿐이야. 책임은 지시한 사람들에게 있어.',{portrait:'doyun_alert'}],['서린','…그래요. 원본은 원본대로 쓰죠.',{portrait:'seorin_questioning'}],['스피커','결국 그 말이구나.',SPK],['도윤','창밖에서 바람이 거세진다. 폭풍이 온다.']]),
  C09_03:lines('D09_03',[['도윤','손전등 빛이 지나갔다. 발전실 문이 바로 앞이다.']]),
  C09_04:lines('D09_04',[['도윤','발전기가 우렁차게 돌기 시작한다. 복도 불이 하나씩 켜진다.'],['서린','문 열렸어요! 피난실로 와요!',RADIO('seorin_relieved')]]),
  C09_05:lines('D09_05',[['혜진','도윤 씨!',{portrait:'hyejin_relieved'}],['태오','…발전기를, 너희가 살렸어?',{portrait:'taeo_stern'}],['도윤','윤태오.'],['태오','8년 동안 기다렸어. 네가 기억해 내기를. 근데 기억만으론 아무것도 안 되더라.',{portrait:'taeo_hesitant'}],['태오','누나 이름을 되찾으려면 원본이 필요했어. 그걸 네가 들고 있지.',{portrait:'taeo_stern'}]]),
  'C09_06:cooperate':lines('D09_06C',[['도윤','같이 나가자. 원본은 여기 있어. 네 누나 이야기도, 내 서명도 같이 밝히자.',{portrait:'doyun_resolved'}],['태오','…….',{portrait:'taeo_hesitant'}],['태오','혜진 씨는 내가 업을게. 선착장 길은 내가 알아.',{portrait:'taeo_cooperative'}],['서린','다 같이 가요.',{portrait:'seorin_relieved'}]]),
  'C09_06:force':lines('D09_06F',[['도윤','비켜. 우린 나간다.',{portrait:'doyun_alert'}],['태오','…또 그렇게 가는구나.',{portrait:'taeo_stern'}],['혜진','먼저 가요… 이 다리로는 폭풍 속을 못 걸어요.',{portrait:'hyejin_concerned'}],['서린','반드시 사람을 보낼게요. 꼭 버텨요.',{portrait:'seorin_worried'}]]),
  C10_08:lines('D10_08',[['도윤','엔진이 낮게 울린다. 이제 바다가 허락하는 시간만 고르면 된다.']]),
  C10_11:lines('D10_11',[['도윤','05:30. 수심도, 등대도 길을 열어 준다.'],['민석','잠깐! …그 드라이브, 이리 줘.',{portrait:'minseok_alarmed'}],['민석','그게 나가면 난 끝이야. 바다에 던지면 우리 모두 살 수 있어!',{portrait:'minseok_defensive'}],['도윤','민석이 계류줄을 붙잡고 놓지 않는다.']]),
  'C10_12:nonviolent':lines('D10_12N',[['도윤','끝나는 게 아니라 이제 시작하는 겁니다. 저도 같이 증언할게요.',{portrait:'doyun_resolved'}],['민석','…….',{portrait:'minseok_ashamed'}],['민석','줄… 풀어 주지.',{portrait:'minseok_ashamed'}]]),
  'C10_12:violence':lines('D10_12V',[['도윤','비켜!',{portrait:'doyun_alert'}],['도윤','민석이 넘어지며 계류줄이 끊기고, 보트가 부두에 세게 부딪혔다. 연료관이 터지는 소리.']])
};

export const endings:Record<'T'|'N'|'B',{ title:string; tag:string; image:string; text:string[] }> = {
  T:{ title:'기억의 귀환', tag:'TRUE ENDING', image:'ending_truth', text:['05:30. 보트가 녹색 등대 빛을 따라 암초 수로를 빠져나갔다.','원본과 수정본, 접수 기록과 방송 보류 로그가 한꺼번에 공개됐다. 8년 전의 ‘무단 진입’은 ‘지연된 대피 방송’으로 다시 기록됐다.','도윤은 조사에 응하며 자신의 서명을 인정했다. 태오는 스스로 경찰서 문을 열었다.','분교 앞 확성기 기둥에 윤서희의 이름이 새겨졌다.'] },
  N:{ title:'표류 끝', tag:'NORMAL ENDING', image:'ending_partial', text:['보트는 무사히 섬을 떠났다.','그러나 공개된 기록은 사건의 일부만 증명했다. 빠진 조각 사이로 해담개발의 변명이 다시 스며들었다.'] },
  B:{ title:'침묵의 섬', tag:'BAD ENDING', image:'ending_silence', text:['연료관이 터진 보트는 움직이지 않았다.','출항 창은 닫혔고, 섬은 다시 침묵에 잠겼다.','…아직 돌이킬 수 있다. 마지막 순간으로 돌아가 다른 선택을 할 수 있다.'] }
};
