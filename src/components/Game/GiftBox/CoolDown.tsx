import { useCallback, useEffect, useMemo, useState } from 'react'
import { FaClock } from 'react-icons/fa'
import { useInterval } from './hook/useInterval'

interface Props {
  coolDownTime: number
}

export const CoolDownCount: React.FC<Props> = ({ coolDownTime }) => {

  const [count, setCount] = useState(0)

  const isActive = useTabVisibility()

  // update count when new coolDownTime or page visiblity change
  useEffect(() => {
    const waitSec = coolDownTime - Math.floor(Date.now() / 1000)
    console.log('Page active', isActive)
    setCount(waitSec > 0 ? waitSec : 0)
  }, [coolDownTime, isActive])

  const doLoop = useCallback(() => {
    setCount(c => c > 0 ? c - 1 : 0)
  }, [])

  // countdown 1sec
  useInterval(doLoop, 1000)

  // useEffect(() => {
  //   const waitSec = coolDownTime - Math.floor(Date.now() / 1000)
  //   setCount(Math.max(waitSec, 0))
  //   if (!isActive || waitSec <= 0) return
  //   const intv = setInterval(() => setCount(c => {
  //     if (c <= 1) clearInterval(intv)
  //     return c - 1
  //   }), 1000)

  //   return () => clearInterval(intv)
  // }, [coolDownTime, isActive])

  const hour = useMemo(() => Math.floor(count / 3600), [count])
  const min = useMemo(() => Math.floor((count % 3600) / 60), [count])
  const sec = useMemo(() => count % 60, [count])

  return (
    <span className='text-gray-800 font-semibold flex items-center'>
      <FaClock className='mr-1' />
      { hour > 0 && `${hour}h ` }
      { min > 0 && `${min}m ` }
      { sec }s
    </span>
  )
}

const useTabVisibility = () => {
  const [isTabActive, setIsTabActive] = useState(true);

  const handleVisibilityChange = useCallback(() => {
    setIsTabActive(document.visibilityState === 'visible');
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return isTabActive;
}
