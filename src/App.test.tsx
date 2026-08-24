import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'

describe('mobile skill tree app', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 24, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('opens Today and completes a quest with one tap, updating progress and Tree coins', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'TODAY' })).toBeInTheDocument()
    expect(screen.getByText('8월 24일')).toBeInTheDocument()
    expect(screen.getByText('0 / 4')).toBeInTheDocument()

    const fitnessGroup = screen.getByTestId('quest-group-fitness')
    expect(within(fitnessGroup).getByText('Fitness Coin 0')).toBeInTheDocument()
    fireEvent.click(within(fitnessGroup).getByRole('button', { name: '오늘 운동하기 완료' }))

    expect(within(fitnessGroup).getByText('Fitness Coin 1')).toBeInTheDocument()
    expect(within(fitnessGroup).getByRole('button', { name: '오늘 운동하기 완료됨' })).toBeDisabled()
    expect(screen.getByText('1 / 4')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('+1 Fitness Coin')
  })

  it('lists available skills and unlocks without spending coins', () => {
    render(<App />)

    const available = screen.getByLabelText('Unlock available')
    expect(within(available).getByText('운동 시작')).toBeInTheDocument()
    fireEvent.click(within(available).getByRole('button', { name: '운동 시작 unlock' }))

    expect(within(available).queryByText('운동 시작')).not.toBeInTheDocument()
    expect(screen.getByTestId('quest-group-fitness')).toHaveTextContent('Fitness Coin 0')
  })

  it('shows only Today, Tree, and Add in primary navigation', () => {
    render(<App />)

    const navigation = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(within(navigation).getAllByRole('button').map((button) => button.textContent))
      .toEqual(['Today', 'Tree', '+'])
  })

  it('shows one vertical Tree and opens skill details in a bottom sheet', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))

    expect(screen.getByRole('heading', { name: 'TREE' })).toBeInTheDocument()
    const tabs = screen.getByRole('tablist', { name: 'Tree selection' })
    expect(within(tabs).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['운동', '공부'])

    const tree = screen.getByLabelText('운동 skill tree')
    expect(within(tree).getByRole('button', { name: /운동 시작.*available/i })).toBeInTheDocument()
    expect(within(tree).getByRole('button', { name: /주 3회 운동.*locked/i })).toBeInTheDocument()
    fireEvent.click(within(tree).getByRole('button', { name: /운동 시작.*available/i }))

    const details = screen.getByRole('dialog', { name: '운동 시작' })
    expect(within(details).getByText('Fitness Coin')).toBeInTheDocument()
    expect(within(details).getByText('0 / 0')).toBeInTheDocument()
    expect(within(details).getByText('조건 달성')).toBeInTheDocument()
  })

  it('creates a Daily Quest from Add and shows it on Today immediately', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: '무엇을 추가할까요?' })).getByRole('button', { name: 'Daily Quest' }))

    const form = screen.getByRole('dialog', { name: 'NEW QUEST' })
    fireEvent.change(within(form).getByRole('textbox', { name: '퀘스트' }), { target: { value: '수학 문제 풀기' } })
    fireEvent.change(within(form).getByRole('combobox', { name: 'Tree' }), { target: { value: 'study' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Reward increase' }))
    fireEvent.click(within(form).getByRole('button', { name: '추가' }))

    expect(screen.getByTestId('quest-group-study')).toHaveTextContent('수학 문제 풀기')
    expect(screen.getByTestId('quest-group-study')).toHaveTextContent('+2')
    expect(screen.getByText('0 / 5')).toBeInTheDocument()
  })

  it('creates a Skill with one prerequisite and shows it in the selected Tree', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: '무엇을 추가할까요?' })).getByRole('button', { name: 'Skill' }))

    const form = screen.getByRole('dialog', { name: 'NEW SKILL' })
    fireEvent.change(within(form).getByRole('textbox', { name: '이름' }), { target: { value: '아침 러닝' } })
    fireEvent.change(within(form).getByRole('spinbutton', { name: '필요 Coin' }), { target: { value: '5' } })
    fireEvent.change(within(form).getByRole('combobox', { name: '선행 Skill' }), { target: { value: 'fitness-start' } })
    fireEvent.click(within(form).getByRole('button', { name: '만들기' }))

    expect(screen.getByRole('heading', { name: 'TREE' })).toBeInTheDocument()
    expect(within(screen.getByLabelText('운동 skill tree')).getByRole('button', { name: /아침 러닝 locked/i })).toBeInTheDocument()
  })

  it('creates a Tree with an automatic coin name and makes it selectable', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: '무엇을 추가할까요?' })).getByRole('button', { name: 'Tree' }))

    const form = screen.getByRole('dialog', { name: 'NEW TREE' })
    fireEvent.change(within(form).getByRole('textbox', { name: '트리 이름' }), { target: { value: '독서' } })
    fireEvent.click(within(form).getByRole('button', { name: '만들기' }))

    expect(screen.getByRole('tab', { name: '독서' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('독서 Coin')).toBeInTheDocument()
  })

  it('edits a quest through its explicit menu', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '오늘 운동하기 menu' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Quest 관리' })).getByRole('button', { name: '수정' }))

    const form = screen.getByRole('dialog', { name: 'EDIT QUEST' })
    fireEvent.change(within(form).getByRole('textbox', { name: '퀘스트' }), { target: { value: '아침 운동하기' } })
    fireEvent.click(within(form).getByRole('button', { name: '저장' }))

    expect(screen.getByTestId('quest-group-fitness')).toHaveTextContent('아침 운동하기')
  })

  it('opens skill editing only from details and resets demo data from Settings', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    fireEvent.click(screen.getByRole('button', { name: /운동 시작 available/i }))
    fireEvent.click(within(screen.getByRole('dialog', { name: '운동 시작' })).getByRole('button', { name: '수정' }))

    const form = screen.getByRole('dialog', { name: 'EDIT SKILL' })
    fireEvent.change(within(form).getByRole('textbox', { name: '이름' }), { target: { value: '가볍게 시작' } })
    fireEvent.click(within(form).getByRole('button', { name: '저장' }))
    expect(screen.getByRole('button', { name: /가볍게 시작 available/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }))
    const settings = screen.getByRole('dialog', { name: 'SETTINGS' })
    expect(within(settings).getByText('Manage Trees')).toBeInTheDocument()
    fireEvent.click(within(settings).getByRole('button', { name: 'Reset Demo Data' }))

    expect(screen.getByRole('button', { name: /운동 시작 available/i })).toBeInTheDocument()
  })
})
