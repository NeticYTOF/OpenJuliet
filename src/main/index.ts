/**
 * OpenJuliet — Main Process Entry Point
 *
 * Creates the BrowserWindow with a frameless dark-theme design,
 * loads the Vite renderer, registers all IPC handlers, and manages
 * the application lifecycle (auto-updates, window controls, etc.).
 *
 * @module main
 */

import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// Lazy import — electron-updater may not be installed in dev; the
// auto-updater gracefully degrades if unavailable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let updater: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  updater = require('electron-updater').autoUpdater
} catch {
  console.warn('[main] electron-updater not available — auto-updates disabled')
}

import { registerHandlers } from './ipc/handlers'
import * as database from './database/index'
import * as github from './github/index'
import * as providers from './providers/index'
import * as execution from './execution/index'
import * as sandbox from './sandbox/index'
import * as demo from './demo/demo-runner'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WINDOW_WIDTH = 1400
const WINDOW_HEIGHT = 900
const MIN_WINDOW_WIDTH = 900
const MIN_WINDOW_HEIGHT = 600

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------

/**
 * Create the main application window with a frameless, dark-themed design.
 *
 * Features:
 * - Frameless window (`frame: false`) for a custom titlebar
 * - Dark background and title bar styling
 * - Traffic-light (minimise, maximise, close) on macOS
 * - Vite dev server URL in development, file:// in production
 * - Node.js integration disabled (context isolation on)
 */
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    show: false, // Show after ready-to-show to prevent flash
    frame: false, // Custom titlebar
    titleBarStyle: 'hidden', // macOS traffic-light integration
    titleBarOverlay: {
      color: '#0a0a0f',
      symbolColor: '#888888',
      height: 38
    },
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !is.dev
    }
  })

  // Prevent external links from opening in Electron
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Show window when content is ready to prevent white flash
  win.on('ready-to-show', () => {
    // Restore maximised state if previously maximised
    const wasMaximised = database.getSetting('window_maximised') === 'true'
    if (wasMaximised) {
      win.maximize()
    }
    win.show()
  })

  // Save window state on close
  win.on('close', () => {
    const isMaximised = win.isMaximized()
    if (isMaximised) {
      database.setSetting('window_maximised', 'true')
    } else {
      database.setSetting('window_maximised', 'false')
      const bounds = win.getBounds()
      database.setSetting('window_x', String(bounds.x))
      database.setSetting('window_y', String(bounds.y))
      database.setSetting('window_width', String(bounds.width))
      database.setSetting('window_height', String(bounds.height))
    }
  })

  // Load the renderer
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

// ---------------------------------------------------------------------------
// Auto-updater (optional)
// ---------------------------------------------------------------------------

/**
 * Initialise the auto-updater.
 *
 * Checks for updates on startup and every 30 minutes thereafter.
 * Sends progress events to the renderer so the UI can show a progress
 * indicator during the download.
 *
 * All calls are guarded — the module may not be installed.
 */
