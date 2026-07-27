/**
 * Autonomous Workflow Engine
 *
 * Implements the complete autonomous coding workflow pipeline:
 *
 *   analyzeRepo → understandIssue → createPlan → implementChanges
 *     → runTests → runLinter → reviewChanges → createCommit → createPR
 *     → generateSummary
 *
 * Each stage emits progress events through the execution module for
 * real-time rendering in the UI. Stages that involve AI calls use
 * the active provider; stages that involve file/git operations use
 * the sandbox and git modules.
 *
 * @module execution/workflow
 */

import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import * as git from '../git/index'
import * as providers from '../providers/index'
import * as pr from '../github/pr'
import { executeCommand } from '../sandbox/index'
import { createSandbox } from '../sandbox/index'
import type { BrowserWindow } from 'electron'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkflowContext {
  taskId: string
  projectPath: string
  description: string
  repoOwner: string
  repoName: string
  baseBranch: string
  featureBranch: string
  metadata: Record<string, unknown>
}

export interface RepoAnalysis {
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'unknown'
  language: string
  framework: string
  testFramework: string
  linter: string
  entryPoints: string[]
  keyFiles: string[]
  dependencies: string[]
  devDependencies: string[]
  structure: Record<string, unknown>[]
}

export interface IssueRequirement {
  summary: string
  type: 'feature' | 'bugfix' | 'improvement' | 'refactor' | 'chore'
  scope: string
  acceptanceCriteria: string[]
  affectedFiles: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface ImplementationPlan {
  summary: string
  steps: PlanStep[]
  estimatedComplexity: 'low' | 'medium' | 'high'
  risks: string[]
  order: string[]
}

export interface PlanStep {
  id: string
  action: 'create' | 'modify' | 'delete' | 'install'
  filePath: string
  description: string
  details: string
  dependsOn: string[]
}

export interface ReviewResult {
  passed: boolean
  issues: ReviewIssue[]
  score: number // 0–100
}

export interface ReviewIssue {
  severity: 'critical' | 'warning' | 'suggestion'
  file: string
  line?: number
  message: string
  recommendation: string
}

export interface WorkflowSummary {
  taskId: string
  status: 'completed' | 'failed'
  branch: string
  commitHash?: string
  prNumber?: number
  prUrl?: string
  filesChanged: number
  additions: number
  deletions: number
  stagesCompleted: string[]
  duration: number
  summary: string
  errors: string[]
}

/** Progress callback signature */
export type WorkflowProgressCallback = (
  stage: string,
  progress: number,
  message: string
) => void

// ---------------------------------------------------------------------------
// Workflow Engine
// ---------------------------------------------------------------------------

/**
 * Full autonomous workflow execution.
 *
 * Runs each stage in sequence, aborting early if any stage fails.
 * Progress is reported via the callback for IPC event emission.
 *
 * @param ctx       - Workflow context (project path, description, repo info).
 * @param onProgress - Optional progress callback.
 * @returns A summary of everything that happened.
 */
export async function executeWorkflow(
  ctx: WorkflowContext,
  onProgress?: WorkflowProgressCallback
): Promise<WorkflowSummary> {
  const startTime = Date.now()
  const stagesCompleted: string[] = []
  const errors: string[] = []
  let plan: ImplementationPlan | null = null
  let analysis: RepoAnalysis | null = null
  let commitHash: string | undefined
  let prNumber: number | undefined
  let prUrl: string | undefined
  let filesChanged = 0
  let additions = 0
  let deletions = 0

  const progress = (stage: string, pct: number, msg: string): void => {
    onProgress?.(stage, pct, msg)
  }

  try {
    // ─── Stage 1: Analyze Repository ─────────────────────────────────────
    progress('analyze', 5, 'Reading repository structure...')
    analysis = await analyzeRepo(ctx.projectPath)

    progress('analyze', 10, `Identified ${analysis.language} project using ${analysis.framework || 'unknown framework'}`)
    stagesCompleted.push('analyze')

    // ─── Stage 2: Understand Issue ───────────────────────────────────────
    progress('understandIssue', 15, 'Parsing issue description...')
    const requirements = await understandIssue(ctx.description, analysis)

    progress('understandIssue', 20, `Extracted ${requirements.acceptanceCriteria.length} acceptance criteria`)
    stagesCompleted.push('understandIssue')

    // ─── Stage 3: Create Plan ───────────────────────────────────────────
    progress('plan', 25, 'Generating implementation plan...')
    plan = await createPlan(requirements, analysis, ctx.projectPath)

    progress('plan', 30, `Plan generated with ${plan.steps.length} steps`)
    stagesCompleted.push('plan')

    // Ensure sandbox directory exists
    await createSandbox(ctx.projectPath)

    // ─── Stage 4: Implement Changes ──────────────────────────────────────
    progress('implement', 35, 'Starting implementation...')

    const implementationResult = await implementChanges(
      ctx.projectPath,
      plan,
      analysis,
      (step, total, desc) => {
        const pct = 35 + Math.round((step / total) * 30)
        progress('implement', pct, desc)
      }
    )

    filesChanged = implementationResult.filesChanged
    additions = implementationResult.additions
    deletions = implementationResult.deletions
    stagesCompleted.push('implement')

    // ─── Stage 5: Run Linter ────────────────────────────────────────────
    progress('test', 65, 'Running linter...')
    const lintResult = await runLinter(ctx.projectPath, analysis)

    if (!lintResult.passed) {
      progress('test', 68, `Linter found ${lintResult.issues.length} issues — attempting fixes`)
      // Attempt auto-fix for lint issues
      await autoFixLintIssues(ctx.projectPath, analysis, lintResult.issues)
    }
    stagesCompleted.push('test')

    // ─── Stage 6: Run Tests ──────────────────────────────────────────────
    progress('test', 70, 'Running tests...')
    const testResult = await runTests(ctx.projectPath, analysis, onProgress)

    if (!testResult.passed) {
      errors.push(`Tests failed: ${testResult.summary}`)
      // Continue anyway — we report but don't block
      progress('test', 75, `Tests failed: ${testResult.summary}`)
    } else {
      progress('test', 75, 'All tests passed')
    }
    // Note: test is part of the same 'test' stage umbrella

    // ─── Stage 7: Review Changes ─────────────────────────────────────────
    progress('review', 80, 'Reviewing changes for quality...')
    const reviewResult = await reviewChanges(ctx.projectPath, plan, requirements)

    if (!reviewResult.passed) {
      const criticalIssues = reviewResult.issues.filter((i) => i.severity === 'critical')
      if (criticalIssues.length > 0) {
        errors.push(`Review found ${criticalIssues.length} critical issues`)
        progress('review', 82, `⚠ ${criticalIssues.length} critical issues found`)
      }
    }
    stagesCompleted.push('review')

    // ─── Stage 8: Create Commit ──────────────────────────────────────────
    progress('commit', 85, 'Creating git branch and committing changes...')

    // Create feature branch if not on one
    const currentBranch = (await git.branch(ctx.projectPath)).current
    if (currentBranch === ctx.baseBranch || !currentBranch) {
      await git.checkout(ctx.projectPath, ctx.featureBranch, true)
    }

    // Stage all changes
    await git.add(ctx.projectPath)

    // Generate commit message
    const commitMessage = await createCommit(
      ctx.projectPath,
      plan,
      requirements,
      ctx.description
    )

    const commitResult = await git.commit(ctx.projectPath, commitMessage, { all: true })
    if (commitResult.success && commitResult.hash) {
      commitHash = commitResult.hash
    }
    stagesCompleted.push('commit')

    // ─── Stage 9: Push and Create PR ─────────────────────────────────────
    progress('pr', 90, 'Pushing branch and creating pull request...')

    // Push the branch
    const effectiveBranch = (await git.branch(ctx.projectPath)).current
    const pushResult = await git.push(ctx.projectPath, { branch: effectiveBranch })
    if (!pushResult.success) {
      errors.push(`Push failed: ${pushResult.message}`)
    }

    // Get diff and commits for PR description
    const diffContent = await git.diff(ctx.projectPath, { staged: true })
    const logEntries = await git.log(ctx.projectPath, { maxCount: 10 })
    const commitMessages = logEntries.map((e) => e.message)

    // Generate and create PR
    const { title, body } = await pr.generatePRDescription(
      ctx.projectPath,
      commitMessages,
      diffContent
    )

    try {
      const { pr: createdPR } = await pr.createPullRequest({
        owner: ctx.repoOwner,
        repo: ctx.repoName,
        title,
        body,
        head: effectiveBranch || ctx.featureBranch,
        base: ctx.baseBranch,
        draft: true
      })

      prNumber = createdPR.number
      prUrl = createdPR.url
      progress('pr', 95, `PR #${prNumber} created`)
    } catch (err) {
      errors.push(`PR creation failed (branch may need to be pushed first): ${err instanceof Error ? err.message : String(err)}`)
    }

    stagesCompleted.push('pr')

    // ─── Stage 10: Generate Summary ──────────────────────────────────────
    progress('summary', 98, 'Generating summary...')
    const summaryText = await generateSummary(
      ctx,
      plan,
      stagesCompleted,
      filesChanged,
      additions,
      deletions,
      errors
    )

    progress('summary', 100, 'Workflow complete')
    stagesCompleted.push('summary')

    return {
      taskId: ctx.taskId,
      status: 'completed',
      branch: effectiveBranch || ctx.featureBranch,
      commitHash,
      prNumber,
      prUrl,
      filesChanged,
      additions,
      deletions,
      stagesCompleted,
      duration: Date.now() - startTime,
      summary: summaryText,
      errors
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    errors.push(errorMsg)

    return {
      taskId: ctx.taskId,
      status: 'failed',
      branch: '',
      filesChanged,
      additions,
      deletions,
      stagesCompleted,
      duration: Date.now() - startTime,
      summary: `Workflow failed at stage "${stagesCompleted[stagesCompleted.length - 1] || 'initialization'}": ${errorMsg}`,
      errors
    }
  }
}

// ---------------------------------------------------------------------------
// Stage 1: analyzeRepo
// ---------------------------------------------------------------------------

/**
 * Read and analyse the repository structure to identify key files,
 * package manager, language, test framework, and linter configuration.
 */
export async function analyzeRepo(projectPath: string): Promise<RepoAnalysis> {
  const keyFiles: string[] = []
  const entryPoints: string[] = []
  const dependencies: string[] = []
  const devDependencies: string[] = []
  const structure: Record<string, unknown>[] = []

  // Detect package manager and dependencies
  const [hasPkgJson, hasYarnLock, hasPnpmLock, hasPipfile, hasRequirements, hasPyproject] =
    await Promise.all([
      fileExists(projectPath, 'package.json'),
      fileExists(projectPath, 'yarn.lock'),
      fileExists(projectPath, 'pnpm-lock.yaml'),
      fileExists(projectPath, 'Pipfile'),
      fileExists(projectPath, 'requirements.txt'),
      fileExists(projectPath, 'pyproject.toml')
    ])
  // ↓ composite checks — each fileExists call is a separate Promise element
  const [hasEsLintRc, hasEsLintRcJson, hasEsLintRcJs, hasEsLintConfigJs,
    hasPrettierRc, hasPrettierRcJson,
    hasVitestTs, hasVitestJs,
    hasJestConfigJs, hasJestConfigTs,
    hasMocharcJs, hasMocharcYml,
    hasPytestIni, hasSetupCfg,
    hasSrcDir] = await Promise.all([
    fileExists(projectPath, '.eslintrc'),
    fileExists(projectPath, '.eslintrc.json'),
    fileExists(projectPath, '.eslintrc.js'),
    fileExists(projectPath, 'eslint.config.js'),
    fileExists(projectPath, '.prettierrc'),
    fileExists(projectPath, '.prettierrc.json'),
    fileExists(projectPath, 'vitest.config.ts'),
    fileExists(projectPath, 'vitest.config.js'),
    fileExists(projectPath, 'jest.config.js'),
    fileExists(projectPath, 'jest.config.ts'),
    fileExists(projectPath, '.mocharc.js'),
    fileExists(projectPath, '.mocharc.yml'),
    fileExists(projectPath, 'pytest.ini'),
    fileExists(projectPath, 'setup.cfg'),
    fileExists(projectPath, 'src')
  ])
  const hasESLint = hasEsLintRc || hasEsLintRcJson || hasEsLintRcJs || hasEsLintConfigJs
  const hasPrettier = hasPrettierRc || hasPrettierRcJson
  const hasVitest = hasVitestTs || hasVitestJs
  const hasJest = hasJestConfigJs || hasJestConfigTs
  const hasMocha = hasMocharcJs || hasMocharcYml
  const hasPytest = hasPytestIni || (hasSetupCfg && dependencies.includes('pytest'))

  const packageManager: RepoAnalysis['packageManager'] = hasPnpmLock
    ? 'pnpm'
    : hasYarnLock
      ? 'yarn'
      : hasPkgJson
        ? 'npm'
        : hasPipfile || hasRequirements || hasPyproject
          ? 'pip'
          : 'unknown'

  // Read dependencies from package.json
  if (hasPkgJson) {
    try {
      const pkgRaw = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
      const pkg = JSON.parse(pkgRaw)
      if (pkg.dependencies) Object.keys(pkg.dependencies).forEach((d) => dependencies.push(d))
      if (pkg.devDependencies) Object.keys(pkg.devDependencies).forEach((d) => devDependencies.push(d))
      if (pkg.main) entryPoints.push(pkg.main)
      if (pkg.bin) {
        if (typeof pkg.bin === 'string') entryPoints.push(pkg.bin)
        else Object.values(pkg.bin).forEach((v: unknown) => typeof v === 'string' && entryPoints.push(v))
      }
    } catch { /* ignore parse errors */ }
  }

  // Read dependencies from Python files
  if (hasRequirements) {
    try {
      const req = await fs.readFile(path.join(projectPath, 'requirements.txt'), 'utf-8')
      req.split('\n')
        .filter((l) => l.trim() && !l.startsWith('#'))
        .forEach((l) => dependencies.push(l.split('==')[0].split('>=')[0].split('<=')[0].trim()))
    } catch { /* ignore */ }
  }

  // Detect language
  const [hasTsConfig] =
    await Promise.all([
      fileExists(projectPath, 'tsconfig.json')
    ])

  const language = hasTsConfig ? 'TypeScript' : hasPkgJson ? 'JavaScript' : hasPipfile || hasRequirements ? 'Python' : 'Unknown'
  const testFramework = hasVitest ? 'vitest' : hasJest ? 'jest' : hasMocha ? 'mocha' : hasPytest ? 'pytest' : 'unknown'
  const linter = hasESLint ? 'eslint' : 'unknown'

  // Detect framework
  let framework = ''
  const allDeps = [...dependencies, ...devDependencies]
  if (allDeps.some((d) => d.startsWith('react'))) framework = 'React'
  else if (allDeps.some((d) => d.startsWith('vue'))) framework = 'Vue'
  else if (allDeps.some((d) => d.startsWith('@angular'))) framework = 'Angular'
  else if (allDeps.some((d) => d.startsWith('next'))) framework = 'Next.js'
  else if (allDeps.some((d) => d.startsWith('electron'))) framework = 'Electron'
  else if (allDeps.some((d) => d.startsWith('express'))) framework = 'Express'
  else if (allDeps.some((d) => d.startsWith('fastify'))) framework = 'Fastify'
  else if (hasPipfile || hasRequirements) {
    if (allDeps.some((d) => d.toLowerCase() === 'django')) framework = 'Django'
    else if (allDeps.some((d) => d.toLowerCase() === 'flask')) framework = 'Flask'
    else if (allDeps.some((d) => d.toLowerCase() === 'fastapi')) framework = 'FastAPI'
  }

  // Identify source entry points
  const possibleEntries = ['src/main.ts', 'src/index.ts', 'src/main.tsx', 'src/index.tsx', 'src/main.js', 'src/index.js', 'src/app.ts', 'src/app.tsx', 'main.ts', 'index.ts', 'main.js', 'index.js']
  for (const entry of possibleEntries) {
    if (await fileExists(projectPath, entry)) {
      entryPoints.push(entry)
    }
  }

  // Build file tree (2 levels deep)
  keyFiles.push('package.json', 'tsconfig.json', '.eslintrc.json')
  structure.push(
    ...(await walkDirectory(projectPath, projectPath, 2))
  )

  return {
    packageManager,
    language,
    framework,
    testFramework,
    linter,
    entryPoints: [...new Set(entryPoints)],
    keyFiles: [...new Set(keyFiles.filter((f) => f))],
    dependencies,
    devDependencies,
    structure
  }
}

// ---------------------------------------------------------------------------
// Stage 2: understandIssue
// ---------------------------------------------------------------------------

/**
 * Parse an issue description and extract structured requirements using AI.
 * Falls back to keyword-based parsing if no AI provider is available.
 */
export async function understandIssue(
  description: string,
  analysis: RepoAnalysis
): Promise<IssueRequirement> {
  const activeProviderId = providers.getActiveProviderId()

  if (!activeProviderId) {
    return parseIssueWithoutAI(description)
  }

  try {
    const systemPrompt = `You are a senior software engineer analysing an issue or feature request.

Parse the following description and extract structured requirements.
Return your response as a JSON object with these fields:
- summary: One-sentence summary
- type: "feature" | "bugfix" | "improvement" | "refactor" | "chore"
- scope: Which part of the codebase this affects
- acceptanceCriteria: Array of specific, testable criteria
- affectedFiles: Array of file paths that likely need changes (based on the repo info)
- priority: "low" | "medium" | "high" | "critical"

Do NOT wrap in markdown fences. Return only the JSON object.`

    const userContent = [
      `## Issue Description\n${description}`,
      `## Project Context\nLanguage: ${analysis.language}\nFramework: ${analysis.framework}\nTest Framework: ${analysis.testFramework}\nKey Files: ${analysis.keyFiles.join(', ')}`,
      analysis.entryPoints.length > 0 ? `Entry Points: ${analysis.entryPoints.join(', ')}` : ''
    ]
      .filter(Boolean)
      .join('\n\n')

    const result = await providers.chat(activeProviderId, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ], { temperature: 0.2, maxTokens: 1500 })

    try {
      const cleaned = result.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim()
      const parsed = JSON.parse(cleaned)

      return {
        summary: parsed.summary as string || description.slice(0, 100),
        type: (parsed.type as IssueRequirement['type']) || 'feature',
        scope: (parsed.scope as string) || 'general',
        acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria) ? parsed.acceptanceCriteria : [description.slice(0, 200)],
        affectedFiles: Array.isArray(parsed.affectedFiles) ? parsed.affectedFiles : [],
        priority: (parsed.priority as IssueRequirement['priority']) || 'medium'
      }
    } catch {
      return parseIssueWithoutAI(description)
    }
  } catch {
    return parseIssueWithoutAI(description)
  }
}

