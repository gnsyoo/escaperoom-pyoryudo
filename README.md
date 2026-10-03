# 표류도 · 기억의 해안

웹에서 실행하고 이후 모바일 앱으로 확장하는 현대적인 2D 미스터리 방탈출 게임이다. 사용자 승인 컨셉은 **적당히 낡았지만 마르고 덜 어두운 해안 시설**이다. 검은방 3의 전반적인 미스터리 분위기를 참고하며 모든 그림과 UI는 표류도용으로 새로 제작했다. 전체 글꼴은 **프리텐다드**다.

현재 **시즌 1 전체(1~10장, 퍼즐·조사 단계 108개, 엔딩 3종)**를 웹에서 처음부터 끝까지 플레이할 수 있다. 그래픽은 PNG 원본 113개와 SVG 63개이며, 웹에서는 같은 그림을 WebP로 변환한 가벼운 팩(약 12MB)을 사용한다.

## 바로 플레이

- GitHub Pages: **https://gnsyoo.github.io/escaperoom-pyoryudo/**
- 화면별 검토(정답 포함): https://gnsyoo.github.io/escaperoom-pyoryudo/ui-preview.html

`main`에 푸시하면 [Pages 워크플로](.github/workflows/pages.yml)가 단위 테스트 → 빌드 → 배포를 자동으로 수행한다.

## 시즌 구성

| 장 | 제목 | 장소 | 핵심 퍼즐 |
| --- | --- | --- | --- |
| 01 | 각성 | 폐창고 | 결박 해제, 선반 번호, 회로도, 퓨즈, 배수 밸브, UV 명판 (25단계) |
| 02 | 수면 아래 | 폐양식장 관리동 | 펌프·우회 밸브·배수 시간으로 목표 수위 맞추기, 일지 서랍(선택·E01) |
| 03 | 바다가 닫히기 전에 | 해안 동굴 | 조수 대기 후 입장, 제한 시간 안에 반사판 3개로 빛 경로 만들기, 대피 표식 |
| 04 | 꺼진 등대 | 등대 | 모스 신호 해독, 해도 기호로 렌즈 정렬, 섬 지도, 접수 원본(선택·E02) |
| 05 | 마지막 출석 | 분교 | 학급 사진·자리표·출석부를 대조해 사물함 순서 찾기, 혜진 구조 |
| 06 | 숲의 목격자 | 높은 숲길 | 장력 표시에 맞춘 덫 해제 절차, 판자+끈 조합으로 다리 보강, 서린 합류 |
| 07 | 응답 없는 주파수 | 군 초소 | 주파수표로 송신, 배선반·난수표 교차로 그날의 녹음 열람(E03) |
| 08 | 감시자의 방 | 감시자의 거처 | 두 CCTV 시각 보정, 작업실 번호, 원본 백업(E04), 책임 인정 선택 |
| 09 | 폭풍의 밤 | 중앙 발전실 | 소리 단서에 맞춰 숨기(추격), 지침 순서대로 발전기 재가동, 협력/강행 선택 |
| 10 | 새벽의 선착장 | 선착장 | 보트 정비, 조수표와 등대 신호로 출항 시각 찾기, 마지막 대면 |

엔딩은 **기억의 귀환(T)** · **표류 끝(N)** · **침묵의 섬(B)** 세 가지다. T는 E01~E04 확보, 8장 책임 인정, 9장 협력이 모두 필요하다. 놓친 E01·E02는 5~8장 사이에 지도에서 2장·4장으로 안전하게 다시 가서 보완할 수 있다. B 엔딩에서는 마지막 선택으로 돌아갈 수 있다. 3장 동굴의 수위 타이머와 9장 추격 타이머는 설정에서 표준·여유·끔을 고를 수 있다.

장별 진행 단계와 정답은 [시즌 구성 명세](docs/08_SEASON_CHAPTERS.md)에 있다(스포일러).

## 실행

Node.js 24와 pnpm 11을 준비하고 프로젝트 루트에서 실행한다. 정확한 패키지 버전은 pnpm-lock.yaml로 고정했다.

```text
pnpm install --frozen-lockfile
pnpm dev
```

- 게임: `http://127.0.0.1:5173/`
- 화면별 검토: `http://127.0.0.1:5173/ui-preview.html`

