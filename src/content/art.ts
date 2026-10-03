import manifest from '../../art/production/v01/manifest.json';
import contract from '../../art/production/v01/ch01-render-contract.json';
import type { GameState } from '../domain/game.ts';
import { chapterOfScene, has, isLegacyScene, itemArt, tidePhase, viewDef } from '../domain/game.ts';
import { seasonItems } from './season.ts';
const files=new Map(manifest.assets.map(a=>[a.id,a.path]));
// PNG originals are served as WebP copies from art/web/v01 (see scripts/optimize-art.mjs).
export const asset=(id:string)=>import.meta.env.BASE_URL+'art/'+(files.get(id)||'').replace(/\.png$/,'.webp');
export const itemAsset=(id:string)=>asset(itemArt[id]||id);
export const vector=(path:string)=>import.meta.env.BASE_URL+'art/'+path;
export const icon=(name:string)=>vector('ui/icons/'+name+'.svg');
export const scenes=contract.scenes;
export const layers=contract.layers;
export function sceneAssetId(s:GameState):string {
  if(isLegacyScene(s.sceneId)){
    const scene=scenes.find(v=>v.sceneId===s.sceneId&&v.viewId===s.viewId)!;
    const state=scene.stateAssets.find(a=>has(s,a.whenCompleted));
    return state?.assetId||scene.baseAssetId;
  }
  const view=viewDef(s.sceneId,s.viewId)!;
  if(s.sceneId==='C03'&&s.viewId==='A'&&tidePhase(s.tide)!=='LOW'&&!has(s,'C03_08'))return 'CH03_A_HIGH';
  let id=view.asset;
  for(const st of view.stateAssets||[])if(has(s,st.when))id=st.asset;
  return id;
}
export const sceneAsset=(s:GameState)=>asset(sceneAssetId(s));
const legacyViewNames:Record<string,string> = {
  R01_A:'결박된 의자',R01_B:'선반과 잠금함',R01_C:'배전함',R01_D:'환기구와 관리실 문',
  R02_A:'관리실 책상',R02_B:'점검함과 근무표',R02_C:'설비실 입구',
  R03_A:'설비실 작업대',R03_B:'밸브와 집수정',R03_C:'낮은 통로',R04_A:'외부 게이트'
};
export const viewName=(scene:string,view:string)=>legacyViewNames[scene+'_'+view]||viewDef(scene,view)?.name||'';
export const roomNames:Record<string,string>={R01:'폐창고 감금실',R02:'관리실',R03:'설비실',R04:'적재장'};
export const placeName=(scene:string)=>roomNames[scene]||chapterOfScene(scene)?.place||'';
const legacyDescriptions:Record<string,string> = {
  metal_shard:'버팀대에서 떨어진 날카로운 금속 조각. 단단한 끈을 끊을 수 있을 것 같다.',
  rope:'손목을 묶었던 마른 끈. 충분히 길고 아직 튼튼하다.',
  note_a:'높은 칸부터 낮은 칸까지. 앞에 적힌 숫자만. 아래쪽에는 찢긴 회로도의 일부가 있다.',
  screwdriver:'십자 모양 끝을 가진 작은 드라이버. 덮개의 나사를 풀 때 쓸 수 있다.',
  magnet:'손바닥만 한 자석. 좁은 곳에 떨어진 금속을 끌어당길 수 있다.',
  rope_magnet:'끈 끝에 자석을 단 도구. 손이 닿지 않는 곳까지 내려 보낼 수 있다.',
  office_key:'환기구에서 건진 작은 열쇠. 관리실 문에 맞을 것 같다.',
  fuse:'관리실 서랍에 보관된 예비 퓨즈. 어느 회로에 들어가는지 먼저 확인하자.',
  valve_handle:'집수정 배관의 비어 있는 축에 맞는 손잡이.',
  uv_lamp:'UV 램프. 전지함이 비어 있다. AA 전지 두 개가 필요하다.',
  battery_pack:'AA 전지 두 개를 묶어 둔 팩. 작업대에서 발견했다.',
  uv_lamp_ready:'전지를 끼운 UV 램프. 맨눈으로 보이지 않는 표식을 찾을 수 있다.',
  exit_plate:'황동 명판. 빛 아래에서 표식을 잇는다. 파도 → 등대 → 배 → 별.'
};
export const descriptions:Record<string,string>={...legacyDescriptions,...Object.fromEntries(seasonItems.map(i=>[i.id,i.desc]))};
export const evidence:Record<string,{title:string;text:string;overlay?:string}>={
  note_a:{title:'선반의 쪽지',text:'높은 칸부터 낮은 칸까지. 앞에 적힌 숫자만.',overlay:'note_a_text'},
  shelf_numbers:{title:'선반의 번호',text:'위쪽 선반 4 · 가운데 선반 1 · 아래쪽 선반 7'},
  circuit_plan:{title:'복원한 회로도',text:'주차단기 OFF 확인 → F2 예비 퓨즈 → 커버 정리 → 주차단기 ON. F1 통신 예비 / F2 관리실 조명·문 잠금.',overlay:'circuit_plan'},
  calendar:{title:'점검 달력',text:'12일에 기계 점검 표시가 있다.',overlay:'calendar'},
  duty_roster:{title:'근무표와 입력 규칙',text:'12일 근무는 3조. 점검함 입력은 점검일 DD + 근무조 N.',overlay:'duty_roster'},
  drain_procedure:{title:'집수정 배수 절차',text:'바다 유입 닫기 → 저수 연결 닫기 → 배출 열기 → 마지막에 구동.',overlay:'drain_procedure'},
  exit_cipher:{title:'빛으로 드러난 숫자',text:'파도 2 · 등대 6 · 배 4 · 별 1. 명판의 순서에 따라 숫자를 잇는다.',overlay:'plate_uv_numbers'}
};
const legacyHotspotNames:Record<string,string>={binding:'손목의 결박',chair_brace:'의자 버팀대',shelf_note:'선반의 쪽지',cabinet_lock:'잠금함',cabinet_inside:'잠금함 안쪽',panel_cover:'배전함 덮개',fuse_socket:'퓨즈 소켓',main_breaker:'주차단기',vent_cover:'환기구 덮개',vent_key:'환기구 안쪽',office_door:'관리실 문',desk_plan:'찢긴 회로도',desk_drawer:'책상 서랍',toolbox_lock:'점검함',calendar:'점검 달력',duty_roster:'근무표',maintenance_door:'설비실 문',workbench_battery:'작업대 전지',valve_label:'배수 작업 표찰',drain_valves:'배수 밸브',sump_plate:'집수정 바닥',loading_passage:'낮은 통로',exit_keypad:'게이트 키패드',exit_gate:'외부 게이트'};
export const hotspotNames=legacyHotspotNames;
export function hotspotName(scene:string,view:string,id:string){
  return legacyHotspotNames[id]||viewDef(scene,view)?.hotspots.find(h=>h.id===id)?.name||'확대 조사';
}