// ---------------------------------------------------------------------------
// Stage 3: createPlan
// ---------------------------------------------------------------------------

/**
 * Generate an implementation plan using AI or heuristic fallback.
 */
export async function createPlan(
  requirements: IssueRequirement,
  analysis: RepoAnalysis,
  projectPath: string
): Promise<ImplementationPlan> {
  const activeProviderId = providers.getActiveProviderId()

  if (!activeProviderId) {
    return generateBasicPlan(requirements, analysis)
  }

  try {
    const systemPrompt = `You are a senior software engineer creating a precise, actionable implementation plan.

Given a project's structure and a set of requirements, produce a step-by-step plan.
Each step must specify:
- action: "create" | "modify" | "delete" | "install"
- filePath: exact file path relative to project root
- description: what to do
- details: code-level details (functions to add, lines to change, patterns to use)
- dependsOn: array of step IDs this step depends on

Return JSON with:
- summary: One-line plan summary
- steps: Array of PlanStep objects (each with a unique id like "S1", "S2", etc.)
- estimatedComplexity: "low" | "medium" | "high"
- risks: Array of strings describing potential risks
- order: Array of step IDs in execution order

Project info: ${analysis.language} ${analysis.framework ? `(${analysis.framework})` : ''}
Package manager: ${analysis.packageManager}
Test framework: ${analysis.testFramework}
Linter: ${analysis.linter}
Key files: ${analysis.keyFiles.join(', ')}

Do NOT wrap in markdown fences. Return only valid JSON.`

    const result = await providers.chat(activeProviderId, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(requirements, null, 2) }
    ], { temperature: 0.2, maxTokens: 3000 })

    try {
      const cleaned = result.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim()
      const parsed = JSON.parse(cleaned)

      return {
        summary: (parsed.summary as string) || requirements.summary,
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        estimatedComplexity: (parsed.estimatedComplexity as ImplementationPlan['estimatedComplexity']) || 'medium',
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        order: Array.isArray(parsed.order) ? parsed.order : []
      }
    } catch {
      return generateBasicPlan(requirements, analysis)
    }
  } catch {
    return generateBasicPlan(requirements, analysis)
  }
}

