import { useState } from 'react'
import { motion } from 'framer-motion'
import { Code, FileCode, FolderOpen, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useWindowSize } from '../../hooks/useWindowSize'
import { cn } from '../../lib/utils'
import { AnimatedContainer, AnimatedItem } from '../ui/AnimatedContainer'

/**
 * EditorView — Placeholder view for the code editor workspace.
 * Provides quick actions to open files, create new files, and access
 * the full code editor experience.
 */
export default function EditorView(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'files' | 'recent'>('files')
  const [panelsExpanded, setPanelsExpanded] = useState(true)
  const { isSmall } = useWindowSize()

  return (
    <AnimatedContainer animation="slideUp">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-accent-subtle)]">
            <Code size={22} className="text-[var(--color-accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Code Editor
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Browse, edit, and manage your project files
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions — collapsible on small screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar panels — collapse on small screens */}
        {(isSmall ? panelsExpanded : true) && (
          <div className="lg:col-span-1 space-y-4">
            <AnimatedItem>
              <Card variant="default" padding="lg">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<FolderOpen size={16} />}
                    fullWidth
                  >
                    Open File
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<Plus size={16} />}
                    fullWidth
                  >
                    New File
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<FolderOpen size={16} />}
                    fullWidth
                  >
                    Open Folder
                  </Button>
                </div>
              </Card>
            </AnimatedItem>

            <AnimatedItem>
              <Card variant="default" padding="lg">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                  Recent Files
                </h3>
                <div className="text-center py-8">
                  <FileCode size={32} className="mx-auto text-[var(--color-text-muted)] opacity-50 mb-2" />
                  <p className="text-xs text-[var(--color-text-muted)]">
                    No recent files
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Open a file to get started
                  </p>
                </div>
              </Card>
            </AnimatedItem>
          </div>
        )}

        {/* Toggle panel collapse button on small screens */}
        {isSmall && (
          <button
            onClick={() => setPanelsExpanded(!panelsExpanded)}
            className="flex items-center justify-center gap-1 p-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)] w-full mb-4"
          >
            {panelsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {panelsExpanded ? 'Hide panels' : 'Show panels'}
          </button>
        )}

        {/* Main Editor Area Preview */}
        <div className="lg:col-span-2">
          <AnimatedItem>
            <Card variant="default" padding="lg">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                Editor
              </h3>
              <motion.div
                className="rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Tab Bar */}
                <div className="flex items-center h-9 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] px-2">
                  <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                    <FileCode size={14} className="text-[var(--color-accent)]" />
                    <span>No file open</span>
                  </div>
                </div>

                {/* Editor Body */}
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Code size={48} className="mx-auto mb-3 text-[var(--color-text-muted)] opacity-30" />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Open a file from the file explorer
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                      Use the sidebar or drag & drop files here
                    </p>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between px-3 py-1 bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border)]">
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    Ready
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    UTF-8
                  </span>
                </div>
              </motion.div>
            </Card>
          </AnimatedItem>
        </div>
      </div>
    </AnimatedContainer>
  )
}
