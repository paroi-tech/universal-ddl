export function removeSelectedItems<T>(selectedIndices: number[], items: T[]): T[] | undefined {
  const copy = [...items]
  for (const constraintIndex of selectedIndices.reverse())
    copy.splice(constraintIndex, 1)
  return copy.length === 0 ? undefined : copy
}