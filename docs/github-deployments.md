# GitHub Deployments Integration

This project uses GitHub's Deployments API to track all Firebase function deployments directly in the GitHub interface.

## 🎯 What is GitHub Deployments?

GitHub Deployments is a built-in feature that:
- Tracks deployment history in your repo's "Deployments" tab
- Shows deployment status (pending, success, failure)
- Links to live environments
- Integrates with pull requests and commit history

## 📍 View Deployments

**Repository Deployments Page:**
https://github.com/timfong888/cartesia-firebase-function/deployments

## 🚀 How to Deploy with GitHub Tracking

### Option 1: Manual Script (Recommended)
```bash
cd functions
export GITHUB_TOKEN="your_github_token_here"
npm run deploy:github
```

### Option 2: GitHub Actions
1. Go to **Actions** → **Deploy Firebase Function**
2. Click **Run workflow**
3. Choose function name and environment
4. Deployment will be tracked automatically

### Option 3: Direct API Usage
```bash
# Create deployment record
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/timfong888/cartesia-firebase-function/deployments \
  -d '{
    "ref": "main",
    "environment": "production", 
    "description": "Deploy cartesiaTTS function"
  }'
```

## 🔑 Setup Requirements

### 1. GitHub Token
Create a Personal Access Token with `repo` scope:
1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Select `repo` scope
4. Copy the token

### 2. Environment Variable
```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

### 3. For GitHub Actions
Add `FIREBASE_TOKEN` secret to repository settings:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add `FIREBASE_TOKEN` with your Firebase CI token

## 📊 Deployment States

| State | Description |
|-------|-------------|
| `pending` | Deployment created, not started |
| `in_progress` | Deployment is running |
| `success` | Deployment completed successfully |
| `failure` | Deployment failed |
| `error` | Deployment encountered an error |

## 🔍 Deployment Information Tracked

Each deployment record includes:
- **Commit SHA** - Exact code version deployed
- **Environment** - production, staging, etc.
- **Status** - Current deployment state
- **URL** - Link to live function
- **Timestamp** - When deployment occurred
- **Description** - Human-readable deployment notes

## 🛠️ Advanced Usage

### Custom Environment
```bash
# Deploy to staging environment
GITHUB_TOKEN="token" node scripts/github-deploy.js cartesiaTTS staging
```

### Multiple Functions
```bash
# Deploy different functions
GITHUB_TOKEN="token" node scripts/github-deploy.js functionName1
GITHUB_TOKEN="token" node scripts/github-deploy.js functionName2
```

## 🔗 Integration Benefits

1. **Pull Request Integration** - See deployment status on PRs
2. **Commit History** - View deployments for each commit
3. **Environment Tracking** - Separate prod/staging deployments
4. **Team Visibility** - Everyone sees deployment status
5. **Rollback Support** - Easy to identify previous versions

## 📝 Current Deployment

The latest deployment has been logged:
- **Function**: cartesiaTTS
- **Environment**: production
- **Status**: success
- **URL**: https://cartesiatts-rdovs7os4q-uc.a.run.app
- **Commit**: 1dd7596dcafbcddc862698657ab1f848810b7100
