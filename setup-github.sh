#!/bin/bash

# HelpNow Quick GitHub Setup Script
# This script helps you quickly set up the GitHub repository

echo "🚀 HelpNow - GitHub Repository Setup"
echo "====================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    echo "Visit: https://git-scm.com/downloads"
    exit 1
fi

echo "✅ Git is installed"
echo ""

# Get GitHub username
read -p "Enter your GitHub username: " github_username

if [ -z "$github_username" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

echo ""
read -p "Repository name (default: HelpNow): " repo_name
repo_name=${repo_name:-HelpNow}

echo ""
read -p "Make repository private? (y/n, default: y): " is_private
is_private=${is_private:-y}

echo ""
echo "📋 Configuration Summary:"
echo "  GitHub Username: $github_username"
echo "  Repository Name: $repo_name"
echo "  Private: $is_private"
echo ""
read -p "Continue with setup? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Setup cancelled"
    exit 0
fi

echo ""
echo "🔧 Setting up Git repository..."

# Initialize git if not already initialized
if [ ! -d .git ]; then
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already initialized"
fi

# Add all files
git add .
echo "✅ Files staged for commit"

# Create initial commit
if ! git rev-parse HEAD > /dev/null 2>&1; then
    git commit -m "Initial commit - HelpNow app foundation"
    echo "✅ Initial commit created"
else
    echo "✅ Repository already has commits"
fi

# Set main branch
git branch -M main
echo "✅ Main branch set"

# Check if GitHub CLI is installed
if command -v gh &> /dev/null; then
    echo ""
    echo "🎉 GitHub CLI detected!"
    echo "Creating repository on GitHub..."
    
    if [ "$is_private" = "y" ]; then
        gh repo create "$repo_name" --private --source=. --remote=origin --push
    else
        gh repo create "$repo_name" --public --source=. --remote=origin --push
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Repository created and code pushed!"
        echo ""
        echo "🎉 Setup Complete!"
        echo "Your repository: https://github.com/$github_username/$repo_name"
    else
        echo "❌ Failed to create repository. You may need to authenticate first:"
        echo "Run: gh auth login"
    fi
else
    echo ""
    echo "📝 GitHub CLI not detected. Setting up remote manually..."
    
    # Add remote
    if [ "$is_private" = "y" ]; then
        git_url="git@github.com:$github_username/$repo_name.git"
    else
        git_url="https://github.com/$github_username/$repo_name.git"
    fi
    
    # Check if remote already exists
    if git remote | grep -q "^origin$"; then
        echo "Remote 'origin' already exists. Updating URL..."
        git remote set-url origin "$git_url"
    else
        git remote add origin "$git_url"
    fi
    
    echo "✅ Remote added: $git_url"
    echo ""
    echo "⚠️  Next steps:"
    echo "1. Go to GitHub.com and create a new repository named '$repo_name'"
    echo "2. Make it private: $is_private"
    echo "3. Do NOT initialize with README, .gitignore, or license"
    echo "4. After creating, run: git push -u origin main"
fi

echo ""
echo "📚 Useful commands:"
echo "  git status           - Check status"
echo "  git add .            - Stage all changes"
echo "  git commit -m '...'  - Commit changes"
echo "  git push             - Push to GitHub"
echo ""
echo "📖 For more info, see GITHUB_SETUP.md"
echo ""
echo "Happy coding! 🚑❤️"
