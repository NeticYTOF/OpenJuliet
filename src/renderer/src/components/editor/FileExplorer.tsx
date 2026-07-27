import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  Image,
  FileJson,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  Plus,
} from 'lucide-react'
import { cn } from '../../lib/utils'

/* ──── Types ──── */

export type GitStatus = 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'none'

export interface FileItem {
  /** Unique identifier */
  id: string
  /** File or directory name */
  name: string
  /** 'file' or 'directory' */
  type: 'file' | 'directory'
  /** Full path from root */
  path: string
  /** Child items (only for directories) */
  children?: FileItem[]
  /** Git decoration status */
  gitStatus?: GitStatus
  /** Whether the node is expanded (directories only) */
  expanded?: boolean
  /** File language for icon selection */
  language?: string
}

export interface FileExplorerProps {
  /** The file tree root */
  items: FileItem[]
  /** Currently selected file ID */
  selectedId?: string | null
  /** Called when a file is clicked/selected */
  onFileSelect?: (item: FileItem) => void
  /** Called when a directory is expanded/collapsed */
  onToggleExpand?: (item: FileItem) => void
  /** Called when a rename is requested (returns the new name) */
  onRename?: (item: FileItem) => void
  /** Called when a delete is requested */
  onDelete?: (item: FileItem) => void
  /** Called when a file is double-clicked */
  onDoubleClick?: (item: FileItem) => void
  /** Whether to show the search/filter input */
  showFilter?: boolean
  /** Additional class names */
  className?: string
  /** Allow creating new files/folders */
  allowCreate?: boolean
  /** Called when creating a new item */
  onCreateItem?: (parentPath: string, type: 'file' | 'directory', name: string) => void
}

/* ──── Helpers ──── */

interface FileIconProps {
  item: FileItem
  size?: number
  className?: string
}

function getFileIcon(name: string, language?: string): typeof File {
  const ext = name.split('.').pop()?.toLowerCase()
  const extMap: Record<string, typeof File> = {
    ts: FileCode,
    tsx: FileCode,
    js: FileCode,
    jsx: FileCode,
    py: FileCode,
    rs: FileCode,
    go: FileCode,
    java: FileCode,
    css: FileCode,
    scss: FileCode,
    html: FileCode,
    json: FileJson,
    md: FileText,
    txt: FileText,
    png: Image,
    jpg: Image,
    jpeg: Image,
    svg: Image,
    ico: Image,
  }

  if (language === 'markdown' || language === 'json') return FileText
  return ext ? extMap[ext] || File : File
}

function getGitStatusColor(status: GitStatus): string {
  switch (status) {
    case 'modified':
      return 'var(--color-warning)'
    case 'added':
      return 'var(--color-success)'
    case 'deleted':
      return 'var(--color-error)'
    case 'renamed':
      return 'var(--color-info)'
    case 'untracked':
      return 'var(--color-text-muted)'
    default:
      return 'transparent'
  }
}

/* ──── Context Menu ──── */

interface ContextMenuProps {
  x: number
  y: number
  item: FileItem
  onClose: () => void
  onRename: () => void
  onDelete: () => void
  onCopyPath: () => void
  onOpen: () => void
}

function ContextMenu({
  x,
  y,
  item,
  onClose,
  onRename,
  onDelete,
  onCopyPath,
  onOpen,
}: ContextMenuProps): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const menuItems = [
    { label: 'Open', icon: ExternalLink, action: onOpen, shortcut: '↵' },
    { label: 'Rename', icon: Edit3, action: onRename, shortcut: 'F2' },
    { label: 'Delete', icon: Trash2, action: onDelete, shortcut: '⌫' },
    { label: 'Copy Path', icon: Copy, action: onCopyPath, shortcut: '⌘C' },
  ]

  /* Clamp to viewport */
  const clampedX = Math.min(x, window.innerWidth - 180)
  const clampedY = Math.min(y, window.innerHeight - menuItems.length * 36 - 16)

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="fixed z-50 w-44 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg"
      style={{ left: clampedX, top: clampedY }}
      data-contextmenu-enabled="true"
    >
      <div className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)] truncate">
        {item.name}
      </div>
      {menuItems.map((menuItem) => (
        <button
          key={menuItem.label}
          onClick={() => {
            menuItem.action()
            onClose()
          }}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-accent-subtle)] transition-colors"
        >
          <menuItem.icon size={14} className="shrink-0" />
          <span className="flex-1 text-left">{menuItem.label}</span>
          <span className="text-[var(--color-text-muted)]">{menuItem.shortcut}</span>
        </button>
      ))}
    </motion.div>
  )
}

