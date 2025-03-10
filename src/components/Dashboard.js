import React, { useState, useEffect, useRef } from 'react';
// import { clients } from '../data/mockData';
import AddClientModal from './AddClientModal';
import { 
  PlusIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  UserIcon, 
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [clientList, setClientList] = useState({ adminClients: [], normalClients: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminExpanded, setAdminExpanded] = useState(true);
  const [normalExpanded, setNormalExpanded] = useState(true);
  const [refreshAnimation, setRefreshAnimation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const dashboardRef = useRef(null);

  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5001/api/clients');
      if (!response.ok) {
        throw new Error(`HTTP-Fehler: ${response.status}`);
      }
      const data = await response.json();
      setClientList(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Fehler beim Laden der Clients:', err);
      setError('Fehler beim Laden der Clients. Bitte versuche es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  // Funktion zum manuellen Pingen der Clients
  const pingClients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5001/api/clients/ping', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP-Fehler: ${response.status}`);
      }
      const data = await response.json();
      setClientList(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Fehler beim Pingen der Clients:', err);
      setError('Fehler beim Pingen der Clients. Bitte versuche es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();

    // Regelmäßiges Abrufen der Clients (alle 60 Sekunden)
    const intervalId = setInterval(() => {
      fetchClients();
    }, 60000);

    // Aufräumen beim Unmount der Komponente
    return () => clearInterval(intervalId);
  }, []);

  // Event-Handler für Klicks außerhalb des Client-Detailfensters
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectedClient && dashboardRef.current && !dashboardRef.current.contains(event.target)) {
        setSelectedClient(null);
      }
    }

    // Event-Listener hinzufügen
    document.addEventListener('mousedown', handleClickOutside);
    
    // Event-Listener entfernen beim Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedClient]);

  const filteredAdminClients = clientList.adminClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.ip.includes(searchTerm)
  );

  const filteredNormalClients = clientList.normalClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.ip.includes(searchTerm)
  );

  const handleAddClient = (newClient) => {
    const id = clientList.adminClients.length + clientList.normalClients.length + 1;
    const now = new Date().toISOString();
    const ip = `10.0.0.${id + 1}`;
    const publicKey = `key-${id}-${Math.random().toString(36).substring(2, 10)}=`;
    
    const client = {
      id,
      name: newClient.name,
      ip,
      publicKey,
      lastSeen: now,
      isAdmin: newClient.isAdmin,
      status: 'online'
    };
    
    setClientList({
      adminClients: [...clientList.adminClients, client],
      normalClients: client.isAdmin ? clientList.normalClients : [...clientList.normalClients, client]
    });
    setSelectedClient(client);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleRefresh = () => {
    setRefreshAnimation(true);
    pingClients().then(() => {
      setTimeout(() => {
        setRefreshAnimation(false);
      }, 1000);
    });
  };

  useEffect(() => {
    if (selectedClient && !filteredAdminClients.some(client => client.id === selectedClient.id) && !filteredNormalClients.some(client => client.id === selectedClient.id)) {
      setSelectedClient(null);
    }
  }, [searchTerm, filteredAdminClients, filteredNormalClients, selectedClient]);

  // Funktion zum Berechnen der Zeit seit dem letzten Sehen
  const getTimeSinceLastSeen = (lastSeenDate) => {
    const now = new Date();
    const lastSeen = new Date(lastSeenDate);
    const diffInSeconds = Math.floor((now - lastSeen) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} Sekunden`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} Minuten`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} Stunden`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} Tagen`;
    }
  };

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {/* Suchleiste und Aktionsschaltflächen */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Suche nach Client oder IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${refreshAnimation ? 'opacity-75' : ''}`}
            onClick={handleRefresh}
          >
            <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${refreshAnimation ? 'animate-spin' : ''}`} aria-hidden="true" />
            Aktualisieren
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => setIsModalOpen(true)}
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Client hinzufügen
          </button>
        </div>
      </div>

      {/* Letzte Aktualisierung */}
      <div className="text-sm text-gray-500 text-right">
        Letzte Aktualisierung: {formatDate(lastRefresh)}
      </div>

      {/* Fehlermeldung anzeigen, falls vorhanden */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Ladeanzeige */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* Client-Listen nur anzeigen, wenn nicht geladen wird */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Admin Clients */}
          <div>
            <div 
              className="flex items-center justify-between bg-gradient-to-r from-primary-50 to-white p-3 rounded-t-lg border border-primary-100 cursor-pointer"
              onClick={() => setAdminExpanded(!adminExpanded)}
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="bg-primary-100 text-primary-800 p-1 rounded mr-2">
                  <UserIcon className="h-5 w-5" />
                </span>
                Admin Clients
                <span className="ml-2 bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {filteredAdminClients.length}
                </span>
              </h3>
              {adminExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-primary-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-primary-500" />
              )}
            </div>
            {adminExpanded && (
              <ul className="divide-y divide-gray-200 bg-white shadow-md rounded-b-lg border-x border-b border-primary-100 transition-all duration-300 ease-in-out">
                {filteredAdminClients.length > 0 ? (
                  filteredAdminClients.map((client) => (
                    <li 
                      key={client.id}
                      className={`px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                        selectedClient?.id === client.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                      }`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.ip}</div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            client.status === 'online' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {client.status === 'online' ? 'Online' : 'Offline seit ' + getTimeSinceLastSeen(client.lastSeen)}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-8 text-center text-gray-500">
                    Keine Admin-Clients gefunden
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Normale Clients */}
          <div>
            <div 
              className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white p-3 rounded-t-lg border border-gray-200 cursor-pointer"
              onClick={() => setNormalExpanded(!normalExpanded)}
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="bg-gray-100 text-gray-800 p-1 rounded mr-2">
                  <UserIcon className="h-5 w-5" />
                </span>
                Normale Clients
                <span className="ml-2 bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {filteredNormalClients.length}
                </span>
              </h3>
              {normalExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </div>
            {normalExpanded && (
              <ul className="divide-y divide-gray-200 bg-white shadow-md rounded-b-lg border-x border-b border-gray-200 transition-all duration-300 ease-in-out">
                {filteredNormalClients.length > 0 ? (
                  filteredNormalClients.map((client) => (
                    <li 
                      key={client.id}
                      className={`px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                        selectedClient?.id === client.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                      }`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.ip}</div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            client.status === 'online' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {client.status === 'online' ? 'Online' : 'Offline seit ' + getTimeSinceLastSeen(client.lastSeen)}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-8 text-center text-gray-500">
                    Keine normalen Clients gefunden
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Client-Details */}
      {selectedClient && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
            <div className="flex items-center">
              <div>
                <h3 className="text-xl font-bold">{selectedClient.name}</h3>
                <p className="text-primary-100">{selectedClient.ip}</p>
              </div>
              <span className={`ml-auto inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                selectedClient.isAdmin 
                  ? 'bg-white text-primary-800' 
                  : 'bg-primary-800 text-white'
              }`}>
                {selectedClient.isAdmin ? 'Admin' : 'Normal'}
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-100 p-2 rounded">
                <ClockIcon className="h-5 w-5 text-gray-500" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-500">Zuletzt gesehen</h4>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedClient.lastSeen)}</p>
                {selectedClient.status === 'offline' && (
                  <p className="text-xs text-red-600">Offline seit {getTimeSinceLastSeen(selectedClient.lastSeen)}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-100 p-2 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className={`mt-1 text-sm font-medium ${
                  selectedClient.status === 'online' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedClient.status === 'online' ? 'Verbunden' : 'Nicht verbunden'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Konfiguration
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Entfernen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal zum Hinzufügen eines Clients */}
      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddClient={handleAddClient}
      />
    </div>
  );
} 