# VPS Deployment Guide Using IP Address Only

This guide shows how to deploy TOE Visitor Management System (TVMS) to a VPS when you do not have a domain name yet.

It assumes:

- VPS operating system: Ubuntu 22.04 or Ubuntu 24.04
- App runtime: Node.js
- Process manager: PM2
- Database: PostgreSQL in Docker Compose
- Web server/reverse proxy: Nginx
- Public app address example: `https://YOUR_VPS_IP_ADDRESS`

Replace `YOUR_VPS_IP_ADDRESS` with your actual server IP.

## Important IP Address Warning

This project uses secure cookies in production for visitor sessions. Secure cookies require HTTPS.

Because you are using an IP address instead of a domain name, this guide uses a self-signed HTTPS certificate.

That means:

- The app can run at `https://YOUR_VPS_IP_ADDRESS`.
- Visitor check-in/check-out sessions can work over HTTPS.
- Browsers will show a certificate warning because the certificate is not publicly trusted.
- You must manually accept the browser warning on each device.

For real public production use, a domain name with a trusted Let's Encrypt certificate is strongly recommended. Use [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md) when you have a domain.

## 1. What You Are Deploying

The IP-only setup will look like this:

```text
Visitor browser
  |
  | HTTPS to server IP address
  v
Nginx on VPS with self-signed certificate
  |
  | reverse proxy to localhost:3000
  v
Next.js app running with PM2
  |
  | DATABASE_URL
  v
PostgreSQL running in Docker
```

The visitor QR code will automatically use the address opened in the browser. If you open admin settings from `https://YOUR_VPS_IP_ADDRESS/admin?section=settings`, the QR code points to:

```text
https://YOUR_VPS_IP_ADDRESS/
```

## 2. Buy Or Prepare A VPS

Recommended starter size:

- 1-2 CPU cores
- 2 GB RAM minimum
- 20 GB disk minimum
- Ubuntu 22.04 or 24.04

After creating the VPS, your provider will give you:

- IP address
- root password or SSH key

Write down your IP address. In this guide it is shown as:

```text
YOUR_VPS_IP_ADDRESS
```

## 3. SSH Into The VPS

From your local computer:

```bash
ssh root@YOUR_VPS_IP_ADDRESS
```

If your provider uses SSH keys:

```bash
ssh -i path/to/your-key root@YOUR_VPS_IP_ADDRESS
```

## 4. Update The Server

On the VPS:

```bash
apt update
apt upgrade -y
```

Install basic tools:

```bash
apt install -y curl git unzip ufw ca-certificates gnupg openssl
```

## 5. Create A Non-Root User

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

## 6. Set Up The Firewall

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

## 7. Install Node.js

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

## 8. Install PM2

PM2 keeps the Next.js app running after you close SSH or reboot the VPS.

```bash
sudo npm install -g pm2
```

Verify:

```bash
pm2 -v
```

## 9. Install Docker

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

## 10. Upload Or Clone The Project

Recommended: push this project to a Git repository, then clone it on the VPS.

On the VPS:

```bash
mkdir -p ~/apps
cd ~/apps
git clone YOUR_GIT_REPOSITORY_URL visitor_system
cd visitor_system
```

If your repository is private, configure SSH keys for GitHub/GitLab first.

Alternative: upload the project folder with SFTP, SCP, or your VPS provider file manager.

## 11. Create The Production `.env`

Inside the project folder:

```bash
cp .env.example .env
nano .env
```

Use IP-address production values:

```env
DATABASE_URL="postgresql://visitor_system:CHANGE_THIS_DATABASE_PASSWORD@localhost:5433/visitor_system?schema=public"
BETTER_AUTH_SECRET="PASTE_A_LONG_RANDOM_SECRET_HERE"
BETTER_AUTH_URL="https://YOUR_VPS_IP_ADDRESS"
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
- `BETTER_AUTH_URL` must be `https://YOUR_VPS_IP_ADDRESS`, not `http://`.
- Keep `.env` private. Do not commit it to Git.

