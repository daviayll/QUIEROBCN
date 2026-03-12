import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useActionState BEFORE importing LoginForm
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useActionState: vi.fn((action: unknown, initialState: unknown) => [initialState, action, false]),
  }
})

vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/actions/clients', () => ({
  loginAction: vi.fn(),
}))

import { LoginForm } from './login-form'
import * as React from 'react'

describe('LoginForm', () => {
  beforeEach(() => {
    vi.mocked(React.useActionState).mockImplementation(
      (action: unknown, init: unknown) => [init, action as any, false]
    )
  })

  it('renders email and password fields', () => {
    render(<LoginForm locale="es" />)
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('renders submit button enabled initially', () => {
    render(<LoginForm locale="es" />)
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).not.toBeDisabled()
  })

  it('displays error message from state', () => {
    const errorState = { success: false as const, error: 'Email o contraseña incorrectos.' }
    vi.mocked(React.useActionState).mockImplementationOnce(
      () => [errorState, vi.fn() as any, false]
    )
    render(<LoginForm locale="es" />)
    expect(screen.getByText('Email o contraseña incorrectos.')).toBeInTheDocument()
  })
})
