#!/bin/bash
# Tunnelle le backend (port 4000) via ngrok et met à jour EXPO_PUBLIC_API_URL
# dans .env.local avec l'URL publique obtenue. Nécessaire quand le téléphone
# n'est pas sur le même réseau que le Mac (wifi public, isolation client, etc).

ENV_FILE="/Users/fabrice/Downloads/RemindAI-main/.env.local"
LOG_FILE="/tmp/ngrok-backend.log"
PID_FILE="/tmp/ngrok-backend.pid"

# Nettoyage d'un éventuel tunnel précédent
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  kill -9 "$OLD_PID" 2>/dev/null
fi
pkill -f "ngrok http 4000" 2>/dev/null
sleep 1
rm -f "$LOG_FILE"

echo "🌐 Démarrage du tunnel backend (port 4000)..."
ngrok http 4000 --log=stdout > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

# Récupère le port de l'API d'admin ngrok (4040 si libre, sinon un autre)
WEB_PORT=""
for i in $(seq 1 20); do
  sleep 1
  WEB_PORT=$(grep -o 'obj=web addr=127\.0\.0\.1:[0-9]*' "$LOG_FILE" | tail -1 | grep -o '[0-9]*$')
  if [ -n "$WEB_PORT" ]; then break; fi
done

if [ -z "$WEB_PORT" ]; then
  echo "❌ Impossible de démarrer le tunnel backend (ngrok n'a pas répondu)"
  cat "$LOG_FILE"
  exit 1
fi

# Récupère l'URL publique depuis l'API locale de cet agent ngrok
URL=""
for i in $(seq 1 20); do
  sleep 1
  URL=$(curl -s "http://localhost:$WEB_PORT/api/tunnels" 2>/dev/null \
    | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{const j=JSON.parse(d);console.log(j.tunnels[0]?.public_url||"")}catch(e){console.log("")}})')
  if [ -n "$URL" ]; then break; fi
done

if [ -z "$URL" ]; then
  echo "❌ Impossible de récupérer l'URL du tunnel backend"
  exit 1
fi

echo "✅ Backend accessible via : $URL"

# Met à jour EXPO_PUBLIC_API_URL dans .env.local
if grep -q "^EXPO_PUBLIC_API_URL=" "$ENV_FILE"; then
  sed -i '' "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$URL/api|" "$ENV_FILE"
else
  echo "EXPO_PUBLIC_API_URL=$URL/api" >> "$ENV_FILE"
fi

echo "📝 .env.local mis à jour"
