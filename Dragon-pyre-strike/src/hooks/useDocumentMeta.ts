import { useEffect } from 'react'

/** Sets document title + meta description for the active page (Section 28 SEO). */
export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    const metaTag = description ? document.querySelector('meta[name="description"]') : null
    const prevContent = metaTag?.getAttribute('content') ?? null
    if (metaTag && description) metaTag.setAttribute('content', description)

    return () => {
      document.title = prevTitle
      if (metaTag && prevContent !== null) metaTag.setAttribute('content', prevContent)
    }
  }, [title, description])
}
