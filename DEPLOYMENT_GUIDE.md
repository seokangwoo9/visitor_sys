# TVMS Deployment — Host + VM (Option A: Host Terminates HTTPS)

This is a **step-by-step** guide for deploying the **TOE Visitor Management
System (TVMS)** in a **host + virtual machine** setup with **one shared public
IP address**.

In this topology the **host** owns the single public IP and runs a reverse
proxy. It terminates HTTPS and forwards plain HTTP to the TVMS **VM** over the
private network. The VM runs the app on HTTP only — it does **not** manage
certificates.

**Traffic flow:**

```
                 one public static IP
                        │
Browser ──HTTPS──▶  HOST reverse proxy   (holds the certificate, routes by hostname)
                        │ private network, HTTP
                        ▼
                  TVMS VM: App (Next.js) + PostgreSQL   (containers, HTTP on :3000)
```

> **Why this design?** Certificates are managed in one place (the host), only
> the host is exposed to the internet, and the VM stays simple and private.
> Other hostnames on the same IP are routed by the host to their own VMs the
> same way.

---

## Table of Contents

**Part A — On the TVMS VM (the app):**
1. [What you need before starting](#1-what-you-need-before-starting)
2. [Log in to the VM and note its private IP](#2-log-in-to-the-vm-and-note-its-private-ip)
3. [Install Docker](#3-install-docker)
4. [Get the application code](#4-get-the-application-code)
5. [Configure environment secrets](#5-configure-environment-secrets)
6. [Start the application (HTTP-only)](#6-start-the-application-http-only)
7. [Create the first admin account](#7-create-the-first-admin-account)
8. [Verify the app locally](#8-verify-the-app-locally)
9. [Lock down the VM firewall](#9-lock-down-the-vm-firewall)

**Part B — On the host (the reverse proxy):**
10. [Point the hostname's DNS at the host](#10-point-the-hostnames-dns-at-the-host)
11. [Configure the host reverse proxy](#11-configure-the-host-reverse-proxy)
12. [Verify end-to-end HTTPS](#12-verify-end-to-end-https)

**Part C — Operations:**
13. [Print the visitor QR codes](#13-print-the-visitor-qr-codes)
14. [Day-to-day operations](#14-day-to-day-operations)
15. [Updating to a new version](#15-updating-to-a-new-version)
16. [Backups and restore](#16-backups-and-restore)
17. [Troubleshooting](#17-troubleshooting)

---

# Part A — On the TVMS VM

## 1. What you need before starting

| Item | Example | Notes |
|---|---|---|
| The TVMS VM (Ubuntu 22.04/24.04) | — | 2 GB RAM minimum |
| The VM's **private IP** | `192.168.10.20` | On the host↔VM private network |
| SSH access to the VM | — | From the host, or your workstation |
| Access to the **host** reverse proxy config | — | You will add a rule in Part B |
| A hostname for TVMS | `tms.company.com` | Resolves to the host's public IP |

You do **not** need a separate public IP for the VM. The host's single public
IP is shared across all VMs by hostname.

---

## 2. Log in to the VM and note its private IP

SSH into the VM (from the host or your workstation):

```bash
ssh youruser@192.168.10.20
```

Confirm the VM's private IP — you will need it for the host proxy rule:

```bash
ip -4 addr show | grep inet
```

Note the address on the private network (e.g. `192.168.10.20`). This guide
calls it **`<VM_PRIVATE_IP>`**.

Update the system:

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 3. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Log out and back in so the group applies, then verify:

```bash
exit
# reconnect
ssh youruser@192.168.10.20
docker --version
docker compose version
```

---

## 4. Get the application code

```bash
sudo apt install git -y
sudo mkdir -p /opt/tvms
sudo chown $USER:$USER /opt/tvms
git clone <YOUR_REPOSITORY_URL> /opt/tvms
cd /opt/tvms
```

Confirm the deployment files exist:

```bash
ls docker-compose.prod.yml deploy/prod.env.example
```

---

## 5. Configure environment secrets

Create the env file from the template:

```bash
cp deploy/prod.env.example deploy/prod.env
```

Generate two strong secrets and copy the outputs:

```bash
echo "DB password: $(openssl rand -base64 24)"
echo "Auth secret: $(openssl rand -base64 32)"
```

Edit the file:

```bash
nano deploy/prod.env
```

Set these values:

| Variable | What to put |
|---|---|
| `POSTGRES_PASSWORD` | The generated DB password |
| `BETTER_AUTH_SECRET` | The generated auth secret |
| `BETTER_AUTH_URL` | **`https://tms.company.com`** — the public URL the browser uses (HTTPS, even though the VM itself serves HTTP) |
| `APP_BIND` | **`<VM_PRIVATE_IP>`**, e.g. `192.168.10.20` — so the app is reachable only from the host, not other networks |
| `APP_PORT` | `3000` (default; change only if 3000 is taken on the VM) |
| `ADMIN_SEED_NAME` | Admin display name |
| `ADMIN_SEED_EMAIL` | Admin login email |
| `ADMIN_SEED_PASSWORD` | Strong admin password |

Leave `DOMAIN` / `ACME_EMAIL` as-is — those are only used by the optional
in-VM Caddy overlay (Option B), which you are **not** using here.

Save and exit: **Ctrl+O**, **Enter**, **Ctrl+X**.

> **`BETTER_AUTH_URL` is critical.** It must be the public `https://` address.
> If it says `http://` or the VM's IP, admin login cookies will be rejected by
> the browser.

Sanity check for leftover placeholders:

```bash
grep -i "replace-with" deploy/prod.env
```

If anything prints, edit the file again.

---

## 6. Start the application (HTTP-only)

Run the **base stack only** — no Caddy overlay. The host handles HTTPS.

```bash
cd /opt/tvms
docker compose -f docker-compose.prod.yml --env-file deploy/prod.env up -d --build
```

- First build takes a few minutes.
- On start, the app automatically applies all database migrations.

Check both containers are up:

```bash
docker compose -f docker-compose.prod.yml --env-file deploy/prod.env ps
```

You want `tvms_app` and `tvms_postgres` both `Up`.

---

## 7. Create the first admin account

```bash
docker compose -f docker-compose.prod.yml --env-file deploy/prod.env \
  exec app npm run auth:seed-admin
```

Creates the admin from the `ADMIN_SEED_*` values. Safe to run once; it does
nothing if the admin already exists.

---

## 8. Verify the app locally

From the VM itself, confirm the app answers on its private address:

```bash
curl http://<VM_PRIVATE_IP>:3000/api/health
```

You should see `{"ok":true,"service":"tvms",...}`.

From the **host**, confirm the host can reach the VM:

```bash
curl http://<VM_PRIVATE_IP>:3000/api/health
```

If both work, the app is ready and the host can proxy to it. If the host
cannot reach it, check `APP_BIND` (section 5) and the VM firewall (section 9).

---

## 9. Lock down the VM firewall

The app port should be reachable **only from the host**, never the public
internet. Allow SSH, and allow port 3000 only from the host's private IP.

```bash
sudo ufw allow OpenSSH
sudo ufw allow from <HOST_PRIVATE_IP> to any port 3000 proto tcp
sudo ufw enable
sudo ufw status
```

Replace `<HOST_PRIVATE_IP>` with the host's address on the private network.

> Do **not** open 80/443 on the VM — those live on the host. Keep SSH (22)
> allowed so you don't lock yourself out.

---

# Part B — On the host

Do these steps on the **host** machine that owns the public IP.

## 10. Point the hostname's DNS at the host

In your DNS provider, ensure the TVMS hostname resolves to the **host's public
IP** (not the VM):

| Field | Value |
|---|---|
| Type | `A` |
| Name | `tms` (for `tms.company.com`) |
| Value | The host's public IP |

Verify from any machine:

```bash
nslookup tms.company.com
```

It must return the host's public IP. (This is usually already set if other
services on the host work.)

---

## 11. Configure the host reverse proxy

Add a rule that routes the TVMS hostname to the VM and terminates HTTPS. Use
whichever proxy the host already runs.

### Requirements for the rule

- Match server name **`tms.company.com`**.
- Terminate TLS (hold the certificate on the host).
- Proxy to **`http://<VM_PRIVATE_IP>:3000`**.
- **Forward these headers** so the app knows its real public identity:
  - `Host` → the original hostname
  - `X-Forwarded-Proto: https`
  - `X-Forwarded-Host` → the original hostname
  - `X-Forwarded-For` → the client IP

> The `X-Forwarded-Proto: https` header is essential. Without it the app
> believes it is on plain HTTP and can produce redirect loops or broken login.

### Example: host runs **nginx**

```nginx
server {
    listen 443 ssl;
    server_name tms.company.com;

    # Certificate for tms.company.com (e.g. from certbot on the host)
    ssl_certificate     /etc/letsencrypt/live/tms.company.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tms.company.com/privkey.pem;

    location / {
        proxy_pass http://192.168.10.20:3000;   # <VM_PRIVATE_IP>:3000

        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;

        # WebSocket / streaming support
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name tms.company.com;
    return 301 https://$host$request_uri;
}
```

Get the certificate on the host with certbot (once):

```bash
sudo certbot --nginx -d tms.company.com
```

Reload nginx after editing:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Example: host runs **Caddy**

Caddy issues and renews the certificate automatically. Add to the host's
`Caddyfile`:

```caddy
tms.company.com {
    reverse_proxy 192.168.10.20:3000    # <VM_PRIVATE_IP>:3000
}
```

Caddy sets the `X-Forwarded-*` headers automatically. Reload:

```bash
sudo systemctl reload caddy
```

### Other proxies

The same three ideas apply to HAProxy, Traefik, or a hardware load balancer:
match the hostname, terminate TLS, forward to `<VM_PRIVATE_IP>:3000` with the
`X-Forwarded-*` headers.

---

## 12. Verify end-to-end HTTPS

From a browser (or your workstation):

- `https://tms.company.com/` — visitor registration
- `https://tms.company.com/admin` — admin login
- `https://tms.company.com/api/health` — `{"ok":true,...}`

Log in at `/admin` with your seeded admin credentials.

If it loads with a valid padlock, the full chain works:
`Browser → Host (HTTPS) → VM app (HTTP) → PostgreSQL`.

---

# Part C — Operations

## 13. Print the visitor QR codes

1. Log in to `https://tms.company.com/admin`.
2. Go to **Settings** → **Visitor QR Code**.
3. Download or print the **Check-in QR** (entrance) and **Check-out QR** (exit).

They point at `https://tms.company.com/check-in` and `/check-out`.

---

## 14. Day-to-day operations

On the **VM**, set a shortcut alias (note: base file only, no HTTPS overlay):

```bash
echo "alias tvms='docker compose -f /opt/tvms/docker-compose.prod.yml --env-file /opt/tvms/deploy/prod.env'" >> ~/.bashrc
source ~/.bashrc
```

Then:

```bash
tvms ps                 # container status
tvms logs -f app        # watch app logs (Ctrl+C to exit)
tvms restart app        # restart the app
tvms down               # stop (data preserved)
tvms up -d              # start again
```

---

## 15. Updating to a new version

On the **VM**:

```bash
cd /opt/tvms
git pull
tvms up -d --build
```

Migrations apply automatically on start. Data and env are preserved. The host
proxy needs no changes for app updates.

---

## 16. Backups and restore

On the **VM**:

```bash
# Backup
mkdir -p ~/backups
tvms exec postgres pg_dump -U visitor_system -d visitor_system > ~/backups/tvms_$(date +%Y%m%d_%H%M%S).sql

# Restore (replace filename)
tvms stop app
cat ~/backups/tvms_20260715_120000.sql | tvms exec -T postgres psql -U visitor_system -d visitor_system
tvms start app
```

Copy backups off the VM regularly (run on your workstation):

```bash
scp youruser@192.168.10.20:/home/youruser/backups/tvms_*.sql .
```

---

## 17. Troubleshooting

### Site won't load at all
- DNS: `nslookup tms.company.com` must return the **host's** public IP.
- Host proxy running? Check the host's nginx/Caddy status and error log.
- Ports 80/443 open on the **host** (not the VM).

### 502 / 504 from the host proxy
The host can't reach the app on the VM. On the **host**:
```bash
curl http://<VM_PRIVATE_IP>:3000/api/health
```
- If this fails: check `APP_BIND` in `deploy/prod.env` is the VM's private IP,
  and the VM firewall allows port 3000 from the host (section 9).
- Confirm the app is up on the VM: `tvms ps`.

### Admin login fails or immediately logs out
- `BETTER_AUTH_URL` must be `https://tms.company.com` (the public URL).
- The host proxy must send `X-Forwarded-Proto: https` (section 11).
- After changing the VM env, apply it: `tvms up -d`.

### Redirect loop
Almost always a missing `X-Forwarded-Proto: https` header on the host proxy.
Add it and reload the proxy.

### App container keeps restarting
```bash
tvms logs app --tail=100
```
A database error usually means `POSTGRES_PASSWORD` mismatch or the DB isn't
healthy yet — check `tvms ps`.

### Start completely fresh (⚠️ deletes all data)
```bash
tvms down -v      # the -v flag deletes the database volume — no undo
```

---

## Quick Reference

**On the VM:**
```bash
cd /opt/tvms
cp deploy/prod.env.example deploy/prod.env   # set secrets, BETTER_AUTH_URL, APP_BIND
tvms up -d --build                           # (after setting the alias)
tvms exec app npm run auth:seed-admin
curl http://<VM_PRIVATE_IP>:3000/api/health
```

**On the host:** route `tms.company.com` → `http://<VM_PRIVATE_IP>:3000`,
terminate HTTPS, forward `X-Forwarded-Proto: https`.

Public URL: **`https://tms.company.com/`** · Admin: **`/admin`**
