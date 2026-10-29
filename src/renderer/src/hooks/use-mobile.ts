import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  const [isMobile, setIsMobile] = React.useState<boolean>(mql.matches)

  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
