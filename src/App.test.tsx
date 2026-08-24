import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('Skill Tree app', () => {
  beforeEach(() => localStorage.clear())

  it('adds a skill and immediately opens it in the editor', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /add skill/i }))

    expect(screen.getByRole('textbox', { name: /skill name/i })).toHaveValue('New Skill')
    expect(screen.getByTestId(/skill-node-skill-/)).toHaveTextContent('AVAILABLE')
  })

  it('creates and activates an independent empty tree', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /new tree/i }))

    expect(screen.getByRole('textbox', { name: /tree name/i })).toHaveValue('New Tree')
    expect(screen.queryByTestId('skill-node-engineering')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /add skill/i }))
    expect(screen.getByTestId(/skill-node-skill-/)).toBeInTheDocument()
  })

  it('completing a prerequisite unlocks its dependent skill immediately', async () => {
    const user = userEvent.setup()
    render(<App />)
    const cad = screen.getByTestId('skill-node-cad')
    expect(within(cad).getByText('LOCKED')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('skill-node-engineering'))
    await user.click(screen.getByRole('button', { name: /complete skill/i }))

    expect(within(screen.getByTestId('skill-node-cad')).getByText('AVAILABLE')).toBeInTheDocument()
  })
})
