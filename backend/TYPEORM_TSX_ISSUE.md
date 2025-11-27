# TypeORM + tsx Decorator Issue - Workaround Guide

## Problem

TypeORM entities fail with `tsx` transpiler:

```
ColumnTypeUndefinedError: Column type for Document#title is not defined
```

## Root Cause

The `tsx` transpiler doesn't properly emit decorator metadata, even with:

- `emitDecoratorMetadata: true` in tsconfig.json
- `import 'reflect-metadata'` at top of entry file
- `experimentalDecorators: true` enabled

This is a known limitation of tsx when used with TypeORM.

## Solutions

### Option 1: Use ts-node (Recommended for Development)

```bash
npm install --save-dev ts-node
npx ts-node src/index.ts
```

### Option 2: Compile TypeScript First

```bash
npm run build
node dist/index.js
```

### Option 3: Use ts-node-dev for Watch Mode

```bash
npm install --save-dev ts-node-dev
npx ts-node-dev --respawn src/index.ts
```

### Option 4: Skip TypeORM Entities (Use Raw SQL)

Our services can work with raw SQL queries via pg Pool.
This is what we're currently using since the schema is perfect.

## Current Status

✅ **Database**: Fully functional with all 12 tables  
✅ **Schema**: Complete with vector extension  
✅ **Services**: API code complete  
❌ **Dev Server**: Blocked by tsx/TypeORM incompatibility  

## Next Steps

1. Install ts-node: `npm install --save-dev ts-node`
2. Start with: `npx ts-node src/index.ts`
3. Or compile first: `npm run build && node dist/index.js`

## Related Links

- <https://github.com/privatenumber/tsx/issues/354>
- <https://typeorm.io/faq#how-to-use-webpack-for-the-backend>
- <https://github.com/TypeStrong/ts-node>

## Database Verification (Working!)

The database itself works perfectly:

```bash
# Test connection
node -e "const {Client}=require('pg');..."  # ✅ Works

# View tables
docker exec knowledge-postgres psql -U postgres -d knowledge_db -c "\dt"  # ✅ 12 tables

# Check extensions
docker exec knowledge-postgres psql -U postgres -d knowledge_db -c "\dx"  # ✅ vector installed
```
