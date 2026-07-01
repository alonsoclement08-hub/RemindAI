#!/bin/bash

# Configuration des ports
PORT_BACKEND=4000
PORT_ERP=5173

# Dossiers des projets
BACKEND_DIR="/Users/fabrice/remindai-workspace/remindai-backend"
ERP_DIR="/Users/fabrice/remindai-workspace/remindai-erp"
MOBILE_DIR="/Users/fabrice/Downloads/RemindAI-main"

echo "=== RemindAI ERP - Démarrage ==="
echo ""

# 1. Libérer les ports
echo "🧹 Nettoyage des anciens serveurs..."
PID_BACKEND=$(lsof -t -i:$PORT_BACKEND)
if [ ! -z "$PID_BACKEND" ]; then
  echo "  -> Fermeture du backend (PID: $PID_BACKEND) sur le port $PORT_BACKEND"
  kill -9 $PID_BACKEND 2>/dev/null
fi

PID_ERP=$(lsof -t -i:$PORT_ERP)
if [ ! -z "$PID_ERP" ]; then
  echo "  -> Fermeture de l'ERP (PID: $PID_ERP) sur le port $PORT_ERP"
  kill -9 $PID_ERP 2>/dev/null
fi

# Petite pause pour s'assurer que les ports sont libérés
sleep 1

# 2. Démarrer le Backend
echo "🚀 Démarrage du backend en arrière-plan..."
cd "$BACKEND_DIR" || exit
npm run dev > "$MOBILE_DIR/backend.log" 2>&1 &
echo "  -> Backend lancé ! (Les logs sont écrits dans $MOBILE_DIR/backend.log)"

sleep 2

# 3. Démarrer l'ERP
echo "🖥️  Démarrage de l'ERP..."
echo "  -> Ouvre http://localhost:5173 dans ton navigateur"
echo "  -> Compte admin : alonso.clement08@gmail.com"
echo ""
cd "$ERP_DIR" || exit
npm run dev
