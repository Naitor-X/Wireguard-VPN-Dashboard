# Wireguard GUI - Installationsanleitung

Diese Anleitung beschreibt, wie Sie die Wireguard GUI auf einem Linux-Server installieren können.

## Voraussetzungen

- Ein Linux-Server mit Root-Zugriff
- Wireguard sollte bereits installiert sein (oder wird vom Installationsskript installiert)
- Internet-Verbindung für das Herunterladen von Paketen

## Installation

### Option 1: Vollautomatische Installation

1. Wechseln Sie in das /opt Verzeichnis und laden Sie alle Projektdateien auf Ihren Server herunter
   ```bash
   # Ins /opt Verzeichnis wechseln
   cd /opt
   
   # Projekt mit Git herunterladen
   git clone https://github.com/ihr-repository/wireguard-gui.git
   cd wireguard-gui
   ```

2. Machen Sie das Installationsskript ausführbar
   ```bash
   chmod +x install.sh
   ```

3. Führen Sie das Installationsskript mit Root-Rechten aus
   ```bash
   sudo ./install.sh
   ```

4. Folgen Sie den Anweisungen auf dem Bildschirm, um die Installation abzuschließen
   - Sie werden nach dem Pfad zum Wireguard-Konfigurationsverzeichnis gefragt (Standard: `/etc/wireguard`)
   - Sie werden nach dem Namen der Wireguard-Konfigurationsdatei gefragt (Standard: `wg0.conf`)

5. Nach Abschluss der Installation können Sie auf die Web-Oberfläche über `http://IhreServerIP:5001` zugreifen

### Option 2: Manuelle Installation in /opt

1. Kopieren Sie die Projektdateien nach `/opt/wireguard-gui`:
   ```bash
   sudo mkdir -p /opt/wireguard-gui
   sudo cp -r * /opt/wireguard-gui/
   cd /opt/wireguard-gui
   ```

2. Installieren Sie die Abhängigkeiten:
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm wireguard iputils-ping
   cd /opt/wireguard-gui/backend-node
   sudo npm install --production
   cd /opt/wireguard-gui
   sudo npm install --production
   sudo npm run build
   ```

3. Erstellen Sie eine .env-Datei mit den Wireguard-Pfaden:
   ```bash
   sudo bash -c 'cat > /opt/wireguard-gui/.env << EOF
   WIREGUARD_DIR=/etc/wireguard
   WIREGUARD_CONFIG_PATH=/etc/wireguard/wg0.conf
   PORT=5001
   EOF'
   ```

4. Erstellen Sie einen systemd-Dienst:
   ```bash
   sudo bash -c 'cat > /etc/systemd/system/wireguard-gui.service << EOF
   [Unit]
   Description=Wireguard GUI
   After=network.target
   
   [Service]
   Type=simple
   User=root
   WorkingDirectory=/opt/wireguard-gui
   EnvironmentFile=/opt/wireguard-gui/.env
   ExecStart=/usr/bin/node /opt/wireguard-gui/backend-node/server.js
   Restart=on-failure
   RestartSec=10
   
   [Install]
   WantedBy=multi-user.target
   EOF'
   ```

5. Aktivieren und starten Sie den Dienst:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable wireguard-gui.service
   sudo systemctl start wireguard-gui.service
   ```

## Berechtigungen einrichten

Wenn Sie Probleme mit Berechtigungen haben, führen Sie folgende Befehle aus:

```bash
# Gruppe für die Anwendung erstellen
sudo groupadd -f wireguard-gui

# Berechtigungen für das Wireguard-Verzeichnis setzen
# Option 1: Mit ACLs (bevorzugt)
sudo apt install -y acl
sudo setfacl -m g:wireguard-gui:rwx /etc/wireguard
sudo setfacl -m g:wireguard-gui:rw /etc/wireguard/wg0.conf

# Option 2: Ohne ACLs
sudo chmod 775 /etc/wireguard
sudo chmod 664 /etc/wireguard/wg0.conf
```

## Fehlerbehebung

- **Dienst startet nicht**: Überprüfen Sie die Logs mit `sudo journalctl -u wireguard-gui`
- **Web-Oberfläche nicht erreichbar**: Überprüfen Sie, ob Port 5001 in Ihrer Firewall freigegeben ist
- **Keine Berechtigungen für Wireguard-Dateien**: Führen Sie die Befehle im Abschnitt "Berechtigungen einrichten" aus 