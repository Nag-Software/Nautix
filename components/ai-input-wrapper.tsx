"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, X, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AISuggestion {
  field: string
  value: string
}

interface AIInputWrapperProps extends React.InputHTMLAttributes<HTMLInputElement> {
  field?: string
  value?: string
  onValueChange?: (value: string) => void
  triggerFields?: Record<string, string>
  enableAutofill?: boolean
  onAutofillSuggestions?: (suggestions: Record<string, string>) => void
  autofillType?: 'engine' | 'boat'
  currentData?: any
}

const MAX_AUTOFILL_ITERATIONS = 4

export function AIInputWrapper({
  field,
  value = "",
  onValueChange,
  triggerFields,
  enableAutofill = false,
  onAutofillSuggestions,
  autofillType = 'engine',
  currentData = {},
  className,
  ...props
}: AIInputWrapperProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [isCheckingAutofill, setIsCheckingAutofill] = useState(false)
  const lastSearchedRef = useRef<string>("")
  const autofillCountRef = useRef<number>(0)

  // Check for spelling corrections
  const checkForSuggestions = async (fieldName: string, fieldValue: string) => {
    if (!fieldName || !fieldValue || fieldValue.length < 2) {
      return
    }

    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          field: fieldName, 
          value: fieldValue,
          action: 'correct'
        }),
      })

      const data = await response.json()

      if (data.suggestion) {
        setSuggestion(data.suggestion)
      }
    } catch (error) {
      console.error('Error checking suggestions:', error)
    }
  }

  // Check for autofill suggestions when trigger fields change
  useEffect(() => {
    if (enableAutofill && triggerFields) {
      const manufacturer = triggerFields.manufacturer
      const model = triggerFields.model

      if (manufacturer && model && manufacturer.length > 1 && model.length > 1) {
        // Check how many affected fields are already filled
        const affectedFields = autofillType === 'boat' 
          ? ['length_meters', 'width_meters', 'weight_kg', 'hull_material', 'year']
          : ['horsepower', 'year', 'engine_type', 'fuel_type', 'fuel_consumption_lph', 'oil_type']
        
        const filledFieldsCount = affectedFields.filter(field => {
          const fieldValue = currentData[field]
          return fieldValue && fieldValue.trim() !== ''
        }).length

        // Don't run autofill if 2 or more fields are already filled
        if (filledFieldsCount >= 2) {
          return
        }

        const searchKey = `${manufacturer.toLowerCase()}-${model.toLowerCase()}`
        
        // Only search if this is a new combination and we haven't exceeded max iterations
        if (searchKey !== lastSearchedRef.current && autofillCountRef.current < MAX_AUTOFILL_ITERATIONS) {
          lastSearchedRef.current = searchKey
          autofillCountRef.current += 1
          checkForAutofill(manufacturer, model)
        }
      }
    }
  }, [enableAutofill, triggerFields, currentData, autofillType])

  const checkForAutofill = async (manufacturer: string, model: string) => {
    setIsCheckingAutofill(true)
    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'autofill',
          manufacturer,
          model,
          type: autofillType
        }),
      })

      const data = await response.json()

      if (data.suggestions && onAutofillSuggestions) {
        onAutofillSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Error checking autofill:', error)
    } finally {
      setIsCheckingAutofill(false)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (field) {
      checkForSuggestions(field, e.target.value)
    }
    props.onBlur?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onValueChange?.(newValue)
    props.onChange?.(e)
  }

  const acceptSuggestion = () => {
    if (suggestion) {
      onValueChange?.(suggestion)
      setSuggestion(null)
    }
  }

  const rejectSuggestion = () => {
    setSuggestion(null)
  }

  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={className}
      />
      {suggestion && (
        <div className="mt-1.5 flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2 animate-in fade-in-50 slide-in-from-top-1 duration-200">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-muted-foreground">Mente du:</span>
          <span className="font-medium text-blue-700 dark:text-blue-300">{suggestion}</span>
          <div className="ml-auto flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900/30"
              onClick={acceptSuggestion}
              type="button"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
              onClick={rejectSuggestion}
              type="button"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      )}
      {isCheckingAutofill && (
        <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Søker etter motorinformasjon...</span>
        </div>
      )}
    </div>
  )
}