function initAutoUpdater(): void {
  if (!updater) return

  updater.autoDownload = false
  updater.autoInstallOnAppQuit = true

  updater.on('update-available', (info: { version: string; releaseDate: string; releaseNotes: string }) => {
    mainWindow?.webContents.send('update:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })
  })

  updater.on('update-not-available', () => {
    mainWindow?.webContents.send('update:not-available')
  })

  updater.on('download-progress', (progress: { percent: number; bytesPerSecond: number; total: number; transferred: number }) => {
    mainWindow?.webContents.send('update:download-progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      total: progress.total,
      transferred: progress.transferred
    })
  })

  updater.on('update-downloaded', (info: { version: string; releaseDate: string }) => {
    mainWindow?.webContents.send('update:downloaded', {
      version: info.version,
      releaseDate: info.releaseDate
    })
  })

  updater.on('error', (err: Error) => {
    console.error('[auto-updater]', err.message)
    mainWindow?.webContents.send('update:error', {
      error: err.message
    })
  })

  // Check for updates
  updater.checkForUpdates().catch(() => {
    // Silently ignore — not critical
  })

  // Check periodically
  setInterval(() => {
    updater.checkForUpdates().catch(() => {})
  }, 30 * 60 * 1000) // Every 30 minutes

  // IPC: trigger update download from renderer
  ipcMain.handle('update:download', async () => {
    updater.downloadUpdate()
    return { success: true }
  })

  ipcMain.handle('update:install', async () => {
    setImmediate(() => {
      updater.quitAndInstall()
    })
    return { success: true }
  })

  ipcMain.handle('update:check', async () => {
    try {
      const result = await updater.checkForUpdates()
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}

// ---------------------------------------------------------------------------
// Subsystem initialisation
// ---------------------------------------------------------------------------

/**
 * Initialise all subsystems in the correct order:
 *   1. Database (no dependencies)
 *   2. Providers (reads from database on init)
 *   3. GitHub (no dependencies)
 *   4. Sandbox (no dependencies)
 *   5. Execution engine (depends on providers, sandbox, git, github)
 *   6. IPC handlers (depends on window)
 */
async function initSubsystems(): Promise<void> {
  // 1. Database
  console.log('[init] Initialising database...')
  await database.init()
  console.log('[init] Database ready')

  // 2. Load saved provider configs
  const savedProviders = database.listProviderConfigs()
  if (savedProviders.length > 0) {
    const configs = savedProviders.map((p) => ({
      id: p.id,
      name: p.name,
      baseUrl: p.baseUrl,
      apiKey: p.apiKey,
      models: JSON.parse(p.models) as string[],
      type: p.type as providers.ProviderConfig['type'],
      isActive: p.isActive === 1
    }))
    providers.initialize(configs)
  } else {
    providers.initialize()
  }
  console.log('[init] Providers initialised')

  // 3. Restore GitHub auth if saved
  const ghAuth = database.getGitHubAuth()
  if (ghAuth) {
    github.authenticate(ghAuth.token, ghAuth.type as 'pat' | 'oauth', ghAuth.username ?? undefined)
    console.log('[init] GitHub auth restored')
  }

  // 4. Sandbox — nothing to init (lazy)
  console.log('[init] Sandbox ready')

  // 5. Execution engine — nothing to init (lazy)
  console.log('[init] Execution engine ready')
}

/**
 * Restore window position and size from saved settings.
 */
function restoreWindowBounds(win: BrowserWindow): void {
  const x = database.getSetting('window_x')
  const y = database.getSetting('window_y')
  const width = database.getSetting('window_width')
  const height = database.getSetting('window_height')

  if (x && y && width && height) {
    win.setBounds({
      x: parseInt(x, 10),
      y: parseInt(y, 10),
      width: parseInt(width, 10),
      height: parseInt(height, 10)
    })
  }
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.nousresearch.openjuliet')

  // Default open or close DevTools by F12 in development and ignore
  // CommandOrControl + R in production
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialise all subsystems first
  await initSubsystems()

  // Create the main window
  mainWindow = createWindow()

  // Restore saved window bounds (non-maximised)
  if (database.getSetting('window_maximised') !== 'true') {
    restoreWindowBounds(mainWindow)
  }

  // Register all IPC handlers
  registerHandlers(mainWindow)
  console.log('[init] IPC handlers registered')

  // Wire up subsystem IPC event emitters
  providers.setMainWindow(mainWindow)
  execution.setMainWindow(mainWindow)
  demo.setMainWindow(mainWindow)

  // Initialise auto-updater (no-op if electron-updater not installed)
  initAutoUpdater()

  // Open DevTools in development
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  database.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS: re-create window when dock icon is clicked
app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow()
    registerHandlers(mainWindow)
    providers.setMainWindow(mainWindow)
    execution.setMainWindow(mainWindow)
    demo.setMainWindow(mainWindow)
  }
})

// Save database before quit
app.on('before-quit', () => {
  database.close()
})

// Handle Squirrel events (Windows installer)
if (process.platform === 'win32') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const squirrelStartup = require('electron-squirrel-startup')
  if (squirrelStartup) app.quit()
}