## 12. Secure The Database Password

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

Also bind PostgreSQL to localhost only:

```yaml
ports:
  - "127.0.0.1:5433:5432"
```

This prevents the database port from being publicly reachable from the internet.

## 13. Start PostgreSQL

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

## 14. Install App Dependencies

Inside the project folder:

```bash
npm ci
```

Use `npm ci` on the server because it installs exactly from `package-lock.json`.

## 15. Prepare The Database

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

## 16. Seed The First Admin User

Run:

```bash
npm run auth:seed-admin
```

This creates the admin login using:

- `ADMIN_SEED_NAME`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`

If the admin user already exists, the script will skip creation.

## 17. Build The App

Run:

```bash
npm run build
```

This creates the optimized production build.

## 18. Start The App With PM2

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

At this point the app should be running internally on:

```text
http://127.0.0.1:3000
```

Do not expose port `3000` publicly. Nginx will handle public traffic on ports `80` and `443`.

## 19. Install Nginx

```bash
sudo apt install -y nginx
```

Check Nginx:

```bash
sudo systemctl status nginx
```

## 20. Create A Self-Signed SSL Certificate For The IP Address

Create a folder for the certificate:

```bash
sudo mkdir -p /etc/ssl/tvms
```

Generate the certificate:

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/tvms/tvms-ip.key -out /etc/ssl/tvms/tvms-ip.crt -subj "/CN=YOUR_VPS_IP_ADDRESS" -addext "subjectAltName=IP:YOUR_VPS_IP_ADDRESS"
```

Protect the private key:

```bash
sudo chmod 600 /etc/ssl/tvms/tvms-ip.key
```

This certificate is valid for 365 days. Because it is self-signed, browsers will not trust it automatically.

## 21. Configure Nginx Reverse Proxy For IP Address

Create a new Nginx config:

```bash
sudo nano /etc/nginx/sites-available/tvms-ip
```

Paste this config:

```nginx
server {
    listen 80 default_server;
    server_name _;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl default_server;
    server_name _;

    ssl_certificate /etc/ssl/tvms/tvms-ip.crt;
    ssl_certificate_key /etc/ssl/tvms/tvms-ip.key;

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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/tvms-ip /etc/nginx/sites-enabled/tvms-ip
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

## 22. Open The App In Your Browser

Open:

```text
https://YOUR_VPS_IP_ADDRESS
```

Your browser will show a warning such as:

```text
Your connection is not private
```

This happens because the certificate is self-signed.

To continue:

1. Click `Advanced`.
2. Click `Proceed to YOUR_VPS_IP_ADDRESS`.
3. The visitor registration page should load.

You must do this on every device that uses the app unless you install/trust the self-signed certificate on those devices.

## 23. Restart The App After Confirming `.env`

Make sure `.env` has:

```env
BETTER_AUTH_URL="https://YOUR_VPS_IP_ADDRESS"
```

Restart the app:

```bash
pm2 restart tvms
```

## 24. Test The Production App

Open:

```text
https://YOUR_VPS_IP_ADDRESS
```

Test visitor flow:

1. Accept the browser certificate warning.
2. Fill in visitor registration.
3. Submit check-in.
4. Confirm checked-in status page.
5. Click check out.
6. Confirm checked-out success page.

Test admin flow:

1. Open `https://YOUR_VPS_IP_ADDRESS/login`.
2. Accept the browser certificate warning if shown.
3. Log in with `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD`.
4. Open Dashboard.
5. Open Visitors.
6. Open Export.
7. Open Settings.
8. Generate/download/print QR code.
9. Open Audit Logs.

The QR code should point to:

```text
https://YOUR_VPS_IP_ADDRESS/
```

## 25. Print The Visitor QR Code

In the admin panel:

1. Open `https://YOUR_VPS_IP_ADDRESS/login`.
2. Log in as admin.
3. Open Settings.
4. Use the QR Code panel.
5. Click `Download PNG` or `Print QR`.

Important:

- Generate the QR code from the final IP address URL.
- If you accidentally open admin through `http://` or `localhost`, the QR will point to the wrong address.
- The QR code uses the browser's current origin automatically.

## 26. How To Deploy Future Updates

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

## 27. Renew The Self-Signed Certificate

The certificate created in this guide lasts 365 days.

Before it expires, generate a new one:

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/tvms/tvms-ip.key -out /etc/ssl/tvms/tvms-ip.crt -subj "/CN=YOUR_VPS_IP_ADDRESS" -addext "subjectAltName=IP:YOUR_VPS_IP_ADDRESS"
sudo chmod 600 /etc/ssl/tvms/tvms-ip.key
sudo systemctl reload nginx
```

Browsers may show the certificate warning again after renewal.

## 28. Database Backup

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

## 29. Restore A Database Backup

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

## 30. Useful Commands

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

Check certificate details:

```bash
openssl x509 -in /etc/ssl/tvms/tvms-ip.crt -text -noout
```

## 31. Common Problems

### Browser Shows "Your Connection Is Not Private"

This is expected with a self-signed certificate.

Click:

1. `Advanced`
2. `Proceed to YOUR_VPS_IP_ADDRESS`

For a warning-free experience, use a domain name and trusted HTTPS certificate.

### Visitor Registers But Status Page Says No Active Visit

This usually means the secure cookie was not stored.

Check:

- You opened the app with `https://YOUR_VPS_IP_ADDRESS`, not `http://`.
- You accepted the certificate warning.
- `.env` uses `BETTER_AUTH_URL="https://YOUR_VPS_IP_ADDRESS"`.
- PM2 was restarted after changing `.env`.

Restart:

```bash
pm2 restart tvms
```

### Website Shows 502 Bad Gateway

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

### App Cannot Connect To Database

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

### Admin Login Fails

Confirm `.env` has the correct admin email and password.

Seed again:

```bash
npm run auth:seed-admin
```

If the user already exists, the seed script will not reset the password. In that case, create a new admin email/password in `.env` and seed again, or add a proper password reset feature later.

### QR Code Points To The Wrong URL

The QR code uses the URL currently loaded in the browser.

Make sure you are opening the admin Settings page from:

```text
https://YOUR_VPS_IP_ADDRESS/admin?section=settings
```

Then regenerate/download/print the QR code.

## 32. IP-Only Production Safety Checklist

Before using the system with real visitors:

- `.env` uses a strong `BETTER_AUTH_SECRET`.
- Admin password is strong and private.
- Database password is changed from the local default.
- PostgreSQL is bound to `127.0.0.1:5433`, not exposed publicly.
- Firewall only exposes SSH, HTTP, and HTTPS.
- Nginx redirects HTTP to HTTPS.
- Self-signed certificate has `subjectAltName=IP:YOUR_VPS_IP_ADDRESS`.
- `BETTER_AUTH_URL` uses `https://YOUR_VPS_IP_ADDRESS`.
- `npx prisma migrate deploy` has run successfully.
- `npm run build` passes on the VPS.
- PM2 starts on reboot.
- You have tested visitor registration, check-in, check-out, admin login, Excel export, Settings, QR generation, and audit logs.
- Every visitor/admin device can accept or trust the self-signed certificate.
- You have a backup plan for PostgreSQL.

## 33. When To Move From IP Address To Domain Name

Move to a domain name when:

- You want visitors to avoid browser certificate warnings.
- You want trusted HTTPS with automatic renewal.
- You want a more professional QR code URL.
- You want a stable address even if the VPS IP changes.

When you get a domain, follow [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md), update `BETTER_AUTH_URL`, regenerate the QR code, and print the new QR code.

