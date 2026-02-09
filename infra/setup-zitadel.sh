#!/bin/bash

# Automated Zitadel Configuration Script
# Configures Zitadel as identity broker via Management API (no UI needed)
# Uses the machine user PAT created at first init (see docker-compose.yml)
# Idempotent: safe to run multiple times

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ZITADEL_URL="http://localhost:8080"
CURL_OPTS="-s" # silent

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="$PROJECT_DIR/infra"
FLAG_FILE="$INFRA_DIR/.zitadel-configured"
CREDS_FILE="$INFRA_DIR/.zitadel-credentials"
PAT_FILE="$INFRA_DIR/machinekey/admin.pat"

# Output helpers
log_info() { echo -e "${BLUE}[zitadel-setup]${NC} $1"; }
log_ok() { echo -e "${GREEN}[zitadel-setup] ✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}[zitadel-setup] ⚠${NC} $1"; }
log_err() { echo -e "${RED}[zitadel-setup] ✗${NC} $1"; }

# Check if already configured (before dependency check to avoid failing needlessly)
if [ -f "$FLAG_FILE" ] && [ -f "$CREDS_FILE" ]; then
    log_ok "Zitadel already configured (flag file exists). To reconfigure, delete $FLAG_FILE"
    source "$CREDS_FILE"
    exit 0
fi

# Check dependencies (only needed for first-time setup)
for cmd in curl jq; do
    if ! command -v "$cmd" &>/dev/null; then
        log_err "Required command '$cmd' not found. Install it and retry."
        exit 1
    fi
done

# Step 1: Wait for Zitadel to be ready
log_info "Waiting for Zitadel to be ready..."
MAX_WAIT=120
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl $CURL_OPTS -o /dev/null -w "%{http_code}" "$ZITADEL_URL/debug/ready" 2>/dev/null | grep -q "200"; then
        log_ok "Zitadel is ready"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    if [ $((WAITED % 10)) -eq 0 ]; then
        log_info "Still waiting... ($WAITED/${MAX_WAIT}s)"
    fi
done

if [ $WAITED -ge $MAX_WAIT ]; then
    log_err "Zitadel not ready after ${MAX_WAIT}s. Is it running?"
    exit 1
fi

# Step 2: Read PAT from file (created by Zitadel at first init)
log_info "Reading machine user PAT..."

if [ ! -f "$PAT_FILE" ]; then
    log_err "PAT file not found at $PAT_FILE. Zitadel may need to be initialized first."
    log_err "Make sure ZITADEL_FIRSTINSTANCE_PATPATH is set in docker-compose.yml"
    exit 1
fi

PAT_TOKEN=$(cat "$PAT_FILE" | tr -d '[:space:]')

if [ -z "$PAT_TOKEN" ]; then
    log_err "PAT file is empty"
    exit 1
fi

# Verify PAT works
VERIFY=$(curl $CURL_OPTS -o /dev/null -w "%{http_code}" \
    "$ZITADEL_URL/management/v1/healthz" \
    -H "Authorization: Bearer $PAT_TOKEN")

if [ "$VERIFY" != "200" ]; then
    log_err "PAT is not valid (got HTTP $VERIFY). Zitadel may need re-initialization."
    exit 1
fi

log_ok "PAT authenticated successfully"
AUTH_HEADER="Authorization: Bearer $PAT_TOKEN"

# Step 3: Create project "RealEstate"
log_info "Creating project 'RealEstate'..."

