/**
 * Queue System
 * In-memory job queue with retry logic and persistence option
 */

import { prisma } from '@/lib/db'

// =====================================================
// Types
// =====================================================

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRY'

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'

export interface Job {
  id: string
  name: string
  data: Record<string, any>
  status: JobStatus
  priority: JobPriority
  attempts: number
  maxAttempts: number
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  failedAt?: Date
  error?: string
  result?: any
  scheduledFor?: Date
}

export interface JobHandler {
  (data: Record<string, any>): Promise<any>
}

export interface QueueOptions {
  name: string
  maxRetries?: number
  retryDelay?: number // ms
  concurrency?: number
}

// =====================================================
// In-Memory Queue (Single Process)
// =====================================================

class InMemoryQueue {
  private jobs: Map<string, Job> = new Map()
  private handlers: Map<string, JobHandler> = new Map()
  private processing = new Set<string>()
  private options: QueueOptions
  private maxConcurrency: number

  constructor(options: QueueOptions) {
    this.options = {
      maxRetries: 3,
      retryDelay: 5000,
      concurrency: 1,
      ...options,
    }
    this.maxConcurrency = this.options.concurrency ?? 1

    // Start processing loop
    this.startProcessing()
  }

  /**
   * Register a job handler
   */
  register(name: string, handler: JobHandler): void {
    this.handlers.set(name, handler)
  }

  /**
   * Add a job to the queue
   */
  async add(
    name: string,
    data: Record<string, any> = {},
    options: {
      priority?: JobPriority
      maxAttempts?: number
      scheduledFor?: Date
    } = {}
  ): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const job: Job = {
      id,
      name,
      data,
      status: 'PENDING',
      priority: options.priority || 'NORMAL',
      attempts: 0,
      maxAttempts: options.maxAttempts || this.options.maxRetries!,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledFor: options.scheduledFor,
    }

    this.jobs.set(id, job)

    // Store in database for persistence
    await this.persistJob(job)