/* ──── Tree Node ──── */

interface TreeNodeProps {
  item: FileItem
  depth: number
  selectedId: string | null | undefined
  onSelect: (item: FileItem) => void
  onToggle: (item: FileItem) => void
  onContextMenu: (e: React.MouseEvent, item: FileItem) => void
  filterQuery: string
}

function TreeNode({
  item,
  depth,
  selectedId,
  onSelect,
  onToggle,
  onContextMenu,
  filterQuery,
}: TreeNodeProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false)
  const isDirectory = item.type === 'directory'
  const isExpanded = item.expanded ?? false
  const isSelected = item.id === selectedId
  const gitDotColor = getGitStatusColor(item.gitStatus || 'none')

  /* Filter matching */
  const matchesFilter = useMemo(() => {
    if (!filterQuery) return true
    return item.name.toLowerCase().includes(filterQuery.toLowerCase())
  }, [item.name, filterQuery])

  /* If this node doesn't match and it's a directory, check if any children match */
  const hasMatchingChildren = useMemo(() => {
    if (!filterQuery || !item.children) return false
    return item.children.some((child) => {
      if (child.name.toLowerCase().includes(filterQuery.toLowerCase())) return true
      if (child.children) {
        return child.children.some((gc) =>
          gc.name.toLowerCase().includes(filterQuery.toLowerCase())
        )
      }
      return false
    })
  }, [filterQuery, item.children])

  if (!matchesFilter && !hasMatchingChildren) return <></>

  const handleDoubleClick = useCallback(() => {
    if (isDirectory) {
      onToggle(item)
    }
  }, [isDirectory, onToggle, item])

  const IconComponent = isDirectory
    ? isExpanded
      ? FolderOpen
      : Folder
    : getFileIcon(item.name, item.language)

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 cursor-pointer group transition-colors text-xs',
          isSelected
            ? 'bg-[var(--color-accent-subtle)] text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]'
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(item)}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => onContextMenu(e, item)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={item.path}
      >
        {/* Expand/collapse for directories */}
        {isDirectory ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(item)
            }}
            className="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors shrink-0"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <ChevronRight size={12} className="text-[var(--color-text-muted)]" />
            </motion.div>
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        {/* File/folder icon */}
        <IconComponent
          size={14}
          className={cn(
            'shrink-0',
            isDirectory
              ? isExpanded
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-info)]'
              : 'text-[var(--color-text-muted)]'
          )}
        />

        {/* Name */}
        <span className="flex-1 truncate">{item.name}</span>

        {/* Git status dot */}
        {item.gitStatus && item.gitStatus !== 'none' && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: gitDotColor }}
            title={item.gitStatus}
          />
        )}

        {/* Hover actions */}
        {isHovered && isDirectory && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(item)
            }}
            className="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)] shrink-0"
          >
            {isExpanded ? (
              <ChevronDown size={12} className="text-[var(--color-text-muted)]" />
            ) : (
              <ChevronRight size={12} className="text-[var(--color-text-muted)]" />
            )}
          </button>
        )}
      </div>

      {/* Children (animated expand/collapse) */}
      <AnimatePresence initial={false}>
        {isDirectory && isExpanded && item.children && (
          <motion.div
            key={`children-${item.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {item.children.length > 0 ? (
              item.children.map((child) => (
                <TreeNode
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onToggle={onToggle}
                  onContextMenu={onContextMenu}
                  filterQuery={filterQuery}
                />
              ))
            ) : (
              <div
                className="px-2 py-1 text-xs text-[var(--color-text-muted)] italic"
                style={{ paddingLeft: `${8 + (depth + 1) * 16}px` }}
              >
                Empty folder
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ──── FileExplorer Component ──── */

/**
 * FileExplorer — A file tree explorer for repositories with git decorations,
 * right-click context menus, animated expand/collapse, and search filtering.
 */
export function FileExplorer({
  items,
  selectedId,
  onFileSelect,
  onToggleExpand,
  onRename,
  onDelete,
  onDoubleClick,
  showFilter = true,
  className,
  allowCreate = false,
  onCreateItem,
}: FileExplorerProps): JSX.Element {
  const [filterQuery, setFilterQuery] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    item: FileItem
  } | null>(null)
  const [creatingIn, setCreatingIn] = useState<string | null>(null)

  /* Close context menu on scroll */
  useEffect(() => {
    if (!contextMenu) return
    const handler = () => setContextMenu(null)
    window.addEventListener('scroll', handler, true)
    return () => window.removeEventListener('scroll', handler, true)
  }, [contextMenu])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, item: FileItem) => {
      e.preventDefault()
      e.stopPropagation()
      setContextMenu({ x: e.clientX, y: e.clientY, item })
    },
    []
  )

  const handleSelect = useCallback(
    (item: FileItem) => {
      onFileSelect?.(item)
    },
    [onFileSelect]
  )

  const handleToggle = useCallback(
    (item: FileItem) => {
      onToggleExpand?.(item)
    },
    [onToggleExpand]
  )

  const handleCopyPath = useCallback((item: FileItem) => {
    navigator.clipboard.writeText(item.path).catch(() => {})
  }, [])

  /* Stats */
  const stats = useMemo(() => {
    const countItems = (list: FileItem[]): { files: number; dirs: number } => {
      let files = 0
      let dirs = 0
      for (const item of list) {
        if (item.type === 'directory') {
          dirs++
          if (item.children) {
            const sub = countItems(item.children)
            files += sub.files
            dirs += sub.dirs
          }
        } else {
          files++
        }
      }
      return { files, dirs }
    }
    return countItems(items)
  }, [items])

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] overflow-hidden',
        className
      )}
    >
      {/* ──── Header ──── */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] shrink-0">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          {allowCreate && (
            <>
              <button
                onClick={() => setCreatingIn('/')}
                className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                title="New File"
              >
                <Plus size={14} />
              </button>
            </>
          )}
          <span className="text-xs text-[var(--color-text-muted)]">
            {stats.files}
          </span>
        </div>
      </div>

      {/* ──── Filter / Search ──── */}
      {showFilter && (
        <div className="px-3 py-2 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-primary)] rounded-md border border-[var(--color-border)]">
            <Search size={12} className="shrink-0 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter files..."
              className="flex-1 bg-transparent text-xs text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="p-0.5 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ──── Tree ──── */}
      <div className="flex-1 overflow-y-auto py-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Folder size={32} className="mb-2 text-[var(--color-text-muted)] opacity-30" />
            <p className="text-xs text-[var(--color-text-muted)]">No files open</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Open a folder to get started
            </p>
          </div>
        ) : (
          items.map((item) => (
            <TreeNode
              key={item.id}
              item={item}
              depth={0}
              selectedId={selectedId}
              onSelect={handleSelect}
              onToggle={handleToggle}
              onContextMenu={handleContextMenu}
              filterQuery={filterQuery}
            />
          ))
        )}
      </div>

      {/* ──── Footer Stats ──── */}
      <div className="px-3 py-1.5 bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)] shrink-0">
        {stats.files} files, {stats.dirs} folders
      </div>

      {/* ──── Context Menu ──── */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            item={contextMenu.item}
            onClose={() => setContextMenu(null)}
            onRename={() => onRename?.(contextMenu.item)}
            onDelete={() => onDelete?.(contextMenu.item)}
            onCopyPath={() => handleCopyPath(contextMenu.item)}
            onOpen={() => onFileSelect?.(contextMenu.item)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileExplorer
