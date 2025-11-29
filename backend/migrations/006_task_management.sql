-- Create Projects table
CREATE TABLE IF NOT EXISTS projects (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" character varying NOT NULL,
    "key" character varying NOT NULL,
    "description" text,
    "ownerId" uuid NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_projects" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_projects_key" UNIQUE ("key"),
    CONSTRAINT "FK_projects_owner" FOREIGN KEY ("ownerId") REFERENCES users("id")
);
-- Create Sprints table
CREATE TABLE IF NOT EXISTS sprints (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" character varying NOT NULL,
    "goal" text,
    "status" character varying NOT NULL DEFAULT 'planned',
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "projectId" uuid,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_sprints" PRIMARY KEY ("id"),
    CONSTRAINT "FK_sprints_project" FOREIGN KEY ("projectId") REFERENCES projects("id")
);
-- Create Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "type" character varying NOT NULL DEFAULT 'task',
    "title" character varying NOT NULL,
    "description" text,
    "status" character varying NOT NULL DEFAULT 'todo',
    "priority" character varying NOT NULL DEFAULT 'medium',
    "parentId" uuid,
    "epicId" uuid,
    "assigneeId" uuid,
    "reporterId" uuid NOT NULL,
    "projectId" uuid,
    "sprintId" uuid,
    "points" float,
    "estimatedHours" integer,
    "actualHours" integer,
    "dueDate" TIMESTAMP,
    "startDate" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "tags" text,
    "order" integer NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_tasks" PRIMARY KEY ("id"),
    CONSTRAINT "FK_tasks_parent" FOREIGN KEY ("parentId") REFERENCES tasks("id") ON DELETE
    SET NULL,
        CONSTRAINT "FK_tasks_epic" FOREIGN KEY ("epicId") REFERENCES tasks("id"),
        CONSTRAINT "FK_tasks_assignee" FOREIGN KEY ("assigneeId") REFERENCES users("id"),
        CONSTRAINT "FK_tasks_reporter" FOREIGN KEY ("reporterId") REFERENCES users("id"),
        CONSTRAINT "FK_tasks_project" FOREIGN KEY ("projectId") REFERENCES projects("id"),
        CONSTRAINT "FK_tasks_sprint" FOREIGN KEY ("sprintId") REFERENCES sprints("id")
);
-- Create Comments table
CREATE TABLE IF NOT EXISTS comments (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "content" text NOT NULL,
    "authorId" uuid NOT NULL,
    "taskId" uuid NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_comments" PRIMARY KEY ("id"),
    CONSTRAINT "FK_comments_author" FOREIGN KEY ("authorId") REFERENCES users("id"),
    CONSTRAINT "FK_comments_task" FOREIGN KEY ("taskId") REFERENCES tasks("id") ON DELETE CASCADE
);
-- Create Attachments table
CREATE TABLE IF NOT EXISTS attachments (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "fileName" character varying NOT NULL,
    "filePath" character varying NOT NULL,
    "fileType" character varying NOT NULL,
    "fileSize" integer NOT NULL,
    "uploaderId" uuid NOT NULL,
    "taskId" uuid NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_attachments" PRIMARY KEY ("id"),
    CONSTRAINT "FK_attachments_uploader" FOREIGN KEY ("uploaderId") REFERENCES users("id"),
    CONSTRAINT "FK_attachments_task" FOREIGN KEY ("taskId") REFERENCES tasks("id") ON DELETE CASCADE
);
-- Create Indexes
CREATE INDEX IF NOT EXISTS "IDX_tasks_status" ON tasks ("status");
CREATE INDEX IF NOT EXISTS "IDX_tasks_priority" ON tasks ("priority");
CREATE INDEX IF NOT EXISTS "IDX_tasks_assignee" ON tasks ("assigneeId");
CREATE INDEX IF NOT EXISTS "IDX_tasks_project" ON tasks ("projectId");
CREATE INDEX IF NOT EXISTS "IDX_tasks_sprint" ON tasks ("sprintId");