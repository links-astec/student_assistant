#!/bin/bash

# 🚀 CampusFlow Automated Vercel Deployment Script
# This script deploys both backend and frontend to Vercel

set -e  # Exit on any error

echo "🚀 Starting CampusFlow Vercel Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Please install it first:"
        echo "npm install -g vercel"
        exit 1
    fi
    print_success "Vercel CLI is installed $(vercel --version)"
}

# Check if user is logged in to Vercel
check_vercel_login() {
    if ! vercel whoami &> /dev/null; then
        print_warning "Not logged in to Vercel. Please login:"
        vercel login
        if ! vercel whoami &> /dev/null; then
            print_error "Login failed. Please try again."
            exit 1
        fi
    fi
    print_success "Logged in to Vercel as $(vercel whoami)"
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend/system_prototype"

print_status "Project root: $PROJECT_ROOT"
print_status "Backend directory: $BACKEND_DIR"
print_status "Frontend directory: $FRONTEND_DIR"

# Function to deploy backend
deploy_backend() {
    print_status "Deploying backend..."

    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi

    cd "$BACKEND_DIR"

    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        print_error "vercel.json not found in backend directory"
        exit 1
    fi

    print_status "Deploying backend to Vercel..."
    BACKEND_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*\.vercel\.app' | head -1)

    if [ -z "$BACKEND_URL" ]; then
        print_error "Failed to get backend URL from deployment"
        exit 1
    fi

    print_success "Backend deployed successfully!"
    print_success "Backend URL: $BACKEND_URL"

    # Return to project root
    cd "$PROJECT_ROOT"
    echo "$BACKEND_URL"
}

# Function to deploy frontend
deploy_frontend() {
    BACKEND_URL=$1
    print_status "Deploying frontend..."

    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi

    cd "$FRONTEND_DIR"

    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        print_error "vercel.json not found in frontend directory"
        exit 1
    fi

    # Update vercel.json with backend URL
    print_status "Updating vercel.json with backend URL: $BACKEND_URL"

    # Use sed to replace the placeholder in vercel.json
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|https://your-backend-url.vercel.app|$BACKEND_URL|g" vercel.json
    else
        # Linux/Windows
        sed -i "s|https://your-backend-url.vercel.app|$BACKEND_URL|g" vercel.json
    fi

    print_status "Deploying frontend to Vercel..."
    FRONTEND_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*\.vercel\.app' | head -1)

    if [ -z "$FRONTEND_URL" ]; then
        print_error "Failed to get frontend URL from deployment"
        exit 1
    fi

    print_success "Frontend deployed successfully!"
    print_success "Frontend URL: $FRONTEND_URL"

    # Return to project root
    cd "$PROJECT_ROOT"
    echo "$FRONTEND_URL"
}

# Function to setup environment variables reminder
setup_env_vars() {
    BACKEND_URL=$1
    FRONTEND_URL=$2

    print_warning "⚠️  IMPORTANT: Environment Variables Setup Required ⚠️"
    echo ""
    echo "Please set up environment variables in Vercel Dashboard:"
    echo ""
    echo "=== BACKEND ENVIRONMENT VARIABLES ==="
    echo "Go to: https://vercel.com/dashboard → [Your Backend Project] → Settings → Environment Variables"
    echo ""
    echo "Required variables:"
    echo "NODE_ENV=production"
    echo "PORT=3001"
    echo "OLLAMA_BASE_URL=https://api.olama.ai"
    echo "OLLAMA_MODEL=qwen2.5:0.5b"
    echo "OLLAMA_EMBEDDING_MODEL=nomic-embed-text"
    echo "SUPABASE_URL=https://your-project.supabase.co"
    echo "SUPABASE_ANON_KEY=your-anon-key"
    echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    echo "=== FRONTEND ENVIRONMENT VARIABLES ==="
    echo "Go to: https://vercel.com/dashboard → [Your Frontend Project] → Settings → Environment Variables"
    echo ""
    echo "Required variables:"
    echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    echo "NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL"
    echo "NEXT_PUBLIC_SITE_URL=$FRONTEND_URL"
    echo ""
    print_warning "After setting environment variables, redeploy both projects:"
    echo "cd backend && vercel --prod"
    echo "cd frontend/system_prototype && vercel --prod"
}

# Main deployment process
main() {
    print_status "Starting automated deployment process..."

    # Pre-deployment checks
    check_vercel_cli
    check_vercel_login

    echo ""
    print_status "Pre-deployment checklist:"
    echo "✅ Vercel CLI installed and logged in"
    echo "✅ Backend and frontend directories exist"
    echo "✅ vercel.json files configured"
    echo "⚠️  Environment variables will need to be set manually in Vercel Dashboard"
    echo ""

    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi

    # Deploy backend first
    BACKEND_URL=$(deploy_backend)

    # Deploy frontend with backend URL
    FRONTEND_URL=$(deploy_frontend "$BACKEND_URL")

    # Show success message
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "=== DEPLOYMENT SUMMARY ==="
    echo "Backend URL:  $BACKEND_URL"
    echo "Frontend URL: $FRONTEND_URL"
    echo ""

    # Environment variables setup
    setup_env_vars "$BACKEND_URL" "$FRONTEND_URL"

    echo ""
    print_success "Next steps:"
    echo "1. Set up environment variables in Vercel Dashboard"
    echo "2. Redeploy both projects after setting env vars"
    echo "3. Test your application at: $FRONTEND_URL"
    echo "4. Submit sitemap to Google Search Console: $FRONTEND_URL/sitemap.xml"
    echo ""
    print_success "🚀 CampusFlow is now live!"
}

# Run main function
main "$@"