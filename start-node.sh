#!/bin/bash

# Starte das Backend
echo "Starte das Backend..."
cd backend-node
npm start &
BACKEND_PID=$!
cd ..

# Warte kurz, damit das Backend starten kann
sleep 2

# Starte das Frontend
echo "Starte das Frontend..."
npm start &
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