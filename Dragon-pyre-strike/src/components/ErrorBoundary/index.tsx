import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/** Catches runtime errors inside an individual game so one broken game can
 *  never take down the rest of DracoPyre Strike (Section 31). */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('DracoPyre Strike game error boundary caught:', error, info)
  }

  handleRetry = () => this.setState({ hasError: false })

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-text/5 bg-surface px-6 py-16 text-center">
          <TriangleAlert className="h-8 w-8 text-warning" aria-hidden="true" />
          <h3 className="font-display text-lg font-bold">Unable to load this game</h3>
          <p className="max-w-sm text-sm text-textMuted">Something went wrong while loading the game.</p>
          <button
            onClick={this.handleRetry}
            className="btn-focus mt-2 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary2"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
