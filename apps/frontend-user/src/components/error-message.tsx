import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"

interface ErrorMessageProps {
  title: string
  description: string
}

export function ErrorMessage({ title, description }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className="max-w-md mx-auto">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}

