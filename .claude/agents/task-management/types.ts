/**
 * Task Management System - Type Definitions
 * Comprehensive type system for production-grade task management
 */

// ============================================================================
// Core Task Types
// ============================================================================

export type TaskType = 'epic' | 'story' | 'task' | 'subtask' | 'bug' | 'chore' | 'spike';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'code_review'
  | 'qa'
  | 'staging'
  | 'done'
  | 'blocked'
  | 'cancelled';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;

  // Hierarchy
  parentId?: string;
  childIds: string[];
  epicId?: string;
  path: string[]; // Full hierarchy path

  // Assignment
  assigneeId?: string;
  reporterId: string;
  teamId?: string;
  watchers: string[];

  // Estimation & Time Tracking
  estimate?: number; // Story points
  timeEstimate?: number; // Hours
  actualTime: number; // Actual hours spent
  remainingTime?: number; // Estimated remaining hours

  // Dates
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;

  // Categorization
  labels: string[];
  component?: string;
  version?: string;
  tags: string[];

  // Sprint & Release
  sprintId?: string;
  releaseId?: string;
  milestoneId?: string;

  // Dependencies
  dependencies: TaskDependency[];
  blockedBy: string[];
  blocking: string[];
  relatedTasks: string[];

  // Metadata
  customFields: Record<string, any>;
  attachments: Attachment[];
  comments: Comment[];

  // Metrics
  cycleTime?: number; // Time from TODO to DONE (seconds)
  leadTime?: number; // Time from created to DONE (seconds)
  codeReviewTime?: number;
  qaTime?: number;

  // Flags
  isCriticalPath: boolean;
  isBlocked: boolean;
  isOverdue: boolean;
  hasRisks: boolean;

  // Search
  searchVector?: string;
}

// ============================================================================
// Dependency Types
// ============================================================================

export type DependencyType =
  | 'finish-to-start'  // Most common: B starts after A finishes
  | 'start-to-start'   // B starts when A starts
  | 'finish-to-finish' // B finishes when A finishes
  | 'start-to-finish'; // Rare: B finishes when A starts

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  type: DependencyType;
  lagTime?: number; // Time offset in seconds (can be negative for lead time)
  isCritical: boolean; // Part of critical path
  createdAt: Date;
  createdBy: string;
}

export interface DependencyGraph {
  nodes: Task[];
  edges: TaskDependency[];
  criticalPath: string[]; // Task IDs on critical path
  cycles: string[][]; // Circular dependency chains
}

// ============================================================================
// Sprint & Iteration
// ============================================================================

export type SprintStatus = 'planning' | 'active' | 'completed' | 'archived';

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  capacity: number; // Total story points or hours
  teamId: string;
  status: SprintStatus;

  // Tasks
  taskIds: string[];
  committedPoints: number;
  completedPoints: number;
  carryoverPoints: number;

  // Metrics
  velocity: number; // Historical average
  predictedCompletion: number; // Predicted completion %
  burndownData: BurndownPoint[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  retrospectiveNotes?: string;

  // Health indicators
  isOnTrack: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  alerts: SprintAlert[];
}

export interface BurndownPoint {
  date: Date;
  remainingPoints: number;
  idealRemaining: number;
  completedPoints: number;
}

export interface SprintAlert {
  type: 'velocity_low' | 'overcommitted' | 'blocked_tasks' | 'scope_creep';
  severity: 'warning' | 'critical';
  message: string;
  affectedTasks: string[];
  createdAt: Date;
}

export interface SprintReport {
  sprintId: string;
  sprintName: string;
  duration: number; // Days

  // Commitment
  committedPoints: number;
  completedPoints: number;
  incompletedPoints: number;
  carryoverPoints: number;
  addedPoints: number; // Mid-sprint additions

  // Metrics
  velocity: number;
  completionRate: number; // %
  scopeChangeRate: number; // %

  // Time breakdown
  totalTimeLogged: number; // Hours
  averageCycleTime: number; // Hours
  averageCodeReviewTime: number;

  // Task breakdown
  tasksByType: Record<TaskType, number>;
  tasksByStatus: Record<TaskStatus, number>;

  // Blockers
  blockedDays: number;
  blockerCount: number;

  // Team
  teamMemberContributions: TeamMemberContribution[];

  // Retrospective
  goalsAchieved: boolean;
  improvements: string[];
  challenges: string[];
}

export interface TeamMemberContribution {
  userId: string;
  tasksCompleted: number;
  pointsCompleted: number;
  timeLogged: number;
  codeReviews: number;
}

// ============================================================================
// Milestone & Release
// ============================================================================

export type MilestoneStatus = 'upcoming' | 'in_progress' | 'at_risk' | 'completed' | 'missed';

export interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  status: MilestoneStatus;
  projectId: string;

  // Tasks
  taskIds: string[];
  completedTasks: number;
  totalTasks: number;

  // Dependencies
  dependsOn: string[]; // Other milestone IDs
  blockedBy: string[];

  // Progress
  completionPercentage: number;
  estimatedCompletionDate: Date;
  confidenceLevel: number; // 0-100

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  // Deliverables
  deliverables: Deliverable[];
  acceptanceCriteria: string[];
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  isComplete: boolean;
  completedAt?: Date;
  artifactUrl?: string;
}

// ============================================================================
// Workflow & State Machine
// ============================================================================

export interface Workflow {
  id: string;
  name: string;
  description: string;
  projectId?: string; // Null = global workflow

  states: WorkflowState[];
  transitions: WorkflowTransition[];
  automations: WorkflowAutomation[];

  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface WorkflowState {
  id: string;
  name: string;
  category: 'todo' | 'in_progress' | 'done';
  requiredFields: string[]; // Fields required to enter this state
  validations: StateValidation[];

  // UI
  color: string;
  icon: string;
  order: number;
}

export interface WorkflowTransition {
  id: string;
  fromStateId: string;
  toStateId: string;
  name: string;

  // Conditions
  conditions: TransitionCondition[];
  requiredApprovals: number;

  // Actions
  postActions: TransitionAction[];

  // Permissions
  allowedRoles: string[];
  allowedUsers: string[];
}

export interface StateValidation {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern';
  value?: any;
  errorMessage: string;
}

export interface TransitionCondition {
  type: 'field_value' | 'user_role' | 'approval_count' | 'custom';
  field?: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface TransitionAction {
  type: 'assign' | 'notify' | 'create_subtask' | 'update_field' | 'webhook';
  config: Record<string, any>;
}

export interface WorkflowAutomation {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: TransitionCondition[];
  actions: TransitionAction[];
  isActive: boolean;
}

export interface AutomationTrigger {
  type: 'task_created' | 'status_changed' | 'pr_merged' | 'time_based' | 'field_updated';
  config: Record<string, any>;
}

// ============================================================================
// Analytics & Metrics
// ============================================================================

export interface TeamMetrics {
  teamId: string;
  period: DateRange;

  // Velocity
  averageVelocity: number;
  velocityTrend: TrendData[];
  velocityStdDev: number;

  // Throughput
  tasksCompleted: number;
  throughputPerWeek: number;

  // Cycle Time
  averageCycleTime: number; // Hours
  cycleTimes: CycleTimeBreakdown;
  cycleTimeTrend: TrendData[];

  // Lead Time
  averageLeadTime: number; // Hours
  leadTimeTrend: TrendData[];

  // WIP
  averageWIP: number;
  maxWIP: number;
  wipTrend: TrendData[];

  // Quality
  bugRate: number; // Bugs per feature
  reopenRate: number; // % of tasks reopened
  codeReviewTime: number; // Average hours

  // Workload
  totalCapacity: number;
  utilization: number; // %
  overloadedMembers: string[];

  // DORA Metrics
  doraMetrics: DORAMetrics;
}

export interface CycleTimeBreakdown {
  todo: number;
  inProgress: number;
  codeReview: number;
  qa: number;
  staging: number;
  total: number;
}

export interface DORAMetrics {
  // Deployment Frequency
  deploymentsPerDay: number;
  deploymentFrequency: 'elite' | 'high' | 'medium' | 'low';

  // Lead Time for Changes
  leadTimeForChanges: number; // Hours
  leadTimeRating: 'elite' | 'high' | 'medium' | 'low';

  // Change Failure Rate
  changeFailureRate: number; // %
  failureRateRating: 'elite' | 'high' | 'medium' | 'low';

  // Mean Time to Recovery
  mttr: number; // Hours
  mttrRating: 'elite' | 'high' | 'medium' | 'low';

  // Overall
  overallRating: 'elite' | 'high' | 'medium' | 'low';
}

export interface TrendData {
  date: Date;
  value: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// ============================================================================
// Workload & Resource Management
// ============================================================================

export interface WorkloadData {
  userId?: string;
  teamId?: string;
  period: DateRange;

  // Current workload
  assignedTasks: number;
  totalEstimatedHours: number;
  totalStoryPoints: number;

  // Capacity
  availableHours: number;
  utilization: number; // %

  // Breakdown
  tasksByPriority: Record<TaskPriority, number>;
  tasksByStatus: Record<TaskStatus, number>;

  // Time allocation
  scheduledWork: ScheduledWork[];
  conflicts: WorkloadConflict[];

