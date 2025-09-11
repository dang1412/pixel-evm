import { useEffect } from 'react'

export function useInterval(func: () => void, timeloop: number) {
  useEffect(() => {
    const intv = setInterval(() => func(), timeloop)

    return () => clearInterval(intv)
  }, [func, timeloop])
}
