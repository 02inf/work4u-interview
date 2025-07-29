import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /ai meeting digest/i })).toBeInTheDocument()
  })

  it('renders the transcript input area', () => {
    render(<App />)
    expect(screen.getByPlaceholderText(/paste your meeting transcript here/i)).toBeInTheDocument()
  })

  it('renders both generate buttons', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /generate digest/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stream digest/i })).toBeInTheDocument()
  })

  it('shows character count', () => {
    render(<App />)
    expect(screen.getByText(/0 \/ 50,000 characters/)).toBeInTheDocument()
  })

  it('has tab navigation', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /new digest/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /past digests/i })).toBeInTheDocument()
  })
})