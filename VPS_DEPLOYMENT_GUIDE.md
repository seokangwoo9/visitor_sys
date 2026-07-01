# VPS Deployment Guide for TOE Visitor Management System

This guide walks through deploying TVMS to your own VPS for the first time.

It assumes:

- VPS operating system: Ubuntu 22.04 or Ubuntu 24.04
- App runtime: Node.js
- Process manager: PM2
- Database: PostgreSQL in Docker Compose
- Web server/reverse proxy: Nginx
- HTTPS certificate: Certbot / Let's Encrypt
- App domain example: `tvms.example.com`

Replace `tvms.example.com` with your real domain.

## 1. What You Are Deploying

The production setup will look like this:

```text
Visitor browser
  |
  | HTTPS
  v
Nginx on VPS
  |
  | reverse proxy to localhost:3000
  v
Next.js app running with PM2
  |
  | DATABASE_URL
  v
PostgreSQL running in Docker
```

The visitor QR code will automatically use your deployed website origin. If your app is deployed at `https://tvms.example.com`, the QR code points to `https://tvms.example.com/`.

## 2. Buy Or Prepare A VPS

Recommended starter size:

- 1-2 CPU cores
- 2 GB RAM minimum
- 20 GB disk minimum
- Ubuntu 22.04 or 24.04

After creating the VPS, your provider will give you:

- IP address
- root password or SSH key

## 3. Point Your Domain To The VPS

In your DNS provider, create an `A` record:

```text
Type: A
Name: tvms
Value: YOUR_VPS_IP_ADDRESS
TTL: Auto
```

If your root domain is `example.com`, this creates:

```text
tvms.example.com
```

DNS can take a few minutes to a few hours to update.

You can test DNS from your computer:

```bash
ping tvms.example.com
```

It should show your VPS IP address.

## 4. SSH Into The VPS

From your local computer:

```bash
ssh root@YOUR_VPS_IP_ADDRESS
```

If your provider uses SSH keys:

```bash
ssh -i path/to/your-key root@YOUR_VPS_IP_ADDRESS
```

## 5. Update The Server

On the VPS:

```bash
apt update
apt upgrade -y
```

Install basic tools:

```bash
apt install -y curl git unzip ufw ca-certificates gnupg
```

## 6. Create A Non-Root User

Create a user named `deploy`:

```bash
adduser deploy
```

Give it sudo permission:

```bash
usermod -aG sudo deploy
```

Switch to the new user:

```bash
su - deploy
```

From now on, run app commands as `deploy`, not `root`.

## 7. Set Up The Firewall

Allow SSH, HTTP, and HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Check status:

```bash
sudo ufw status
```

You should see ports `22`, `80`, and `443` allowed.

## 8. Install Node.js

Install Node.js 22 LTS using NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
node -v
npm -v
```

## 9. Install PM2

PM2 keeps the Next.js app running after you close SSH or reboot the VPS.

```bash
sudo npm install -g pm2
```

Verify:

```bash
pm2 -v
```

## 10. Install Docker

Install Docker:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

Allow your `deploy` user to run Docker:

```bash
sudo usermod -aG docker deploy
```

Log out and log back in so the Docker group takes effect:

```bash
exit
ssh deploy@YOUR_VPS_IP_ADDRESS
```

Verify:

```bash
docker --version
docker compose version
```

## 11. Upload Or Clone The Project

Recommended: push this project to a Git repository, then clone it on the VPS.

On the VPS:

```bash
mkdir -p ~/apps
cd ~/apps
git clone YOUR_GIT_REPOSITORY_URL visitor_system
cd visitor_system
```

If your repository is private, configure SSH keys for GitHub/GitLab first.

Alternative: upload the folder with SFTP, SCP, or your VPS provider file manager.

## 12. Create The Production `.env`

Inside the project folder:

```bash
cp .env.example .env
nano .env
```

Use production values:

```env
DATABASE_URL="postgresql://visitor_system:CHANGE_THIS_DATABASE_PASSWORD@localhost:5433/visitor_system?schema=public"
BETTER_AUTH_SECRET="PASTE_A_LONG_RANDOM_SECRET_HERE"
BETTER_AUTH_URL="https://tvms.example.com"
ADMIN_SEED_NAME="System Administrator"
ADMIN_SEED_EMAIL="admin@example.com"
ADMIN_SEED_PASSWORD="PASTE_A_STRONG_ADMIN_PASSWORD_HERE"
```

Generate a secure auth secret:

```bash
openssl rand -base64 32
```

Generate a strong admin password yourself and save it in a password manager.

Important:

- Do not use `replace-with-a-secure-random-secret` in production.
- Do not use `replace-with-a-secure-admin-password` in production.
- `BETTER_AUTH_URL` must include `https://` once SSL is enabled.
- Keep `.env` private. Do not commit it to Git.

