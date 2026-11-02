import React from 'react'
import AppShell from '@renderer/components/shell/app-shell'
import { ThemeProvider } from '@renderer/lib/theme'
import { WorkspaceProvider } from '@renderer/hooks/workspace'

export default function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <AppShell />
      </WorkspaceProvider>
    </ThemeProvider>
  )
}