```text
pnpm build
pnpm preview
```

빌드는 dist/에 생성된다. 웹 빌드에는 `art/web/v01`의 WebP 팩과 SVG UI만 들어가며, PNG 원본과 정답이 담긴 제작용 갤러리는 저장소에만 남는다. 원본 그림을 바꾼 뒤에는 `pnpm optimize:art`로 WebP 팩을 다시 만든다.

## 검증

```text
pnpm test
pnpm check:content
pnpm check:art
node tests/e2e/playthrough.mjs
node tests/e2e/layout-and-save.mjs
```

단위 테스트는 1장 25단계와 함께 **10장 전체 완주와 저장 재검증, 세 엔딩 분기와 마지막 선택 되돌리기, 동굴 제한 시간 초과 시 체크포인트 복원, 5~8장 사이 재방문으로 E01·E02 보완, 새 퍼즐 유형의 오답 무소모, 1장 시절 저장(v1)의 자동 변환**을 확인한다. 브라우저 검증은 Chrome/Edge 또는 Playwright Chromium을 사용한다. 검증 브라우저가 없으면 `pnpm exec playwright install chromium`으로 준비한다.

## 결과물 확인

| 결과물 | 위치 |
| --- | --- |
| 완성 UI 이미지 | [갤러리](art/ui-screens/v02/gallery.html) · [전체 파일 목록](art/ui-screens/v02/README.md) |
| 그래픽 리소스 | [갤러리](art/production/v01/gallery.html) · [사용 가이드](art/production/v01/README.md) |
| 이미지별 제작 조건 | [전체 프롬프트](art/production/v01/asset-plan-final.json) · [생성 기록](art/production/v01/generation-log-final.json) |
| 승인된 기준 이미지 | [창고 컨셉](art/concepts/ch01_warehouse_mood_v01.png) |
| 폰트 원본·라이선스 | [프리텐다드 포함 안내](public/fonts/README.md) |

## 개발 문서

| 문서 | 용도 |
| --- | --- |
| [통합 개발 명세](docs/00_MASTER_SPEC.md) | 원문 7개와 JSON을 모은 통합본 |
| [세계관과 게임 설계](docs/01_GAME_DESIGN.md) | 인물·사건·10챕터·엔딩 |
| [1챕터 상세 명세](docs/02_CHAPTER01_SPEC.md) | 방·25단계·아이템·대사 |
| [그래픽·UI 가이드](docs/03_ART_UI_GUIDE.md) | 승인 분위기·색·폰트·합성 |
| [기술 명세](docs/04_TECH_SPEC.md) | 데이터·상태·저장·향후 조수와 앱 |
| [AI 개발 지시](docs/05_AI_IMPLEMENTATION_TASKS.md) | 초기 계획과 다음 작업 요청 |
| [검수 기준](docs/06_QA_CHECKLIST.md) | 진행·접근성·저장·스포일러 |
| [실행 UI 기록](docs/07_UI_IMPLEMENTATION.md) | 1장 화면·이미지·확인한 내용 |
| [시즌 구성 명세](docs/08_SEASON_CHAPTERS.md) | 2~10장 장면·퍼즐·정답·엔딩 조건 |
| [1장 퍼즐 데이터](data/ch01.puzzles.json) | 1장 정답·조건·보상·소모의 기준 |
| [2~10장 콘텐츠](src/content/season.ts) | 2~10장 장면·핫스폿·퍼즐·대사·단서 문서 |

통합본은 `node scripts/build-spec.mjs`로 갱신한다. 기획 충돌 시 사용자의 최신 지시 → 실제 데이터(JSON·season.ts) → 장별 명세 → 최신 UI 구현 기록 → 기술 명세 → 전체 기획 순으로 확인한다.

## 후속 범위

환경음·BGM·더빙, 2~10장 전용 확대 그림과 상태 변화 그림, Service Worker 오프라인 캐시, 저장 내보내기, Capacitor 앱 패키징과 Android/iOS 실기기 검증은 후속 작업이다. 2~10장의 확대 화면은 현재 배경 그림을 확대해 보여 주고, 숫자·글자 단서는 UI 문서로 그린다.
