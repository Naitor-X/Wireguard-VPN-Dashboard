# Wireguard VPN Dashboard

Ein modernes, leichtes Dashboard zur Verwaltung von Wireguard VPN-Clients mit Python-Backend.

## Funktionen

- Übersicht über alle verbundenen Wireguard-Clients
- Unterteilung in Admin-Clients (10.10.10.x) und normale Clients
- Ein- und ausklappbare Clientgruppen
- Suchfunktion zum schnellen Finden von Clients
- Hinzufügen neuer Clients
- Detailansicht für ausgewählte Clients
- Automatisches Auslesen der Wireguard-Konfigurationsdatei

## Features

- **Modernes Design**: Klares, übersichtliches Interface mit Farbkodierung
- **Responsive Layout**: Optimiert für Desktop und mobile Geräte
- **Suchfunktion**: Schnelles Finden von Clients nach Namen oder IP-Adresse
- **Gruppierung**: Separate Bereiche für Admin- und normale Clients
- **Ein-/Ausklappbare Gruppen**: Bessere Übersicht durch Minimieren nicht benötigter Gruppen
- **Detailansicht**: Detaillierte Informationen zu ausgewählten Clients
- **Aktionsbuttons**: Schneller Zugriff auf häufig benötigte Funktionen
- **Python-Backend**: Liest die Wireguard-Konfigurationsdatei aus und stellt die Daten über eine REST-API zur Verfügung

## Installation

### Backend

```bash
# Ins Backend-Verzeichnis wechseln
cd backend

# Abhängigkeiten installieren
pip install -r requirements.txt

# Umgebungsvariablen konfigurieren
cp .env.example .env
# Passe die Werte in der .env-Datei nach Bedarf an
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
chmod +x start.sh

# Starten
./start.sh
```

Oder manuell:

```bash
# Backend starten
cd backend
python app.py

# In einem neuen Terminal: Frontend starten
npm start
```

## Technologien

- **Frontend**:
  - React
  - Tailwind CSS
  - Headless UI für Komponenten
- **Backend**:
  - Python
  - Flask
  - Flask-CORS

## Konfiguration

Die Wireguard-Konfigurationsdatei wird standardmäßig aus `etc/wireguard/wg0.conf` gelesen. Sie können den Pfad in der `.env`-Datei im Backend-Verzeichnis ändern.

## Lizenz

MIT 