  // Health
  isOverloaded: boolean;
  burnoutRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface ScheduledWork {
  taskId: string;
  taskTitle: string;
  scheduledHours: number;
  startDate: Date;
  endDate: Date;
  priority: TaskPriority;
}

export interface WorkloadConflict {
  type: 'overallocation' | 'deadline_clash' | 'dependency_issue';
  description: string;
  affectedTasks: string[];
  suggestedAction: string;
}

// ============================================================================
// AI & Predictions
// ============================================================================

export interface EstimationSuggestion {
  taskId: string;
  suggestedPoints: number;
  suggestedHours: number;
  confidence: number; // 0-100
  reasoning: string;
  similarTasks: SimilarTask[];
}

export interface SimilarTask {
  taskId: string;
  title: string;
  similarity: number; // 0-100
  actualPoints: number;
  actualHours: number;
}

export interface CompletionPrediction {
  entityId: string; // Sprint, milestone, or project ID
  entityType: 'sprint' | 'milestone' | 'project';

  predictedCompletionDate: Date;
  confidence: number; // 0-100

  // Risk factors
  risks: RiskFactor[];
  blockers: string[];
  assumptions: string[];

  // Scenarios
  bestCase: Date;
  worstCase: Date;
  mostLikely: Date;
}

export interface RiskFactor {
  type: 'dependency' | 'resource' | 'scope' | 'technical' | 'external';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  mitigation: string;
  probability: number; // 0-100
}

export interface Bottleneck {
  type: 'resource' | 'dependency' | 'process' | 'technical';
  location: string; // Task ID, team, or process name
  description: string;
  impact: number; // Delay in hours
  affectedTasks: string[];
  suggestions: string[];
}

// ============================================================================
// Comments & Collaboration
// ============================================================================

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;

  // Threading
  parentCommentId?: string;
  replies: string[];

  // Mentions
  mentions: string[]; // User IDs

  // Attachments
  attachments: Attachment[];

  // Reactions
  reactions: Reaction[];
}

export interface Reaction {
  emoji: string;
  userId: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// ============================================================================
// Work Logs & Time Tracking
// ============================================================================

export interface WorkLog {
  id: string;
  taskId: string;
  userId: string;
  timeSpent: number; // Minutes
  loggedAt: Date;
  description: string;
  isBillable: boolean;

  // Automatic tracking
  startedAt?: Date;
  endedAt?: Date;
  isAutomatic: boolean;
}

// ============================================================================
// State Transition History
// ============================================================================

export interface StateTransition {
  id: string;
  taskId: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  userId: string;
  transitionedAt: Date;
  comment?: string;

  // Duration in previous state
  durationInState?: number; // Seconds

  // Automation
  triggeredBy?: string; // Automation ID if automated
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateTaskDTO {
  type: TaskType;
  title: string;
  description: string;
  priority: TaskPriority;
  parentId?: string;
  assigneeId?: string;
  teamId?: string;
  estimate?: number;
  timeEstimate?: number;
  startDate?: Date;
  dueDate?: Date;
  labels?: string[];
  sprintId?: string;
  customFields?: Record<string, any>;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  estimate?: number;
  timeEstimate?: number;
  startDate?: Date;
  dueDate?: Date;
  labels?: string[];
  sprintId?: string;
  customFields?: Record<string, any>;
}

export interface TaskFilters {
  type?: TaskType[];
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  teamId?: string;
  sprintId?: string;
  milestoneId?: string;
  labels?: string[];
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  dueAfter?: Date;
  dueBefore?: Date;
  isBlocked?: boolean;
  isCriticalPath?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// ============================================================================
// System Configuration
// ============================================================================

export interface TaskManagementConfig {
  // Limits
  maxTaskHierarchyDepth: number;
  maxDependencyChainLength: number;
  maxActiveTasksPerUser: number;
  maxSprintDuration: number; // Days

  // Defaults
  defaultWorkflow: string;
  defaultSprintDuration: number;
  defaultEstimationUnit: 'points' | 'hours';

  // Features
  enableAIEstimation: boolean;
  enableAutoTransitions: boolean;
  enableTimeTracking: boolean;
  enableWorkloadWarnings: boolean;

  // Workflows
  workflows: Workflow[];

  // Notifications
  notifyOnTaskAssigned: boolean;
  notifyOnTaskBlocked: boolean;
  notifyOnSprintStart: boolean;
  notifyOnMilestoneAtRisk: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export class CircularDependencyError extends Error {
  constructor(
    message: string,
    public cycle: string[]
  ) {
    super(message);
    this.name = 'CircularDependencyError';
  }
}

export class WorkflowValidationError extends Error {
  constructor(
    message: string,
    public validationErrors: ValidationError[]
  ) {
    super(message);
    this.name = 'WorkflowValidationError';
  }
}

export class CapacityExceededError extends Error {
  constructor(
    message: string,
    public currentCapacity: number,
    public requiredCapacity: number
  ) {
    super(message);
    this.name = 'CapacityExceededError';
  }
}
