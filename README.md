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

### Backend

```bash
# Ins Backend-Verzeichnis wechseln
cd backend-node

# Abhängigkeiten installieren
npm install
```

### Frontend

```bash
# Abhängigkeiten installieren
npm install
```

## Starten der Anwendung

Sie können die Anwendung mit dem bereitgestellten Skript starten:

```bash
# Ausführbar machen
chmod +x start-node.sh

# Starten
./start-node.sh
```

Oder manuell:

```bash
# Backend starten
cd backend-node
node server.js

# In einem neuen Terminal: Frontend starten
npm start
```

## API-Endpunkte

Das Backend stellt folgende REST-API-Endpunkte zur Verfügung:

- `GET /api/clients`: Liefert alle Clients mit Status-Informationen
- `GET /api/clients/status`: Liefert den aktuellen Online-/Offline-Status aller Clients
- `POST /api/clients/ping`: Aktualisiert den Status aller Clients und gibt die aktuellen Daten zurück
- `POST /api/clients`: Erstellt einen neuen Client
- `GET /api/clients/:clientID/qrcode`: Generiert einen QR-Code für die Client-Konfiguration
- `DELETE /api/clients/:clientName`: Löscht einen vorhandenen Client

## Technologien

- **Frontend**:
  - React
  - Tailwind CSS
  - Headless UI für Komponenten
- **Backend**:
  - Node.js
  - Express
  - Child Process für Systemaufrufe

## Konfiguration

Die Wireguard-Konfigurationsdatei wird standardmäßig aus `etc/wireguard/wg0.conf` gelesen. Sie können den Pfad durch Setzen der Umgebungsvariable `WIREGUARD_CONFIG_PATH` ändern.

Zusätzlich kann das Wireguard-Verzeichnis durch Setzen der Umgebungsvariable `WIREGUARD_DIR` angepasst werden.

Der Client-Status wird in der Datei `clients_status.json` im Wireguard-Verzeichnis gespeichert.

## Lizenz

MIT 