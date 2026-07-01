#!/bin/bash

# Configuration des ports
PORT_BACKEND=4000
PORT_EXPO=8081

# Dossiers des projets
BACKEND_DIR="/Users/fabrice/remindai-workspace/remindai-backend"
MOBILE_DIR="/Users/fabrice/Downloads/RemindAI-main"

echo "=== RemindAI - Démarrage du projet ==="
echo ""

# 1. Libérer les ports
echo "🧹 Nettoyage des anciens serveurs..."
PID_BACKEND=$(lsof -t -i:$PORT_BACKEND)
if [ ! -z "$PID_BACKEND" ]; then
  echo "  -> Fermeture du backend (PID: $PID_BACKEND) sur le port $PORT_BACKEND"
  kill -9 $PID_BACKEND 2>/dev/null
fi

PID_EXPO=$(lsof -t -i:$PORT_EXPO)
if [ ! -z "$PID_EXPO" ]; then
  echo "  -> Fermeture d'Expo/Metro (PID: $PID_EXPO) sur le port $PORT_EXPO"
  kill -9 $PID_EXPO 2>/dev/null
fi

# Petite pause pour s'assurer que les ports sont libérés
sleep 1

# 2. Démarrer le Backend
echo "🚀 Démarrage du backend en arrière-plan..."
cd "$BACKEND_DIR" || exit
npm run dev > "$MOBILE_DIR/backend.log" 2>&1 &
echo "  -> Backend lancé ! (Les logs sont écrits dans $MOBILE_DIR/backend.log)"

# 3. Démarrer Expo avec le tunnel
echo "📱 Démarrage d'Expo avec tunnel..."
cd "$MOBILE_DIR" || exit
npx expo start --tunnel
