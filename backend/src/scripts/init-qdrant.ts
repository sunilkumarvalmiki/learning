import { QdrantClient } from '@qdrant/js-client-rest';
import config from '../config';

const qdrantClient = new QdrantClient({
    url: config.qdrant.url,
    apiKey: config.qdrant.apiKey,
});

export async function initializeQdrant() {
    console.log('🔄 Initializing Qdrant collections...\n');

    try {
        // Create documents collection
        console.log('📄 Creating "documents" collection...');
        try {
            await qdrantClient.createCollection('documents', {
                vectors: {
                    size: 384, // all-MiniLM-L6-v2 dimension (free HuggingFace model)
                    distance: 'Cosine',
                },
                optimizers_config: {
                    default_segment_number: 2,
                    indexing_threshold: 20000,
                },
                hnsw_config: {
                    m: 16,
                    ef_construct: 100,
                    full_scan_threshold: 10000,
                },
            });
            console.log('✅ Documents collection created\n');
        } catch (error: any) {
            if (error.status === 409) {
                console.log('⚠️  Documents collection already exists\n');
            } else {
                throw error;
            }
        }

        // Create payload indexes for filtering
        console.log('📄 Creating payload indexes...');
        try {
            await qdrantClient.createPayloadIndex('documents', {
                field_name: 'user_id',
                field_schema: 'keyword',
            });
            await qdrantClient.createPayloadIndex('documents', {
                field_name: 'file_type',
                field_schema: 'keyword',
            });
            console.log('✅ Payload indexes created\n');
        } catch (error: any) {
            if (error.status === 409) {
                console.log('⚠️  Payload indexes already exist\n');
            } else {
                throw error;
            }
        }

        // Create notes collection
        console.log('📄 Creating "notes" collection...');
        try {
            await qdrantClient.createCollection('notes', {
                vectors: {
                    size: 384, // all-MiniLM-L6-v2 dimension (free HuggingFace model)
                    distance: 'Cosine',
                },
                optimizers_config: {
                    default_segment_number: 2,
                    indexing_threshold: 20000,
                },
                hnsw_config: {
                    m: 16,
                    ef_construct: 100,
                    full_scan_threshold: 10000,
                },
            });
            console.log('✅ Notes collection created\n');
        } catch (error: any) {
            if (error.status === 409) {
                console.log('⚠️  Notes collection already exists\n');
            } else {
                throw error;
            }
        }

        // Verify collections
        const collections = await qdrantClient.getCollections();
        console.log('📊 Qdrant collections:');
        collections.collections.forEach((col) => {
            console.log(`   - ${col.name}`);
        });

        console.log('\n✅ Qdrant initialization completed!');
    } catch (error) {
        console.error('\n❌ Qdrant initialization failed:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    initializeQdrant()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export { qdrantClient };
