import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : /\.(tsx|ts)$/.test(path) && !path.endsWith('.test.ts') ? [path] : []
  })
}

describe('active student management app', () => {
  it('keeps the requested name and participation page', () => {
    const html = readFileSync('index.html', 'utf8')
    const shell = readFileSync('src/components/AppShell.tsx', 'utf8')
    const routes = readFileSync('src/App.tsx', 'utf8')
    expect(html).toContain('荣市大学_学生管理系统')
    expect(shell).toContain('回答次數')
    expect(shell).toContain('/participation')
    expect(routes).toContain('path="/participation"')
  })

  it('does not reintroduce the retired visible name', () => {
    const visibleSources = ['index.html', ...sourceFiles('src')]
    for (const file of visibleSources) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/课迹|課跡/)
    }
  })
})
