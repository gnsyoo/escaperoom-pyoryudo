# Pretendard Variable

공식 npm 배포 `pretendard@1.3.9`의 원본 WOFF2를 프로젝트에 포함한다. 런타임에 외부 CDN을 요청하지 않는다. 변형하지 않은 폰트이며 `OFL.txt`를 같이 배포한다.

- 출처: [공식 Pretendard 프로젝트](https://github.com/orioncactus/pretendard)
- 파일: `dist/web/variable/woff2/PretendardVariable.woff2`
- CSS 패밀리: `Pretendard Variable`
- 가변 굵기: `45 920`
- UI 사용 굵기: 400·500·600·700·800
- UI·로고 글자·숫자·게임 내 정확한 SVG 단서 모두 동일 패밀리 사용

게임 안의 SVG 단서는 React에서 inline SVG로 렌더링해 같은 웹폰트를 상속한다. SVG를 이미지 편집기에서 별도로 열 때는 이 폰트를 설치하거나 텍스트를 윤곽선으로 변환한 별도 배포본을 만들면 같은 모양을 보존할 수 있다. 최종 화면 PNG에는 렌더링된 프리텐다드 글자 모양이 포함되어 있다.
