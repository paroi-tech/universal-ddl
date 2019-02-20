export function getIdentifierText(idCtx) {
  return idCtx.IDENTIFIER().getText()
}

export function getIdListItemTexts(idListCtx) {
  // return idListCtx.items.map(item =>  item.getText())
  const list: any[] = []
  for (const idCtx of idListCtx.items) {
    const text = getIdentifierText(idCtx)
    list.push(text)
  }
  return list
}
