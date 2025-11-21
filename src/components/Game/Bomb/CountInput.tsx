import { useCallback, useState } from 'react'

interface CountInputProps {
  min: number
  max: number
  onChange: (value: number) => void
}

export const CountInput: React.FC<CountInputProps> = ({ min, max, onChange }) => {

  const [value, setValue] = useState(min)

  const decrease = useCallback(() => {
    if (value > min) {
      const newValue = value - 1
      setValue(newValue)
      onChange(newValue)
    }
  }, [value, min, onChange]) 

  const increase = useCallback(() => {
    if (value < max) {
      const newValue = value + 1
      setValue(newValue)
      onChange(newValue)
    }
  }, [value, max, onChange])

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={decrease}
        disabled={value <= min}
        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous round"
      >
        ←
      </button>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 text-center">
        {value}
      </span>
      <button
        onClick={increase}
        disabled={value >= max}
        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next round"
      >
        →
      </button>
    </div>
  )
}
