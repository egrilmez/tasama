#!/bin/bash
# Azure Deployment Setup for Tasama Next.js App
# This script creates all required Azure resources and configures the App Service

set -e

# Configuration
RESOURCE_GROUP="tasama-rg"
LOCATION="westeurope"  # Change if needed (e.g., eastus, westus2, etc.)
APP_SERVICE_PLAN="tasama-plan"
APP_SERVICE_NAME="tasama-app"
NODE_VERSION="24-lts"

echo "🚀 Starting Azure deployment setup for Tasama..."
echo ""

# Login to Azure (if not already logged in)
echo "📝 Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "Please login to Azure..."
    az login
fi

# Show current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo "✓ Using subscription: $SUBSCRIPTION"
echo ""

# Step 1: Create Resource Group
echo "📦 Creating Resource Group: $RESOURCE_GROUP in $LOCATION..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output table

echo ""

# Step 2: Create App Service Plan (Linux, B1 tier for production-ready setup)
echo "📋 Creating App Service Plan: $APP_SERVICE_PLAN (B1 tier)..."
az appservice plan create \
  --name "$APP_SERVICE_PLAN" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku B1 \
  --is-linux \
  --output table

echo ""

# Step 3: Create App Service (Web App)
echo "🌐 Creating App Service: $APP_SERVICE_NAME with Node.js $NODE_VERSION..."
az webapp create \
  --name "$APP_SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$APP_SERVICE_PLAN" \
  --runtime "NODE:$NODE_VERSION" \
  --output table

echo ""

# Step 4: Configure App Service Settings
echo "⚙️  Configuring App Service settings..."

# Set Node.js version explicitly
az webapp config appsettings set \
  --name "$APP_SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    WEBSITE_NODE_DEFAULT_VERSION="~24" \
    NODE_ENV="production" \
    NEXT_TELEMETRY_DISABLED="1" \
    PORT="8080" \
    WEBSITES_PORT="8080" \
  --output table

echo ""

# Step 5: Set custom startup command
echo "🔧 Setting custom startup command..."
az webapp config set \
  --name "$APP_SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --startup-file "startup.sh" \
  --output table

echo ""

# Step 6: Enable local storage for better-sqlite3 database
echo "💾 Enabling local storage (for better-sqlite3 database)..."
az webapp config appsettings set \
  --name "$APP_SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE="true" \
  --output none

echo ""

# Step 7: Configure environment variables (optional - ARIVA API)
echo "🔐 Setting optional environment variables (ARIVA API - currently empty)..."
az webapp config appsettings set \
  --name "$APP_SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    ARIVA_BASE_URL="https://ariva.agenticdynamic.com" \
    ARIVA_ASSISTANT_ID="" \
    ARIVA_API_KEY="" \
  --output table

echo ""
echo "⚠️  Note: ARIVA_ASSISTANT_ID and ARIVA_API_KEY are empty. Update them in Azure Portal if needed."
echo ""

# Step 8: Get deployment credentials
echo "🔑 Generating deployment credentials..."
PUBLISH_PROFILE=$(az webapp deployment list-publishing-profiles \
  --name "$APP_SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --xml)

echo ""
echo "✓ Deployment credentials generated!"
echo ""

# Step 9: Show summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  DEPLOYMENT SETUP COMPLETE                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Resource Summary:"
echo "  • Resource Group:    $RESOURCE_GROUP"
echo "  • Location:          $LOCATION"
echo "  • App Service Plan:  $APP_SERVICE_PLAN (B1 - Basic tier)"
echo "  • App Service:       $APP_SERVICE_NAME"
echo "  • Runtime:           Node.js $NODE_VERSION"
echo "  • URL:               https://$APP_SERVICE_NAME.azurewebsites.net"
echo ""
echo "🔐 Next Steps:"
echo ""
echo "1. Add GitHub Secret for deployment:"
echo "   - Go to: https://github.com/egrilmez/tasama/settings/secrets/actions"
echo "   - Click 'New repository secret'"
echo "   - Name: AZURE_WEBAPP_PUBLISH_PROFILE"
echo "   - Value: Copy from below"
echo ""
echo "2. Copy this publish profile to GitHub Secrets:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$PUBLISH_PROFILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "3. Commit and push the GitHub Actions workflow:"
echo "   git add .github/workflows/azure-deploy.yml"
echo "   git commit -m 'chore: add Azure deployment workflow'"
echo "   git push origin main"
echo ""
echo "4. Monitor deployment at:"
echo "   https://github.com/egrilmez/tasama/actions"
echo ""
echo "5. Optional - Update ARIVA API credentials:"
echo "   az webapp config appsettings set \\"
echo "     --name $APP_SERVICE_NAME \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --settings \\"
echo "       ARIVA_ASSISTANT_ID='your-assistant-id' \\"
echo "       ARIVA_API_KEY='your-api-key'"
echo ""
echo "✅ All resources created successfully!"
