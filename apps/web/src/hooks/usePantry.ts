import { useEffect, useState } from 'react'
import {
  loadPantryIngredients,
  loadRecipeMatches,
  type PantryIngredient,
  type RecipeMatch,
} from '../api'

const storageKey = 'olivier-pantry-v1'

type PantrySelection = { selected: number[]; submitted: number[] | null }

function validIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(
    (id): id is number => Number.isSafeInteger(id) && id > 0,
  ))]
}

function readSelection(): PantrySelection {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(storageKey) ?? '{}')
    const selected = validIds(stored.selected)
    const submitted = stored.submitted === null ? null : validIds(stored.submitted)
    return { selected, submitted: submitted?.length ? submitted : null }
  } catch {
    return { selected: [], submitted: null }
  }
}

export function usePantry() {
  const [selection, setSelection] = useState<PantrySelection>(readSelection)
  const [ingredients, setIngredients] = useState<PantryIngredient[] | null>(null)
  const [ingredientsError, setIngredientsError] = useState(false)
  const [ingredientsRequest, setIngredientsRequest] = useState(0)
  const [matches, setMatches] = useState<RecipeMatch[] | null>(null)
  const [matchesError, setMatchesError] = useState(false)
  const [matchesRequest, setMatchesRequest] = useState(0)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(selection))
    } catch {
      // Недоступное хранилище не должно блокировать работу страницы.
    }
  }, [selection])

  useEffect(() => {
    let current = true
    loadPantryIngredients()
      .then((loaded) => {
        if (!current) return
        const publicIds = new Set(loaded.map((item) => item.id))
        setSelection((previous) => {
          const selected = previous.selected.filter((id) => publicIds.has(id))
          const submitted = previous.submitted?.filter((id) => publicIds.has(id)) ?? null
          return { selected, submitted: submitted?.length ? submitted : null }
        })
        setIngredients(loaded)
        setIngredientsError(false)
      })
      .catch(() => {
        if (current) setIngredientsError(true)
      })
    return () => { current = false }
  }, [ingredientsRequest])

  useEffect(() => {
    if (!selection.submitted || ingredients === null) return
    let current = true
    loadRecipeMatches(selection.submitted)
      .then((loaded) => { if (current) setMatches(loaded) })
      .catch(() => { if (current) setMatchesError(true) })
    return () => { current = false }
  }, [selection.submitted, ingredients, matchesRequest])

  return {
    ingredients,
    ingredientsError,
    matches,
    matchesError,
    selectedIds: new Set(selection.selected),
    submittedIds: selection.submitted,
    retryIngredients: () => setIngredientsRequest((request) => request + 1),
    retryMatches: () => {
      setMatches(null)
      setMatchesError(false)
      setMatchesRequest((request) => request + 1)
    },
    toggle: (id: number) => setSelection((previous) => ({
      selected: previous.selected.includes(id)
        ? previous.selected.filter((item) => item !== id)
        : [...previous.selected, id],
      submitted: null,
    })),
    clear: () => setSelection({ selected: [], submitted: null }),
    submit: () => {
      if (!selection.selected.length) return
      setMatches(null)
      setMatchesError(false)
      setSelection((previous) => ({ ...previous, submitted: [...previous.selected] }))
    },
    edit: () => setSelection((previous) => ({ ...previous, submitted: null })),
  }
}
