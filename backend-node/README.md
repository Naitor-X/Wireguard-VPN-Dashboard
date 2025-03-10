# WireGuard GUI Backend (Node.js)

Dieses Backend liest die WireGuard-Konfigurationsdatei aus und stellt die Daten über eine REST-API zur Verfügung. Es speichert auch den Online-Status der Clients persistent.

## Installation

1. Node.js 14 oder höher installieren
2. Abhängigkeiten installieren:
   ```
   npm install
   ```

## Starten des Backends

```
node server.js
```

Das Backend ist dann unter `http://localhost:5001` erreichbar.

## Umgebungsvariablen

- `PORT`: Der Port, auf dem der Server laufen soll (Standard: 5001)
- `WIREGUARD_CONFIG_PATH`: Der Pfad zur WireGuard-Konfigurationsdatei (Standard: ../etc/wireguard/wg0.conf)
- `WIREGUARD_DIR`: Das WireGuard-Verzeichnis (Standard: ../etc/wireguard)

## Statusdatei

Der Online-Status der Clients wird in der Datei `clients_status.json` im WireGuard-Verzeichnis gespeichert. Diese Datei wird automatisch erstellt und aktualisiert. Der Status bleibt auch nach einem Serverneustart erhalten.

## API-Endpunkte

### GET /api/clients

Gibt alle Clients aus der WireGuard-Konfigurationsdatei zurück. Die Clients werden in Admin-Clients (10.10.10.x) und normale Clients aufgeteilt. Der Status und die letzte Sichtung werden mit zurückgegeben.

Beispielantwort:
```json
{
  "adminClients": [
    {
      "id": 1,
      "name": "ClemensT14",
      "ip": "10.10.10.2",
      "publicKey": "mvFMF4ppFYPpx9pTiLkk3lEXZwhZst4+6hMnw3vHvhM=",
      "isAdmin": true,
      "status": "online",
      "lastSeen": "2023-09-15T14:30:00Z"
    }
  ],
  "normalClients": [
    {
      "id": 5,
      "name": "hm-gisingen",
      "ip": "10.10.11.2",
      "publicKey": "CMqUKtHSxH0Vrs12oePoqVVHCfHGi6FU5dpvcq9IP0Y=",
      "isAdmin": false,
      "status": "offline",
      "lastSeen": "2023-09-15T14:25:00Z"
    }
  ]
}
```

### GET /api/clients/status

Gibt den aktuellen Status aller Clients zurück.

Beispielantwort:
```json
{
  "10.10.10.2": {
    "status": "online",
    "lastSeen": "2023-09-15T14:30:00Z"
  },
  "10.10.11.2": {
    "status": "offline",
    "lastSeen": "2023-09-15T14:25:00Z"
  }
}
```

### POST /api/clients/ping

Aktualisiert den Status aller Clients und gibt die aktualisierten Daten zurück. Dies erfolgt durch Pingen aller Clients.

### POST /api/clients

Erstellt einen neuen Client mit automatischer IP-Zuweisung.

### GET /api/clients/:clientID/qrcode

Generiert einen QR-Code für die Client-Konfiguration.

### DELETE /api/clients/:clientName

Löscht einen vorhandenen Client. 