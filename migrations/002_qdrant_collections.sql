-- Migration 002: Qdrant Vector Collections Setup
-- Although Qdrant is a separate database, this documents the collection schemas
-- Run these via Qdrant HTTP API or Rust client

-- ===========================================
-- COLLECTION: documents
-- ===========================================

-- HTTP API:
-- PUT http://localhost:6334/collections/documents

{
  "vectors": {
    "size": 384,
    "distance": "Cosine"
  },
  "optimizers_config": {
    "default_segment_number": 2,
    "indexing_threshold": 20000
  },
  "hnsw_config": {
    "m": 16,
    "ef_construct": 100,
    "full_scan_threshold": 10000
  },
  "quantization_config": {
    "scalar": {
      "type": "int8",
      "quantile": 0.99,
      "always_ram": true
    }
  }
}

-- Payload schema (stored with each vector):
-- {
--   "document_id": "UUID",
--   "user_id": "UUID",
--   "workspace_id": "UUID", (optional)
--   "title": "string",
--   "file_type": "pdf|docx|txt|md|image|video|audio|other",
--   "chunk_index": 0, (for multi-chunk documents)
--   "created_at": "2025-01-25T12:00:00Z"
-- }

-- Payload index (for filtering):
-- POST http://localhost:6334/collections/documents/index
{
  "field_name": "user_id",
  "field_schema": "keyword"
}

{
  "field_name": "workspace_id",
  "field_schema": "keyword"
}

{
  "field_name": "file_type",
  "field_schema": "keyword"
}

{
  "field_name": "created_at",
  "field_schema": "datetime"
}

-- ===========================================
-- COLLECTION: notes
-- ===========================================

-- PUT http://localhost:6334/collections/notes

{
  "vectors": {
    "size": 384,
    "distance": "Cosine"
  },
  "optimizers_config": {
    "default_segment_number": 2,
    "indexing_threshold": 20000
  },
  "hnsw_config": {
    "m": 16,
    "ef_construct": 100,
    "full_scan_threshold": 10000
  },
  "quantization_config": {
    "scalar": {
      "type": "int8",
      "quantile": 0.99,
      "always_ram": true
    }
  }
}

-- Payload schema:
-- {
--   "note_id": "UUID",
--   "user_id": "UUID",
--   "workspace_id": "UUID", (optional)
--   "title": "string",
--   "created_at": "2025-01-25T12:00:00Z"
-- }

-- Payload index:
{
  "field_name": "user_id",
  "field_schema": "keyword"
}

{
  "field_name": "workspace_id",
  "field_schema": "keyword"
}

-- ===========================================
-- Rust Client Example
-- ===========================================

/*
use qdrant_client::{
    client::QdrantClient,
    qdrant::{
        vectors_config::Config, CreateCollection, Distance, HnswConfigDiff,
        OptimizersConfigDiff, QuantizationConfig, QuantizationType, ScalarQuantization,
        VectorParams, VectorsConfig,
    },
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = QdrantClient::from_url("http://localhost:6334").build()?;

    // Create documents collection
    client
        .create_collection(&CreateCollection {
            collection_name: "documents".to_string(),
            vectors_config: Some(VectorsConfig {
                config: Some(Config::Params(VectorParams {
                    size: 384,
                    distance: Distance::Cosine.into(),
                    hnsw_config: Some(HnswConfigDiff {
                        m: Some(16),
                        ef_construct: Some(100),
                        full_scan_threshold: Some(10000),
                        ..Default::default()
                    }),
                    quantization_config: Some(QuantizationConfig {
                        quantization: Some(
                            QuantizationType::Scalar(ScalarQuantization {
                                r#type: 1, // int8
                                quantile: Some(0.99),
                                always_ram: Some(true),
                            }),
                        ),
                    }),
                    ..Default::default()
                })),
            }),
            ..Default::default()
        })
        .await?;

    // Create payload index for user_id
    client
        .create_field_index(
            "documents",
            "user_id",
            qdrant_client::qdrant::FieldType::Keyword,
            None,
            None,
        )
        .await?;

    println!("Qdrant collections created successfully!");
    Ok(())
}
*/
