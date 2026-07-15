# TVMS VPS Deployment — Complete Step-by-Step Guide

This is a **beginner-friendly, start-to-finish** guide for deploying the
**TOE Visitor Management System (TVMS)** to a Virtual Private Server (VPS).

It assumes **no prior server experience**. Every command is explained. Follow
the sections in order and you will end with a live site at
`https://your-domain/` with automatic HTTPS.

**Final result — three containers running on one VPS:**

```
Browser → Caddy (HTTPS, auto-certificate) → App (Next.js) → PostgreSQL (database)
```

---

## Table of Contents

1. [What you need before starting](#1-what-you-need-before-starting)
2. [Point your domain at the server](#2-point-your-domain-at-the-server)
3. [Connect to the VPS for the first time](#3-connect-to-the-vps-for-the-first-time)
4. [Create a non-root user](#4-create-a-non-root-user)
5. [Basic server security](#5-basic-server-security)
6. [Install Docker](#6-install-docker)
7. [Get the application code](#7-get-the-application-code)
8. [Configure environment secrets](#8-configure-environment-secrets)
9. [Build and start the application](#9-build-and-start-the-application)
10. [Create the first admin account](#10-create-the-first-admin-account)
11. [Verify the deployment](#11-verify-the-deployment)
12. [Print the visitor QR codes](#12-print-the-visitor-qr-codes)
13. [Day-to-day operations](#13-day-to-day-operations)
14. [Updating to a new version](#14-updating-to-a-new-version)
15. [Backups and restore](#15-backups-and-restore)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. What you need before starting

Gather these before you begin:

| Item | Example | Notes |
|---|---|---|
| A VPS running Ubuntu 22.04 or 24.04 | — | 2 GB RAM minimum |
| The VPS public IP address | `203.0.113.10` | From your VPS provider dashboard |
| The root password or SSH key | — | Provided when you created the VPS |
| A domain name | `tms.example.com` | You must be able to edit its DNS |
| A terminal on your computer | — | macOS/Linux: Terminal. Windows: PowerShell |

> **What is a VPS?** A rented computer in a data center that runs 24/7. You
> control it remotely over SSH.

Firewall/security-group note: in your VPS provider's control panel, make sure
**inbound ports 22, 80, and 443** are allowed. Many providers open them by
default; some (AWS, Oracle, Google Cloud) require you to add them manually.

---

## 2. Point your domain at the server

Your domain must point to the VPS **before** you start, because the HTTPS
certificate can only be issued once the domain resolves to this server.

In your domain provider's DNS settings, create one record:

| Field | Value |
|---|---|
| Type | `A` |
| Name / Host | `tms` (for `tms.example.com`), or `@` for the root domain |
| Value / Points to | Your VPS public IP, e.g. `203.0.113.10` |
| TTL | Default (or 3600) |

DNS changes can take a few minutes to a few hours to take effect.

**Check it from your own computer** (not the VPS):

```bash
nslookup tms.example.com
```

Do not continue until the answer shows your VPS IP.

---

## 3. Connect to the VPS for the first time

On **your computer's** terminal, connect as `root` (replace with your IP):

```bash
ssh root@203.0.113.10
```

- The first time, it asks to trust the server — type `yes`.
- Enter the root password (or it uses your SSH key automatically).

You are now "inside" the server. Your prompt changes to something like
`root@vps:~#`.

Update the system's software list and packages:

```bash
apt update && apt upgrade -y
```

If it asks about restarting services or keeping config files, accept the
defaults (press Enter).

---

## 4. Create a non-root user

Running everything as `root` is risky. Create a normal user named `deploy`:

```bash
adduser deploy
```

- Set a password when prompted (save it somewhere safe).
- For the "Full Name" etc. questions, just press Enter to skip.

Give `deploy` administrator (sudo) rights:

```bash
usermod -aG sudo deploy
```

Switch to the new user:

```bash
su - deploy
```

Your prompt now shows `deploy@vps:~$`. From here, commands that need admin
rights use `sudo` in front.

> From now on, do everything as `deploy`, **not** root.

---

## 5. Basic server security

### 5a. Enable the firewall

Allow SSH, HTTP, and HTTPS, then turn the firewall on:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Type `y` when asked to proceed. Check it:

```bash
sudo ufw status
```

You should see `22`, `80`, and `443` allowed.

> **Important:** always keep port 22 (SSH) allowed, or you will lock yourself
> out of the server.

### 5b. (Optional) automatic security updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

Choose **Yes** when prompted. This installs security patches automatically.

---

## 6. Install Docker

Docker runs the application's containers. Install it with the official script:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

Allow the `deploy` user to run Docker without `sudo`:

```bash
sudo usermod -aG docker deploy
```

**Log out and back in** so this takes effect:

```bash
exit
```

You will drop back to the `root` shell — log out of that too:

```bash
exit
```

Now reconnect from your computer **directly as `deploy`**:

```bash
ssh deploy@203.0.113.10
```

Verify Docker works without sudo:

```bash
docker --version
docker compose version
docker run --rm hello-world
```

The last command should print "Hello from Docker!". If it does, Docker is
ready.

---

## 7. Get the application code

Install Git and download the project into `/opt/tvms`:

```bash
sudo apt install git -y
sudo mkdir -p /opt/tvms
sudo chown deploy:deploy /opt/tvms
git clone <YOUR_REPOSITORY_URL> /opt/tvms
cd /opt/tvms
```

Replace `<YOUR_REPOSITORY_URL>` with your actual repository address
(for example `https://github.com/your-org/visitor_system.git`).

> If your repository is private, Git will ask for a username and token. Use a
> GitHub Personal Access Token as the password.

Confirm the deployment files are present:

```bash
ls docker-compose.prod.yml docker-compose.prod.https.yml deploy/
```

You should see the two compose files and a `deploy/` folder containing
`Caddyfile` and `prod.env.example`.

---

## 8. Configure environment secrets

The app reads its configuration from `deploy/prod.env`. Create it from the
template:

```bash
cp deploy/prod.env.example deploy/prod.env
```

First, generate two strong random secrets and copy the outputs:

```bash
echo "DB password:   $(openssl rand -base64 24)"
echo "Auth secret:   $(openssl rand -base64 32)"
```

Now open the file for editing:

```bash
nano deploy/prod.env
```

Fill in every value:

| Variable | What to put |
|---|---|
| `POSTGRES_PASSWORD` | The **DB password** you just generated |
| `BETTER_AUTH_SECRET` | The **Auth secret** you just generated |
| `BETTER_AUTH_URL` | `https://tms.example.com` (your real domain) |
| `DOMAIN` | `tms.example.com` (same domain, no `https://`) |
| `ACME_EMAIL` | A real email (for certificate expiry notices) |
| `ADMIN_SEED_NAME` | The admin's display name |
| `ADMIN_SEED_EMAIL` | The admin login email |
| `ADMIN_SEED_PASSWORD` | A strong admin login password |

Save and exit nano: press **Ctrl+O**, then **Enter**, then **Ctrl+X**.

> `deploy/prod.env` contains passwords. It is already excluded from Git and
> must never be committed or shared.

**Double-check there are no leftover placeholder values:**

```bash
grep -i "replace-with" deploy/prod.env
```

If this prints anything, you missed a value — edit the file again.

---

## 9. Build and start the application

This single command builds the app image and starts all three containers
(app, database, and the Caddy HTTPS proxy):

```bash
cd /opt/tvms
docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env \
  up -d --build
```

- The first build takes several minutes (it downloads Node, installs
  dependencies, and builds the app). This is normal.
- `-d` means "run in the background".
- On start, the app automatically applies all database migrations.

Check that all three containers are running:

```bash
docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env \
  ps
```

You want to see `tvms_app`, `tvms_postgres`, and `tvms_caddy` all `Up`.

**Watch Caddy get the HTTPS certificate** (first start only):

```bash
docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env \
  logs -f caddy --tail=100
```

Look for a line mentioning "certificate obtained". Press **Ctrl+C** to stop
watching (this does not stop the server).

> **Tip:** these commands are long. See [section 13](#13-day-to-day-operations)
> for a shortcut that saves a lot of typing.

---

## 10. Create the first admin account

Migrations run automatically, but the admin account is created manually and
only once. Run:

```bash
docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.prod.https.yml \
  --env-file deploy/prod.env \
  exec app npm run auth:seed-admin
```

This creates the admin using the `ADMIN_SEED_*` values from your env file. If
the admin already exists, it safely does nothing.

---

## 11. Verify the deployment

Open these in your browser:

- `https://tms.example.com/` — the visitor registration page
- `https://tms.example.com/admin` — redirects to the admin login
- `https://tms.example.com/api/health` — should show `{"ok":true,...}`

Log in at `/admin` with the `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` you
set.

If the pages load with a padlock icon (secure), the full chain
`Browser → Caddy → App → Database` is working. 🎉

---

## 12. Print the visitor QR codes

1. Log in to `/admin`.
2. Go to **Settings**.
3. In the **Visitor QR Code** card, download or print the **Check-in QR** and
   **Check-out QR**.
4. Place the check-in QR at the entrance and the check-out QR at the exit.

The QR codes point at `https://tms.example.com/check-in` and `/check-out`.

---

## 13. Day-to-day operations

Typing the long compose command every time is tedious. Create a short alias:

```bash
echo "alias tvms='docker compose -f /opt/tvms/docker-compose.prod.yml -f /opt/tvms/docker-compose.prod.https.yml --env-file /opt/tvms/deploy/prod.env'" >> ~/.bashrc
source ~/.bashrc
```

Now you can use `tvms` as a shortcut:

```bash
tvms ps                 # show container status
tvms logs -f app        # watch app logs (Ctrl+C to exit)
tvms logs -f caddy      # watch Caddy/HTTPS logs
tvms restart app        # restart just the app
tvms down               # stop everything (data is preserved)
tvms up -d              # start everything again
```

> The examples below use the `tvms` shortcut. If you skipped the alias, replace
> `tvms` with the full `docker compose -f ... -f ... --env-file ...` command.

---

## 14. Updating to a new version

When there is new code to deploy:

```bash
cd /opt/tvms
git pull
tvms up -d --build
```

This rebuilds the image and restarts the containers. The app automatically
applies any new database migrations on start. Your data and HTTPS certificate
are preserved.

---

## 15. Backups and restore

### Create a backup

Back up the entire database to a file:

```bash
mkdir -p ~/backups
tvms exec postgres pg_dump -U visitor_system -d visitor_system > ~/backups/tvms_$(date +%Y%m%d_%H%M%S).sql
```

Download the backup to your own computer (run this on **your computer**, not
the VPS):

```bash
scp deploy@203.0.113.10:/home/deploy/backups/tvms_*.sql .
```

> Schedule this regularly. Store copies off the server.

### Restore a backup

```bash
# Stop the app so nothing writes during restore
tvms stop app

# Load the backup (replace with your filename)
cat ~/backups/tvms_20260715_120000.sql | tvms exec -T postgres psql -U visitor_system -d visitor_system

# Start the app again
tvms start app
```

---

## 16. Troubleshooting

### The site won't load / no HTTPS

- Confirm DNS points to the VPS: `nslookup tms.example.com` (from your
  computer) must return the VPS IP.
- Confirm ports are open: `sudo ufw status` should list 80 and 443.
- Check Caddy logs for certificate errors: `tvms logs caddy --tail=100`.

### Caddy certificate request fails

The most common causes:

- DNS not yet pointing at this server (wait, then retry).
- Port 80 blocked by the firewall or the cloud security group.
- Port 80 already used by another web server on the VPS. Check with:
  ```bash
  sudo ss -lntp | grep -E ':80|:443'
  ```
  If something other than Docker/Caddy is listening, stop it.

### Admin login fails or immediately logs out

- `BETTER_AUTH_URL` in `deploy/prod.env` must exactly match your public URL
  (`https://tms.example.com`).
- After editing the env file, apply it: `tvms up -d`.

### App container keeps restarting

Check its logs for the real error:

```bash
tvms logs app --tail=100
```

- A database connection error usually means `POSTGRES_PASSWORD` in the env file
  doesn't match, or the database container isn't healthy yet — check
  `tvms ps`.

### Check what's using memory

```bash
docker stats --no-stream
```

### Start completely fresh (⚠️ deletes all data)

Only if you want to wipe everything, including the database:

```bash
tvms down -v
```

The `-v` flag deletes the data volumes. **There is no undo.** Skip this unless
you are certain.

---

## Quick Reference Card

```bash
# Location of everything
cd /opt/tvms

# First-time deploy
cp deploy/prod.env.example deploy/prod.env   # then edit it
tvms up -d --build                           # (after setting the alias)
tvms exec app npm run auth:seed-admin

# Everyday
tvms ps                 # status
tvms logs -f app        # logs
tvms up -d --build      # deploy update (after git pull)
tvms exec postgres pg_dump -U visitor_system -d visitor_system > backup.sql
```

Your app lives at **`https://tms.example.com/`** and the admin dashboard at
**`https://tms.example.com/admin`**.