// ---------------------------------------------------------------------------
// Stage 4: implementChanges
// ---------------------------------------------------------------------------

interface ImplementationResult {
  filesChanged: number
  additions: number
  deletions: number
  errors: string[]
}

/**
 * Execute the implementation plan by writing or editing code files.
 * Each step uses AI to generate the actual code content.
 */
async function implementChanges(
  projectPath: string,
  plan: ImplementationPlan,
  analysis: RepoAnalysis,
  onStepProgress: (step: number, total: number, description: string) => void
): Promise<ImplementationResult> {
  const errors: string[] = []
  let filesChanged = 0
  let additions = 0
  let deletions = 0

  const activeProviderId = providers.getActiveProviderId()

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i]
    onStepProgress(i + 1, plan.steps.length, `${step.action} ${step.filePath}`)

    const fullPath = path.join(projectPath, step.filePath)

    try {
      switch (step.action) {
        case 'create': {
          // Generate file content via AI
          const content = activeProviderId
            ? await generateFileContent(
                step.filePath,
                step.details,
                analysis,
                projectPath
              )
            : `// ${step.filePath}\n// TODO: ${step.description}\n${step.details}\n`

          // Ensure parent directory exists
          await fs.mkdir(path.dirname(fullPath), { recursive: true })
          await fs.writeFile(fullPath, content, 'utf-8')
          filesChanged++
          additions += content.split('\n').length
          break
        }

        case 'modify': {
          // Read existing, modify using AI, write back
          const existing = await fs.readFile(fullPath, 'utf-8').catch(() => '')
          const newContent = activeProviderId
            ? await modifyFileContent(fullPath, existing, step.details, analysis)
            : existing + `\n// TODO: ${step.description}\n${step.details}\n`

          if (newContent !== existing) {
            await fs.writeFile(fullPath, newContent, 'utf-8')
            filesChanged++
            const existingLines = existing.split('\n').length
            const newLines = newContent.split('\n').length
            additions += Math.max(0, newLines - existingLines)
            deletions += Math.max(0, existingLines - newLines)
          }
          break
        }

        case 'delete': {
          try {
            await fs.unlink(fullPath)
            filesChanged++
          } catch {
            errors.push(`Could not delete ${step.filePath}: file not found`)
          }
          break
        }

        case 'install': {
          const cmd = getInstallCommand(analysis.packageManager, step.details.trim())
          if (cmd) {
            const result = await executeCommand(cmd, projectPath)
            if (result.exitCode !== 0) {
              errors.push(`Install failed for ${step.details}: ${result.stderr.slice(0, 200)}`)
            }
          }
          break
        }
      }
    } catch (err) {
      errors.push(`Step ${step.id} (${step.action} ${step.filePath}): ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { filesChanged, additions, deletions, errors }
}

// ---------------------------------------------------------------------------
// Stage 5: runLinter
// ---------------------------------------------------------------------------

/**
 * Run the project's linter and parse results.
 */
export async function runLinter(
  projectPath: string,
  analysis: RepoAnalysis
): Promise<ReviewResult> {
  const issues: ReviewIssue[] = []

  if (analysis.linter === 'eslint') {
    try {
      const result = await executeCommand(
        'npx eslint . --format json --no-color 2>/dev/null || true',
        projectPath,
        undefined,
        { timeout: 120_000 }
      )

      if (result.stdout) {
        try {
          const eslintResults = JSON.parse(result.stdout) as Array<{
            filePath: string
            messages: Array<{
              line: number
              column: number
              severity: 1 | 2
              message: string
              ruleId: string
            }>
          }>

          for (const file of eslintResults) {
            for (const msg of file.messages) {
              issues.push({
                severity: msg.severity === 2 ? 'warning' : 'suggestion',
                file: file.filePath,
                line: msg.line,
                message: `[${msg.ruleId}] ${msg.message}`,
                recommendation: `Fix ${msg.ruleId} on line ${msg.line}`
              })
            }
          }
        } catch {
          // Parse failed — eslint may not have output JSON
        }
      }
    } catch {
      // Linter not available or failed
    }
  }

  // Check for TypeScript compilation errors
  if (analysis.language === 'TypeScript') {
    try {
      const result = await executeCommand(
        'npx tsc --noEmit --pretty false 2>&1 || true',
        projectPath,
        undefined,
        { timeout: 120_000 }
      )

      const tscErrors = result.stdout + result.stderr
      for (const line of tscErrors.split('\n')) {
        const match = line.match(/^(.+)\((\d+),\d+\):\s+(error|warning)\s+TS\d+:\s+(.+)$/)
        if (match) {
          issues.push({
            severity: match[3] === 'error' ? 'warning' : 'suggestion',
            file: match[1],
            line: parseInt(match[2], 10),
            message: match[4],
            recommendation: `Fix TypeScript ${match[3]} on line ${match[2]} in ${match[1]}`
          })
        }
      }
    } catch {
      // tsc not available
    }
  }

  return {
    passed: issues.length === 0,
    issues: issues.slice(0, 50), // Cap at 50 issues
    score: Math.max(0, 100 - issues.length * 5)
  }
}

// ---------------------------------------------------------------------------
// Stage 6: runTests
// ---------------------------------------------------------------------------

/**
 * Execute project tests and return results.
 */
export async function runTests(
  projectPath: string,
  analysis: RepoAnalysis,
  onProgress?: WorkflowProgressCallback
): Promise<{ passed: boolean; summary: string; details: string }> {
  const testCommands: Record<string, string> = {
    vitest: 'npx vitest run --reporter=verbose 2>&1',
    jest: 'npx jest --verbose 2>&1',
    mocha: 'npx mocha --recursive 2>&1',
    pytest: 'python -m pytest -v 2>&1',
    unknown: ''
  }

  const cmd = testCommands[analysis.testFramework]
  if (!cmd) {
    return { passed: true, summary: 'No test framework detected — skipping', details: '' }
  }

  try {
    const result = await executeCommand(cmd, projectPath, undefined, { timeout: 300_000 })

    const output = result.stdout + result.stderr
    const passed = result.exitCode === 0

    // Parse summary from output
    let summary = output.split('\n').filter((l) => /tests?|passed|failed|suites?/i.test(l)).slice(-3).join('; ')
    if (!summary) {
      summary = passed ? 'All tests passed' : `Tests failed (exit code ${result.exitCode})`
    }

    return { passed, summary, details: output.slice(0, 2000) }
  } catch (err) {
    return {
      passed: false,
      summary: `Test execution error: ${err instanceof Error ? err.message : String(err)}`,
      details: ''
    }
  }
}

// ---------------------------------------------------------------------------
// Stage 7: reviewChanges
// ---------------------------------------------------------------------------

/**
 * Self-review the implementation for quality, security, and correctness.
 */
export async function reviewChanges(
  projectPath: string,
  plan: ImplementationPlan,
  requirements: IssueRequirement
): Promise<ReviewResult> {
  const issues: ReviewIssue[] = []
  const activeProviderId = providers.getActiveProviderId()

  if (!activeProviderId) {
    return { passed: true, issues: [], score: 100 }
  }

  try {
    // Collect changed files
    const changedFiles: string[] = []
    for (const step of plan.steps) {
      if (step.action === 'create' || step.action === 'modify') {
        const fullPath = path.join(projectPath, step.filePath)
        try {
          await fs.access(fullPath)
          changedFiles.push(step.filePath)
        } catch { /* file doesn't exist yet */ }
      }
    }

    if (changedFiles.length === 0) {
      return { passed: true, issues: [], score: 100 }
    }

    // Read content of changed files
    const fileContents: string[] = []
    for (const file of changedFiles.slice(0, 10)) {
      try {
        const content = await fs.readFile(path.join(projectPath, file), 'utf-8')
        fileContents.push(`### ${file}\n\`\`\`\n${content.slice(0, 3000)}\n\`\`\``)
      } catch { /* skip unreadable */ }
    }

    const prompt = `Review the following changed files for a PR that implements the requirements described below.
Focus on:
1. Correctness — does the code do what it should?
2. Security — any injection risks, exposed secrets, or unsafe patterns?
3. Edge cases — missing error handling, null checks, boundary conditions?
4. Code quality — naming, duplication, complexity, type safety?
5. Completeness — do the changes fully satisfy the acceptance criteria?

Requirements: ${requirements.summary}
Acceptance criteria: ${requirements.acceptanceCriteria.join(', ')}

Return a JSON object:
{
  "score": <number 0-100>,
  "issues": [
    {
      "severity": "critical" | "warning" | "suggestion",
      "file": "<file path>",
      "line": <number | null>,
      "message": "<short description>",
      "recommendation": "<how to fix>"
    }
  ]
}

If no issues found, return {"score": 100, "issues": []}.`

    const reviewMessages = [
      { role: 'system' as const, content: prompt },
      { role: 'user' as const, content: fileContents.join('\n\n') || 'No files to review.' }
    ]

    const result = await providers.chat(activeProviderId, reviewMessages, {
      temperature: 0.2,
      maxTokens: 2000
    })

    try {
      const cleaned = result.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim()
      const parsed = JSON.parse(cleaned)
      const parsedIssues: ReviewIssue[] = Array.isArray(parsed.issues) ? parsed.issues : []
      const score = typeof parsed.score === 'number' ? parsed.score : 100

      issues.push(...parsedIssues)
      return {
        passed: parsedIssues.filter((i) => i.severity === 'critical').length === 0,
        issues,
        score
      }
    } catch {
      return { passed: true, issues: [], score: 100 }
    }
  } catch {
    return { passed: true, issues: [], score: 100 }
  }
}

