#!/bin/bash
set -e

echo "🔐 Generant certificats SSL autofirmats per localhost..."

# Crear directori per certificats
mkdir -p certs
cd certs

# Generar clau privada
echo "🔑 Generant clau privada..."
openssl genrsa -out localhost-key.pem 2048

# Generar certificat autofirmat
echo "📜 Generant certificat SSL..."
openssl req -new -x509 -sha256 \
  -key localhost-key.pem \
  -out localhost.pem \
  -days 365 \
  -subj "/C=ES/ST=Barcelona/L=Barcelona/O=RealEstate POC/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:::1"

# Crear .gitignore
cat > .gitignore << EOF
*.pem
*.key
*.crt
EOF

echo ""
echo "✅ Certificats generats correctament!"
echo ""
echo "📁 Fitxers creats:"
ls -lh *.pem
echo ""
echo "⚠️  NOTA: Aquests són certificats autofirmats."
echo "   El navegador mostrarà una advertència que hauràs d'acceptar."
echo ""
echo "🎯 Pròxims passos:"
echo "  1. Configurar Caddy com a reverse proxy"
echo "  2. Actualitzar variables d'entorn"
echo "  3. Reiniciar serveis"
