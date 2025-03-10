// Beispieldaten für Wireguard-Clients
export const clients = [
  // Admin-Clients
  {
    id: 1,
    name: 'Admin-Laptop',
    ip: '10.0.0.2',
    publicKey: 'abcdefghijklmnopqrstuvwxyz123456789ABCDEFG=',
    lastSeen: '2023-09-15T14:30:00',
    isAdmin: true,
    status: 'online'
  },
  {
    id: 2,
    name: 'Admin-Smartphone',
    ip: '10.0.0.3',
    publicKey: 'HIJKLMNOPQRSTUVWXYZ123456789ABCDEFGabcde=',
    lastSeen: '2023-09-15T13:45:00',
    isAdmin: true,
    status: 'online'
  },
  {
    id: 3,
    name: 'Admin-Backup',
    ip: '10.0.0.4',
    publicKey: 'XYZ123456789ABCDEFGabcdefghijklmnopqrst=',
    lastSeen: '2023-09-14T09:20:00',
    isAdmin: true,
    status: 'offline'
  },
  
  // Normale Clients
  {
    id: 4,
    name: 'Mitarbeiter-1',
    ip: '10.0.0.5',
    publicKey: '123456789ABCDEFGabcdefghijklmnopqrstuvwx=',
    lastSeen: '2023-09-15T14:25:00',
    isAdmin: false,
    status: 'online'
  },
  {
    id: 5,
    name: 'Mitarbeiter-2',
    ip: '10.0.0.6',
    publicKey: '789ABCDEFGabcdefghijklmnopqrstuvwx123456=',
    lastSeen: '2023-09-15T11:10:00',
    isAdmin: false,
    status: 'online'
  },
  {
    id: 6,
    name: 'Mitarbeiter-3',
    ip: '10.0.0.7',
    publicKey: 'EFGabcdefghijklmnopqrstuvwx123456789ABCD=',
    lastSeen: '2023-09-13T16:40:00',
    isAdmin: false,
    status: 'offline'
  },
  {
    id: 7,
    name: 'Gast-1',
    ip: '10.0.0.8',
    publicKey: 'defghijklmnopqrstuvwx123456789ABCDEFGabc=',
    lastSeen: '2023-09-15T09:15:00',
    isAdmin: false,
    status: 'online'
  },
  {
    id: 8,
    name: 'Gast-2',
    ip: '10.0.0.9',
    publicKey: 'pqrstuvwx123456789ABCDEFGabcdefghijklmno=',
    lastSeen: '2023-09-14T13:50:00',
    isAdmin: false,
    status: 'offline'
  }
]; 