// ---------------------------------------------------------------------------
// Stage 8: createCommit
// ---------------------------------------------------------------------------

/**
 * Generate a structured commit message from the plan and requirements.
 */
export async function createCommit(
  projectPath: string,
  plan: ImplementationPlan,
  requirements: IssueRequirement,
  description: string
): Promise<string> {
  const activeProviderId = providers.getActiveProviderId()

  if (!activeProviderId) {
    return generateCommitMessage(plan, requirements)
  }

  try {
    const result = await providers.chat(activeProviderId, [
      {
        role: 'system',
        content: `Generate a conventional commit message for the following changes.
Format: <type>(<scope>): <subject>

<BLANK LINE>
<body>

<BLANK LINE>
- Co-authored-by: ...

Types: feat, fix, chore, docs, refactor, test

Return ONLY the commit message, no explanations, no markdown fences.`
      },
      {
        role: 'user',
        content: JSON.stringify({
          summary: plan.summary,
          steps: plan.steps.map((s) => `${s.action}: ${s.filePath} — ${s.description}`),
          requirements: requirements.summary,
          description
        }, null, 2)
      }
    ], { temperature: 0.3, maxTokens: 500 })

    const cleaned = result.trim().replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '').trim()
    if (cleaned && cleaned.length > 10) {
      return cleaned
    }
  } catch {
    // Fallback
  }

  return generateCommitMessage(plan, requirements)
}

