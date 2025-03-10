# Wireguard VPN Dashboard

Ein modernes, leichtes Dashboard zur Verwaltung von Wireguard VPN-Clients mit Node.js-Backend.

## Funktionen

- Übersicht über alle verbundenen Wireguard-Clients
- Persistente Speicherung des Online-/Offline-Status der Clients
- Unterteilung in Admin-Clients (10.10.10.x) und normale Clients
- Ein- und ausklappbare Clientgruppen
- Suchfunktion zum schnellen Finden von Clients
- Hinzufügen neuer Clients mit automatischer IP-Zuweisung
- Detailansicht für ausgewählte Clients
- QR-Code-Generierung für Mobile Clients
- Anzeige der Offline-Zeit der Clients (wann zuletzt online)
- Einfaches Löschen von vorhandenen Clients
- Automatisches Auslesen der Wireguard-Konfigurationsdatei

## Features

- **Modernes Design**: Klares, übersichtliches Interface mit Farbkodierung
- **Responsive Layout**: Optimiert für Desktop und mobile Geräte
- **Persistenter Client-Status**: Der Online-/Offline-Status der Clients bleibt auch nach einem Serverneustart erhalten
- **Suchfunktion**: Schnelles Finden von Clients nach Namen oder IP-Adresse
- **Gruppierung**: Separate Bereiche für Admin- und normale Clients
- **Ein-/Ausklappbare Gruppen**: Bessere Übersicht durch Minimieren nicht benötigter Gruppen
- **Detailansicht**: Detaillierte Informationen zu ausgewählten Clients
- **Aktionsbuttons**: Schneller Zugriff auf häufig benötigte Funktionen
- **QR-Code-Unterstützung**: Einfache Konfiguration von Mobilgeräten durch Scannen eines QR-Codes
- **Automatische IP-Zuweisung**: Freie IP-Adressen werden automatisch gefunden und zugewiesen
- **Node.js-Backend**: Liest die Wireguard-Konfigurationsdatei aus und stellt die Daten über eine REST-API zur Verfügung

## Installation

### Voraussetzungen

- Node.js (v14 oder höher)
- npm (v6 oder höher)
- Wireguard (bereits installiert und konfiguriert)

### Schritt-für-Schritt-Anleitung

1. **Repository klonen**

   ```bash
   git clone https://github.com/ihr-username/wireguard-dashboard.git
   cd wireguard-dashboard
   ```

2. **Backend einrichten**

   ```bash
   # Ins Backend-Verzeichnis wechseln
   cd backend-node

   # Abhängigkeiten installieren
   npm install

   # Zurück zum Hauptverzeichnis
   cd ..
   ```

3. **Frontend einrichten**

   ```bash
   # Abhängigkeiten im Hauptverzeichnis installieren
   npm install
   ```

4. **Konfiguration**

   Das Backend liest standardmäßig die Wireguard-Konfiguration aus `/etc/wireguard/wg0.conf`. Falls Ihre Konfiguration an einem anderen Ort liegt, können Sie dies über Umgebungsvariablen anpassen:

   ```bash
   # Optional: Umgebungsvariablen setzen
   export WIREGUARD_CONFIG_PATH=/pfad/zu/ihrer/wg0.conf
   export WIREGUARD_DIR=/pfad/zu/ihrem/wireguard-verzeichnis
   ```

   Alternativ können Sie diese Variablen in einer `.env`-Datei im Backend-Verzeichnis speichern:

   ```
   WIREGUARD_CONFIG_PATH=/pfad/zu/ihrer/wg0.conf
   WIREGUARD_DIR=/pfad/zu/ihrem/wireguard-verzeichnis
   PORT=5001
   ```

5. **Berechtigungen einrichten**

   Das Backend benötigt Leserechte für die Wireguard-Konfigurationsdatei und Schreibrechte für das Wireguard-Verzeichnis:

   ```bash
   # Leserechte für die Konfigurationsdatei
   sudo chmod 644 /etc/wireguard/wg0.conf

   # Schreibrechte für das Wireguard-Verzeichnis (falls nötig)
   sudo chmod 755 /etc/wireguard
   ```

   Alternativ können Sie das Backend mit sudo-Rechten ausführen, was jedoch aus Sicherheitsgründen nicht empfohlen wird.

6. **Start-Skript ausführbar machen**

   ```bash
   chmod +x start-node.sh
   ```

### Starten der Anwendung

Sie können die Anwendung mit dem bereitgestellten Skript starten:

```bash
# Starten mit dem Skript
./start-node.sh
```

Oder manuell in zwei separaten Terminals:

```bash
# Terminal 1: Backend starten
cd backend-node
node server.js

# Terminal 2: Frontend starten
npm start
```

Nach dem Start ist die Anwendung unter folgenden URLs erreichbar:
- Frontend: http://localhost:3000
- Backend-API: http://localhost:5001/api

### Autostart einrichten (optional)

Um die Anwendung beim Systemstart automatisch zu starten, können Sie einen systemd-Service einrichten:

1. **Service-Datei erstellen**

   ```bash
   sudo nano /etc/systemd/system/wireguard-dashboard.service
   ```

2. **Folgende Konfiguration einfügen** (Pfade entsprechend anpassen):

   ```
   [Unit]
   Description=Wireguard Dashboard
   After=network.target

   [Service]
   Type=simple
   User=<ihr-username>
   WorkingDirectory=/pfad/zu/wireguard-dashboard
   ExecStart=/bin/bash /pfad/zu/wireguard-dashboard/start-node.sh
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

3. **Service aktivieren und starten**

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable wireguard-dashboard
   sudo systemctl start wireguard-dashboard
   ```

4. **Status überprüfen**

   ```bash
   sudo systemctl status wireguard-dashboard
   ```

## API-Endpunkte

Das Backend stellt folgende REST-API-Endpunkte zur Verfügung:

- `GET /api/clients`: Liefert alle Clients mit Status-Informationen
- `GET /api/clients/status`: Liefert den aktuellen Online-/Offline-Status aller Clients
- `POST /api/clients/ping`: Aktualisiert den Status aller Clients und gibt die aktuellen Daten zurück
- `POST /api/clients`: Erstellt einen neuen Client
- `GET /api/clients/:clientID/qrcode`: Generiert einen QR-Code für die Client-Konfiguration
- `DELETE /api/clients/:clientName`: Löscht einen vorhandenen Client

## Fehlerbehebung

### Häufige Probleme

1. **Backend startet nicht**
   - Überprüfen Sie, ob Port 5001 bereits verwendet wird
   - Stellen Sie sicher, dass die Wireguard-Konfigurationsdatei existiert und lesbar ist
   - Überprüfen Sie die Berechtigungen für das Wireguard-Verzeichnis

2. **Frontend startet nicht**
   - Überprüfen Sie, ob Port 3000 bereits verwendet wird
   - Stellen Sie sicher, dass alle Abhängigkeiten installiert sind

3. **Keine Clients werden angezeigt**
   - Überprüfen Sie, ob die Wireguard-Konfigurationsdatei korrekt formatiert ist
   - Stellen Sie sicher, dass das Backend läuft und erreichbar ist

4. **Änderungen werden nicht gespeichert**
   - Überprüfen Sie die Schreibrechte für das Wireguard-Verzeichnis
   - Stellen Sie sicher, dass der Benutzer, der das Backend ausführt, ausreichende Rechte hat

## Technologien

- **Frontend**:
  - React
  - Tailwind CSS
  - Headless UI für Komponenten
- **Backend**:
  - Node.js
  - Express
  - Child Process für Systemaufrufe

## Lizenz

MIT 