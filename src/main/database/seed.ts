/**
 * Database Seed Script
 * ====================
 *
 * Populates the OpenJuliet database with demo data:
 *   - Sample AI providers (OpenAI, Anthropic)
 *   - Sample app settings
 *   - Sample project with tasks and activity history
 *
 * Usage (from project root):
 *   npx ts-node --project tsconfig.node.json src/main/database/seed.ts
 *
 * Or after build:
 *   node out/main/database/seed.js
 *
 * Custom database path:
 *   npx ts-node --project tsconfig.node.json src/main/database/seed.ts --db-path=/custom/path/openjuliet.db
 */

import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { init, query, setSetting } from './index'

// ── Parse CLI args for custom db path ────────────────────────────────────
function getDbPath(): string | undefined {
  const idx = process.argv.findIndex((a) => a.startsWith('--db-path='))
  return idx >= 0 ? process.argv[idx].split('=')[1] : undefined
}

// ── Seed data ─────────────────────────────────────────────────────────────

const NOW = new Date().toISOString().replace('T', ' ').slice(0, 19) // SQLite datetime

const PROVIDERS = [
  {
    id: uuidv4(),
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '', // Placeholder — user should configure their own key
    models: JSON.stringify([
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo'
    ]),
    type: 'openai',
    isActive: 1
  },
  {
    id: uuidv4(),
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    models: JSON.stringify([
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229'
    ]),
    type: 'anthropic',
    isActive: 0
  },
  {
    id: uuidv4(),
    name: 'Local (Ollama)',
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'ollama',
    models: JSON.stringify([
      'llama3.1',
      'codellama',
      'mistral',
      'mixtral'
    ]),
    type: 'openai-compatible',
    isActive: 0
  }
]

const SETTINGS: { key: string; value: string }[] = [
  { key: 'theme', value: 'dark' },
  { key: 'fontSize', value: '14' },
  { key: 'autoSave', value: 'true' },
  { key: 'autoSaveDelay', value: '2000' },
  { key: 'terminalFontSize', value: '13' },
  { key: 'editorWordWrap', value: 'on' },
  { key: 'editorMinimap', value: 'true' },
  { key: 'editorLineNumbers', value: 'on' },
  { key: 'aiMaxTokens', value: '4096' },
  { key: 'aiTemperature', value: '0.7' },
  { key: 'gitAutoCommit', value: 'false' },
  { key: 'gitBranchPrefix', value: 'feature/' },
  { key: 'notificationsEnabled', value: 'true' },
  { key: 'soundEnabled', value: 'false' },
  { key: 'firstLaunch', value: 'false' },
  { key: 'lastActiveProvider', value: PROVIDERS[0].id }
]

const SAMPLE_PROJECT = {
  id: uuidv4(),
  name: 'OpenJuliet Website',
  path: '/home/user/projects/openjuliet-website',
  description: 'A landing page and documentation site for OpenJuliet',
  repoUrl: 'https://github.com/netic/openjuliet-website',
  defaultBranch: 'main'
}

const SAMPLE_TASKS = [
  {
    id: uuidv4(),
    title: 'Set up project scaffolding',
    description: 'Initialize Next.js with TypeScript and Tailwind CSS',
    status: 'done' as const,
    priority: 'high' as const,
    stage: 'setup'
  },
  {
    id: uuidv4(),
    title: 'Build hero section component',
    description: 'Create animated hero with starry background and CTA',
    status: 'done' as const,
    priority: 'high' as const,
    stage: 'implementation'
  },
  {
    id: uuidv4(),
    title: 'Implement features grid',
    description: 'Responsive grid showcasing OpenJuliet capabilities',
    status: 'done' as const,
    priority: 'medium' as const,
    stage: 'implementation'
  },
  {
    id: uuidv4(),
    title: 'Add documentation search',
    description: 'Full-text search across documentation pages using Fuse.js',
    status: 'implementing' as const,
    priority: 'medium' as const,
    stage: 'implementation'
  },
  {
    id: uuidv4(),
    title: 'Write API integration tests',
    description: 'End-to-end tests for the contact form and newsletter API',
    status: 'pending' as const,
    priority: 'medium' as const,
    stage: 'testing'
  },
  {
    id: uuidv4(),
    title: 'Performance audit & optimisation',
    description: 'Lighthouse audit, image optimisation, code splitting',
    status: 'pending' as const,
    priority: 'low' as const,
    stage: 'review'
  }
]

