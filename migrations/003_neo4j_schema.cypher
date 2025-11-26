// Migration 003: Neo4j Knowledge Graph Schema
// Cypher queries to set up constraints and indexes

// ===========================================
// CONSTRAINTS (Uniqueness)
// ===========================================

// Entity nodes must have unique IDs
CREATE CONSTRAINT entity_id_unique IF NOT EXISTS
FOR (e:Entity) REQUIRE e.id IS UNIQUE;

// User nodes must have unique IDs
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

// Document nodes must have unique IDs
CREATE CONSTRAINT document_id_unique IF NOT EXISTS
FOR (d:Document) REQUIRE d.id IS UNIQUE;

// Note nodes must have unique IDs
CREATE CONSTRAINT note_id_unique IF NOT EXISTS
FOR (n:Note) REQUIRE n.id IS UNIQUE;

// ===========================================
// INDEXES (Performance)
// ===========================================

// Index on entity name for fast lookups
CREATE INDEX entity_name_index IF NOT EXISTS
FOR (e:Entity) ON (e.name);

// Index on entity type
CREATE INDEX entity_type_index IF NOT EXISTS
FOR (e:Entity) ON (e.type);

// Index on document title
CREATE INDEX document_title_index IF NOT EXISTS
FOR (d:Document) ON (d.title);

// ===========================================
// NODE LABELS & PROPERTIES
// ===========================================

/*
Node: User
Properties:
  - id: UUID (from PostgreSQL)
  - email: String
  - full_name: String

Node: Document
Properties:
  - id: UUID (from PostgreSQL)
  - title: String
  - file_type: String
  - created_at: DateTime

Node: Note
Properties:
  - id: UUID (from PostgreSQL)
  - title: String
  - created_at: DateTime

Node: Entity (extracted concepts)
Properties:
  - id: UUID (auto-generated)
  - name: String (e.g., "Machine Learning", "Python")
  - type: String (e.g., "CONCEPT", "PERSON", "ORGANIZATION", "LOCATION")
  - description: String (optional)
  - confidence: Float (NER confidence score 0-1)

Node: Tag
Properties:
  - id: UUID (from PostgreSQL)
  - name: String
  - color: String
*/

// ===========================================
// RELATIONSHIPS
// ===========================================

/*
Relationship: (User)-[:OWNS]->(Document)
Relationship: (User)-[:OWNS]->(Note)

Relationship: (Document)-[:CONTAINS]->(Entity)
Properties:
  - frequency: Integer (how many times entity appears)
  - relevance: Float (TF-IDF or similar)

Relationship: (Note)-[:CONTAINS]->(Entity)
Properties:
  - frequency: Integer
  - relevance: Float

Relationship: (Document)-[:TAGGED_WITH]->(Tag)
Relationship: (Note)-[:TAGGED_WITH]->(Tag)

Relationship: (Entity)-[:RELATED_TO]->(Entity)
Properties:
  - weight: Float (co-occurrence strength)
  - type: String (e.g., "SYNONYM", "HYPERNYM", "RELATED")

Relationship: (Document)-[:CITES]->(Document)
Properties:
  - context: String (citation context)

Relationship: (Note)-[:REFERENCES]->(Document)
Properties:
  - excerpt: String (quoted text)
*/

// ===========================================
// SAMPLE DATA INSERTION
// ===========================================

// Create sample user
CREATE (u:User {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'demo@example.com',
    full_name: 'Demo User'
});

// Create sample document
CREATE (d:Document {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Introduction to Machine Learning',
    file_type: 'pdf',
    created_at: datetime('2025-01-25T12:00:00Z')
});

// Create entities
CREATE (e1:Entity {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Machine Learning',
    type: 'CONCEPT',
    confidence: 0.95
});

CREATE (e2:Entity {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Neural Networks',
    type: 'CONCEPT',
    confidence: 0.92
});

// Create relationships
MATCH (u:User {id: '00000000-0000-0000-0000-000000000001'})
MATCH (d:Document {id: '00000000-0000-0000-0000-000000000002'})
CREATE (u)-[:OWNS]->(d);

MATCH (d:Document {id: '00000000-0000-0000-0000-000000000002'})
MATCH (e:Entity {id: '00000000-0000-0000-0000-000000000003'})
CREATE (d)-[:CONTAINS {frequency: 15, relevance: 0.85}]->(e);

MATCH (e1:Entity {id: '00000000-0000-0000-0000-000000000003'})
MATCH (e2:Entity {id: '00000000-0000-0000-0000-000000000004'})
CREATE (e1)-[:RELATED_TO {weight: 0.78, type: 'RELATED'}]->(e2);

// ===========================================
// USEFUL QUERIES
// ===========================================

// Find all entities in a document
/*
MATCH (d:Document {id: $document_id})-[c:CONTAINS]->(e:Entity)
RETURN e.name, e.type, c.frequency, c.relevance
ORDER BY c.relevance DESC;
*/

// Find related entities (knowledge graph traversal)
/*
MATCH (e1:Entity {name: $entity_name})-[:RELATED_TO]-(e2:Entity)
RETURN e2.name, e2.type
ORDER BY e2.name;
*/

// Find documents containing specific entity
/*
MATCH (d:Document)-[:CONTAINS]->(e:Entity {name: $entity_name})
RETURN d.title, d.id
ORDER BY d.created_at DESC;
*/

// Find user's knowledge graph
/*
MATCH (u:User {id: $user_id})-[:OWNS]->(d:Document)-[:CONTAINS]->(e:Entity)
RETURN DISTINCT e.name, e.type, count(d) as document_count
ORDER BY document_count DESC
LIMIT 20;
*/

// Find citation network (documents citing each other)
/*
MATCH path = (d1:Document)-[:CITES*1..3]->(d2:Document)
WHERE d1.id = $document_id
RETURN path;
*/
