# Deploy to Tencent Cloud HK — Step by Step

Your Next.js app will be served from Hong Kong, accessible from mainland China without an ICP license.

---

## Step 1: Buy a Tencent Cloud HK Server

1. Go to **[intl.cloud.tencent.com](https://intl.cloud.tencent.com)** (international portal, pay by card)
2. Click **Cloud Virtual Machine (CVM)** → Buy
3. Settings:
   - **Region:** Hong Kong
   - **Image:** Ubuntu 22.04 LTS
   - **Instance type:** S5.SMALL2 (1 vCPU, 2GB RAM) — ~$10–15/month, enough for this app
   - **Bandwidth:** 5 Mbps (can upgrade later)
4. Under **Security Group**, open ports: **22** (SSH), **80** (HTTP), **443** (HTTPS)
5. Create or upload an **SSH key pair** — download the `.pem` file and keep it safe
6. Launch the instance. Note your **Public IP**.

---

## Step 2: SSH into your server

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_SERVER_IP
```

---

## Step 3: Install Docker on the server

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

---

## Step 4: Clone your repo on the server

```bash
cd /home/ubuntu
git clone https://github.com/joeadymimi/Best-Wishes-London-2026.git
cd Best-Wishes-London-2026
```

---

## Step 5: Build and start the app

```bash
docker compose build
docker compose up -d

# Check it's running:
docker compose ps
docker compose logs app
```

Visit `http://YOUR_SERVER_IP` — your app should be live!

---

## Step 6: Set up auto-deploy via GitHub Actions

So every `git push` to `main` auto-deploys to your server:

1. In your GitHub repo → **Settings → Secrets and variables → Actions**
2. Add these 3 secrets:

| Secret name | Value |
|---|---|
| `TENCENT_HK_HOST` | Your server's public IP |
| `TENCENT_HK_USER` | `ubuntu` |
| `TENCENT_HK_SSH_KEY` | Contents of your `.pem` file (paste the whole thing) |

3. Push to main → GitHub will auto-deploy on every commit!

---

## Step 7 (Optional): Add a free domain + SSL

If you want `https://yourdomain.com` instead of a raw IP:

```bash
# On your server:
sudo apt install certbot python3-certbot-nginx -y

# Point your domain's DNS A record to YOUR_SERVER_IP first, then:
sudo certbot --nginx -d yourdomain.com

# Certbot auto-renews, and updates nginx config for HTTPS
```

Then uncomment the SSL block in `nginx.conf`.

---

## Quick Commands (cheatsheet)

```bash
# View logs
docker compose logs -f app

# Restart app
docker compose restart app

# Pull latest code and redeploy manually
git pull && docker compose build && docker compose up -d

# Stop everything
docker compose down
```

---

## Estimated Cost

| Item | Monthly Cost |
|---|---|
| Tencent Cloud HK CVM S5.SMALL2 | ~$10–15 USD |
| 5 Mbps bandwidth | Included |
| Domain (optional) | ~$10/year |

**Total: ~$10–15/month** — and your app is accessible from mainland China
