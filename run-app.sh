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

# Fermer les tunnels ngrok existants (port admin 4040)
pkill -f ngrok 2>/dev/null || true
PID_NGROK=$(lsof -t -i:4040 2>/dev/null)
if [ ! -z "$PID_NGROK" ]; then
  echo "  -> Fermeture du tunnel ngrok (PID: $PID_NGROK)"
  kill -9 $PID_NGROK 2>/dev/null
fi

# Petite pause pour s'assurer que les ports sont libérés
sleep 1

# 2. Démarrer le Backend
echo "🚀 Démarrage du backend en arrière-plan..."
cd "$BACKEND_DIR" || exit
npm run dev > "$MOBILE_DIR/backend.log" 2>&1 &
echo "  -> Backend lancé ! (Les logs sont écrits dans $MOBILE_DIR/backend.log)"

# Attendre que le backend réponde avant de le tunneler
for i in $(seq 1 20); do
  sleep 1
  curl -s -o /dev/null http://localhost:$PORT_BACKEND/api/health && break
done

# 2bis. Tunneler le backend (nécessaire si le téléphone n'est pas sur le même réseau)
bash "$MOBILE_DIR/tunnel-backend.sh"

# 3. Démarrer Expo avec le tunnel
echo "📱 Démarrage d'Expo avec tunnel..."
cd "$MOBILE_DIR" || exit
npx expo start --tunnel --clear
