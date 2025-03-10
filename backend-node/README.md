# WireGuard GUI Backend (Node.js)

Dieses Backend liest die WireGuard-Konfigurationsdatei aus und stellt die Daten über eine REST-API zur Verfügung.

## Installation

1. Node.js 14 oder höher installieren
2. Abhängigkeiten installieren:
   ```
   npm install
   ```

## Starten des Backends

```
npm start
```

Das Backend ist dann unter `http://localhost:5000` erreichbar.

## Umgebungsvariablen

- `PORT`: Der Port, auf dem der Server laufen soll (Standard: 5000)
- `WIREGUARD_CONFIG_PATH`: Der Pfad zur WireGuard-Konfigurationsdatei (Standard: etc/wireguard/wg0.conf)

## API-Endpunkte

### GET /api/clients

Gibt alle Clients aus der WireGuard-Konfigurationsdatei zurück. Die Clients werden in Admin-Clients (10.10.10.x) und normale Clients aufgeteilt.

Beispielantwort:
```json
{
  "adminClients": [
    {
      "id": 1,
      "name": "ClemensT14",
      "ip": "10.10.10.2",
      "publicKey": "mvFMF4ppFYPpx9pTiLkk3lEXZwhZst4+6hMnw3vHvhM=",
      "lastSeen": "2023-09-15T14:30:00",
      "isAdmin": true,
      "status": "unknown"
    }
  ],
  "normalClients": [
    {
      "id": 5,
      "name": "hm-gisingen",
      "ip": "10.10.11.2",
      "publicKey": "CMqUKtHSxH0Vrs12oePoqVVHCfHGi6FU5dpvcq9IP0Y=",
      "lastSeen": "2023-09-15T14:25:00",
      "isAdmin": false,
      "status": "unknown"
    }
  ]
}
``` 