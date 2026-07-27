# Azure CLI Commands - Quick Reference

Copy-paste ready commands for Azure deployment.

## One-Line Automated Setup

```bash
chmod +x azure-setup.sh && ./azure-setup.sh
```

## Manual Commands (Copy-Paste Each Block)

### 1. Login & Verify

```bash
az login
az account show
```

### 2. Create Resource Group

```bash
az group create \
  --name tasama-rg \
  --location westeurope \
  --output table
```

### 3. Create App Service Plan

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

### 5. Configure App Settings

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

### 6. Set Startup Command

```bash
az webapp config set \
  --name tasama-app \
  --resource-group tasama-rg \
  --startup-file "startup.sh" \
  --output table
```

### 7. Get Publish Profile (for GitHub Secret)

```bash
az webapp deployment list-publishing-profiles \
  --name tasama-app \
  --resource-group tasama-rg \
  --xml
```

**Copy the entire XML output** and add it as a GitHub Secret:
- Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
- Go to: https://github.com/egrilmez/tasama/settings/secrets/actions

### 8. Commit Workflow & Deploy

```bash
git add .github/workflows/azure-deploy.yml DEPLOYMENT.md AZURE_COMMANDS.md azure-setup.sh
git commit -m "chore: add Azure deployment workflow and docs"
git push origin main
```

Monitor: https://github.com/egrilmez/tasama/actions

## Common Operations

### Update Environment Variables

```bash
az webapp config appsettings set \
  --name tasama-app \
  --resource-group tasama-rg \
  --settings \
    ARIVA_ASSISTANT_ID='your-id' \
    ARIVA_API_KEY='your-key'
```

### View Logs

```bash
az webapp log tail --name tasama-app --resource-group tasama-rg
```

### Restart App

```bash
az webapp restart --name tasama-app --resource-group tasama-rg
```

### SSH into App

```bash
az webapp ssh --name tasama-app --resource-group tasama-rg
```

### Stop/Start App

```bash
az webapp stop --name tasama-app --resource-group tasama-rg
az webapp start --name tasama-app --resource-group tasama-rg
```

### Delete All Resources

```bash
az group delete --name tasama-rg --yes --no-wait
```

## URLs

- **App**: https://tasama-app.azurewebsites.net
- **Portal**: https://portal.azure.com
- **GitHub Actions**: https://github.com/egrilmez/tasama/actions
- **Secrets**: https://github.com/egrilmez/tasama/settings/secrets/actions

## Next Steps After Setup

1. ✓ Run setup script or manual commands above
2. ✓ Copy publish profile to GitHub Secrets
3. ✓ Commit and push workflow file
4. ✓ Monitor deployment in GitHub Actions
5. ✓ Test app at https://tasama-app.azurewebsites.net
6. (Optional) Update ARIVA API credentials
7. (Optional) Configure custom domain
