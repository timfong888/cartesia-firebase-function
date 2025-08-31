#!/usr/bin/env node

/**
 * GitHub Deployments API Integration
 * Creates deployment records in GitHub's deployment tracking system
 */

const { execSync } = require('child_process');

async function createGitHubDeployment(functionName, environment = 'production') {
  try {
    // Get current git info
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    
    // GitHub API configuration
    const owner = 'timfong888';
    const repo = 'cartesia-firebase-function';
    
    console.log(`🚀 Creating GitHub deployment for ${functionName}...`);
    
    // Create deployment
    const deploymentResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/deployments`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: commitHash,
        environment: environment,
        description: `Deploy ${functionName} function`,
        auto_merge: false,
        required_contexts: []
      })
    });
    
    if (!deploymentResponse.ok) {
      throw new Error(`Failed to create deployment: ${deploymentResponse.statusText}`);
    }
    
    const deployment = await deploymentResponse.json();
    console.log(`✅ Deployment created: ${deployment.url}`);
    
    return deployment;
    
  } catch (error) {
    console.error('❌ Failed to create GitHub deployment:', error.message);
    throw error;
  }
}

async function updateDeploymentStatus(deploymentId, state, environmentUrl, description) {
  try {
    const owner = 'timfong888';
    const repo = 'cartesia-firebase-function';
    
    console.log(`📝 Updating deployment status to ${state}...`);
    
    const statusResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/deployments/${deploymentId}/statuses`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        state: state,
        description: description,
        environment_url: environmentUrl
      })
    });
    
    if (!statusResponse.ok) {
      throw new Error(`Failed to update deployment status: ${statusResponse.statusText}`);
    }
    
    const status = await statusResponse.json();
    console.log(`✅ Deployment status updated: ${status.url}`);
    
    return status;
    
  } catch (error) {
    console.error('❌ Failed to update deployment status:', error.message);
    throw error;
  }
}

async function deployWithGitHubTracking(functionName) {
  let deployment;
  
  try {
    // Create GitHub deployment record
    deployment = await createGitHubDeployment(functionName);
    
    // Update status to in_progress
    await updateDeploymentStatus(deployment.id, 'in_progress', null, 'Deployment started');
    
    // Deploy the function
    console.log(`🔧 Deploying ${functionName} to Firebase...`);
    execSync(`firebase deploy --only functions:${functionName}`, { stdio: 'inherit' });
    
    // Update status to success
    const functionUrl = 'https://cartesiatts-rdovs7os4q-uc.a.run.app'; // You might want to extract this dynamically
    await updateDeploymentStatus(deployment.id, 'success', functionUrl, 'Function deployed successfully');
    
    console.log(`🎉 Deployment completed successfully!`);
    console.log(`📊 View deployment: https://github.com/timfong888/cartesia-firebase-function/deployments`);
    
  } catch (error) {
    // Update status to failure if deployment exists
    if (deployment) {
      await updateDeploymentStatus(deployment.id, 'failure', null, `Deployment failed: ${error.message}`);
    }
    
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  const functionName = process.argv[2] || 'cartesiaTTS';
  
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.log('💡 Create a token at: https://github.com/settings/tokens');
    console.log('💡 Required scopes: repo');
    process.exit(1);
  }
  
  deployWithGitHubTracking(functionName);
}

module.exports = { createGitHubDeployment, updateDeploymentStatus, deployWithGitHubTracking };
