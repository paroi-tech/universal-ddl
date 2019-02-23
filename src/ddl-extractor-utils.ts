export function getIdentifierText(idCtx) {
  return idCtx.IDENTIFIER().getText()
}

export function getIdListItemTexts(idListCtx) {
  const list: any[] = []
  for (const idCtx of idListCtx.id()) {
    const text = getIdentifierText(idCtx)
    list.push(text)
  }
  return list
}
