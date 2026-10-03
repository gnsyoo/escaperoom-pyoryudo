import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sources = ['01_GAME_DESIGN.md','02_CHAPTER01_SPEC.md','03_ART_UI_GUIDE.md','04_TECH_SPEC.md','05_AI_IMPLEMENTATION_TASKS.md','06_QA_CHECKLIST.md','07_UI_IMPLEMENTATION.md'];
const parts = [
  '# 표류도 시즌 1 통합 개발 명세서',
  '웹에서 먼저 실행하고 모바일 앱으로 확장하는 미스터리 방탈출 게임의 제작 기준이다. 검은방 3의 전반적인 분위기를 참고하며 그래픽은 현대적인 고해상도 2D로 제작한다. 세계관과 인물, 10챕터, 1챕터 25단계, 그래픽과 UI, React 및 TypeScript 기술 구조, AI 개발 요청, 검수 기준, 퍼즐 JSON을 포함한다. 작성 기준일은 2026년 10월 3일이다.',
  '개발은 아래 AI 개발 작업 지시의 첫 개발 요청부터 진행한다. 사용자 최신 지시와 실제 원본 JSON이 우선이며 이 통합본은 원문에서 생성된 읽기용 사본이다. 수정은 개별 문서와 data/ch01.puzzles.json에 적용하고 node scripts/build-spec.mjs로 다시 생성한다. 현재 1챕터 P01~P25 웹 체험판과 정식 리소스·UI 이미지가 구현되어 있다. 최신 실행 상태는 07_UI_IMPLEMENTATION.md를 따른다.',
  '## 원문 파일',
  sources.map(name => `- [${name}](${name})`).join('\n') + '\n- [퍼즐 JSON](../data/ch01.puzzles.json)',
];
for (const source of sources) {
  const body = readFileSync(resolve(root, 'docs', source), 'utf8').trim();
  parts.push(body.replace(/^(#{1,5}) /gm, '$1# '));
}
parts.push('## 기계 판독 퍼즐 데이터', '다음 JSON은 data/ch01.puzzles.json의 전체 내용이다. 파일의 원문을 import해 사용하고 정답이나 보상을 UI에 따로 복제하지 않는다.', '```json\n' + readFileSync(resolve(root, 'data/ch01.puzzles.json'), 'utf8').trim() + '\n```');
const output = parts.join('\n\n') + '\n';
writeFileSync(resolve(root, 'docs/00_MASTER_SPEC.md'), output, 'utf8');
console.log(`Generated docs/00_MASTER_SPEC.md (${Buffer.byteLength(output)} UTF-8 bytes).`);