PROJECTS_RESPONSE=$(curl $CURL_OPTS -X POST "$ZITADEL_URL/management/v1/projects/_search" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{}')

PROJECT_ID=$(echo "$PROJECTS_RESPONSE" | jq -r '.result[]? | select(.name == "RealEstate") | .id // empty')

if [ -n "$PROJECT_ID" ]; then
    log_ok "Project 'RealEstate' already exists: $PROJECT_ID"
else
    PROJECT_RESPONSE=$(curl $CURL_OPTS -X POST "$ZITADEL_URL/management/v1/projects" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d '{
            "name": "RealEstate",
            "projectRoleAssertion": false,
            "projectRoleCheck": false,
            "hasProjectCheck": false,
            "privateLabelingSetting": "PRIVATE_LABELING_SETTING_UNSPECIFIED"
        }')

    PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.id // empty')

    if [ -z "$PROJECT_ID" ]; then
        log_err "Failed to create project. Response: $PROJECT_RESPONSE"
        exit 1
    fi
    log_ok "Project created: $PROJECT_ID"
fi

# Step 4: Create OIDC application
log_info "Creating OIDC application..."

APPS_RESPONSE=$(curl $CURL_OPTS -X POST "$ZITADEL_URL/management/v1/projects/$PROJECT_ID/apps/_search" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{}')

APP_ID=$(echo "$APPS_RESPONSE" | jq -r '.result[]? | select(.name == "RealEstate Web") | .id // empty')
CLIENT_ID=""
CLIENT_SECRET=""

if [ -n "$APP_ID" ]; then
    log_ok "OIDC app 'RealEstate Web' already exists: $APP_ID"
    APP_DETAIL=$(curl $CURL_OPTS -X GET "$ZITADEL_URL/management/v1/projects/$PROJECT_ID/apps/$APP_ID" \
        -H "$AUTH_HEADER")
    CLIENT_ID=$(echo "$APP_DETAIL" | jq -r '.app.oidcConfig.clientId // empty')
    log_warn "Existing app found. Client secret cannot be retrieved. Delete app and rerun to get new credentials."
else
    APP_RESPONSE=$(curl $CURL_OPTS -X POST "$ZITADEL_URL/management/v1/projects/$PROJECT_ID/apps/oidc" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d '{
            "name": "RealEstate Web",
            "redirectUris": [
                "https://localhost/api/auth/callback/zitadel",
                "http://localhost:3000/api/auth/callback/zitadel"
            ],
            "responseTypes": ["OIDC_RESPONSE_TYPE_CODE"],
            "grantTypes": ["OIDC_GRANT_TYPE_AUTHORIZATION_CODE", "OIDC_GRANT_TYPE_REFRESH_TOKEN"],
            "appType": "OIDC_APP_TYPE_WEB",
            "authMethodType": "OIDC_AUTH_METHOD_TYPE_POST",
            "postLogoutRedirectUris": ["https://localhost", "http://localhost:3000"],
            "devMode": true,
            "accessTokenType": "OIDC_TOKEN_TYPE_JWT",
            "accessTokenRoleAssertion": true,
            "idTokenRoleAssertion": true,
            "idTokenUserinfoAssertion": true,
            "clockSkew": "5s"
        }')

    CLIENT_ID=$(echo "$APP_RESPONSE" | jq -r '.clientId // empty')
    CLIENT_SECRET=$(echo "$APP_RESPONSE" | jq -r '.clientSecret // empty')

    if [ -z "$CLIENT_ID" ]; then
        log_err "Failed to create OIDC app. Response: $APP_RESPONSE"
        exit 1
    fi
    log_ok "OIDC app created. Client ID: $CLIENT_ID"
fi

# Step 5: Add Google as external IdP
log_info "Configuring Google Identity Provider..."

WEB_ENV="$PROJECT_DIR/web/.env.local"
if [ -f "$WEB_ENV" ]; then
    GOOGLE_CLIENT_ID=$(grep '^GOOGLE_CLIENT_ID=' "$WEB_ENV" | cut -d'=' -f2- || true)
    GOOGLE_CLIENT_SECRET=$(grep '^GOOGLE_CLIENT_SECRET=' "$WEB_ENV" | cut -d'=' -f2- || true)
else
    log_warn "web/.env.local not found. Skipping Google IdP setup."
    GOOGLE_CLIENT_ID=""
    GOOGLE_CLIENT_SECRET=""
fi

GOOGLE_IDP_ID=""
if [ -n "$GOOGLE_CLIENT_ID" ] && [ -n "$GOOGLE_CLIENT_SECRET" ]; then
    IDPS_RESPONSE=$(curl $CURL_OPTS -X POST "$ZITADEL_URL/management/v1/idps/_search" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d '{}')

    GOOGLE_IDP_ID=$(echo "$IDPS_RESPONSE" | jq -r '.result[]? | select(.name == "Google") | .id // empty')

    if [ -n "$GOOGLE_IDP_ID" ]; then
        log_ok "Google IdP already configured: $GOOGLE_IDP_ID"
    else
        # Use Google-native endpoint (proper field mapping for Login V2 compatibility)
        # Note: providerOptions (isAutoCreation etc.) are NOT accepted in the POST request,
        # they must be set via a separate PUT call after creation.
        IDP_RESPONSE=$(curl $CURL_OPTS -X POST "$ZITADEL_URL/management/v1/idps/google" \
            -H "Content-Type: application/json" \
            -H "$AUTH_HEADER" \
            -d "{
                \"name\": \"Google\",
                \"clientId\": \"$GOOGLE_CLIENT_ID\",
                \"clientSecret\": \"$GOOGLE_CLIENT_SECRET\",
                \"scopes\": [\"openid\", \"profile\", \"email\"]
            }")

        GOOGLE_IDP_ID=$(echo "$IDP_RESPONSE" | jq -r '.id // .idpId // empty')

        if [ -n "$GOOGLE_IDP_ID" ]; then
            log_ok "Google IdP created: $GOOGLE_IDP_ID"

            # Set providerOptions (auto-creation, linking) via PUT
            curl $CURL_OPTS -X PUT "$ZITADEL_URL/management/v1/idps/google/$GOOGLE_IDP_ID" \
                -H "Content-Type: application/json" \
                -H "$AUTH_HEADER" \
                -d "{
                    \"name\": \"Google\",
                    \"clientId\": \"$GOOGLE_CLIENT_ID\",
                    \"clientSecret\": \"$GOOGLE_CLIENT_SECRET\",
                    \"scopes\": [\"openid\", \"profile\", \"email\"],
                    \"providerOptions\": {
                        \"isAutoCreation\": true,
                        \"isAutoUpdate\": true,
                        \"isCreationAllowed\": true,
                        \"isLinkingAllowed\": true,
                        \"isAutoLinking\": true
                    }
                }" > /dev/null 2>&1
            log_ok "Google IdP options set (auto-creation, linking)"
        else
            log_warn "Could not create Google IdP. Response: $IDP_RESPONSE"
            log_warn "Google login via Zitadel won't be available. Manual setup may be needed."
        fi
    fi

    # Step 6: Create login policy and add Google IdP
    if [ -n "$GOOGLE_IDP_ID" ]; then
        log_info "Configuring login policy with Google IdP..."

        # Set instance-level login policy (Login V2 requires allowRegister at instance level)
        curl $CURL_OPTS -X PUT "$ZITADEL_URL/admin/v1/policies/login" \
            -H "Content-Type: application/json" \
            -H "$AUTH_HEADER" \
            -d '{
                "allowUsernamePassword": true,
                "allowRegister": true,
                "allowExternalIdp": true,
                "forceMfa": false,
                "hidePasswordReset": false
            }' > /dev/null 2>&1

        # Create custom org-level login policy (required before adding IdPs)
        curl $CURL_OPTS -X POST "$ZITADEL_URL/management/v1/policies/login" \
            -H "Content-Type: application/json" \
            -H "$AUTH_HEADER" \
            -d '{
                "allowUsernamePassword": true,
                "allowRegister": true,
                "allowExternalIdp": true,
                "forceMfa": false,
                "hidePasswordReset": false
            }' > /dev/null 2>&1

        # Add Google IdP to login policy
        POLICY_RESPONSE=$(curl $CURL_OPTS -X POST "$ZITADEL_URL/management/v1/policies/login/idps" \
            -H "Content-Type: application/json" \
            -H "$AUTH_HEADER" \
            -d "{
                \"idpId\": \"$GOOGLE_IDP_ID\",
                \"ownerType\": \"IDP_OWNER_TYPE_ORG\"
            }")

        if echo "$POLICY_RESPONSE" | jq -r '.details // empty' | grep -q .; then
            log_ok "Google IdP added to login policy"
        elif echo "$POLICY_RESPONSE" | jq -r '.code // empty' | grep -q "6"; then
            log_ok "Google IdP already in login policy"
        else
            log_warn "Login policy update response: $(echo "$POLICY_RESPONSE" | jq -r '.message // "unknown"')"
        fi
    fi
