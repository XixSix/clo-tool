import { useEffect, useState } from 'react'

/** Phiên bản app đang chạy — đọc từ package.json qua main process. */
export function useAppVersion(): string {
  const [version, setVersion] = useState('')

  useEffect(() => {
    let mounted = true
    void window.api.getAppVersion().then((value) => {
      if (mounted) setVersion(value)
    })
    return () => {
      mounted = false
    }
  }, [])

  return version
}
