import { useEffect, useState } from 'react';

export function useAnimatedNumber(
  endValue: number,
  duration: number = 1000,
  startValue: number = 0
): number {
  const [currentValue, setCurrentValue] = useState(startValue);

  useEffect(() => {
    const stepTime = 16; // ~60fps
    const totalSteps = duration / stepTime;
    const increment = (endValue - startValue) / totalSteps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      
      if (currentStep >= totalSteps) {
        setCurrentValue(endValue);
        clearInterval(timer);
      } else {
        // Easing function for smooth animation
        const progress = currentStep / totalSteps;
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        const newValue = startValue + (endValue - startValue) * easedProgress;
        setCurrentValue(Math.round(newValue));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [endValue, duration, startValue]);

  return currentValue;
}