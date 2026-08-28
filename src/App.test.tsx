import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'
import type { WorkspaceData } from './types/skillTree'
import { loadWorkspace, saveWorkspace } from './utils/storage'

const existingWorkspace = (): WorkspaceData => ({
  version: 3,
  userName: '민준',
  selectedCategoryId: 'fitness',
  categories: [
    { id: 'fitness', name: '운동', finalGoal: '마라톤 완주' },
    { id: 'study', name: '공부', finalGoal: '논문 완성' },
  ],
  quests: [
    { id: 'fitness-daily', categoryId: 'fitness', title: '오늘 달리기', completedDate: null },
    { id: 'study-daily', categoryId: 'study', title: '오늘 복습하기', completedDate: null },
  ],
  nodes: [
    { id: 'warmup', type: 'skill', position: { x: 100, y: 100 }, data: { id: 'warmup', name: '준비운동', description: '몸을 풉니다.', categoryId: 'fitness', prerequisiteIds: [] } },
    { id: 'run', type: 'skill', position: { x: 320, y: 100 }, data: { id: 'run', name: '달리기 습관', description: '', categoryId: 'fitness', prerequisiteIds: ['warmup'] } },
  ],
  edges: [{ id: 'warmup->run', source: 'warmup', target: 'run', type: 'smoothstep' }],
})

