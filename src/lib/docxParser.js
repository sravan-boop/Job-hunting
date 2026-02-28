import mammoth from 'mammoth'

export async function extractTextFromDocx(file) {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}
