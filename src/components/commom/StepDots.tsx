import { cn } from '@/lib/utils';

// RN-26 — a wide pill for the current step, a small dot for the other one.
// Originally the create-purchase dialog's own two-step indicator (HU-29);
// reused as-is by HU-08's "load items from template" sheet on the active
// purchase, which follows the same pick-a-template pattern.
interface StepDotsProps {
  activeStep: 1 | 2;
}

const StepDots: React.FC<StepDotsProps> = ({ activeStep }) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <div
        className={cn(
          'h-2 rounded-full',
          activeStep === 1 ? 'w-4 bg-primary' : 'w-2 bg-tosho-200'
        )}
      />
      <div
        className={cn(
          'h-2 rounded-full',
          activeStep === 2 ? 'w-4 bg-primary' : 'w-2 bg-tosho-200'
        )}
      />
    </div>
  );
};

export default StepDots;
