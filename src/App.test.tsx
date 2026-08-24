import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('Skill Tree Phase 2 app', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('renders one map containing Fitness and Study category skills', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'MY SKILL TREE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /운동 category/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /공부 category/i })).toBeInTheDocument()
    expect(screen.getByTestId('skill-node-fitness-start')).toBeInTheDocument()
    expect(screen.getByTestId('skill-node-study-start')).toBeInTheDocument()
  })

  it('awards a daily quest only once on the same date', async () => {
    const user = userEvent.setup()
    render(<App />)
    const questButton = screen.getByRole('button', { name: /complete 오늘 운동하기/i })

    expect(screen.getByTestId('category-balance-fitness')).toHaveTextContent('Fitness Coin: 0')
    await user.click(questButton)

    expect(screen.getByTestId('category-balance-fitness')).toHaveTextContent('Fitness Coin: 1')
    expect(questButton).toBeDisabled()
    await user.click(questButton)
    expect(screen.getByTestId('category-balance-fitness')).toHaveTextContent('Fitness Coin: 1')
  })

  it('reenables completed quests when an open page crosses local midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 24, 23, 59, 59, 500))
    render(<App />)
    const questButton = screen.getByRole('button', { name: /complete 오늘 운동하기/i })

    fireEvent.click(questButton)
    expect(questButton).toBeDisabled()

    act(() => { vi.advanceTimersByTime(1_000) })

    expect(questButton).toBeEnabled()
  })

  it('shows quest-earned availability and unlocks without spending coins', async () => {
    const user = userEvent.setup()
    render(<App />)

    fireEvent.click(screen.getByTestId('skill-node-fitness-start'))
    await user.click(screen.getByRole('button', { name: /^unlock$/i }))
    fireEvent.click(screen.getByTestId('skill-node-fitness-3-week'))
    fireEvent.change(screen.getByRole('spinbutton', { name: /required coins/i }), { target: { value: '1' } })
    expect(within(screen.getByTestId('skill-node-fitness-3-week')).getByText('LOCKED')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /complete 오늘 운동하기/i }))

    expect(within(screen.getByTestId('skill-node-fitness-3-week')).getByText('AVAILABLE')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^unlock$/i }))
    expect(within(screen.getByTestId('skill-node-fitness-3-week')).getByText('UNLOCKED')).toBeInTheDocument()
    expect(screen.getByTestId('category-balance-fitness')).toHaveTextContent('Fitness Coin: 1')
  })

  it('creates a custom category and adds a skill assigned to it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /add category/i }))
    await user.type(screen.getByRole('textbox', { name: /new category name/i }), '음악')
    await user.type(screen.getByRole('textbox', { name: /new coin name/i }), 'Music Coin')
    await user.click(screen.getByRole('button', { name: /create category/i }))

    expect(screen.getByTestId(/category-balance-category-/)).toHaveTextContent('Music Coin: 0')
    await user.click(screen.getByRole('button', { name: /add skill/i }))
    expect((screen.getByRole('combobox', { name: /category/i }) as HTMLSelectElement).value)
      .toMatch(/^category-/)
    expect(screen.getByRole('textbox', { name: /skill name/i })).toHaveValue('New Skill')
  })
})
