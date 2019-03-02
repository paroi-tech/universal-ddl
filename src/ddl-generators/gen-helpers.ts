import { GeneratorContext, GeneratorOptions, GenSections } from "./index"

export function makeGeneratorContext(options: GeneratorOptions, sections: GenSections): GeneratorContext {
  const cx: GeneratorContext = {
    sections,
    options: {
      ...defaultOptions,
      ...options
    },
    gen(sectionName: string, functionName: string, ...args: any[]) {
      const dict = cx.sections[sectionName]
      if (!dict)
        throw new Error(`Invalid section: ${sectionName}`)
      if (dict[functionName] === undefined)
        throw new Error(`Cannot find "${functionName}" in ${sectionName}`)
      return dict[functionName](cx, ...args)
    }
  }
  return cx
}

const defaultOptions: Required<GeneratorOptions> = {
  indentUnit: "  "
}

export function indent(cx: GeneratorContext, level: number) {
  if (level === 1)
    return cx.options.indentUnit
  const items: string[] = []
  for (let i = 0; i < level; ++i)
    items.push(cx.options.indentUnit)
  return items.join("")
}