describe('goal-ended personal mind map app', () => {
  beforeEach(() => {
    localStorage.clear()
    saveWorkspace(localStorage, existingWorkspace())
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 28, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shows only the user-name root on a fresh tree', () => {
    localStorage.clear()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))

    const canvas = screen.getByRole('region', { name: 'personal mind map canvas' })
    expect(within(canvas).getByTestId('me-root')).toHaveTextContent('ME')
    expect(within(canvas).queryByTestId(/^category-node-/)).not.toBeInTheDocument()
    expect(within(canvas).queryByTestId(/^final-goal-node-/)).not.toBeInTheDocument()
  })

  it('requires a final goal and creates the complete first branch atomically', () => {
    localStorage.clear()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    fireEvent.click(screen.getByRole('button', { name: '카테고리 추가' }))

    const form = screen.getByRole('dialog', { name: 'NEW CATEGORY' })
    const submit = within(form).getByRole('button', { name: '만들기' })
    fireEvent.change(within(form).getByRole('textbox', { name: '카테고리 이름' }), { target: { value: '운동' } })
    expect(submit).toBeDisabled()
    fireEvent.change(within(form).getByRole('textbox', { name: '최종목표' }), { target: { value: '마라톤 완주' } })
    expect(submit).toBeEnabled()
    fireEvent.click(submit)

    const canvas = screen.getByRole('region', { name: 'personal mind map canvas' })
    expect(within(canvas).getByTestId('me-root')).toBeInTheDocument()
    expect(within(canvas).getByTestId(/^category-node-category-/)).toHaveTextContent('운동')
    expect(within(canvas).getByTestId(/^final-goal-node-category-/)).toHaveTextContent('마라톤 완주')
  })

  it('shows categories, middle skills, and final goals together', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))

    const canvas = screen.getByRole('region', { name: 'personal mind map canvas' })
    expect(within(canvas).getByTestId('me-root')).toHaveTextContent('민준')
    expect(within(canvas).getByTestId('category-node-fitness')).toHaveTextContent('운동')
    expect(within(canvas).getByTestId('skill-node-warmup')).toHaveTextContent('준비운동')
    expect(within(canvas).getByTestId('skill-node-run')).toHaveTextContent('달리기 습관')
    expect(within(canvas).getByTestId('final-goal-node-fitness')).toHaveTextContent('마라톤 완주')
  })

  it('adds a user-defined skill before the final goal', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    fireEvent.click(screen.getByRole('button', { name: '스킬 추가' }))

    const form = screen.getByRole('dialog', { name: 'NEW SKILL' })
    fireEvent.change(within(form).getByRole('textbox', { name: '이름' }), { target: { value: '10km 달리기' } })
    fireEvent.change(within(form).getByRole('combobox', { name: '선행 Skill' }), { target: { value: 'run' } })
    fireEvent.click(within(form).getByRole('button', { name: '만들기' }))

    expect(screen.getByTestId(/^skill-node-skill-/)).toHaveTextContent('10km 달리기')
    expect(screen.getByTestId('final-goal-node-fitness')).toHaveTextContent('마라톤 완주')
  })

  it('keeps quests as simple daily check-offs', () => {
    render(<App />)
    const fitnessGroup = screen.getByTestId('quest-group-fitness')

    fireEvent.click(within(fitnessGroup).getByRole('button', { name: '오늘 달리기 완료' }))

    expect(within(fitnessGroup).getByRole('button', { name: '오늘 달리기 완료됨' })).toBeDisabled()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('creates and edits reward-free quests', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '미션 추가' }))
    const createForm = screen.getByRole('dialog', { name: 'NEW QUEST' })
    fireEvent.change(within(createForm).getByRole('textbox', { name: '퀘스트' }), { target: { value: '수학 문제 풀기' } })
    fireEvent.change(within(createForm).getByRole('combobox', { name: '카테고리' }), { target: { value: 'study' } })
    fireEvent.click(within(createForm).getByRole('button', { name: '추가' }))
    expect(screen.getByTestId('quest-group-study')).toHaveTextContent('수학 문제 풀기')

    fireEvent.click(screen.getByRole('button', { name: '수학 문제 풀기 menu' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Quest 관리' })).getByRole('button', { name: '수정' }))
    const editForm = screen.getByRole('dialog', { name: 'EDIT QUEST' })
    fireEvent.change(within(editForm).getByRole('textbox', { name: '퀘스트' }), { target: { value: '수학 복습' } })
    fireEvent.click(within(editForm).getByRole('button', { name: '저장' }))
    expect(screen.getByTestId('quest-group-study')).toHaveTextContent('수학 복습')
  })

  it('shows skill details without purchase or unlock controls', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    fireEvent.click(screen.getByTestId('skill-node-warmup'))

    const details = screen.getByRole('dialog', { name: '준비운동' })
    expect(within(details).getByText('몸을 풉니다.')).toBeInTheDocument()
    expect(within(details).queryByRole('button', { name: /unlock/i })).not.toBeInTheDocument()
  })

  it('edits category names and final goals in settings', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }))
    const settings = screen.getByRole('dialog', { name: 'SETTINGS' })
    fireEvent.change(within(settings).getByRole('textbox', { name: 'Final goal 운동' }), {
      target: { value: '울트라 마라톤 완주' },
    })
    fireEvent.click(within(settings).getByRole('button', { name: 'Save category 운동' }))
    fireEvent.click(within(settings).getByRole('button', { name: '닫기' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))

    expect(screen.getByTestId('final-goal-node-fitness')).toHaveTextContent('울트라 마라톤 완주')
  })

  it('shows the saved user name at the map center', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }))
    const settings = screen.getByRole('dialog', { name: 'SETTINGS' })
    fireEvent.change(within(settings).getByRole('textbox', { name: '사용자 이름' }), { target: { value: '서연' } })
    fireEvent.click(within(settings).getByRole('button', { name: '사용자 이름 저장' }))
    fireEvent.click(within(settings).getByRole('button', { name: '닫기' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))

    expect(screen.getByTestId('me-root')).toHaveTextContent('서연')
    expect(loadWorkspace(localStorage).userName).toBe('서연')
  })

  it('contains no coin UI', () => {
    const { container } = render(<App />)
    expect(container.textContent).not.toMatch(/coin/i)
    fireEvent.click(screen.getByRole('button', { name: 'Tree' }))
    expect(container.textContent).not.toMatch(/coin/i)
  })
})
