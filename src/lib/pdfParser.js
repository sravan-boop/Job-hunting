import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export async function extractTextFromPdf(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => item.str).join(' ')
    pages.push(text)
  }

  return pages.join('\n\n')
}
