#!/bin/bash

# Configuration des ports
PORT_BACKEND=4000
PORT_BACKOFFICE=5173

# Dossiers des projets
BACKEND_DIR="/Users/fabrice/remindai-workspace/remindai-backend"
BACKOFFICE_DIR="/Users/fabrice/remindai-workspace/remindai-erp"
MOBILE_DIR="/Users/fabrice/Downloads/RemindAI-main"

echo "=== RemindAI Back-office - Démarrage ==="
echo ""

# 1. Libérer les ports
echo "🧹 Nettoyage des anciens serveurs..."
PID_BACKEND=$(lsof -t -i:$PORT_BACKEND)
if [ ! -z "$PID_BACKEND" ]; then
  echo "  -> Fermeture du backend (PID: $PID_BACKEND) sur le port $PORT_BACKEND"
  kill -9 $PID_BACKEND 2>/dev/null
fi

PID_BACKOFFICE=$(lsof -t -i:$PORT_BACKOFFICE)
if [ ! -z "$PID_BACKOFFICE" ]; then
  echo "  -> Fermeture du back-office (PID: $PID_BACKOFFICE) sur le port $PORT_BACKOFFICE"
  kill -9 $PID_BACKOFFICE 2>/dev/null
fi

sleep 1

# 2. Démarrer le Backend
echo "🚀 Démarrage du backend en arrière-plan..."
cd "$BACKEND_DIR" || exit
npm run dev > "$MOBILE_DIR/backend.log" 2>&1 &
echo "  -> Backend lancé ! (Les logs sont écrits dans $MOBILE_DIR/backend.log)"

sleep 2

# 3. Démarrer le Back-office
echo "🖥️  Démarrage du back-office..."
echo "  -> Ouvre http://localhost:5173 dans ton navigateur"
echo "  -> Compte admin : alonso.clement08@gmail.com"
echo ""
cd "$BACKOFFICE_DIR" || exit
npm run dev
