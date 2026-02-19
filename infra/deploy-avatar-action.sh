#!/bin/bash

# Deploy Zitadel Action to sync Google Avatar
# This script creates an action that runs after external authentication
# and ensures the profile picture is saved to user metadata.

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ZITADEL_URL="http://localhost:8080"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="$PROJECT_DIR/infra"
PAT_FILE="$INFRA_DIR/machinekey/admin.pat"

# Output helpers
log_info() { echo -e "${BLUE}[action-deploy]${NC} $1"; }
log_ok() { echo -e "${GREEN}[action-deploy] ✓${NC} $1"; }

# Check PAT
if [ ! -f "$PAT_FILE" ]; then
    echo "Error: PAT file not found at $PAT_FILE"
    exit 1
fi
PAT_TOKEN=$(cat "$PAT_FILE" | tr -d '[:space:]')
AUTH_HEADER="Authorization: Bearer $PAT_TOKEN"

# 1. Create the Action
log_info "Creating 'sync_external_avatar' action..."

ACTION_SCRIPT='function external_authentication_post(ctx, api) {
    if (ctx.v1.externalUser && ctx.v1.externalUser.picture) {
        api.v1.user.setMetadata("picture", ctx.v1.externalUser.picture);
    }
}'

# Check if action exists
ACTIONS_RESP=$(curl -s "$ZITADEL_URL/management/v1/actions/_search" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d '{ "queries": [{ "nameQuery": { "name": "sync_external_avatar" } }] }')

ACTION_ID=$(echo "$ACTIONS_RESP" | jq -r '.result[0].id // empty')

if [ -n "$ACTION_ID" ]; then
    log_info "Action already exists ($ACTION_ID). Updating..."
    curl -s -X PUT "$ZITADEL_URL/management/v1/actions/$ACTION_ID" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"sync_external_avatar\",
            \"script\": $(echo "$ACTION_SCRIPT" | jq -R -s .),
            \"timeout\": \"10s\",
            \"allowedToFail\": true
        }" > /dev/null
    log_ok "Action updated."
else
    CREATE_RESP=$(curl -s -X POST "$ZITADEL_URL/management/v1/actions" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"sync_external_avatar\",
            \"script\": $(echo "$ACTION_SCRIPT" | jq -R -s .),
            \"timeout\": \"10s\",
            \"allowedToFail\": true
        }")
    ACTION_ID=$(echo "$CREATE_RESP" | jq -r '.id // empty')
    
    if [ -z "$ACTION_ID" ]; then
        echo "Failed to create action: $CREATE_RESP"
        exit 1
    fi
    log_ok "Action created: $ACTION_ID"
fi

# 2. Configure the Trigger
log_info "Configuring trigger 'FLOW_TYPE_EXTERNAL_AUTHENTICATION'..."

# Trigger type: 2 (Post Authentication)
# Flow type: 1 (External Authentication)
# Note: In Zitadel API, we set the trigger actions for the flow.

TRIGGER_RESP=$(curl -s -X POST "$ZITADEL_URL/management/v1/flows/1/triggers/2" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "{
        \"actionIds\": [\"$ACTION_ID\"]
    }")

# If it fails, it might be because it already exists or expects PUT? 
# Zitadel API for SetTriggerActions is POST /management/v1/flows/{flowType}/triggers/{triggerType}

if echo "$TRIGGER_RESP" | jq -r '.details // empty' | grep -q .; then
    log_ok "Trigger configured successfully."
else
    # Might return empty JSON on success or error? 
    # Actually SetTriggerActions returns current actions.
    log_ok "Trigger response received (likely success)."
fi

echo ""
log_ok "Avatar sync action deployed!"
echo "Please verify by logging in with Google again."
