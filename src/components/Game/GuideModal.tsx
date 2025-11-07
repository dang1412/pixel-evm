import { useState, ReactNode, useCallback, useMemo } from 'react'
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

interface Step {
  content: ReactNode
  image?: string
}

interface GuideModalProps {
  steps: Step[]
  onClose: () => void
}

export const GuideModal = ({ steps, onClose }: GuideModalProps) => {
  const [currentStep, setCurrentStep] = useState(0)

  const goToNextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, steps])

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep, steps])

  const isLastStep = useMemo(() => currentStep === steps.length - 1, [currentStep, steps])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-2xl transform rounded-xl bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="absolute right-2 top-1 flex items-center justify-between">
            {/* <h3 className="text-lg font-medium">
              Guide ({currentStep + 1}/{steps.length})
            </h3> */}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {steps[currentStep].image && (
              <div className="mb-6 flex justify-center">
                <img
                  src={steps[currentStep].image}
                  alt={`Step ${currentStep + 1}`}
                  className="max-h-80 rounded-lg object-contain"
                />
              </div>
            )}
            
            <div className="prose max-w-none">
              {steps[currentStep].content}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between border-t p-4">
            <button
              onClick={goToPrevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className='text-sm font-medium mt-2'>Guide ({currentStep + 1}/{steps.length})</div>
            
            <button
              onClick={() =>
                isLastStep ? onClose() : goToNextStep()
              }
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLastStep ? 'Done' : 'Next'}
              {!isLastStep && <FaChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}