    return id
  }

  /**
   * Process pending jobs
   */
  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.name)

    if (!handler) {
      console.error(`[QUEUE] No handler for job: ${job.name}`)
      job.status = 'FAILED'
      job.error = `No handler registered for: ${job.name}`
      return
    }

    job.status = 'PROCESSING'
    job.attempts++
    job.updatedAt = new Date()

    try {
      const result = await handler(job.data)
      job.status = 'COMPLETED'
      job.completedAt = new Date()
      job.result = result
    } catch (error: any) {
      job.error = error.message || 'Unknown error'
      job.updatedAt = new Date()

      if (job.attempts < job.maxAttempts) {
        job.status = 'RETRY'
        // Schedule retry
        setTimeout(() => {
          job.status = 'PENDING'
        }, this.options.retryDelay)
      } else {
        job.status = 'FAILED'
        job.failedAt = new Date()
      }
    }

    // Update in database
    await this.persistJob(job)
  }

  /**
   * Start the processing loop
   */
  private startProcessing(): void {
    setInterval(async () => {
      if (this.processing.size >= this.maxConcurrency) return

      // Get pending jobs sorted by priority
      const pendingJobs = Array.from(this.jobs.values())
        .filter((job) =>
          job.status === 'PENDING' &&
          !this.processing.has(job.id) &&
          (!job.scheduledFor || job.scheduledFor <= new Date())
        )
        .sort((a, b) => {
          const priorityOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })

      for (const job of pendingJobs) {
        if (this.processing.size >= this.maxConcurrency) break

        this.processing.add(job.id)
        this.processJob(job).finally(() => {
          this.processing.delete(job.id)
        })
      }
    }, 1000)
  }

  /**
   * Get job status
   */
  getJob(id: string): Job | undefined {
    return this.jobs.get(id)
  }

  /**
   * Get all jobs
   */
  getJobs(filter?: {
    status?: JobStatus
    name?: string
    limit?: number
  }): Job[] {
    let jobs = Array.from(this.jobs.values())

    if (filter?.status) {
      jobs = jobs.filter((job) => job.status === filter.status)
    }

    if (filter?.name) {
      jobs = jobs.filter((job) => job.name === filter.name)
    }

    jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    if (filter?.limit) {
      jobs = jobs.slice(0, filter.limit)
    }

    return jobs
  }

  /**
   * Retry a failed job
   */
  async retry(id: string): Promise<boolean> {
    const job = this.jobs.get(id)

    if (!job) return false

    job.status = 'PENDING'
    job.attempts = 0
    job.error = undefined
    job.updatedAt = new Date()

    await this.persistJob(job)

    return true
  }

  /**
   * Cancel a job
   */
  async cancel(id: string): Promise<boolean> {
    const job = this.jobs.get(id)

    if (!job) return false

    if (job.status === 'PROCESSING') return false

    job.status = 'FAILED'
    job.error = 'Cancelled by user'
    job.updatedAt = new Date()

    await this.persistJob(job)

    return true
  }

  /**
   * Persist job to database
   */
  private async persistJob(job: Job): Promise<void> {
    try {
      await prisma.queueJob.upsert({
        where: { id: job.id },
        create: {
          id: job.id,
          name: job.name,
          data: job.data,
          status: job.status,
          priority: job.priority,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          error: job.error,
          result: job.result,
          scheduledFor: job.scheduledFor,
          completedAt: job.completedAt,
          failedAt: job.failedAt,
        },
        update: {
          status: job.status,
          attempts: job.attempts,
          error: job.error,
          result: job.result,
          scheduledFor: job.scheduledFor,
          completedAt: job.completedAt,
          failedAt: job.failedAt,
        },
      })
    } catch (error) {
      console.error('[QUEUE] Failed to persist job:', error)
    }
  }

  /**
   * Load jobs from database on startup
   */
  async loadFromDatabase(): Promise<void> {
    try {
      const dbJobs = await prisma.queueJob.findMany({
        where: {
          status: { in: ['PENDING', 'RETRY'] },
        },
      })

      for (const dbJob of dbJobs) {
        const job: Job = {
          id: dbJob.id,
          name: dbJob.name,
          data: dbJob.data as Record<string, any>,
          status: dbJob.status as JobStatus,
          priority: dbJob.priority as JobPriority,
          attempts: dbJob.attempts,
          maxAttempts: dbJob.maxAttempts,
          createdAt: dbJob.createdAt,
          updatedAt: dbJob.updatedAt,
          completedAt: dbJob.completedAt || undefined,
          failedAt: dbJob.failedAt || undefined,
          error: dbJob.error || undefined,
          result: dbJob.result || undefined,
          scheduledFor: dbJob.scheduledFor || undefined,
        }

        this.jobs.set(job.id, job)
      }

      console.log(`[QUEUE] Loaded ${dbJobs.length} jobs from database`)
    } catch (error) {
      console.error('[QUEUE] Failed to load jobs from database:', error)
    }
  }
}

// =====================================================
// Queue Registry
// =====================================================

const queues = new Map<string, InMemoryQueue>()

/**
 * Get or create a queue
 */
export function getQueue(name: string, options?: QueueOptions): InMemoryQueue {
  let queue = queues.get(name)

  if (!queue) {
    queue = new InMemoryQueue({ name, ...options })
    queues.set(name, queue)
  }

  return queue
}

/**
 * Get all queues
 */
export function getAllQueues(): InMemoryQueue[] {
  return Array.from(queues.values())
}

// =====================================================
// Predefined Queues
// =====================================================

export const QUEUES = {
  EMAIL: 'email',
  EXPORT: 'export',
  SYNC: 'sync',
  NOTIFICATION: 'notification',
  CLEANUP: 'cleanup',
} as const

// =====================================================
// Common Job Handlers
// =====================================================

/**
 * Email job handler
 */
export async function handleEmailJob(data: {
  to: string
  subject: string
  template: string
  context?: Record<string, any>
}): Promise<void> {
  // In production, integrate with email service
  console.log(`[EMAIL JOB] Sending to: ${data.to}`)
  console.log(`[EMAIL JOB] Subject: ${data.subject}`)

  // Simulate async email sending
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // throw new Error('Simulated email failure') // Uncomment to test retry
}

