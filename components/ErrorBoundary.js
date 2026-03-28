'use client'
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center bg-[#fafaf8] px-6">
          <div className="max-w-md w-full text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#f0f4f8] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1e3a5f"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#111111] mb-2">
              Algo salio mal
            </h2>
            <p className="text-sm text-[#6b7280] mb-6">
              Ha ocurrido un error inesperado. Puedes intentar de nuevo o contactar con soporte si el problema persiste.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
