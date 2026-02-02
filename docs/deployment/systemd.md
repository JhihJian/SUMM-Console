# Systemd Service Installation

## User Service (Recommended)

1. Copy the service file:
   ```bash
   mkdir -p ~/.config/systemd/user/
   cp summ-console.service ~/.config/systemd/user/
   ```

2. Reload systemd:
   ```bash
   systemctl --user daemon-reload
   ```

3. Enable and start:
   ```bash
   systemctl --user enable summ-console
   systemctl --user start summ-console
   ```

4. Check status:
   ```bash
   systemctl --user status summ-console
   ```

## System-wide Service

1. Copy service file to system directory:
   ```bash
   sudo cp summ-console.service /etc/systemd/system/
   ```

2. Create summ-console user:
   ```bash
   sudo useradd -r -s /bin/false summ-console
   ```

3. Set permissions:
   ```bash
   sudo chown -R summ-console:summ-console /opt/summ-console
   ```

4. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable summ-console
   sudo systemctl start summ-console
   ```
