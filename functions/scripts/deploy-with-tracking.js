#!/usr/bin/env node

/**
 * Enhanced Deployment Script with Branch and Issue Tracking
 * 
 * Associates Firebase deployments with:
 * - Git branch information
 * - GitHub issue numbers
 * - Commit details
 * - Deployment environment
 */

const { execSync } = require('child_process');
const fs = require('fs');

async function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    const authorName = execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim();
    const commitDate = execSync('git log -1 --pretty=%ci', { encoding: 'utf8' }).trim();
    
    return {
      commitHash,
      branchName,
      commitMessage,
      authorName,
      commitDate
    };
  } catch (error) {
    console.error('❌ Failed to get git info:', error.message);
    throw error;
  }
}

function extractIssueNumbers(commitMessage, branchName) {
  const issues = new Set();
  
  // Extract from commit message (e.g., "fixes #10", "closes #10", "#10")
  const commitIssues = commitMessage.match(/#(\d+)/g);
  if (commitIssues) {
    commitIssues.forEach(match => issues.add(match.replace('#', '')));
  }
  
  // Extract from branch name (e.g., "10-immediate-response")
  const branchIssue = branchName.match(/^(\d+)-/);
  if (branchIssue) {
    issues.add(branchIssue[1]);
  }
  
  return Array.from(issues);
}

async function createGitHubDeployment(functionName, environment, gitInfo, issueNumbers) {
  try {
    const owner = 'timfong888';
    const repo = 'cartesia-firebase-function';
    
    // Create rich description with branch and issue info
    let description = `Deploy ${functionName} from ${gitInfo.branchName}`;
    if (issueNumbers.length > 0) {
      description += ` (Issues: ${issueNumbers.map(n => `#${n}`).join(', ')})`;
    }
    
    console.log(`🚀 Creating GitHub deployment...`);
    console.log(`   📦 Function: ${functionName}`);
    console.log(`   🌿 Branch: ${gitInfo.branchName}`);
    console.log(`   🎯 Issues: ${issueNumbers.length > 0 ? issueNumbers.map(n => `#${n}`).join(', ') : 'None'}`);
    console.log(`   🔗 Commit: ${gitInfo.commitHash.substring(0, 8)}`);
    
    const deploymentPayload = {
      ref: gitInfo.commitHash,
      environment: environment,
      description: description,
      auto_merge: false,
      required_contexts: [],
      payload: {
        branch: gitInfo.branchName,
        issues: issueNumbers,
        function_name: functionName,
        author: gitInfo.authorName,
        commit_message: gitInfo.commitMessage,
        commit_date: gitInfo.commitDate
      }
    };
    
    const deploymentResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/deployments`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deploymentPayload)
    });
    
    if (!deploymentResponse.ok) {
      const errorText = await deploymentResponse.text();
      throw new Error(`Failed to create deployment: ${deploymentResponse.statusText} - ${errorText}`);
    }
    
    const deployment = await deploymentResponse.json();
    console.log(`✅ Deployment created: ${deployment.url}`);
    
    return deployment;
    
  } catch (error) {
    console.error('❌ Failed to create GitHub deployment:', error.message);
    throw error;
  }
}

async function updateDeploymentStatus(deploymentId, state, environmentUrl, description, gitInfo, issueNumbers) {
  try {
    const owner = 'timfong888';
    const repo = 'cartesia-firebase-function';
    
    const statusPayload = {
      state: state,
      description: description,
      environment_url: environmentUrl,
      log_url: `https://console.cloud.google.com/functions/list?project=sophia-db784`,
      payload: {
        branch: gitInfo.branchName,
        issues: issueNumbers,
        commit: gitInfo.commitHash.substring(0, 8),
        timestamp: new Date().toISOString()
      }
    };
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/deployments/${deploymentId}/statuses`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(statusPayload)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update deployment status: ${response.statusText}`);
    }
    
    console.log(`📊 Status updated: ${state}`);
    
  } catch (error) {
    console.error('❌ Failed to update deployment status:', error.message);
  }
}

