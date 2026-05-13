#!/bin/bash
# Start local development environment
# Run from project root: ./scripts/dev.sh

set -e

echo "Starting Supabase..."
supabase start

echo ""
echo "Applying migrations and seed data..."
supabase db reset

echo ""
echo "Starting Next.js dev server..."
cd app && npm run dev
