#!/bin/bash

# ====================================================
# Wireguard GUI - Installations-Skript
# 
# Dieses Skript wird verwendet, um die Wireguard GUI auf einem Server zu installieren.
# Es führt folgende Aufgaben aus:
# 1. Installation aller benötigten Abhängigkeiten
# 2. Einrichtung der Anwendung im /opt-Verzeichnis
# 3. Konfiguration der Pfade zur Wireguard-Installation
# 4. Einrichtung der nötigen Berechtigungen
# ====================================================

# Fehler-Behandlung
set -e  # Skript beenden, wenn ein Befehl fehlschlägt
trap 'echo "Installation fehlgeschlagen. Siehe obige Fehler für Details."; exit 1' ERR

# Farben für die Ausgabe
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # Keine Farbe

# Root-Berechtigungen prüfen
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${YELLOW}Dieses Skript muss mit Root-Berechtigungen ausgeführt werden.${NC}"
    echo -e "Bitte mit sudo ausführen: ${GREEN}sudo $0${NC}"
    exit 1
fi

# Begrüßung und Einführung
echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}       Wireguard GUI - Installations-Skript       ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo
echo -e "Dieses Skript wird die Wireguard GUI in ${GREEN}/opt/wireguard-gui${NC} installieren."
echo -e "Während der Installation werden Sie nach Pfaden zum Wireguard-Konfigurationsverzeichnis gefragt."
echo
echo -e "${YELLOW}Die Installation beginnt in 5 Sekunden...${NC}"
sleep 5

# Installationsverzeichnis festlegen
INSTALL_DIR="/opt/wireguard-gui"
echo -e "\n${BLUE}=== Installationsverzeichnis vorbereiten ===${NC}"
mkdir -p "$INSTALL_DIR"

# Wireguard-Pfad abfragen
echo -e "\n${BLUE}=== Wireguard-Konfiguration ===${NC}"
read -p "Bitte geben Sie den Pfad zum Wireguard-Konfigurationsverzeichnis ein [/etc/wireguard]: " WIREGUARD_DIR
WIREGUARD_DIR=${WIREGUARD_DIR:-/etc/wireguard}

# Prüfen, ob Wireguard-Verzeichnis existiert
if [ ! -d "$WIREGUARD_DIR" ]; then
    echo -e "${YELLOW}Warnung: Das Verzeichnis $WIREGUARD_DIR existiert nicht.${NC}"
    read -p "Möchten Sie es erstellen? (j/n): " CREATE_DIR
    if [[ "$CREATE_DIR" =~ ^[Jj]$ ]]; then
        mkdir -p "$WIREGUARD_DIR"
        echo -e "${GREEN}Verzeichnis $WIREGUARD_DIR wurde erstellt.${NC}"
    else
        echo -e "${YELLOW}Bitte installieren Sie Wireguard zuerst und führen Sie dieses Skript erneut aus.${NC}"
        exit 1
    fi
fi

# Den Standard-Config-Pfad abfragen
read -p "Bitte geben Sie den Namen der Wireguard-Konfigurationsdatei ein [wg0.conf]: " CONFIG_FILE
CONFIG_FILE=${CONFIG_FILE:-wg0.conf}
CONFIG_PATH="$WIREGUARD_DIR/$CONFIG_FILE"

# Prüfen, ob die Config-Datei existiert
if [ ! -f "$CONFIG_PATH" ]; then
    echo -e "${YELLOW}Warnung: Die Konfigurationsdatei $CONFIG_PATH existiert nicht.${NC}"
    echo -e "${YELLOW}Die Anwendung wird trotzdem installiert, aber Sie müssen die Konfigurationsdatei später einrichten.${NC}"
fi

# Abhängigkeiten installieren
echo -e "\n${BLUE}=== Systemabhängigkeiten installieren ===${NC}"
apt update
apt install -y nodejs npm wireguard iputils-ping

# Prüfen, ob Node.js und npm installiert sind
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}Fehler: Node.js oder npm konnte nicht installiert werden.${NC}"
    exit 1
fi

# Node.js-Version prüfen (mindestens v14 empfohlen)
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo -e "${YELLOW}Warnung: Node.js Version $NODE_VERSION erkannt. Version 14 oder höher wird empfohlen.${NC}"
    read -p "Möchten Sie fortfahren? (j/n): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Jj]$ ]]; then
        exit 1
    fi
fi

# Projekt-Dateien kopieren
echo -e "\n${BLUE}=== Anwendungsdateien kopieren ===${NC}"
cp -r ./* "$INSTALL_DIR/"
cd "$INSTALL_DIR"

# Umgebungsvariablen-Datei erstellen
echo -e "\n${BLUE}=== Umgebungsvariablen konfigurieren ===${NC}"

cat > "$INSTALL_DIR/.env" << EOF
# Automatisch generiert durch das Installations-Skript
WIREGUARD_DIR=$WIREGUARD_DIR
WIREGUARD_CONFIG_PATH=$CONFIG_PATH
PORT=5001
EOF

echo -e "${GREEN}Umgebungsvariablen wurden in $INSTALL_DIR/.env gespeichert.${NC}"

# Backend-Abhängigkeiten installieren
echo -e "\n${BLUE}=== Backend-Abhängigkeiten installieren ===${NC}"
cd "$INSTALL_DIR/backend-node"
npm install --production

# Frontend-Abhängigkeiten installieren und Build erstellen
echo -e "\n${BLUE}=== Frontend-Abhängigkeiten installieren und Build erstellen ===${NC}"
cd "$INSTALL_DIR"
npm install --production
npm run build

# Service-Datei für systemd erstellen
echo -e "\n${BLUE}=== Systemdienst einrichten ===${NC}"

cat > /etc/systemd/system/wireguard-gui.service << EOF
[Unit]
Description=Wireguard GUI
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=/usr/bin/node $INSTALL_DIR/backend-node/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Berechtigungen setzen
echo -e "\n${BLUE}=== Berechtigungen einrichten ===${NC}"

# Gruppe für wireguard-gui erstellen
groupadd -f wireguard-gui

# Wireguard-Gruppenberechtigungen setzen (wenn nötig)
if getent group wireguard > /dev/null; then
    # Wireguard-Gruppe existiert bereits
    echo -e "Nutzer 'root' wird zur Gruppe 'wireguard' hinzugefügt..."
    usermod -a -G wireguard root
else
    echo -e "${YELLOW}Keine Wireguard-Gruppe gefunden. ACLs werden stattdessen verwendet.${NC}"
fi

# ACLs für das Wireguard-Verzeichnis einrichten
if command -v setfacl &> /dev/null; then
    echo -e "ACLs werden für $WIREGUARD_DIR eingerichtet..."
    setfacl -m g:wireguard-gui:rwx "$WIREGUARD_DIR"
    if [ -f "$CONFIG_PATH" ]; then
        setfacl -m g:wireguard-gui:rw "$CONFIG_PATH"
        echo -e "${GREEN}ACLs für $CONFIG_PATH wurden eingerichtet.${NC}"
    fi
else
    echo -e "${YELLOW}setfacl ist nicht installiert. Direktes Setzen von Berechtigungen...${NC}"
    chmod 775 "$WIREGUARD_DIR"
    if [ -f "$CONFIG_PATH" ]; then
        chmod 664 "$CONFIG_PATH"
    fi
fi

# Systemd neu laden und Dienst starten
echo -e "\n${BLUE}=== Dienst aktivieren und starten ===${NC}"
systemctl daemon-reload
systemctl enable wireguard-gui.service
systemctl start wireguard-gui.service

# Netzwerk-Konfiguration ausgeben
echo -e "\n${BLUE}=== Installation abgeschlossen ===${NC}"
IP_ADDR=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}Die Wireguard GUI wurde erfolgreich installiert!${NC}"
echo -e "Sie können auf die Web-Oberfläche über ${YELLOW}http://$IP_ADDR:3000${NC} zugreifen."
echo -e "Die Anwendung läuft als Systemdienst und wird automatisch beim Systemstart gestartet."
echo
echo -e "${BLUE}==================================================${NC}"
echo -e "${YELLOW}Hinweise zur Fehlerbehebung:${NC}"
echo -e "- Dienststatus prüfen: ${GREEN}systemctl status wireguard-gui${NC}"
echo -e "- Logs anzeigen: ${GREEN}journalctl -u wireguard-gui${NC}"
echo -e "- Dienst neu starten: ${GREEN}systemctl restart wireguard-gui${NC}"
echo -e "${BLUE}==================================================${NC}" 