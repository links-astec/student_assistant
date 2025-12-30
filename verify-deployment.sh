#!/bin/bash

# 🧪 CampusFlow Deployment Verification Script
# Tests both backend and frontend after deployment

set -e

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

# Function to test URL
test_url() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3

    print_status "Testing $description: $url"

    if curl -s --head --fail --max-time 10 "$url" > /dev/null 2>&1; then
        print_success "$description is accessible"
        return 0
    else
        print_error "$description is not accessible"
        return 1
    fi
}

# Function to test API endpoint
test_api() {
    local url=$1
    local description=$2

    print_status "Testing API $description: $url"

    response=$(curl -s -w "\nHTTPSTATUS:%{http_code}" --max-time 10 "$url" 2>/dev/null)
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

    if [ "$http_code" = "200" ]; then
        print_success "API $description responded correctly"
        return 0
    else
        print_error "API $description failed (HTTP $http_code)"
        return 1
    fi
}

# Function to check SEO elements
check_seo() {
    local url=$1

    print_status "Checking SEO elements for: $url"

    # Check meta title
    if curl -s "$url" | grep -q "<title>"; then
        print_success "Meta title found"
    else
        print_warning "Meta title not found"
    fi

    # Check meta description
    if curl -s "$url" | grep -q "name=\"description\""; then
        print_success "Meta description found"
    else
        print_warning "Meta description not found"
    fi

    # Check Open Graph tags
    if curl -s "$url" | grep -q "property=\"og:"; then
        print_success "Open Graph tags found"
    else
        print_warning "Open Graph tags not found"
    fi

    # Check JSON-LD structured data
    if curl -s "$url" | grep -q "application/ld+json"; then
        print_success "JSON-LD structured data found"
    else
        print_warning "JSON-LD structured data not found"
    fi
}

# Function to check security headers
check_security() {
    local url=$1

    print_status "Checking security headers for: $url"

    headers=$(curl -s -I "$url")

    # Check Content Security Policy
    if echo "$headers" | grep -q "Content-Security-Policy"; then
        print_success "Content Security Policy header found"
    else
        print_warning "Content Security Policy header missing"
    fi

    # Check X-Frame-Options
    if echo "$headers" | grep -q "X-Frame-Options"; then
        print_success "X-Frame-Options header found"
    else
        print_warning "X-Frame-Options header missing"
    fi

    # Check HTTPS
    if echo "$url" | grep -q "^https://"; then
        print_success "HTTPS enabled"
    else
        print_warning "HTTPS not enabled"
    fi
}

# Main verification function
main() {
    echo "🧪 CampusFlow Deployment Verification"
    echo "====================================="

    # Get URLs from arguments or prompt
    if [ $# -eq 2 ]; then
        FRONTEND_URL=$1
        BACKEND_URL=$2
    else
        read -p "Enter Frontend URL (e.g., https://campusflow.vercel.app): " FRONTEND_URL
        read -p "Enter Backend URL (e.g., https://campusflow-backend.vercel.app): " BACKEND_URL
    fi

    echo ""
    print_status "Starting verification tests..."
    echo ""

    # Test frontend accessibility
    if test_url "$FRONTEND_URL" 200 "Frontend"; then
        # Test specific pages
        test_url "$FRONTEND_URL/sitemap.xml" 200 "Sitemap"
        test_url "$FRONTEND_URL/robots.txt" 200 "Robots.txt"
        test_url "$FRONTEND_URL/manifest.json" 200 "PWA Manifest"

        # Check SEO
        check_seo "$FRONTEND_URL"

        # Check security
        check_security "$FRONTEND_URL"
    fi

    echo ""

    # Test backend accessibility
    if test_url "$BACKEND_URL" 200 "Backend"; then
        # Test API endpoints
        test_api "$BACKEND_URL/api/health" "Health Check"
        test_api "$BACKEND_URL/api/chat" "Chat API"

        # Check security
        check_security "$BACKEND_URL"
    fi

    echo ""
    print_success "Verification complete!"
    echo ""
    print_status "Manual testing checklist:"
    echo "☐ Test chat functionality in the UI"
    echo "☐ Test document search feature"
    echo "☐ Test email drafting feature"
    echo "☐ Test analytics dashboard"
    echo "☐ Test mobile responsiveness"
    echo "☐ Test PWA installation"
    echo ""
    print_status "If all tests pass, your CampusFlow deployment is ready! 🎉"
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [frontend_url backend_url]"
    echo "Or run without arguments to be prompted for URLs"
    echo ""
fi

# Run main function
main "$@"