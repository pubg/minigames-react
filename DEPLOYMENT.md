# GitHub Actions Setup Instructions

이 저장소에는 npm 패키지 배포와 GitHub Pages 데모 사이트 배포를 위한 GitHub Actions 워크플로우가 설정되어 있습니다.

## 필요한 설정

### 1. NPM 토큰 설정 (npm publish용)

1. [npm 웹사이트](https://www.npmjs.com/)에 로그인합니다
2. 프로필 > Access Tokens > Generate New Token으로 이동합니다
3. "Classic Token" 선택 후 "Automation" 타입으로 토큰을 생성합니다
4. 생성된 토큰을 복사합니다
5. GitHub 저장소의 Settings > Secrets and variables > Actions로 이동합니다
6. "New repository secret" 클릭
7. Name: `NPM_TOKEN`, Value: (복사한 토큰)으로 설정합니다

### 2. GitHub Pages 설정 (데모 사이트용)

1. GitHub 저장소의 Settings > Pages로 이동합니다
2. "Source"를 **"GitHub Actions"**로 선택합니다
   - "Deploy from a branch"가 아닌 "GitHub Actions"를 선택해야 합니다
3. 저장하면 완료입니다

## 워크플로우 사용 방법

### npm 패키지 배포

**방법 1: Release 생성 (권장)**
1. GitHub에서 새로운 Release를 생성합니다
2. 태그는 버전 번호를 따라 지정합니다 (예: v0.1.0, v0.2.0)
3. Release를 생성하면 자동으로 npm에 배포됩니다

**방법 2: 수동 실행**
1. Actions 탭 > "Publish to npm" 워크플로우 선택
2. "Run workflow" 버튼 클릭
3. 원하는 브랜치 선택 후 실행

### 데모 사이트 배포

- `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다
- 또는 Actions 탭에서 "Deploy Demo to GitHub Pages" 워크플로우를 수동으로 실행할 수 있습니다

## 배포된 사이트 확인

- npm 패키지: https://www.npmjs.com/package/@minigames-react/minesweeper
- 데모 사이트: https://pubg.github.io/minigames-react/

## 주의사항

- npm 패키지를 배포하기 전에 `packages/minesweeper/package.json`의 `version` 필드를 업데이트해야 합니다
- 이미 배포된 버전과 동일한 버전으로는 재배포할 수 없습니다
- GitHub Pages 배포는 약 1-2분 정도 소요될 수 있습니다

## 문제 해결

### npm 배포 실패 시
- NPM_TOKEN이 올바르게 설정되었는지 확인
- npm에 로그인한 계정이 @minigames-react organization에 접근 권한이 있는지 확인

### GitHub Pages 배포 실패 시
- Settings > Pages에서 Source가 "GitHub Actions"로 설정되어 있는지 확인
- 워크플로우에 pages: write 권한이 있는지 확인 (이미 설정됨)
