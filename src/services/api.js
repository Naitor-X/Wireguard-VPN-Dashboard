// API-Basis-URL
const API_BASE_URL = 'http://localhost:5001/api';

// Download der Client-Konfiguration
export async function downloadClientConfig(clientName, isAdmin) {
  try {
    const response = await fetch(`${API_BASE_URL}/clients/${clientName}/config?isAdmin=${isAdmin}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Herunterladen der Konfiguration');
    }
    
    // Blob erstellen und Download starten
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientName}.conf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Download-Fehler:', error);
    return false;
  }
}

// Client löschen
export async function deleteClient(clientName, isAdmin) {
  try {
    const response = await fetch(`${API_BASE_URL}/clients/${clientName}?isAdmin=${isAdmin}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Fehler beim Löschen des Clients');
    }
    
    return true;
  } catch (error) {
    console.error('Fehler beim Löschen des Clients:', error);
    throw error;
  }
} 