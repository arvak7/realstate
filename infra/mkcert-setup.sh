#!/bin/bash
set -e

echo "🔐 Configurant HTTPS per localhost amb mkcert..."

# Verificar si mkcert està instal·lat
if ! command -v mkcert &> /dev/null; then
    echo "📦 Instal·lant mkcert..."
    
    # Detectar sistema operatiu
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            # Debian/Ubuntu
            sudo apt-get update
            sudo apt-get install -y libnss3-tools
            curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
            chmod +x mkcert-v*-linux-amd64
            sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
        elif command -v yum &> /dev/null; then
            # RedHat/CentOS
            sudo yum install -y nss-tools
            curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
            chmod +x mkcert-v*-linux-amd64
            sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install mkcert
    fi
else
    echo "✅ mkcert ja està instal·lat"
fi

# Crear directori per certificats
mkdir -p certs
cd certs

# Instal·lar CA local
echo "🔑 Instal·lant CA local..."
mkcert -install

# Generar certificats per localhost
echo "📜 Generant certificats per localhost..."
mkcert localhost 127.0.0.1 ::1

# Renombrar fitxers per consistència
mv localhost+2.pem localhost.pem 2>/dev/null || true
mv localhost+2-key.pem localhost-key.pem 2>/dev/null || true

# Instal·lar CA a Firefox (si existeix)
CAROOT=$(mkcert -CAROOT)
FIREFOX_DB=$(find "$HOME" /home -name "cert9.db" -path "*firefox*" 2>/dev/null | head -1)
if [ -n "$FIREFOX_DB" ]; then
    FIREFOX_DIR=$(dirname "$FIREFOX_DB")
    echo "🦊 Instal·lant CA a Firefox ($FIREFOX_DIR)..."
    certutil -A -n "mkcert" -t "TC,," -i "$CAROOT/rootCA.pem" -d "sql:$FIREFOX_DIR" 2>/dev/null && \
        echo "✅ CA instal·lada a Firefox" || \
        echo "⚠️  No s'ha pogut instal·lar la CA a Firefox. Fes-ho manualment."
else
    echo "⚠️  No s'ha trobat perfil Firefox. Si uses Firefox, instal·la la CA manualment:"
    echo "   certutil -A -n mkcert -t TC,, -i $CAROOT/rootCA.pem -d sql:<firefox-profile-dir>"
fi

echo ""
echo "✅ Certificats generats correctament!"
echo ""
echo "📁 Fitxers creats:"
ls -lh localhost*.pem
echo ""
echo "🎯 Pròxims passos:"
echo "  1. Reiniciar Caddy: cd .. && docker compose restart caddy"
echo "  2. Obrir https://localhost - ha de mostrar candau verd"
