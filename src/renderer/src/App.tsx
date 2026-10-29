import React from 'react'
import AppShell from '@renderer/components/app-shell'
import { ThemeProvider } from '@renderer/lib/theme'
import { WorkspaceProvider } from '@renderer/lib/workspace'

export default function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <AppShell />
      </WorkspaceProvider>
    </ThemeProvider>
  )
}