## 13. Secure The Database Password

The current `compose.yaml` contains the local development password:

```yaml
POSTGRES_PASSWORD: visitor_system_password
```

For production, change it to match your `.env` password.

Open the file:

```bash
nano compose.yaml
```

Change:

```yaml
POSTGRES_PASSWORD: visitor_system_password
```

To:

```yaml
POSTGRES_PASSWORD: CHANGE_THIS_DATABASE_PASSWORD
```

Also consider binding PostgreSQL to localhost only:

```yaml
ports:
  - "127.0.0.1:5433:5432"
```

This prevents the database port from being publicly reachable from the internet.

## 14. Start PostgreSQL

Start the database:

```bash
docker compose up -d postgres
```

Check that it is running:

```bash
docker compose ps
```

You should see the `postgres` service as running or healthy.

View logs if needed:

```bash
docker compose logs postgres
```

## 15. Install App Dependencies

Inside the project folder:

```bash
npm ci
```

Use `npm ci` on the server because it installs exactly from `package-lock.json`.

## 16. Prepare The Database

Validate Prisma:

```bash
npm run db:validate
```

Generate Prisma Client:

```bash
npm run db:generate
```

Apply production migrations:

```bash
npx prisma migrate deploy
```

Do not use `prisma migrate dev` in production.

## 17. Seed The First Admin User

Run:

```bash
npm run auth:seed-admin
```

This creates the admin login using:

- `ADMIN_SEED_NAME`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`

If the admin user already exists, the script will skip creation.

## 18. Build The App

Run:

```bash
npm run build
```

This creates the optimized production build.

## 19. Start The App With PM2

Start the app:

```bash
pm2 start npm --name tvms -- start
```

Check status:

```bash
pm2 status
```

Check logs:

```bash
pm2 logs tvms
```

Save the PM2 process list:

```bash
pm2 save
```

Enable PM2 startup on reboot:

```bash
pm2 startup
```

PM2 will print a command beginning with `sudo env ...`. Copy and run that exact command.

Then run:

```bash
pm2 save
```

At this point the app should be running on:

```text
http://127.0.0.1:3000
```

Do not expose port `3000` publicly. Nginx will handle public traffic.

## 20. Install Nginx

```bash
sudo apt install -y nginx
```

Check Nginx:

```bash
sudo systemctl status nginx
```

## 21. Configure Nginx Reverse Proxy

Create a new Nginx config:

```bash
sudo nano /etc/nginx/sites-available/tvms
```

Paste this config:

```nginx
server {
    listen 80;
    server_name tvms.example.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }
}
```

Replace `tvms.example.com` with your real domain.

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/tvms /etc/nginx/sites-enabled/tvms
```

Remove the default site if you do not need it:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

Test Nginx config:

```bash
sudo nginx -t
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

Now test:

```text
http://tvms.example.com
```

It should load the visitor registration page.

## 22. Enable HTTPS With Certbot

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Request SSL certificate:

```bash
sudo certbot --nginx -d tvms.example.com
```

Follow the prompts.

Certbot will update Nginx automatically.

Test renewal:

```bash
sudo certbot renew --dry-run
```

Now open:

```text
https://tvms.example.com
```

## 23. Update `.env` After HTTPS

Make sure `.env` has the HTTPS URL:

```env
BETTER_AUTH_URL="https://tvms.example.com"
```

Then restart the app:

```bash
pm2 restart tvms
```

## 24. Test The Production App

Open:

```text
https://tvms.example.com
```

Test visitor flow:

1. Fill in visitor registration.
2. Submit check-in.
3. Confirm checked-in status page.
4. Click check out.
5. Confirm checked-out success page.

Test admin flow:

1. Open `https://tvms.example.com/login`.
2. Log in with `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD`.
3. Open Dashboard.
4. Open Visitors.
5. Open Export.
6. Open Settings.
7. Generate/download/print QR code.
8. Open Audit Logs.