else
    log_warn "Google OAuth credentials not found. Skipping Google IdP setup."
fi

# Step 7: Setup Login V2 client (for existing installs where FIRSTINSTANCE vars didn't apply)
LOGIN_PAT_DIR="$INFRA_DIR/loginkey"
LOGIN_PAT_FILE="$LOGIN_PAT_DIR/login-client.pat"
mkdir -p "$LOGIN_PAT_DIR"

if [ -f "$LOGIN_PAT_FILE" ] && [ -s "$LOGIN_PAT_FILE" ]; then
    log_ok "Login client PAT already exists"
else
    log_info "Creating Login V2 client user..."

    # Search for existing login-client user
    LOGIN_USER_ID=$(curl $CURL_OPTS -X POST "$ZITADEL_URL/management/v1/users/_search" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d '{"queries":[{"userNameQuery":{"userName":"login-client","method":"TEXT_QUERY_METHOD_EQUALS"}}]}' \
        | jq -r '.result[0].id // empty')

    if [ -z "$LOGIN_USER_ID" ]; then
        # Create machine user
        LOGIN_USER_RESPONSE=$(curl $CURL_OPTS -X POST "$ZITADEL_URL/management/v1/users/machine" \
            -H "Content-Type: application/json" \
            -H "$AUTH_HEADER" \
            -d '{
                "userName": "login-client",
                "name": "Login V2 Client",
                "description": "Machine user for Login V2 UI"
            }')
        LOGIN_USER_ID=$(echo "$LOGIN_USER_RESPONSE" | jq -r '.userId // empty')

        if [ -z "$LOGIN_USER_ID" ]; then
            log_warn "Could not create login-client user. Login V2 may not work."
        else
            log_ok "Login client user created: $LOGIN_USER_ID"
        fi
    else
        log_ok "Login client user already exists: $LOGIN_USER_ID"
    fi

    if [ -n "$LOGIN_USER_ID" ]; then
        # Get the instance ID (organization) for IAM role grant
        INSTANCE_ID=$(curl $CURL_OPTS "$ZITADEL_URL/admin/v1/instances/me" \
            -H "$AUTH_HEADER" | jq -r '.instance.id // empty')

        # Grant IAM_LOGIN_CLIENT role
        curl $CURL_OPTS -X POST "$ZITADEL_URL/admin/v1/members" \
            -H "Content-Type: application/json" \
            -H "$AUTH_HEADER" \
            -d "{\"userId\": \"$LOGIN_USER_ID\", \"roles\": [\"IAM_LOGIN_CLIENT\"]}" > /dev/null 2>&1
        log_ok "IAM_LOGIN_CLIENT role granted"

        # Create PAT
        PAT_RESPONSE=$(curl $CURL_OPTS -X POST "$ZITADEL_URL/management/v1/users/$LOGIN_USER_ID/pats" \
            -H "Content-Type: application/json" \
            -H "$AUTH_HEADER" \
            -d '{"expirationDate": "2029-01-01T00:00:00Z"}')
        LOGIN_PAT=$(echo "$PAT_RESPONSE" | jq -r '.token // empty')

        if [ -n "$LOGIN_PAT" ]; then
            echo -n "$LOGIN_PAT" > "$LOGIN_PAT_FILE"
            log_ok "Login client PAT saved to $LOGIN_PAT_FILE"
        else
            log_warn "Could not create login client PAT: $(echo "$PAT_RESPONSE" | jq -r '.message // "unknown"')"
        fi
    fi
