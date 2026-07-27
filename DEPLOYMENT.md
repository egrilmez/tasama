# Azure Deployment Guide - Tasama Next.js App

Complete guide for deploying your Next.js 16 app with better-sqlite3 to Azure App Service.

## Prerequisites

- Azure CLI installed (`brew install azure-cli` on macOS)
- Azure account with active subscription
- GitHub repository: https://github.com/egrilmez/tasama

## Quick Start (Automated)

Run the automated setup script:

```bash
chmod +x azure-setup.sh
./azure-setup.sh
```

This will:
1. Create all Azure resources
2. Configure App Service for Next.js
3. Set up environment variables
4. Generate deployment credentials

Then follow the output instructions to add the publish profile to GitHub Secrets.

## Manual Setup (Step-by-Step)

### 1. Login to Azure

```bash
az login
az account show  # Verify correct subscription
```

### 2. Create Resource Group

```bash
az group create \
  --name tasama-rg \
  --location westeurope \
  --output table
```

### 3. Create App Service Plan

Choose a SKU based on your needs:
- **F1** (Free) - For testing only, has limitations
- **B1** (Basic) - Recommended for production ($12.41/month)
- **P1V2** (Premium) - Better performance ($73.00/month)

```bash
az appservice plan create \
  --name tasama-plan \
  --resource-group tasama-rg \
  --location westeurope \
  --sku B1 \
  --is-linux \
  --output table
```

### 4. Create App Service

```bash
az webapp create \
  --name tasama-app \
  --resource-group tasama-rg \
  --plan tasama-plan \
  --runtime "NODE:24-lts" \
  --output table
```

### 5. Configure App Service

#### Set App Settings

```bash
az webapp config appsettings set \
  --name tasama-app \
  --resource-group tasama-rg \
  --settings \
    WEBSITE_NODE_DEFAULT_VERSION="~24" \
    NODE_ENV="production" \
    NEXT_TELEMETRY_DISABLED="1" \
    PORT="8080" \
    WEBSITES_PORT="8080" \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE="true" \
    ARIVA_BASE_URL="https://ariva.agenticdynamic.com" \
    ARIVA_ASSISTANT_ID="" \
    ARIVA_API_KEY="" \
  --output table
```

#### Set Startup Command

```bash
az webapp config set \
  --name tasama-app \
  --resource-group tasama-rg \
  --startup-file "startup.sh" \
  --output table
```

### 6. Get Deployment Credentials

```bash
az webapp deployment list-publishing-profiles \
  --name tasama-app \
  --resource-group tasama-rg \
  --xml > publish-profile.xml

cat publish-profile.xml
```

### 7. Configure GitHub Secrets

1. Go to: https://github.com/egrilmez/tasama/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Value: Paste the entire contents of `publish-profile.xml`
5. Click **"Add secret"**

### 8. Deploy

Push to main branch or trigger workflow manually:

```bash
git add .github/workflows/azure-deploy.yml
git commit -m "chore: add Azure deployment workflow"
git push origin main
```

Monitor deployment at: https://github.com/egrilmez/tasama/actions

## Important Notes

### better-sqlite3 on Azure

The app uses `better-sqlite3`, a native Node.js module. The deployment workflow:
1. Rebuilds the module for Linux during deployment (`npm rebuild better-sqlite3`)
2. Ensures the `data/` directory is writable on Azure

### Database Persistence

Azure App Service uses ephemeral storage by default. For persistent database:

**Option 1: Enable App Service Storage (already configured)**
```bash
az webapp config appsettings set \
  --name tasama-app \
  --resource-group tasama-rg \
  --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE="true"
```

**Option 2: Use Azure File Share (for better persistence)**
```bash
# Create storage account
az storage account create \
  --name tasamastorage \
  --resource-group tasama-rg \
  --location westeurope \
  --sku Standard_LRS

# Create file share
az storage share create \
  --name tasama-data \
  --account-name tasamastorage

# Mount to App Service
az webapp config storage-account add \
  --name tasama-app \
  --resource-group tasama-rg \
  --storage-type AzureFiles \
  --share-name tasama-data \
  --account-name tasamastorage \
  --access-key $(az storage account keys list -g tasama-rg -n tasamastorage --query '[0].value' -o tsv) \
  --mount-path /home/site/wwwroot/data
```

### Environment Variables

Update ARIVA API credentials in production:

```bash
az webapp config appsettings set \
  --name tasama-app \
  --resource-group tasama-rg \
  --settings \
    ARIVA_ASSISTANT_ID='your-assistant-id' \
    ARIVA_API_KEY='your-api-key'
```

## Monitoring & Logs

### Stream Live Logs

```bash
az webapp log tail \
  --name tasama-app \
  --resource-group tasama-rg
```

### Enable Application Logging

```bash
az webapp log config \
  --name tasama-app \
  --resource-group tasama-rg \
  --application-logging filesystem \
  --level information
```

### View Logs in Portal

https://portal.azure.com → App Services → tasama-app → Log stream

## Troubleshooting

### App not starting

```bash
# Check logs
az webapp log tail --name tasama-app --resource-group tasama-rg

# Restart app
az webapp restart --name tasama-app --resource-group tasama-rg
```

### Database errors

```bash
# Verify data directory is writable
az webapp ssh --name tasama-app --resource-group tasama-rg
# In SSH session:
cd /home/site/wwwroot
ls -la data/
touch data/test.txt  # Should succeed
```

### better-sqlite3 errors

```bash
# Rebuild the module
az webapp ssh --name tasama-app --resource-group tasama-rg
cd /home/site/wwwroot
npm rebuild better-sqlite3
```

## Cost Optimization

- **Development**: Use F1 (Free) tier
- **Staging**: Use B1 (Basic) tier - $12.41/month
- **Production**: Use B1-B3 or P1V2 based on traffic

Stop app when not in use:
```bash
az webapp stop --name tasama-app --resource-group tasama-rg
az webapp start --name tasama-app --resource-group tasama-rg
```

## Cleanup

Delete all resources when done:

```bash
az group delete \
  --name tasama-rg \
  --yes \
  --no-wait
```

## Custom Domain (Optional)

1. Purchase domain or use existing
2. Add custom domain:
```bash
az webapp config hostname add \
  --webapp-name tasama-app \
  --resource-group tasama-rg \
  --hostname yourdomain.com
```

3. Enable HTTPS:
```bash
az webapp config ssl bind \
  --name tasama-app \
  --resource-group tasama-rg \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

## Resources

- Azure App Service: https://portal.azure.com
- GitHub Actions: https://github.com/egrilmez/tasama/actions
- App URL: https://tasama-app.azurewebsites.net
- Azure CLI Docs: https://learn.microsoft.com/cli/azure/
