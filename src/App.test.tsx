import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'
import { createLegacyDemoWorkspace } from './data/defaultTree'
import { loadWorkspace, saveWorkspace } from './utils/storage'

describe('mobile skill tree app', () => {
  beforeEach(() => {
    localStorage.clear()
    const existingWorkspace = createLegacyDemoWorkspace()
    existingWorkspace.nodes[0].data.description = 'Existing user workspace'
    saveWorkspace(localStorage, existingWorkspace)
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 24, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('opens a fresh workspace on Today and keeps only ME in Tree', () => {
    localStorage.clear()
    render(<App />)

    expect(screen.getByRole('heading', { name: 'TODAY' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    const map = screen.getByRole('region', { name: 'ME personal skill map canvas' })
    expect(within(map).getByTestId('me-root')).toHaveTextContent('ME')
    expect(within(map).queryByTestId(/^category-node-/)).not.toBeInTheDocument()
    expect(within(map).queryByTestId(/^skill-node-/)).not.toBeInTheDocument()
    expect(screen.queryByRole('tablist', { name: 'Tree selection' })).not.toBeInTheDocument()
  })

  it('clears cached workspace data with R and returns to Today', () => {
    render(<App />)
    expect(screen.getByTestId('quest-group-fitness')).toBeInTheDocument()

    const event = new KeyboardEvent('keydown', { key: 'r', bubbles: true, cancelable: true })
    fireEvent(window, event)

    expect(event.defaultPrevented).toBe(true)
    expect(screen.getByRole('heading', { name: 'TODAY' })).toBeInTheDocument()
    expect(screen.queryByTestId('quest-group-fitness')).not.toBeInTheDocument()
    expect(screen.getByText('0 / 0')).toBeInTheDocument()
    expect(loadWorkspace(localStorage)).toMatchObject({
      selectedCategoryId: null,
      categories: [],
      quests: [],
      nodes: [],
      edges: [],
    })

    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    expect(screen.getByTestId('me-root')).toHaveTextContent('ME')
  })

  it('does not reset while R is typed in a mission form field', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '미션 추가' }))

    const form = screen.getByRole('dialog', { name: 'NEW QUEST' })
    const input = within(form).getByRole('textbox', { name: '퀘스트' })
    const event = new KeyboardEvent('keydown', { key: 'r', bubbles: true, cancelable: true })
    fireEvent(input, event)

    expect(event.defaultPrevented).toBe(false)
    expect(form).toBeInTheDocument()
    expect(screen.getByTestId('quest-group-fitness')).toBeInTheDocument()
  })

  it('keeps the browser refresh shortcut available', () => {
    render(<App />)
    const event = new KeyboardEvent('keydown', {
      key: 'r',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    fireEvent(window, event)

    expect(event.defaultPrevented).toBe(false)
    expect(screen.getByTestId('quest-group-fitness')).toBeInTheDocument()
  })

  it('keeps category creation available above an empty Tree', () => {
    localStorage.clear()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))

    expect(screen.getByRole('button', { name: '카테고리 추가' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '스킬 추가' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '카테고리 추가' }))
    expect(screen.getByRole('dialog', { name: 'NEW TREE' })).toBeInTheDocument()
  })

  it('keeps quest completion available for an existing workspace', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Today' }))

    const fitnessGroup = screen.getByTestId('quest-group-fitness')
    fireEvent.click(within(fitnessGroup).getByRole('button', { name: '오늘 운동하기 완료' }))

    expect(within(fitnessGroup).getByText('Fitness Coin 1')).toBeInTheDocument()
    expect(screen.getByText('1 / 4')).toBeInTheDocument()
  })

  it('lists available skills and unlocks without spending coins', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Today' }))

    const available = screen.getByLabelText('Unlock available')
    expect(within(available).getByText('운동 시작')).toBeInTheDocument()
    fireEvent.click(within(available).getByRole('button', { name: '운동 시작 unlock' }))

    expect(within(available).queryByText('운동 시작')).not.toBeInTheDocument()
    expect(screen.getByTestId('quest-group-fitness')).toHaveTextContent('Fitness Coin 0')
  })

  it('keeps only page navigation at the bottom and shows contextual add actions above', () => {
    render(<App />)

    const navigation = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(within(navigation).getAllByRole('button').map((button) => button.textContent))
      .toEqual(['Today', 'Tree'])
    expect(screen.getByRole('button', { name: '미션 추가' })).toBeInTheDocument()

    fireEvent.click(within(navigation).getByRole('button', { name: 'Tree' }))
    expect(screen.getByRole('button', { name: '카테고리 추가' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '스킬 추가' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '미션 추가' })).not.toBeInTheDocument()
  })

  it('shows every category and skill on one ME-centered personal skill map', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))

    expect(screen.getByRole('heading', { name: 'TREE' })).toBeInTheDocument()
    expect(screen.queryByRole('tablist', { name: 'Tree selection' })).not.toBeInTheDocument()
    const canvas = screen.getByRole('region', { name: 'ME personal skill map canvas' })
    expect(within(canvas).getByTestId('me-root')).toBeInTheDocument()
    expect(within(canvas).getByTestId('category-node-fitness')).toHaveTextContent('운동')
    expect(within(canvas).getByTestId('category-node-study')).toHaveTextContent('공부')
    expect(within(canvas).getByTestId('skill-node-fitness-start')).toBeInTheDocument()
    expect(within(canvas).getByTestId('skill-node-fitness-3-week')).toBeInTheDocument()
    expect(within(canvas).getByTestId('skill-node-study-start')).toBeInTheDocument()
    fireEvent.click(within(canvas).getByTestId('skill-node-fitness-start'))

    const details = screen.getByRole('dialog', { name: '운동 시작' })
    expect(within(details).getByText('Fitness Coin')).toBeInTheDocument()
    expect(within(details).getByText('0 / 0')).toBeInTheDocument()
    expect(within(details).getByText('조건 달성')).toBeInTheDocument()
  })

  it('opens mission creation directly from Today and shows it immediately', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '미션 추가' }))

    const form = screen.getByRole('dialog', { name: 'NEW QUEST' })
    fireEvent.change(within(form).getByRole('textbox', { name: '퀘스트' }), { target: { value: '수학 문제 풀기' } })
    fireEvent.change(within(form).getByRole('combobox', { name: 'Tree' }), { target: { value: 'study' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Reward increase' }))
    fireEvent.click(within(form).getByRole('button', { name: '추가' }))

    expect(screen.getByTestId('quest-group-study')).toHaveTextContent('수학 문제 풀기')
    expect(screen.getByTestId('quest-group-study')).toHaveTextContent('+2')
    expect(screen.getByText('0 / 5')).toBeInTheDocument()
  })

  it('opens skill creation directly from Tree and shows the new branch', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    fireEvent.click(screen.getByRole('button', { name: '스킬 추가' }))

    const form = screen.getByRole('dialog', { name: 'NEW SKILL' })
    fireEvent.change(within(form).getByRole('textbox', { name: '이름' }), { target: { value: '아침 러닝' } })
    fireEvent.change(within(form).getByRole('spinbutton', { name: '필요 Coin' }), { target: { value: '5' } })
    fireEvent.change(within(form).getByRole('combobox', { name: '선행 Skill' }), { target: { value: 'fitness-start' } })
    fireEvent.click(within(form).getByRole('button', { name: '만들기' }))

    expect(screen.getByRole('heading', { name: 'TREE' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'ME personal skill map canvas' })).getByTestId(/^skill-node-skill-/)).toHaveTextContent('아침 러닝')
  })

  it('creates a category branch with an automatic coin name', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    fireEvent.click(screen.getByRole('button', { name: '카테고리 추가' }))

    const form = screen.getByRole('dialog', { name: 'NEW TREE' })
    fireEvent.change(within(form).getByRole('textbox', { name: '트리 이름' }), { target: { value: '독서' } })
    fireEvent.click(within(form).getByRole('button', { name: '만들기' }))

    const canvas = screen.getByRole('region', { name: 'ME personal skill map canvas' })
    expect(within(canvas).getByTestId(/^category-node-category-/)).toHaveTextContent('독서')
    expect(within(canvas).getByTestId(/^category-node-category-/)).toHaveTextContent('독서 Coin')
  })

  it('edits a quest through its explicit menu', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    fireEvent.click(screen.getByRole('button', { name: '오늘 운동하기 menu' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Quest 관리' })).getByRole('button', { name: '수정' }))

    const form = screen.getByRole('dialog', { name: 'EDIT QUEST' })
    fireEvent.change(within(form).getByRole('textbox', { name: '퀘스트' }), { target: { value: '아침 운동하기' } })
    fireEvent.click(within(form).getByRole('button', { name: '저장' }))

    expect(screen.getByTestId('quest-group-fitness')).toHaveTextContent('아침 운동하기')
  })

  it('opens skill editing from details and resets all data back to ME', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    fireEvent.click(screen.getByTestId('skill-node-fitness-start'))
    fireEvent.click(within(screen.getByRole('dialog', { name: '운동 시작' })).getByRole('button', { name: '수정' }))

    const form = screen.getByRole('dialog', { name: 'EDIT SKILL' })
    fireEvent.change(within(form).getByRole('textbox', { name: '이름' }), { target: { value: '가볍게 시작' } })
    fireEvent.click(within(form).getByRole('button', { name: '저장' }))
    expect(screen.getByTestId('skill-node-fitness-start')).toHaveTextContent('가볍게 시작')

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }))
    const settings = screen.getByRole('dialog', { name: 'SETTINGS' })
    expect(within(settings).getByText('Manage Trees')).toBeInTheDocument()
    fireEvent.click(within(settings).getByRole('button', { name: 'Reset All Data' }))

    expect(screen.getByRole('heading', { name: 'TODAY' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    const canvas = screen.getByRole('region', { name: 'ME personal skill map canvas' })
    expect(within(canvas).getByTestId('me-root')).toHaveTextContent('ME')
    expect(within(canvas).queryByTestId(/^category-node-/)).not.toBeInTheDocument()
    expect(within(canvas).queryByTestId(/^skill-node-/)).not.toBeInTheDocument()
  })

  it('shows the saved user name at the center of the personal tree', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }))

    const settings = screen.getByRole('dialog', { name: 'SETTINGS' })
    fireEvent.change(within(settings).getByRole('textbox', { name: '사용자 이름' }), {
      target: { value: '민준' },
    })
    fireEvent.click(within(settings).getByRole('button', { name: '사용자 이름 저장' }))

    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    expect(screen.getByTestId('me-root')).toHaveTextContent('민준')
    expect(loadWorkspace(localStorage).userName).toBe('민준')
  })

  it('deletes a selected canvas node from its mobile detail sheet', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    fireEvent.click(screen.getByTestId('skill-node-fitness-100-days'))

    fireEvent.click(within(screen.getByRole('dialog', { name: '운동 100일' })).getByRole('button', { name: '삭제' }))

    expect(screen.queryByTestId('skill-node-fitness-100-days')).not.toBeInTheDocument()
  })
})