The QR code should point to:

```text
https://tvms.example.com/
```

## 25. How To Deploy Future Updates

SSH into the VPS:

```bash
ssh deploy@YOUR_VPS_IP_ADDRESS
```

Go to the app:

```bash
cd ~/apps/visitor_system
```

Pull latest code:

```bash
git pull
```

Install dependencies:

```bash
npm ci
```

Apply database migrations:

```bash
npx prisma migrate deploy
```

Generate Prisma Client:

```bash
npm run db:generate
```

Build:

```bash
npm run build
```

Restart:

```bash
pm2 restart tvms
```

Check logs:

```bash
pm2 logs tvms
```

## 26. Database Backup

Create a backup folder:

```bash
mkdir -p ~/backups/tvms
```

Create a database backup:

```bash
docker exec visitor_system_postgres pg_dump -U visitor_system -d visitor_system > ~/backups/tvms/visitor_system_$(date +%Y%m%d_%H%M%S).sql
```

List backups:

```bash
ls -lh ~/backups/tvms
```

Copy backups off the VPS regularly. A backup only on the same VPS is not enough if the VPS disk fails.

## 27. Restore A Database Backup

Warning: restoring can overwrite existing database data.

Stop the app first:

```bash
pm2 stop tvms
```

Restore:

```bash
cat backup-file.sql | docker exec -i visitor_system_postgres psql -U visitor_system -d visitor_system
```

Start the app again:

```bash
pm2 start tvms
```

## 28. Useful Commands

App status:

```bash
pm2 status
```

App logs:

```bash
pm2 logs tvms
```

Restart app:

```bash
pm2 restart tvms
```

Database status:

```bash
docker compose ps
```

Database logs:

```bash
docker compose logs postgres
```

Nginx config test:

```bash
sudo nginx -t
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

SSL renewal test:

```bash
sudo certbot renew --dry-run
```

## 29. Common Problems

### Website shows 502 Bad Gateway

Nginx cannot reach the Next.js app.

Check PM2:

```bash
pm2 status
pm2 logs tvms
```

Restart:

```bash
pm2 restart tvms
```

### App cannot connect to database

Check Docker:

```bash
docker compose ps
docker compose logs postgres
```

Check `.env`:

```bash
nano .env
```

Confirm `DATABASE_URL` password matches `compose.yaml`.

### Admin login fails

Confirm `.env` has the correct admin email and password.

Seed again:

```bash
npm run auth:seed-admin
```

If the user already exists, the seed script will not reset the password. In that case, create a new admin email/password in `.env` and seed again, or add a proper password reset feature later.

### QR code points to the wrong URL

The QR code uses the URL currently loaded in the browser.

Make sure you are opening the admin Settings page from the final production domain:

```text
https://tvms.example.com/admin?section=settings
```

Then regenerate/download/print the QR code.

### HTTPS certificate fails

Check:

- DNS `A` record points to the VPS IP.
- Ports `80` and `443` are open.
- Nginx config has the correct `server_name`.

Run:

```bash
sudo nginx -t
sudo certbot --nginx -d tvms.example.com
```

## 30. Production Safety Checklist

Before using the system with real visitors:

- `.env` uses a strong `BETTER_AUTH_SECRET`.
- Admin password is strong and private.
- Database password is changed from the local default.
- PostgreSQL is bound to `127.0.0.1:5433`, not exposed publicly.
- Firewall only exposes SSH, HTTP, and HTTPS.
- HTTPS works.
- `BETTER_AUTH_URL` uses your HTTPS domain.
- `npx prisma migrate deploy` has run successfully.
- `npm run build` passes on the VPS.
- PM2 starts on reboot.
- You have tested visitor registration, check-in, check-out, admin login, Excel export, Settings, QR generation, and audit logs.
- You have a backup plan for PostgreSQL.

