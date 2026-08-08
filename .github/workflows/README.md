# CinemaSeat CI/CD Pipeline

This folder contains the GitHub Actions workflows for the CinemaSeat project.

---

## Workflows

| File | Trigger | Purpose |
|---|---|---|
| `ci.yml` | Pull Request (opened / sync / reopened) | Lint, test, build microservice images, Trivy scan — gates PR merge |
| `cd.yml` | Push to `master` / merged PR to `master` | Full pipeline + push microservice images to Docker Hub + doco-cd deploy |

---

## Microservice Pipeline Architecture

```mermaid
flowchart TD
    subgraph PR["Pull Request (ci.yml)"]
        direction TB
        PR_trigger["PR Opened / Updated"] --> filter_ci["filter\nDetect Changed Services\ndorny/paths-filter"]

        filter_ci -->|frontend changed| fe_ci["frontend\nReact Router CI"]
        filter_ci -->|catalog changed| cat_ci["catalog\nCatalog Service CI"]
        filter_ci -->|booking changed| book_ci["booking\nBooking Service CI"]
        filter_ci -->|payment changed| pay_ci["payment\nPayment Service CI"]
        filter_ci -->|health changed| hlth_ci["health\nHealth Service CI"]

        fe_ci --> ci_status["ci-status\nPR Status Check"]
        cat_ci --> ci_status
        book_ci --> ci_status
        pay_ci --> ci_status
        hlth_ci --> ci_status

        ci_status -->|all pass| PR_green["PR shows green\nReady to merge"]
        ci_status -->|any fail| PR_red["PR blocked\nSecurity vulnerability or test failure"]
    end

    subgraph CD["Push to master / Merged PR (cd.yml)"]
        direction TB
        CD_trigger["Push to master\nor PR Merged"] --> filter_cd["filter\nDetect Changed Services\ndorny/paths-filter"]

        filter_cd -->|frontend| fe_cd["Push frontend image"]
        filter_cd -->|catalog| cat_cd["Push catalog image"]
        filter_cd -->|booking| book_cd["Push booking image"]
        filter_cd -->|payment| pay_cd["Push payment image"]
        filter_cd -->|health| hlth_cd["Push health image"]
        filter_cd -->|nginx| ngx_cd["Push nginx image"]

        fe_cd --> deploy["update-compose-and-deploy"]
        cat_cd --> deploy
        book_cd --> deploy
        pay_cd --> deploy
        hlth_cd --> deploy
        hlth_cd --> deploy
        ngx_cd --> deploy

        subgraph deploy["update-compose-and-deploy"]
            direction TB
            d1["sed: bump image tags\nin docker-compose.yml"] --> d2["git commit\nci: update tags skip ci\ngit push"]
            d2 --> d3["curl POST\ndoco-cd webhook\nHMAC-SHA256 signed"]
        end

        deploy --> server["Deployment Server\ndoco-cd container"]
    end
```

---

## Stage-by-Stage Breakdown

### Stage 1 — Path Filtering

Uses `dorny/paths-filter@v3` to inspect which files changed in the commit diff.

- Outputs boolean flags: `frontend`, `catalog`, `booking`, `payment`, `health`, `nginx`
- If only `frontend/**` changed, backend microservices jobs are skipped entirely
- Watching `.github/workflows/ci.yml` and `cd.yml` re-triggers all services when pipeline definitions change

### Stage 2 — Microservice Pipelines (Parallel)

Each microservice runs its test suite and builds its Docker image:

1. **Frontend (React Router v7)**
   - Install deps with `pnpm`
   - Lint with `pnpm lint`
   - TypeScript build check with `pnpm build`
   - Trivy Security scan

2. **Backend Microservices (Go 1.26)**
   - `go test -v -race ./...` and `go vet ./...` across `catalog`, `booking`, `payment`, `health-service`
   - Docker build check using individual service Dockerfiles
   - Trivy Security scan gate

### Stage 3 — Docker Hub Push (cd.yml only)

Pushes microservice-specific image tags to Docker Hub:
- `<username>/cinemaseat:catalog-<sha>`
- `<username>/cinemaseat:booking-<sha>`
- `<username>/cinemaseat:payment-<sha>`
- `<username>/cinemaseat:health-<sha>`
- `<username>/cinemaseat:nginx-<sha>`
- `<username>/cinemaseat:frontend-<sha>`

### Stage 4 — Compose Tag Bump + Deploy (cd.yml only)

1. `sed` updates matching image tags in `docker-compose.yml`
2. Commits and pushes with `[skip ci]` flag
3. Fires HMAC-SHA256 signed webhook trigger to the `doco-cd` server
4. `doco-cd` pulls updated tags and performs a rolling update via `docker compose up -d`

---

## Required Repository Secrets

| Secret | Required | Description |
|---|---|---|
| `DOCKERHUB_USERNAME` | Yes | Docker Hub account username |
| `DOCKERHUB_TOKEN` | Yes | Docker Hub access token |
| `DOCO_CD_SERVER_URL` | Yes | Full URL to doco-cd webhook |
| `WEBHOOK_SECRET` | Yes | HMAC secret shared between CI and doco-cd server |
| `BUMP_TOKEN` | Optional | GitHub PAT for protected branch tag updates |
