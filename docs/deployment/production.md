# Production Deployment Guide

## Pre-deployment Checklist

- [ ] Node.js 18+ installed
- [ ] tmux 3.0+ installed
- [ ] SUMM CLI available in PATH
- [ ] Claude Daemon installed and running
- [ ] Environment variables configured
- [ ] SUMM_DIR directory with proper permissions
- [ ] Firewall configured for PORT

## Deployment Steps

### 1. Build Application

```bash
npm run build
```

Verify output in `dist/` directory.

### 2. Prepare Production Directory

```bash
# Create installation directory
sudo mkdir -p /opt/summ-console

# Copy files
sudo cp -r dist/ /opt/summ-console/
sudo cp package.json /opt/summ-console/
sudo cp .env /opt/summ-console/  # Configure this first!

# Set permissions
sudo chown -R $USER:$USER /opt/summ-console
```

### 3. Configure Environment

Edit `/opt/summ-console/.env`:

```env
NODE_ENV=production
PORT=3000
SUMM_DIR=/opt/summ-data
SUMM_WORK_DIR=/path/to/workspace
ANTHROPIC_API_KEY=sk-xxx
```

### 4. Install Production Dependencies

```bash
cd /opt/summ-console
npm ci --production
```

### 5. Test Run

```bash
node dist/server/index.js
```

Check http://localhost:3000/api/health

### 6. Configure systemd

See [systemd.md](systemd.md)

### 7. Start Service

```bash
systemctl --user start summ-console
systemctl --user status summ-console
```

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

Or use the script:
```bash
./scripts/health-check.sh
```

### Logs

```bash
journalctl --user -u summ-console -f
```

## Updating

1. Stop service:
   ```bash
   systemctl --user stop summ-console
   ```

2. Build and deploy new version

3. Restart service:
   ```bash
   systemctl --user start summ-console
   ```

## Security Considerations

- Use environment variables for secrets
- Restrict CORS origin in production
- Use reverse proxy (nginx) for SSL
- Set up firewall rules
- Regular security updates

## Reverse Proxy Configuration (nginx)

```nginx
server {
    listen 80;
    server_name summ-console.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```
