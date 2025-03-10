#!/bin/bash

# Lade Umgebungsvariablen aus .env-Datei
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Starte das Backend
echo "Starte das Backend..."
cd backend-node
npm start &
BACKEND_PID=$!
cd ..

# Warte kurz, damit das Backend starten kann
sleep 2

# Starte das Frontend mit explizitem Port 3000
echo "Starte das Frontend auf Port 3000..."
PORT=3000 npm start &
FRONTEND_PID=$!

# Funktion zum Beenden der Prozesse
cleanup() {
    echo "Beende Prozesse..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Fange SIGINT (Ctrl+C) ab
trap cleanup SIGINT

# Warte auf Benutzerabbruch
echo "Drücke Ctrl+C, um beide Prozesse zu beenden"
wait 