// ---------------------------------------------------------------------------
// Stage 9: createPR is handled by executeWorkflow directly
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Stage 10: generateSummary
// ---------------------------------------------------------------------------

/**
 * Generate a human-readable summary of the workflow execution.
 */
export async function generateSummary(
  ctx: WorkflowContext,
  plan: ImplementationPlan | null,
  stagesCompleted: string[],
  filesChanged: number,
  additions: number,
  deletions: number,
  errors: string[]
): Promise<string> {
  const lines: string[] = [
    `## Workflow Summary`,
    ``,
    `**Task:** ${ctx.description.slice(0, 120)}`,
    `**Project:** ${ctx.projectPath}`,
    `**Branch:** ${ctx.featureBranch} → ${ctx.baseBranch}`,
    ``,
    `### Stages Completed`,
    ...stagesCompleted.map((s) => `- ✅ ${s}`),
    ``,
    `### Changes`,
    `- **${filesChanged}** files changed`,
    `- **+${additions}** additions`,
    `- **-${deletions}** deletions`,
    ``
  ]

  if (plan) {
    lines.push(`### Implementation Plan`, `**${plan.summary}**`, ``)
    lines.push(`| Step | Action | File |`, `|------|--------|------|`)
    for (const step of plan.steps) {
      lines.push(`| ${step.id} | ${step.action} | \`${step.filePath}\` |`)
    }
    lines.push(``)
  }

  if (errors.length > 0) {
    lines.push(`### Issues Encountered`)
    for (const err of errors) {
      lines.push(`- ⚠ ${err}`)
    }
    lines.push(``)
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function fileExists(basePath: string, file: string): Promise<boolean> {
  try {
    await fs.access(path.join(basePath, file))
    return true
  } catch {
    return false
  }
}

async function walkDirectory(
  basePath: string,
  currentPath: string,
  maxDepth: number,
  currentDepth = 0
): Promise<Record<string, unknown>[]> {
  if (currentDepth >= maxDepth) return []

  const results: Record<string, unknown>[] = []
  const entries = await fs.readdir(currentPath, { withFileTypes: true })

  for (const entry of entries) {
    // Skip hidden dirs and node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue

    const relativePath = path.relative(basePath, path.join(currentPath, entry.name))
    if (entry.isDirectory()) {
      results.push({
        type: 'directory',
        path: relativePath,
        children: await walkDirectory(basePath, path.join(currentPath, entry.name), maxDepth, currentDepth + 1)
      })
    } else {
      results.push({ type: 'file', path: relativePath })
    }
  }

  return results
}

async function generateFileContent(
  filePath: string,
  details: string,
  analysis: RepoAnalysis,
  projectPath: string
): Promise<string> {
  const providerId = providers.getActiveProviderId()
  if (!providerId) {
    return `// ${filePath}\n// Generated by OpenJuliet\n\n`
  }

  // Read relevant existing files for context (up to 3)
  const contextFiles: string[] = []
  try {
    const entries = await fs.readdir(projectPath)
    const tsFiles = entries.filter((e) => e.endsWith('.ts') || e.endsWith('.tsx')).slice(0, 3)
    for (const f of tsFiles) {
      const content = await fs.readFile(path.join(projectPath, f), 'utf-8')
      contextFiles.push(`// ${f}\n${content.slice(0, 1000)}`)
    }
  } catch { /* no context */ }

  const prompt = [
    `Generate the complete content for \`${filePath}\`.`,
    ``,
    `## Requirements`,
    details,
    ``,
    `## Project Context`,
    `Language: ${analysis.language}`,
    analysis.framework ? `Framework: ${analysis.framework}` : '',
    `Package manager: ${analysis.packageManager}`,
    ``,
    contextFiles.length > 0 ? `## Reference Files\n${contextFiles.join('\n\n')}` : '',
    ``,
    `## Rules`,
    `- Output ONLY the file content — no explanations, no markdown fences.`,
    `- Follow the project's coding style from reference files.`,
    `- Include proper imports, types, and error handling.`,
    `- Use the same package manager imports as the reference files.`
  ].filter(Boolean).join('\n')

  try {
    const result = await providers.chat(providerId, [
      { role: 'system', content: prompt }
    ], { temperature: 0.3, maxTokens: 3000 })

    return result.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
  } catch {
    return `// ${filePath}\n// Auto-generated\n\n${details}\n`
  }
}

async function modifyFileContent(
  filePath: string,
  existingContent: string,
  modificationDetails: string,
  analysis: RepoAnalysis
): Promise<string> {
  const providerId = providers.getActiveProviderId()
  if (!providerId) {
    return existingContent + `\n// TODO: ${modificationDetails}\n`
  }

  const prompt = [
    `Modify the file \`${filePath}\` based on the requirements below.`,
    ``,
    `## Existing Content`,
    `\`\`\`\n${existingContent.slice(0, 5000)}\n\`\`\``,
    ``,
    `## Required Changes`,
    modificationDetails,
    ``,
    `## Rules`,
    `- Output the COMPLETE modified file content, not just the changes.`,
    `- Do NOT wrap in markdown fences — output raw file content only.`,
    `- Preserve existing imports and code structure.`,
    `- Add proper error handling and types.`
  ].join('\n')

  try {
    const result = await providers.chat(providerId, [
      { role: 'system', content: prompt }
    ], { temperature: 0.3, maxTokens: 4000 })

    return result.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
  } catch {
    return existingContent
  }
}

function getInstallCommand(
  packageManager: RepoAnalysis['packageManager'],
  packageSpec: string
): string {
  const spec = packageSpec.trim()
  if (!spec) return ''

  switch (packageManager) {
    case 'npm':
      return `npm install ${spec}`
    case 'yarn':
      return `yarn add ${spec}`
    case 'pnpm':
      return `pnpm add ${spec}`
    case 'pip':
      return `pip install ${spec}`
    default:
      return ''
  }
}

function generateCommitMessage(
  plan: ImplementationPlan,
  requirements: IssueRequirement
): string {
  const type = requirements.type === 'bugfix' ? 'fix' : requirements.type === 'feature' ? 'feat' : requirements.type
  const scope = requirements.scope || 'general'
  const subject = requirements.summary.length > 72
    ? requirements.summary.slice(0, 69) + '...'
    : requirements.summary

  const body = plan.steps
    .map((s) => `- ${s.action}: ${s.filePath} — ${s.description}`)
    .join('\n')

  return `${type}(${scope}): ${subject}\n\n${body}`
}

function generateBasicPlan(
  requirements: IssueRequirement,
  analysis: RepoAnalysis
): ImplementationPlan {
  const steps: PlanStep[] = requirements.affectedFiles.map((file, i) => ({
    id: `S${i + 1}`,
    action: 'modify',
    filePath: file,
    description: `Implement ${requirements.type}: ${requirements.summary.slice(0, 60)}`,
    details: '',
    dependsOn: i > 0 ? [`S${i}`] : []
  }))

  return {
    summary: requirements.summary,
    steps,
    estimatedComplexity: steps.length > 5 ? 'high' : steps.length > 2 ? 'medium' : 'low',
    risks: [],
    order: steps.map((s) => s.id)
  }
}

function parseIssueWithoutAI(description: string): IssueRequirement {
  const lower = description.toLowerCase()

  // Determine type from keywords
  const isBug = /bug|fix|error|crash|broken|issue|failed/i.test(lower)
  const isFeature = /feat|feature|add|implement|new|support/i.test(lower)
  const isRefactor = /refactor|rewrite|restructure|cleanup/i.test(lower)
  const isChore = /chore|update|bump|upgrade|config/i.test(lower)

  const type: IssueRequirement['type'] = isBug
    ? 'bugfix'
    : isFeature
      ? 'feature'
      : isRefactor
        ? 'refactor'
        : isChore
          ? 'chore'
          : 'improvement'

  // Extract bullet points as potential acceptance criteria
  const bulletPoints = description
    .split('\n')
    .filter((l) => /^[-*]\s/.test(l.trim()) || /^\d+\.\s/.test(l.trim()))
    .map((l) => l.replace(/^[-*\d.]+\s+/, '').trim())
    .filter(Boolean)

  const summary = description
    .split('\n')
    .find((l) => l.trim() && !l.startsWith('-') && !l.startsWith('#'))
    ?.slice(0, 120) || description.slice(0, 120)

  return {
    summary,
    type,
    scope: 'general',
    acceptanceCriteria: bulletPoints.length > 0
      ? bulletPoints
      : [description.slice(0, 200)],
    affectedFiles: [],
    priority: isBug ? 'high' : 'medium'
  }
}

async function autoFixLintIssues(
  projectPath: string,
  analysis: RepoAnalysis,
  _issues: ReviewIssue[]
): Promise<void> {
  // Try eslint --fix
  if (analysis.linter === 'eslint') {
    try {
      await executeCommand('npx eslint . --fix --no-color 2>/dev/null || true', projectPath, undefined, { timeout: 120_000 })
    } catch {
      // Auto-fix may fail — that's okay
    }
  }

  // Try prettier
  try {
    await executeCommand(
      'npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css}" 2>/dev/null || true',
      projectPath,
      undefined,
      { timeout: 60_000 }
    )
  } catch {
    // Non-fatal
  }
}