fi

# Step 7b: Enable Login V2 feature
log_info "Enabling Login V2..."
LOGIN_V2_RESPONSE=$(curl $CURL_OPTS -X PUT "$ZITADEL_URL/v2/features/instance" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{"loginV2": {"required": true, "baseUri": "http://localhost:8081/ui/v2/login"}}')

if echo "$LOGIN_V2_RESPONSE" | jq -r '.details // empty' | grep -q .; then
    log_ok "Login V2 enabled (base URI: http://localhost:8081/ui/v2/login)"
else
    log_warn "Could not enable Login V2: $(echo "$LOGIN_V2_RESPONSE" | jq -r '.message // "unknown"')"
fi

# Step 8: Write credentials to env files and credentials file
log_info "Writing credentials..."

# Issuer URL must match Zitadel's own issuer (from OIDC discovery)
ZITADEL_ISSUER="$ZITADEL_URL"

if [ -n "$CLIENT_ID" ]; then
    cat > "$CREDS_FILE" << EOF
# Zitadel credentials generated by setup-zitadel.sh
# Generated at: $(date -u '+%Y-%m-%dT%H:%M:%SZ')
ZITADEL_CLIENT_ID=$CLIENT_ID
ZITADEL_CLIENT_SECRET=$CLIENT_SECRET
ZITADEL_PROJECT_ID=$PROJECT_ID
ZITADEL_ISSUER=$ZITADEL_ISSUER
EOF

    # Update web/.env.local
    if [ -f "$WEB_ENV" ]; then
        if grep -q '^ZITADEL_CLIENT_ID=' "$WEB_ENV"; then
            sed -i "s|^ZITADEL_CLIENT_ID=.*|ZITADEL_CLIENT_ID=$CLIENT_ID|" "$WEB_ENV"
        fi
        if [ -n "$CLIENT_SECRET" ]; then
            if grep -q '^ZITADEL_CLIENT_SECRET=' "$WEB_ENV"; then
                sed -i "s|^ZITADEL_CLIENT_SECRET=.*|ZITADEL_CLIENT_SECRET=$CLIENT_SECRET|" "$WEB_ENV"
            fi
        fi
        if grep -q '^ZITADEL_ISSUER=' "$WEB_ENV"; then
            sed -i "s|^ZITADEL_ISSUER=.*|ZITADEL_ISSUER=$ZITADEL_ISSUER|" "$WEB_ENV"
        fi
        if ! grep -q '^NODE_TLS_REJECT_UNAUTHORIZED=' "$WEB_ENV"; then
            echo "" >> "$WEB_ENV"
            echo "# Dev only: trust self-signed certs" >> "$WEB_ENV"
            echo "NODE_TLS_REJECT_UNAUTHORIZED=0" >> "$WEB_ENV"
        fi
        log_ok "Updated web/.env.local"
    fi

    # Update backend/.env
    BACKEND_ENV="$PROJECT_DIR/backend/.env"
    if [ -f "$BACKEND_ENV" ]; then
        if grep -q '^ZITADEL_ISSUER=' "$BACKEND_ENV"; then
            sed -i "s|^ZITADEL_ISSUER=.*|ZITADEL_ISSUER=$ZITADEL_ISSUER|" "$BACKEND_ENV"
        fi
        if grep -q '^ZITADEL_AUDIENCE=' "$BACKEND_ENV"; then
            sed -i "s|^ZITADEL_AUDIENCE=.*|ZITADEL_AUDIENCE=$PROJECT_ID|" "$BACKEND_ENV"
        else
            echo "" >> "$BACKEND_ENV"
            echo "# Zitadel project ID as audience for JWT validation" >> "$BACKEND_ENV"
            echo "ZITADEL_AUDIENCE=$PROJECT_ID" >> "$BACKEND_ENV"
        fi
        if ! grep -q '^NODE_TLS_REJECT_UNAUTHORIZED=' "$BACKEND_ENV"; then
            echo "" >> "$BACKEND_ENV"
            echo "# Dev only: trust self-signed certs" >> "$BACKEND_ENV"
            echo "NODE_TLS_REJECT_UNAUTHORIZED=0" >> "$BACKEND_ENV"
        fi
        log_ok "Updated backend/.env"
    fi

    log_ok "Credentials saved to $CREDS_FILE"
else
    log_warn "No client ID available. Env files not updated."
fi

# Mark as configured
touch "$FLAG_FILE"

echo ""
log_ok "=========================================="
log_ok "  Zitadel configuration complete!"
log_ok "=========================================="
echo ""
echo -e "  ${BLUE}Project ID:${NC}     $PROJECT_ID"
echo -e "  ${BLUE}Client ID:${NC}      $CLIENT_ID"
if [ -n "$CLIENT_SECRET" ]; then
    echo -e "  ${BLUE}Client Secret:${NC}  ${CLIENT_SECRET:0:8}..."
fi
if [ -n "$GOOGLE_IDP_ID" ]; then
    echo -e "  ${BLUE}Google IdP:${NC}     $GOOGLE_IDP_ID"
fi
echo ""
echo -e "  ${YELLOW}Credentials file:${NC} $CREDS_FILE"
echo -e "  ${YELLOW}To reconfigure:${NC}   rm $FLAG_FILE && $0"
echo ""
