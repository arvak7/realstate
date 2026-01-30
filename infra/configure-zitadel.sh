#!/bin/bash
set -e

echo "🔐 Configurant Zitadel per Real Estate POC..."

# Esperar que Zitadel estigui completament inicialitzat
echo "⏳ Esperant que Zitadel estigui llest..."
sleep 5

# Credencials d'admin
ADMIN_USER="admin"
ADMIN_PASSWORD="Admin123!"
ZITADEL_URL="http://localhost:8080"

echo "📝 Instruccions per configurar Zitadel manualment:"
echo ""
echo "1. Obre el navegador a: ${ZITADEL_URL}"
echo "2. Inicia sessió amb:"
echo "   - Username: ${ADMIN_USER}"
echo "   - Password: ${ADMIN_PASSWORD}"
echo ""
echo "3. Crea una nova aplicació:"
echo "   - Ves a: Organization > Projects > Create New Project"
echo "   - Nom del projecte: 'RealEstate POC'"
echo ""
echo "4. Afegeix una aplicació al projecte:"
echo "   - Type: WEB"
echo "   - Name: 'RealEstate Web'"
echo "   - Authentication Method: CODE"
echo "   - Redirect URIs:"
echo "     * http://localhost:3000/api/auth/callback/zitadel"
echo "   - Post Logout URIs:"
echo "     * http://localhost:3000"
echo "   - Dev Mode: ENABLED (per localhost)"
echo ""
echo "5. Copia el CLIENT_ID i CLIENT_SECRET generat"
echo ""
echo "6. Actualitza /home/manel/dev/realState/web/.env.local amb:"
echo "   ZITADEL_CLIENT_ID=<el_teu_client_id>"
echo "   ZITADEL_CLIENT_SECRET=<el_teu_client_secret>"
echo ""
echo "7. Reinicia el servidor web: npm run dev"
echo ""
echo "✅ Zitadel està funcionant a: ${ZITADEL_URL}"
