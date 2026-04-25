# Hostinger VPS Deployment Guide (UNNSSAA)

## 1. Server prerequisites
- Provision an Ubuntu VPS on Hostinger.
- Point your domain DNS A record to the VPS public IP.
- SSH into server and update packages:

```bash
sudo apt update
sudo apt upgrade -y
```

## 2. Install runtime dependencies

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs nginx postgresql postgresql-contrib
sudo npm install -g pm2
```

## 3. Setup PostgreSQL database

```bash
sudo -u postgres psql
CREATE DATABASE unnssaa;
CREATE USER unnssaa_app WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE unnssaa TO unnssaa_app;
\q
```

## 4. Deploy code

```bash
cd /var/www
sudo mkdir -p unnssaa
sudo chown -R $USER:$USER unnssaa
cd unnssaa
git clone <your-repository-url> .
npm install
cp .env.example .env
```

Edit `.env` values for production secrets:
- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=postgresql://unnssaa_app:strong_password_here@localhost:5432/unnssaa`
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- `CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com`

## 5. Run migrations and seed

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

## 6. Start with PM2

```bash
pm2 start deployment/ecosystem.config.cjs
pm2 save
pm2 startup
```

## 7. Configure Nginx reverse proxy

```bash
sudo cp deployment/nginx-unnssaa.conf /etc/nginx/sites-available/unnssaa
sudo ln -s /etc/nginx/sites-available/unnssaa /etc/nginx/sites-enabled/unnssaa
sudo nginx -t
sudo systemctl restart nginx
```

## 8. Enable SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 9. Hardening and operations
- Use UFW firewall (`sudo ufw allow OpenSSH`, `sudo ufw allow 'Nginx Full'`, `sudo ufw enable`).
- Rotate admin seed password immediately after first login.
- Set up daily database backups (cron + `pg_dump`).
- Monitor logs with `pm2 logs unnssaa-web` and `sudo tail -f /var/log/nginx/error.log`.
