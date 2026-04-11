import { useEffect, useEffectEvent } from 'react'

type GlobalKeyboardOptions = {
  onCharacter: (character: string) => void
  onBackspace: () => void
  onSubmit: () => void
}

const LETTER_PATTERN = /^[a-z]$/i

export function useGlobalKeyboard({
  onCharacter,
  onBackspace,
  onSubmit,
}: GlobalKeyboardOptions) {
  const handleCharacter = useEffectEvent(onCharacter)
  const handleBackspace = useEffectEvent(onBackspace)
  const handleSubmit = useEffectEvent(onSubmit)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        handleBackspace()
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        handleSubmit()
        return
      }

      if (LETTER_PATTERN.test(event.key)) {
        event.preventDefault()
        handleCharacter(event.key.toLowerCase())
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