/**
 * Export job handler
 */
export async function handleExportJob(data: {
  userId: string
  type: string
  format: string
  params: Record<string, any>
}): Promise<{ url: string }> {
  console.log(`[EXPORT JOB] Generating: ${data.type} ${data.format}`)

  // Simulate export generation
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return {
    url: `/exports/${data.userId}/${data.type}-${Date.now()}.${data.format}`,
  }
}

/**
 * Sync job handler
 */
export async function handleSyncJob(data: {
  type: 'kalender' | 'proker' | 'all'
  options?: Record<string, any>
}): Promise<{ synced: number }> {
  console.log(`[SYNC JOB] Syncing: ${data.type}`)

  // Import and run sync
  const { syncAllProkerDeadlines } = await import('./kalender-sync')

  if (data.type === 'kalender' || data.type === 'all') {
    await syncAllProkerDeadlines()
  }

  return { synced: 1 }
}

/**
 * Notification job handler
 */
export async function handleNotificationJob(data: {
  userId: string
  title: string
  message: string
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
}): Promise<void> {
  // Create notification in database
  await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'INFO',
    },
  })
}

/**
 * Cleanup job handler
 */
export async function handleCleanupJob(data: {
  type: 'orphans' | 'sessions' | 'logs'
  options?: Record<string, any>
}): Promise<{ deleted: number }> {
  console.log(`[CLEANUP JOB] Running: ${data.type}`)

  let deleted = 0

  if (data.type === 'orphans') {
    const { cleanupOrphanedMedia } = await import('./media-manager')
    const result = await cleanupOrphanedMedia()
    deleted = result.deleted
  } else if (data.type === 'sessions') {
    // Clean up expired sessions
    const result = await prisma.session.deleteMany({
      where: {
        expires: { lt: new Date() },
      },
    })
    deleted = result.count
  } else if (data.type === 'logs') {
    // Clean up old audit logs (keep 90 days)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    })
    deleted = result.count
  }

  return { deleted }
}

// =====================================================
// Queue API Helpers
// =====================================================

/**
 * Schedule a job
 */
export async function scheduleJob(
  queueName: string,
  jobName: string,
  data: Record<string, any>,
  options?: {
    priority?: JobPriority
    scheduledFor?: Date
  }
): Promise<string> {
  const queue = getQueue(queueName)
  return queue.add(jobName, data, options)
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string): Job | undefined {
  for (const queue of Array.from(queues.values())) {
    const job = queue.getJob(jobId)
    if (job) return job
  }
  return undefined
}

/**
 * Retry failed job
 */
export async function retryFailedJob(jobId: string): Promise<boolean> {
  for (const queue of Array.from(queues.values())) {
    const job = queue.getJob(jobId)
    if (job) {
      return queue.retry(jobId)
    }
  }
  return false
}

/**
 * Cancel job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  for (const queue of Array.from(queues.values())) {
    const job = queue.getJob(jobId)
    if (job) {
      return queue.cancel(jobId)
    }
  }
  return false
}

// =====================================================
// Initialize Queues
// =====================================================

/**
 * Initialize all queues with handlers
 */
export function initializeQueues(): void {
  const emailQueue = getQueue(QUEUES.EMAIL)
  emailQueue.register('send', handleEmailJob as JobHandler)

  const exportQueue = getQueue(QUEUES.EXPORT)
  exportQueue.register('generate', handleExportJob as JobHandler)

  const syncQueue = getQueue(QUEUES.SYNC)
  syncQueue.register('sync', handleSyncJob as JobHandler)

  const notificationQueue = getQueue(QUEUES.NOTIFICATION)
  notificationQueue.register('notify', handleNotificationJob as JobHandler)

  const cleanupQueue = getQueue(QUEUES.CLEANUP)
  cleanupQueue.register('cleanup', handleCleanupJob as JobHandler)

  // Load pending jobs from database
  for (const queue of Array.from(queues.values())) {
    queue.loadFromDatabase()
  }

  console.log('[QUEUE] All queues initialized')
}
