const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS aktivieren
app.use(cors());

// Body-Parser für JSON-Anfragen aktivieren
app.use(express.json());

// Konfigurationspfad für die WireGuard-Konfigurationsdatei
const CONFIG_PATH = process.env.WIREGUARD_CONFIG_PATH || '../etc/wireguard/wg0.conf';
const WIREGUARD_DIR = process.env.WIREGUARD_DIR || '../etc/wireguard';

// Globaler Speicher für Client-Status
let clientsStatus = {};

// Funktion zum Parsen der WireGuard-Konfigurationsdatei
function parseWireguardConfig(configPath) {
  try {
    // Prüfen, ob die Datei existiert
    if (!fs.existsSync(configPath)) {
      throw new Error(`Die Konfigurationsdatei ${configPath} wurde nicht gefunden.`);
    }

    // Datei einlesen
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Debug-Ausgabe
    console.log('Konfigurationsdatei geladen, Größe:', configContent.length, 'Bytes');

    // Peer-Abschnitte extrahieren - verbesserte Version
    const peers = [];
    
    // Zuerst den Interface-Abschnitt überspringen
    const contentWithoutInterface = configContent.split('[Interface]')[1];
    
    // Dann alle Peer-Abschnitte finden
    const peerSections = contentWithoutInterface.split(/# (.*?)\n\[Peer\]/g);
    
    // Der erste Eintrag ist der Rest des Interface-Abschnitts, überspringen
    for (let i = 1; i < peerSections.length; i += 2) {
      if (i + 1 < peerSections.length) {
        const name = peerSections[i].trim();
        const peerContent = peerSections[i + 1];
        
        // Extrahiere die relevanten Informationen
        const publicKeyMatch = /PublicKey\s*=\s*(.*)/m.exec(peerContent);
        const allowedIpsMatch = /AllowedIPs\s*=\s*(.*)/m.exec(peerContent);
        
        if (publicKeyMatch && allowedIpsMatch) {
          const publicKey = publicKeyMatch[1].trim();
          const allowedIps = allowedIpsMatch[1].trim();
          
          // IP-Adresse extrahieren (nehme die erste, falls mehrere vorhanden sind)
          const ipMatch = /(\d+\.\d+\.\d+\.\d+)/.exec(allowedIps);
          if (ipMatch) {
            const ip = ipMatch[1];
            
            // Bestimme, ob es sich um einen Admin-Client handelt (10.10.10.x)
            const isAdmin = ip.startsWith('10.10.10.');
            
            // Status aus dem globalen Speicher abrufen oder Standardwert setzen
            const clientStatus = clientsStatus[ip] || {
              status: 'offline',
              lastSeen: new Date().toISOString()
            };
            
            peers.push({
              id: peers.length + 1,
              name,
              ip,
              publicKey,
              lastSeen: clientStatus.lastSeen,
              isAdmin,
              status: clientStatus.status
            });
            
            console.log(`Client gefunden: ${name}, IP: ${ip}, isAdmin: ${isAdmin}, Status: ${clientStatus.status}`);
          }
        }
      }
    }
    
    console.log(`Insgesamt ${peers.length} Clients gefunden.`);

    // Clients in Admin-Clients und normale Clients aufteilen
    const adminClients = peers.filter(client => client.isAdmin);
    const normalClients = peers.filter(client => !client.isAdmin);
    
    console.log(`Admin-Clients: ${adminClients.length}, Normale Clients: ${normalClients.length}`);

    return {
      adminClients,
      normalClients
    };
  } catch (error) {
    console.error('Fehler beim Parsen der Konfigurationsdatei:', error);
    throw error;
  }
}

// Funktion zum Pingen eines Clients
function pingClient(ip) {
  return new Promise((resolve) => {
    exec(`ping -c 1 -W 1 ${ip}`, (error, stdout, stderr) => {
      if (error) {
        // Ping fehlgeschlagen
        resolve(false);
      } else {
        // Ping erfolgreich
        resolve(true);
      }
    });
  });
}

// Funktion zum Aktualisieren des Status aller Clients
async function updateClientsStatus() {
  try {
    const clients = parseWireguardConfig(CONFIG_PATH);
    const allClients = [...clients.adminClients, ...clients.normalClients];
    
    console.log('Starte Ping-Überprüfung für alle Clients...');
    
    for (const client of allClients) {
      const isReachable = await pingClient(client.ip);
      const now = new Date().toISOString();
      
      // Status aktualisieren
      if (isReachable) {
        clientsStatus[client.ip] = {
          status: 'online',
          lastSeen: now
        };
        console.log(`Client ${client.name} (${client.ip}) ist erreichbar.`);
      } else {
        // Wenn der Client nicht erreichbar ist, behalten wir das letzte Sehen bei
        const lastSeen = (clientsStatus[client.ip] && clientsStatus[client.ip].lastSeen) || now;
        clientsStatus[client.ip] = {
          status: 'offline',
          lastSeen: lastSeen
        };
        console.log(`Client ${client.name} (${client.ip}) ist nicht erreichbar.`);
      }
    }
    
    console.log('Ping-Überprüfung abgeschlossen.');
  } catch (error) {
    console.error('Fehler bei der Aktualisierung des Client-Status:', error);
  }
}

// API-Endpunkt zum Abrufen der Clients
app.get('/api/clients', (req, res) => {
  try {
    const clients = parseWireguardConfig(CONFIG_PATH);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API-Endpunkt zum manuellen Aktualisieren des Client-Status
app.post('/api/clients/ping', async (req, res) => {
  try {
    await updateClientsStatus();
    const clients = parseWireguardConfig(CONFIG_PATH);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Funktion zum Finden der nächsten verfügbaren IP-Adresse
function findNextAvailableIp(isAdmin) {
  try {
    // Konfigurationsdatei laden
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    
    // IP-Bereich basierend auf dem Client-Typ bestimmen
    const ipBase = isAdmin ? '10.10.10.' : '10.10.11.';
    
    // Regulärer Ausdruck, um alle vorhandenen IPs zu finden
    // Format: AllowedIPs = 10.10.1x.y/32
    const ipRegex = new RegExp(`AllowedIPs\\s*=\\s*${ipBase.replace(/\./g, '\\.')}(\\d+)/32`, 'g');
    
    // Alle übereinstimmenden IPs sammeln
    let match;
    const usedLastOctets = [];
    while ((match = ipRegex.exec(configContent)) !== null) {
      usedLastOctets.push(parseInt(match[1], 10));
    }
    
    // Sortieren, um die Lücken zu finden
    usedLastOctets.sort((a, b) => a - b);
    
    // Die erste verfügbare Nummer ab 2 finden
    let nextOctet = 2;
    for (const usedOctet of usedLastOctets) {
      if (usedOctet === nextOctet) {
        nextOctet++;
      } else if (usedOctet > nextOctet) {
        // Wir haben eine Lücke gefunden
        break;
      }
    }
    
    return ipBase + nextOctet;
  } catch (error) {
    console.error('Fehler beim Finden der nächsten IP-Adresse:', error);
    // Fallback: Zufällige IP, falls ein Fehler auftritt
    const randomOctet = Math.floor(Math.random() * 253) + 2; // Werte von 2 bis 254
    return (isAdmin ? '10.10.10.' : '10.10.11.') + randomOctet;
  }
}

// API-Endpunkt zum Anlegen eines neuen Wireguard-Clients
app.post('/api/clients/create', (req, res) => {
  try {
    const { name, isAdmin } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Client-Name fehlt' });
    }
    
    // Bestimme den Zielordner basierend auf isAdmin
    const clientType = isAdmin ? 'admin' : 'client';
    const clientDir = path.join(WIREGUARD_DIR, clientType, name);
    
    // Überprüfen, ob der Ordner bereits existiert
    if (fs.existsSync(clientDir)) {
      return res.status(400).json({ error: `Client mit dem Namen '${name}' existiert bereits` });
    }
    
    // Erstelle Ordner, falls sie nicht existieren
    fs.mkdirSync(path.join(WIREGUARD_DIR, clientType), { recursive: true });
    fs.mkdirSync(clientDir, { recursive: true });
    
    // Finde die nächste verfügbare IP-Adresse
    const clientIP = findNextAvailableIp(isAdmin);
    
    // Generiere die Schlüssel für den Client mit den WireGuard-Tools
    // Führe diese Operationen synchron aus, da wir die Ergebnisse sofort benötigen
    let privateKey, publicKey, presharedKey;
    
    try {
      // Private Key generieren
      privateKey = execSync('wg genkey').toString().trim();
      
      // Public Key aus Private Key ableiten
      publicKey = execSync(`echo "${privateKey}" | wg pubkey`).toString().trim();
      
      // Preshared Key generieren
      presharedKey = execSync('wg genpsk').toString().trim();
    } catch (error) {
      console.error('Fehler bei der Generierung der WireGuard-Keys:', error);
      // Fallback zu Dummy-Keys, falls die WireGuard-Tools nicht verfügbar sind
      privateKey = `privatekey-${Math.random().toString(36).substring(2, 15)}=`;
      publicKey = `publickey-${Math.random().toString(36).substring(2, 15)}=`;
      presharedKey = `presharedkey-${Math.random().toString(36).substring(2, 15)}=`;
      console.warn('Verwende Dummy-Keys, da WireGuard-Tools nicht verfügbar sind.');
    }
    
    // Server-Public-Key aus der Konfiguration holen oder den Beispiel-Key verwenden
    let serverPublicKey = 'AiZFodn+Rp9FHO4i2VoYitlqpMdoXsILQyP6zrr0yw8=';
    const serverEndpoint = 'vpn.laengle.pro:51133';
    
    // Erstelle die Client-Konfigurationsdatei
    const clientConfig = `[Interface]
PrivateKey = ${privateKey}
Address = ${clientIP}/24
DNS = 1.1.1.1
ListenPort = 51133

[Peer]
PublicKey = ${serverPublicKey}
PresharedKey = ${presharedKey}
Endpoint = ${serverEndpoint}
AllowedIPs = ${isAdmin ? '10.10.10.0/24, 10.10.11.0/24' : '10.10.11.0/24, 10.10.10.0/24'}
PersistentKeepalive = 25
`;
    
    // Speichere die Client-Konfiguration
    fs.writeFileSync(path.join(clientDir, 'client.conf'), clientConfig);
    
    // Speichere die Schlüssel in separaten Dateien
    fs.writeFileSync(path.join(clientDir, 'private_key'), privateKey);
    fs.writeFileSync(path.join(clientDir, 'public_key'), publicKey);
    fs.writeFileSync(path.join(clientDir, 'preshared_key'), presharedKey);
    
    // Füge den Client zur WireGuard-Konfigurationsdatei hinzu
    const peerSection = `
# ${name}
[Peer]
PublicKey = ${publicKey}
PresharedKey = ${presharedKey}
AllowedIPs = ${clientIP}/32
`;
    
    fs.appendFileSync(CONFIG_PATH, peerSection);
    
    // Aktualisiere den Client-Status
    clientsStatus[clientIP] = {
      status: 'offline',
      lastSeen: new Date().toISOString()
    };
    
    // Returniere den neu erstellten Client
    const newClient = {
      id: Object.keys(clientsStatus).length,
      name,
      ip: clientIP,
      publicKey,
      lastSeen: new Date().toISOString(),
      isAdmin,
      status: 'offline'
    };
    
    res.status(201).json(newClient);
  } catch (error) {
    console.error('Fehler beim Erstellen des Clients:', error);
    res.status(500).json({ error: error.message });
  }
});

// API-Endpunkt zum Herunterladen der Client-Konfiguration
app.get('/api/clients/:clientName/config', (req, res) => {
  try {
    const { clientName } = req.params;
    const { isAdmin } = req.query;
    
    if (!clientName) {
      return res.status(400).json({ error: 'Client-Name fehlt' });
    }
    
    // Bestimme den Pfad zur Konfigurationsdatei
    const clientType = isAdmin === 'true' ? 'admin' : 'client';
    const configPath = path.join(WIREGUARD_DIR, clientType, clientName, 'client.conf');
    
    // Überprüfen, ob die Datei existiert
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: `Konfigurationsdatei für Client '${clientName}' nicht gefunden` });
    }
    
    // Datei zum Download senden
    res.download(configPath);
  } catch (error) {
    console.error('Fehler beim Herunterladen der Konfiguration:', error);
    res.status(500).json({ error: error.message });
  }
});

// API-Endpunkt zum Löschen eines Wireguard-Clients
app.delete('/api/clients/:clientName', (req, res) => {
  try {
    const { clientName } = req.params;
    const { isAdmin } = req.query;
    
    if (!clientName) {
      return res.status(400).json({ error: 'Client-Name fehlt' });
    }
    
    // Bestimme den Pfad zum Client-Ordner
    const clientType = isAdmin === 'true' ? 'admin' : 'client';
    const clientDir = path.join(WIREGUARD_DIR, clientType, clientName);
    
    // Überprüfen, ob der Client-Ordner existiert
    if (!fs.existsSync(clientDir)) {
      return res.status(404).json({ error: `Client '${clientName}' nicht gefunden` });
    }
    
    // Lese die aktuelle wg0.conf
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    
    // Finde und entferne den Client-Abschnitt aus der Konfigurationsdatei
    // Der Abschnitt beginnt mit "# ClientName" und endet vor dem nächsten Peer oder Ende der Datei
    const clientPattern = new RegExp(`\\n# ${clientName}\\n\\[Peer\\][\\s\\S]*?(?=\\n# |$)`, 'g');
    const newConfigContent = configContent.replace(clientPattern, '');
    
    // Speichere die aktualisierte Konfigurationsdatei
    fs.writeFileSync(CONFIG_PATH, newConfigContent);
    
    // Lösche den Client-Ordner rekursiv
    fs.rmdirSync(clientDir, { recursive: true });
    
    // IP-Adresse des gelöschten Clients aus dem Status entfernen
    const clientIP = Object.keys(clientsStatus).find(ip => {
      const type = ip.startsWith('10.10.10.') ? 'admin' : 'client';
      return type === clientType;
    });
    
    if (clientIP) {
      delete clientsStatus[clientIP];
    }
    
    res.status(200).json({ message: `Client '${clientName}' wurde erfolgreich gelöscht` });
  } catch (error) {
    console.error('Fehler beim Löschen des Clients:', error);
    res.status(500).json({ error: error.message });
  }
});

// Regelmäßige Aktualisierung des Client-Status (alle 60 Sekunden)
setInterval(updateClientsStatus, 60000);

// Initiale Aktualisierung des Client-Status beim Serverstart
updateClientsStatus();

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`WireGuard-Konfigurationsdatei: ${CONFIG_PATH}`);
  console.log(`WireGuard-Verzeichnis: ${WIREGUARD_DIR}`);
  
  // Stelle sicher, dass die Verzeichnisstruktur existiert
  try {
    if (!fs.existsSync(WIREGUARD_DIR)) {
      fs.mkdirSync(WIREGUARD_DIR, { recursive: true });
      console.log(`Verzeichnis ${WIREGUARD_DIR} wurde erstellt.`);
    }
    
    const adminDir = path.join(WIREGUARD_DIR, 'admin');
    if (!fs.existsSync(adminDir)) {
      fs.mkdirSync(adminDir, { recursive: true });
      console.log(`Verzeichnis ${adminDir} wurde erstellt.`);
    }
    
    const clientDir = path.join(WIREGUARD_DIR, 'client');
    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
      console.log(`Verzeichnis ${clientDir} wurde erstellt.`);
    }
  } catch (error) {
    console.error('Fehler beim Erstellen der Verzeichnisstruktur:', error);
  }
}); 