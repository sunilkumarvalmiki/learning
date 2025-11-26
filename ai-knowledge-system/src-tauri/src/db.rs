use sqlx::{PgPool, postgres::PgPoolOptions};
use std::env;

pub struct Database {
    pub pool: PgPool,
}

impl Database {
    pub async fn new() -> Result<Self, sqlx::Error> {
        // Load DATABASE_URL from environment
        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5432/ai_knowledge_dev".to_string());
        
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await?;
        
        Ok(Database { pool })
    }
    
    pub fn pool(&self) -> &PgPool {
        &self.pool
    }
}
