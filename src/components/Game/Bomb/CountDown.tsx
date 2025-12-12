import { useCallback, useEffect, useState } from 'react'
import { FaClock } from 'react-icons/fa'

import { useInterval } from '../GiftBox/hook/useInterval'

interface Props {
  // in seconds
  time: number
  isPaused?: boolean
}

export const CountDown: React.FC<Props> = ({ time, isPaused }) => {

  const [count, setCount] = useState(0)
  const [targetTime, setTargetTime] = useState(0)

  // set target time when time prop change
  useEffect(() => {
    setTargetTime(Date.now() + time * 1000)
  }, [time])

  // update count when new targetTime or page visiblity change
  const isActive = useTabVisibility()
  useEffect(() => {
    const waitSec = Math.round((targetTime - Date.now()) / 1000)
    console.log('Page active', isActive)
    setCount(waitSec > 0 ? waitSec : 0)
  }, [targetTime, isActive])

  const doLoop = useCallback(() => {
    if (isPaused) return
    setCount(c => c > 0 ? c - 1 : 0)
  }, [isPaused])

  // countdown 1sec
  useInterval(doLoop, 1000)

  return (
    <span className='text-gray-800 flex items-center'>
      {count}s ⏱️
    </span>
  )
}

const useTabVisibility = () => {
  const [isTabActive, setIsTabActive] = useState(true)

  const handleVisibilityChange = useCallback(() => {
    setIsTabActive(document.visibilityState === 'visible')
  }, [])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    };
  }, [handleVisibilityChange])

  return isTabActive
}
