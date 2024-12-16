export function ProgressSteps({ currentStep = 1 }: { currentStep?: number }) {
  const steps = [
    { number: 1, title: 'お悩みを入力' },
    { number: 2, title: '質問票に回答' },
    { number: 3, title: '回答を確認' },
  ]

  return (
    <div className="flex justify-between mb-6 px-4">
      {steps.map((step) => (
        <div
          key={step.number}
          className="flex flex-col items-center gap-2"
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
              ${currentStep === step.number
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
              }`}
          >
            {step.number}
          </div>
          <div className="text-xs text-center">{step.title}</div>
        </div>
      ))}
    </div>
  )
}

