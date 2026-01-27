# FE GitHub Actions CD (EC2 배포) 정리

## 현재 서버 배포 구조(확인됨)

- **nginx**
  - HTTPS(`q-feed.com`) 정적 파일 root: `/srv/qfeed/repo/fe/dist`
  - 설정 파일: `/etc/nginx/sites-enabled/qfeed.conf`

## 서버 배포 스크립트

- **경로**: `/srv/qfeed/deploy.sh`
- **동작**
  - 기존 dist를 롤백용으로 백업: `/srv/qfeed/backups/fe/dist-<UTC timestamp>.tar.gz`
  - 전달받은 tar.gz에서 `dist/`를 풀어 `rsync --delete`로 `/srv/qfeed/repo/fe/dist/`를 갱신
  - nginx가 활성 상태면 `reload`를 시도(실패해도 배포는 유지)

### 수동 배포(서버에서 직접)

```bash
sudo /srv/qfeed/deploy.sh /path/to/fe-dist.tar.gz
```

### 롤백 방법(예시)

백업 파일이 `dist-20260127T074700Z.tar.gz` 라면:

```bash
sudo tar -C /srv/qfeed/repo/fe -xzf /srv/qfeed/backups/fe/dist-20260127T074700Z.tar.gz
sudo systemctl reload nginx
```

## GitHub Actions 워크플로우 변경점

- 파일: `.github/workflows/FE-CI.yml`
- **CI**
  - main push / main 대상 PR에서 lint/test/build
  - build 산출물은 `fe-v<package.json version>.tar.gz`로 artifact 업로드
- **CD**
  - `push` to `main`에서만 실행
  - artifact 다운로드 → EC2로 SCP 업로드(`/tmp`) → EC2에서 `/srv/qfeed/deploy.sh` 실행

## GitHub Secrets 설정(필수)

Repository Secrets에 아래 3개를 추가해야 배포가 동작합니다.

- `QFEED_EC2_HOST`: `ec2-13-125-168-101.ap-northeast-2.compute.amazonaws.com`
- `QFEED_EC2_USER`: `ubuntu`
- `QFEED_EC2_SSH_KEY`: pem 키 파일 전체 내용 (예: `-----BEGIN RSA PRIVATE KEY-----`부터 끝까지)

