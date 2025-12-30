/**
 * Knowledge Base Ingestion Script
 * 
 * This script reads all knowledge base JSON files, generates embeddings,
 * and stores them for semantic search.
 * 
 * Usage: npm run ingest
 */

import { ingestDocuments, loadKnowledgeBase } from '../services/knowledgeService';

async function main() {
  console.log('🚀 Starting Knowledge Base Ingestion\n');
  console.log('=' .repeat(50));
  
  try {
    // Load and display document count
    const documents = loadKnowledgeBase();
    console.log(`\n📊 Found ${documents.length} documents to process\n`);
    
    // Check if we should use Supabase (based on env)
    const useSupabase = process.argv.includes('--supabase');
    
    if (useSupabase) {
      console.log('📦 Mode: Supabase (remote storage)\n');
    } else {
      console.log('📦 Mode: Local (file-based cache)\n');
    }
    
    // Run ingestion
    await ingestDocuments(useSupabase);
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Ingestion complete!');
    console.log('\nYou can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  }
}

main();
