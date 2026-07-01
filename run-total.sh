#!/bin/bash

# Configuration des ports
PORT_BACKEND=4000
PORT_EXPO=8081
PORT_ERP=5173

# Dossiers des projets
BACKEND_DIR="/Users/fabrice/remindai-workspace/remindai-backend"
MOBILE_DIR="/Users/fabrice/Downloads/RemindAI-main"
ERP_DIR="/Users/fabrice/remindai-workspace/remindai-erp"

echo "=== RemindAI - Démarrage complet (App + ERP) ==="
echo ""

# 1. Libérer les ports
echo "🧹 Nettoyage des anciens serveurs..."
for PORT in $PORT_BACKEND $PORT_EXPO $PORT_ERP; do
  PID=$(lsof -t -i:$PORT 2>/dev/null)
  if [ ! -z "$PID" ]; then
    echo "  -> Fermeture du port $PORT (PID: $PID)"
    kill -9 $PID 2>/dev/null
  fi
done

pkill -f ngrok 2>/dev/null || true
PID_NGROK=$(lsof -t -i:4040 2>/dev/null)
if [ ! -z "$PID_NGROK" ]; then
  echo "  -> Fermeture du tunnel ngrok (PID: $PID_NGROK)"
  kill -9 $PID_NGROK 2>/dev/null
fi

sleep 1

# 2. Démarrer le Backend (partagé entre l'app et l'ERP)
echo "🚀 Démarrage du backend en arrière-plan..."
cd "$BACKEND_DIR" || exit
npm run dev > "$MOBILE_DIR/backend.log" 2>&1 &
echo "  -> Backend lancé ! (logs: $MOBILE_DIR/backend.log)"

# Attendre que le backend réponde avant de le tunneler
for i in $(seq 1 20); do
  sleep 1
  curl -s -o /dev/null http://localhost:$PORT_BACKEND/api/health && break
done

# 2bis. Tunneler le backend (nécessaire si le téléphone n'est pas sur le même réseau)
bash "$MOBILE_DIR/tunnel-backend.sh"

# 3. Ouvrir un nouveau terminal pour Expo (tunnel)
echo "📱 Ouverture d'un nouveau terminal pour l'app (Expo tunnel)..."
osascript -e "tell application \"Terminal\" to do script \"cd '$MOBILE_DIR' && npx expo start --tunnel --clear\""

# 4. Ouvrir un nouveau terminal pour l'ERP
echo "🖥️  Ouverture d'un nouveau terminal pour l'ERP..."
osascript -e "tell application \"Terminal\" to do script \"cd '$ERP_DIR' && npm run dev\""

echo ""
echo "✅ Tout est lancé !"
echo "   - Backend : http://localhost:$PORT_BACKEND"
echo "   - ERP     : http://localhost:$PORT_ERP"
echo "   - App     : scanne le QR code dans le nouveau terminal Expo"
