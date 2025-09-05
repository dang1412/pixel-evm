import { useEffect, useMemo, useState } from 'react'
import { FaClock } from 'react-icons/fa'

interface Props {
  waitSec: number
}

export const CoolDownCount: React.FC<Props> = ({ waitSec }) => {

  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(Math.max(waitSec, 0))
    if (waitSec <= 0) return
    const intv = setInterval(() => setCount(c => {
      if (c <= 1) clearInterval(intv)
      return c - 1
    }), 1000)

    return () => clearInterval(intv)
  }, [waitSec])

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
