import { AstColumnConstraintComposition, AstTableConstraintComposition } from "../parser/ast"

export interface SelectedConstraint {
  compoIndex: number
  constraintIndex: number
}

export function removeSelectedColumnConstraints(sel: SelectedConstraint[], compos: AstColumnConstraintComposition[]) {
  // Build map
  const map = new Map<number, number[]>()
  for (const { compoIndex, constraintIndex } of sel) {
    let indices = map.get(compoIndex)
    if (!indices) {
      indices = []
      map.set(compoIndex, indices)
    }
    indices.push(constraintIndex)
  }

  // Make a copy with removed constraints
  const copy = [...compos]
  for (const [compoIndex, constraintIndices] of map.entries()) {
    copy[compoIndex] = {
      ...copy[compoIndex],
      constraints: [...copy[compoIndex].constraints]
    }
    for (const constraintIndex of constraintIndices.reverse())
      copy[compoIndex].constraints.splice(constraintIndex, 1)
  }
  for (const compoIndex of Array.from(map.keys()).sort((a, b) => b - a)) {
    if (copy[compoIndex].constraints.length === 0)
      copy.splice(compoIndex, 1)
  }
  return copy.length === 0 ? undefined : copy
}

export function removeSelectedConstraints<T extends AstColumnConstraintComposition | AstTableConstraintComposition>(
  constraintIndices: number[],
  compo: T
): T | undefined {
  const copy = {
    ...compo,
    constraints: [...compo.constraints]
  }
  for (const constraintIndex of constraintIndices.reverse())
    copy.constraints.splice(constraintIndex, 1)
  return copy.constraints.length > 0 ? copy : undefined
}