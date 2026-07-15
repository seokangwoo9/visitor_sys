# VPS Deployment (Ubuntu + Docker Compose + Domain + HTTPS)

This guide deploys the **TOE Visitor Management System (TVMS)** in a fully
Docker-first way: the Next.js app, PostgreSQL, and a Caddy reverse proxy all
run as containers. Caddy is the HTTPS entry point — it automatically requests
and renews a Let's Encrypt certificate and proxies traffic to the app
container, which serves both the pages and the `/api` routes.

When you finish, the system is reachable at `https://your-domain/`.

Container topology:

```
Browser → Caddy (container, auto-HTTPS) → App (Next.js container) → PostgreSQL (container)
```

---

## 0. Prerequisites

- A domain, e.g. `tms.example.com`
- The domain's **A record** points to your VPS public IP
- Ports **80** and **443** open in the VPS firewall / security group
- Ubuntu 22.04 or 24.04 VPS
- Docker Engine + Docker Compose plugin installed

Install Docker if needed:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Log out and back in so the docker group applies.
docker --version
docker compose version
```

---

## 1. Configure Domain DNS

In your domain provider's DNS console, add:

- Type: `A`
- Host / Name: `tms` (or your chosen subdomain)
- Value: your VPS public IP
- TTL: default

Wait for DNS to propagate, then verify from your machine:

```bash
nslookup tms.example.com
```

Make sure it returns your VPS IP before continuing. Caddy cannot issue a
certificate until DNS resolves to this server.

---

## 2. Get the Code onto the VPS

```bash
sudo mkdir -p /opt/tvms
sudo chown $USER:$USER /opt/tvms
git clone <your-repo-url> /opt/tvms
cd /opt/tvms
```

---

## 3. Create the Production Environment File

```bash
cp deploy/prod.env.example deploy/prod.env
nano deploy/prod.env
```

Set real values:

- `POSTGRES_PASSWORD` — a strong database password
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL` — `https://tms.example.com` (your public HTTPS URL)
- `DOMAIN` — `tms.example.com`
- `ACME_EMAIL` — a real inbox for Let's Encrypt notices
- `ADMIN_SEED_*` — the initial admin name, email, and password

Notes:

- `DOMAIN` and `ACME_EMAIL` are used by Caddy to sign the certificate.
- `BETTER_AUTH_URL` **must** match the public domain, or admin login cookies
  may be rejected by the browser.
- `deploy/prod.env` is git-ignored. Never commit it.

---

## 4. Start the Stack with HTTPS (Caddy)

Bring up the base stack plus the HTTPS overlay by stacking the two compose
files:

```bash
cd /opt/tvms
docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env \
  up -d --build
```

This does three things:

- Builds the app image and starts the **app** container. On start it runs
  `prisma migrate deploy` automatically to apply all database migrations.
- Starts the **postgres** container (data persists in the `tvms_postgres_data`
  volume).
- Starts the **caddy** container, which serves 80/443 and requests the HTTPS
  certificate.

Check container status:

```bash
docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env \
  ps
```

Watch the Caddy logs on first start (you should see it obtain the certificate):

```bash
docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env \
  logs -f caddy --tail=200
```

---

## 5. Seed the Initial Admin (one-off)

Migrations run automatically, but the admin account is created manually so it
is never provisioned implicitly:

```bash
docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env \
  exec app npm run auth:seed-admin
```

This uses `ADMIN_SEED_NAME`, `ADMIN_SEED_EMAIL`, and `ADMIN_SEED_PASSWORD`. If
the admin already exists, it is left untouched.

---

## 6. Verify

In a browser:

- `https://tms.example.com/` — visitor registration
- `https://tms.example.com/admin` — admin dashboard (redirects to login)
- `https://tms.example.com/api/health` — should return `{"ok":true,...}`

If these load over HTTPS, the path
`Browser → Caddy (HTTPS) → App (Next.js) → PostgreSQL` is working.

---

## 7. Certificate Renewal

- Caddy renews the Let's Encrypt certificate automatically — no cron or manual
  command needed.
- Certificates and Caddy config live in the `tvms_caddy_data` and
  `tvms_caddy_config` volumes.
- As long as those volumes are not deleted, certificate state is preserved.

---

## 8. Updating / Upgrading

```bash
cd /opt/tvms
git pull

docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env \
  up -d --build
```

The app container re-runs `prisma migrate deploy` on start, so new migrations
are applied automatically during the update.

---

## 9. Common Issues (HTTPS)

- **Certificate request fails (ACME errors in Caddy logs):**
  - Most often DNS is not yet pointing at this VPS — re-check the A record.
  - Ports 80/443 not open in the firewall / security group.
  - Port 80 already used by another process (e.g. a host Nginx/Apache).
    Check with: `sudo ss -lntp | grep -E ':80|:443'`

- **Browser shows insecure / wrong certificate:**
  - Confirm the domain you visit exactly matches `DOMAIN` (including subdomain).
  - Make sure traffic is not routed through an old CDN/proxy; flush DNS cache.

- **Admin login fails / cookie rejected:**
  - Confirm `BETTER_AUTH_URL=https://your-domain` in `deploy/prod.env`.
  - After changing env values, restart: `docker compose ... up -d`.

---

## 10. HTTP-only Mode (optional, no domain)

For a quick internal test without a domain, run only the base file. The app is
published directly on port 3000:

```bash
docker compose -f docker-compose.prod.yml --env-file deploy/prod.env up -d --build
```

Then browse `http://<VPS_IP>:3000/`. Use the HTTPS overlay (sections 4–6) for
any real deployment.

---

## Useful Commands

```bash
# Tail app logs
docker compose -f docker-compose.prod.yml -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env logs -f app --tail=200

# Restart just the app
docker compose -f docker-compose.prod.yml -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env restart app

# Database backup
docker compose -f docker-compose.prod.yml -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env exec postgres \
  pg_dump -U visitor_system -d visitor_system > backup_$(date +%Y%m%d_%H%M%S).sql

# Stop everything (data volumes are preserved)
docker compose -f docker-compose.prod.yml -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env down
```
