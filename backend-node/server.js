const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS aktivieren
app.use(cors());

// Konfigurationspfad für die WireGuard-Konfigurationsdatei
const CONFIG_PATH = process.env.WIREGUARD_CONFIG_PATH || '../etc/wireguard/wg0.conf';

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

// Regelmäßige Aktualisierung des Client-Status (alle 60 Sekunden)
setInterval(updateClientsStatus, 60000);

// Initiale Aktualisierung des Client-Status beim Serverstart
updateClientsStatus();

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`WireGuard-Konfigurationsdatei: ${CONFIG_PATH}`);
}); 