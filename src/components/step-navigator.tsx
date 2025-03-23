import { ReactNode, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

type Step = {
  title: string;
  description?: string;
  content: ReactNode;
};

type StepNavigatorProps = {
  steps: Step[];
  currentStep: number;
  isPreviousDisabled?: boolean;
  originalDb?: any; // To check if database is loaded
  onStepClick?: (stepIndex: number) => void; // Add handler for step clicks
};

export function StepNavigator({
  steps,
  currentStep,
  originalDb = null,
  onStepClick,
}: StepNavigatorProps) {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Auto-scroll to the current step when it changes
  useEffect(() => {
    // Add a small delay to ensure DOM is fully updated
    const scrollTimer = setTimeout(() => {
      if (stepRefs.current[currentStep]) {
        stepRefs.current[currentStep]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
    
    return () => clearTimeout(scrollTimer);
  }, [currentStep]);

  // Function to determine if a step is available
  const isStepAvailable = (index: number) => {
    // First step is always available
    if (index === 0) return true;
    // Second step (load) is always available
    if (index === 1) return true;
    // Subsequent steps require database to be loaded
    return originalDb !== null;
  };

  return (
    <div >
      {/* Step indicator - horizontal bar at the top */}
      <div className="sticky top-0 z-10 bg-background pt-2 pb-2 border-b px-4">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center"
              onClick={() => {
                const isAvailable = isStepAvailable(index);
                if (isAvailable && onStepClick) {
                  onStepClick(index);
                }
              }}
              style={{ cursor: isStepAvailable(index) ? 'pointer' : 'not-allowed' }}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${index === currentStep
                  ? 'bg-primary text-primary-foreground border-primary'
                  : index < currentStep
                    ? 'bg-primary/20 border-primary/50 text-primary-foreground'
                    : 'bg-background border-muted-foreground/30 text-muted-foreground'
                  }`}
              >
                {index + 1}
              </div>
              <span
                className={`mt-2 text-sm ${index === currentStep
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
                  }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Vertical steps content */}
      <div className="space-y-6">
        {steps.map((step, index) => {
          const isAvailable = isStepAvailable(index);
          return (
            <div 
              key={index} 
              ref={(el) => {
                if (el) {
                  stepRefs.current[index] = el;
                }
              }}
              className={`scroll-mt-24 ${!isAvailable ? 'opacity-25 pointer-events-none' : ''}`}
              id={`step-${index}`}
            >
              <Card className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground mr-2">
                      {index + 1}
                    </span>
                    {step.title}
                  </h2>
                  {step.description && (
                    <p className="text-muted-foreground mt-1">{step.description}</p>
                  )}
                </div>
                <div>{step.content}</div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
