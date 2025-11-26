import { Client as MinioClient } from 'minio';
import config from '../config';

export const minioClient = new MinioClient({
    endPoint: config.minio.endPoint,
    port: config.minio.port,
    useSSL: config.minio.useSSL,
    accessKey: config.minio.accessKey,
    secretKey: config.minio.secretKey,
});

export async function initializeMinIO() {
    console.log('🔄 Initializing MinIO storage...\n');

    try {
        const bucketName = config.minio.bucket;

        // Check if bucket exists
        const exists = await minioClient.bucketExists(bucketName);

        if (!exists) {
            console.log(`📄 Creating bucket: ${bucketName}`);
            await minioClient.makeBucket(bucketName, 'us-east-1');
            console.log(`✅ Bucket created: ${bucketName}\n`);
        } else {
            console.log(`⚠️  Bucket already exists: ${bucketName}\n`);
        }

        // List all buckets to verify
        const buckets = await minioClient.listBuckets();
        console.log('📊 MinIO buckets:');
        buckets.forEach((bucket) => {
            console.log(`   - ${bucket.name} (created: ${bucket.creationDate})`);
        });

        console.log('\n✅ MinIO initialization completed!');
    } catch (error) {
        console.error('\n❌ MinIO initialization failed:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    initializeMinIO()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