const SAMPLE_EXECUTION_LOGS = [
  {
    id: uuidv4(),
    command: 'npx create-next-app@latest . --typescript --tailwind',
    cwd: '/home/user/projects/openjuliet-website',
    exitCode: 0,
    stdout: 'Creating a new Next.js app...\n✅ Success!',
    stderr: '',
    duration: 12.5,
    status: 'completed' as const
  },
  {
    id: uuidv4(),
    command: 'npm install fuse.js react-intersection-observer',
    cwd: '/home/user/projects/openjuliet-website',
    exitCode: 0,
    stdout: 'added 2 packages in 3s',
    stderr: '',
    duration: 3.2,
    status: 'completed' as const
  },
  {
    id: uuidv4(),
    command: 'npm run build',
    cwd: '/home/user/projects/openjuliet-website',
    exitCode: 0,
    stdout: '✓ Compiled successfully in 8.4s',
    stderr: '',
    duration: 8.4,
    status: 'completed' as const
  },
  {
    id: uuidv4(),
    command: 'npm run lint',
    cwd: '/home/user/projects/openjuliet-website',
    exitCode: 1,
    stdout: '',
    stderr: '✘ 3 warnings found:\n  1:1  warning  Missing description in metadata\n  45:2  warning  Image component should have alt text\n  89:2  warning  unused import Button',
    duration: 2.1,
    status: 'completed' as const
  }
]

// ── Seed function ────────────────────────────────────────────────────────

/**
 * Populate the database with demo data.
 */
export async function seed(): Promise<void> {
  const dbPath = getDbPath()

  console.log('🌱 Seeding OpenJuliet database...')
  if (dbPath) console.log(`   Database path: ${dbPath}`)

  // 1. Initialise the database (runs migrations)
  await init(dbPath)
  console.log('   ✔ Database initialised / migrated')

  // 2. Insert providers
  for (const p of PROVIDERS) {
    query(
      `INSERT OR IGNORE INTO provider_configs (id, name, base_url, api_key, models, type, is_active)
       VALUES ($id, $name, $baseUrl, $apiKey, $models, $type, $isActive)`,
      {
        $id: p.id,
        $name: p.name,
        $baseUrl: p.baseUrl,
        $apiKey: p.apiKey,
        $models: p.models,
        $type: p.type,
        $isActive: p.isActive
      }
    )
  }
  console.log(`   ✔ ${PROVIDERS.length} providers seeded`)

  // 3. Insert settings
  for (const s of SETTINGS) {
    setSetting(s.key, s.value)
  }
  console.log(`   ✔ ${SETTINGS.length} settings seeded`)

  // 4. Insert sample project
  query(
    `INSERT OR IGNORE INTO projects (id, name, path, description, repo_url, default_branch, created_at, updated_at)
     VALUES ($id, $name, $path, $description, $repoUrl, $defaultBranch, $createdAt, $updatedAt)`,
    {
      $id: SAMPLE_PROJECT.id,
      $name: SAMPLE_PROJECT.name,
      $path: SAMPLE_PROJECT.path,
      $description: SAMPLE_PROJECT.description,
      $repoUrl: SAMPLE_PROJECT.repoUrl,
      $defaultBranch: SAMPLE_PROJECT.defaultBranch,
      $createdAt: NOW,
      $updatedAt: NOW
    }
  )
  console.log(`   ✔ Project "${SAMPLE_PROJECT.name}" seeded`)

  // 5. Insert sample tasks
  for (const t of SAMPLE_TASKS) {
    query(
      `INSERT OR IGNORE INTO tasks (id, project_id, title, description, status, priority, stage, created_at, updated_at)
       VALUES ($id, $projectId, $title, $description, $status, $priority, $stage, $createdAt, $updatedAt)`,
      {
        $id: t.id,
        $projectId: SAMPLE_PROJECT.id,
        $title: t.title,
        $description: t.description,
        $status: t.status,
        $priority: t.priority,
        $stage: t.stage,
        $createdAt: NOW,
        $updatedAt: NOW
      }
    )
  }
  console.log(`   ✔ ${SAMPLE_TASKS.length} tasks seeded`)

  // 6. Insert sample execution logs
  for (const log of SAMPLE_EXECUTION_LOGS) {
    query(
      `INSERT OR IGNORE INTO execution_logs (id, task_id, command, cwd, exit_code, stdout, stderr, duration, status, started_at, finished_at)
       VALUES ($id, $taskId, $command, $cwd, $exitCode, $stdout, $stderr, $duration, $status, $startedAt, $finishedAt)`,
      {
        $id: log.id,
        $taskId: SAMPLE_TASKS[0].id, // associate with first task
        $command: log.command,
        $cwd: log.cwd,
        $exitCode: log.exitCode,
        $stdout: log.stdout,
        $stderr: log.stderr,
        $duration: log.duration,
        $status: log.status,
        $startedAt: NOW,
        $finishedAt: NOW
      }
    )
  }
  console.log(`   ✔ ${SAMPLE_EXECUTION_LOGS.length} execution logs seeded`)

  console.log('\n✅ Seeding complete!')
}

// ── Run directly ─────────────────────────────────────────────────────────
// When this file is executed directly (not imported), run the seed.
if (require.main === module) {
  seed()
    .then(() => {
      console.log('\n🎉 Database seeded successfully!')
      process.exit(0)
    })
    .catch((err) => {
      console.error('\n❌ Seeding failed:', err)
      process.exit(1)
    })
}