async function commentOnIssues(issueNumbers, deploymentInfo, gitInfo) {
  if (issueNumbers.length === 0) return;
  
  try {
    const owner = 'timfong888';
    const repo = 'cartesia-firebase-function';
    
    for (const issueNumber of issueNumbers) {
      const comment = `## 🚀 Deployment Update

**Branch \`${gitInfo.branchName}\` has been deployed to production**

### Deployment Details:
- **Function**: ${deploymentInfo.functionName}
- **Environment**: ${deploymentInfo.environment}  
- **Commit**: ${gitInfo.commitHash.substring(0, 8)}
- **Author**: ${gitInfo.authorName}
- **Timestamp**: ${new Date().toISOString()}

### Links:
- 🔗 [View Deployment](${deploymentInfo.url})
- 📊 [Function Logs](https://console.cloud.google.com/functions/list?project=sophia-db784)
- 🌐 [Live Function](${deploymentInfo.functionUrl})

### Commit Message:
\`\`\`
${gitInfo.commitMessage}
\`\`\`

The changes from this branch are now live and ready for testing.`;

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: comment })
      });
      
      if (response.ok) {
        console.log(`💬 Comment added to issue #${issueNumber}`);
      } else {
        console.log(`⚠️  Failed to comment on issue #${issueNumber}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to comment on issues:', error.message);
  }
}

async function logDeployment(deploymentInfo, gitInfo, issueNumbers) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    deployment_id: deploymentInfo.id,
    function_name: deploymentInfo.functionName,
    environment: deploymentInfo.environment,
    branch: gitInfo.branchName,
    commit_hash: gitInfo.commitHash,
    commit_message: gitInfo.commitMessage,
    author: gitInfo.authorName,
    issues: issueNumbers,
    function_url: deploymentInfo.functionUrl,
    deployment_url: deploymentInfo.url
  };
  
  // Log to file for local tracking
  const logFile = 'deployment-history.json';
  let history = [];
  
  try {
    if (fs.existsSync(logFile)) {
      history = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    }
  } catch (error) {
    console.log('📝 Creating new deployment history file');
  }
  
  history.unshift(logEntry);
  
  // Keep only last 50 deployments
  history = history.slice(0, 50);
  
  fs.writeFileSync(logFile, JSON.stringify(history, null, 2));
  console.log(`📝 Deployment logged to ${logFile}`);
}

async function deployWithTracking(functionName = 'cartesiaTTS', environment = 'production') {
  let deployment;
  let gitInfo;
  let issueNumbers = [];
  
  try {
    // Check for required environment variables
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
    
    console.log('🔍 Gathering deployment information...');
    
    // Get git information
    gitInfo = await getGitInfo();
    issueNumbers = extractIssueNumbers(gitInfo.commitMessage, gitInfo.branchName);
    
    console.log('📋 Deployment Summary:');
    console.log(`   Function: ${functionName}`);
    console.log(`   Environment: ${environment}`);
    console.log(`   Branch: ${gitInfo.branchName}`);
    console.log(`   Commit: ${gitInfo.commitHash.substring(0, 8)} by ${gitInfo.authorName}`);
    console.log(`   Issues: ${issueNumbers.length > 0 ? issueNumbers.map(n => `#${n}`).join(', ') : 'None detected'}`);
    console.log('');
    
    // Create GitHub deployment record
    deployment = await createGitHubDeployment(functionName, environment, gitInfo, issueNumbers);
    
    // Update status to in_progress
    await updateDeploymentStatus(deployment.id, 'in_progress', null, 'Deployment started', gitInfo, issueNumbers);
    
    // Deploy the function
    console.log(`🔧 Deploying ${functionName} to Firebase...`);
    const deployOutput = execSync(`firebase deploy --only functions:${functionName}`, { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    // Extract function URL from deploy output (if available)
    const urlMatch = deployOutput.match(/Function URL \(.*?\): (https:\/\/[^\s]+)/);
    const functionUrl = urlMatch ? urlMatch[1] : `https://${functionName.toLowerCase()}-rdovs7os4q-uc.a.run.app`;
    
    // Update status to success
    await updateDeploymentStatus(
      deployment.id, 
      'success', 
      functionUrl, 
      `Function deployed successfully from ${gitInfo.branchName}`,
      gitInfo,
      issueNumbers
    );
    
    // Comment on related issues
    await commentOnIssues(issueNumbers, {
      id: deployment.id,
      functionName,
      environment,
      url: deployment.url,
      functionUrl
    }, gitInfo);
    
    // Log deployment locally
    await logDeployment({
      id: deployment.id,
      functionName,
      environment,
      url: deployment.url,
      functionUrl
    }, gitInfo, issueNumbers);
    
    console.log('');
    console.log('🎉 Deployment completed successfully!');
    console.log(`📊 View deployment: https://github.com/timfong888/cartesia-firebase-function/deployments`);
    console.log(`🌐 Function URL: ${functionUrl}`);
    if (issueNumbers.length > 0) {
      console.log(`🎯 Related issues: ${issueNumbers.map(n => `#${n}`).join(', ')}`);
    }
    
  } catch (error) {
    // Update status to failure if deployment exists
    if (deployment && gitInfo) {
      await updateDeploymentStatus(
        deployment.id, 
        'failure', 
        null, 
        `Deployment failed: ${error.message}`,
        gitInfo,
        issueNumbers
      );
    }
    
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  const functionName = process.argv[2] || 'cartesiaTTS';
  const environment = process.argv[3] || 'production';
  
  deployWithTracking(functionName, environment);
}

module.exports = { deployWithTracking, getGitInfo, extractIssueNumbers };
