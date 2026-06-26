import {
  AlertTriangle,
  Archive,
  Bell,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Home as HomeIcon,
  Leaf,
  PackagePlus,
  Search,
  ShieldCheck,
  Soup,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { type ChangeEvent, type ComponentType, useEffect, useMemo, useState } from 'react'
import './App.css'
import { categories, dietSuggestions, getHerbById, getSources, herbs, sourceRefs } from './data/herbs'
import type { CabinetItem, Herb, HerbCategory, Reminder } from './types'

type Route = '/' | '/identify' | '/herbs' | '/diet' | '/cabinet' | '/reminders'

interface NavItem {
  path: Route
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
}

const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: HomeIcon },
  { path: '/identify', label: '识别', icon: Camera },
  { path: '/herbs', label: '药材库', icon: BookOpen },
  { path: '/diet', label: '药膳', icon: Soup },
  { path: '/reminders', label: '提醒', icon: Bell },
]

const routeSet = new Set<Route>(['/', '/identify', '/herbs', '/diet', '/cabinet', '/reminders'])
const assetImage = '/assets/herb-still-life.png'

function getInitialRoute(): Route {
  const path = window.location.pathname as Route
  return routeSet.has(path) ? path : '/'
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function nextYear() {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function App() {
  const [route, setRoute] = useState<Route>(getInitialRoute)
  const [query, setQuery] = useState('')
  const [selectedHerbId, setSelectedHerbId] = useState('huangqi')
  const [cabinet, setCabinet] = usePersistentState<CabinetItem[]>('materia-care:cabinet:v1', [])
  const [reminders, setReminders] = usePersistentState<Reminder[]>('materia-care:reminders:v1', [])
  const selectedHerb = getHerbById(selectedHerbId) ?? herbs[0]

  useEffect(() => {
    const onPopState = () => setRoute(getInitialRoute())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (path: Route) => {
    setRoute(path)
    window.history.pushState({}, '', path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addToCabinet = (herbId: string) => {
    setCabinet((items) => {
      if (items.some((item) => item.herbId === herbId)) return items
      return [
        ...items,
        {
          id: makeId('cabinet'),
          herbId,
          amount: '一小袋',
          purchaseDate: today(),
          expiresAt: nextYear(),
          note: '家庭常备，使用前检查气味与状态。',
        },
      ]
    })
  }

  const addReminder = (herbId: string, title = '今日查看药材状态') => {
    setReminders((items) => [
      ...items,
      {
        id: makeId('reminder'),
        herbId,
        title,
        time: '20:30',
        cycle: '每日',
        startDate: today(),
        endDate: nextYear(),
        done: false,
      },
    ])
  }

  const commonProps = {
    query,
    setQuery,
    selectedHerb,
    setSelectedHerbId,
    navigate,
    addToCabinet,
    addReminder,
    cabinet,
    setCabinet,
    reminders,
    setReminders,
  }

  return (
    <div className="app-shell">
      <Header route={route} navigate={navigate} />
      <main>
        {route === '/' && <HomePage {...commonProps} />}
        {route === '/identify' && <IdentifyPage {...commonProps} />}
        {route === '/herbs' && <HerbsPage {...commonProps} />}
        {route === '/diet' && <DietPage {...commonProps} />}
        {route === '/cabinet' && <CabinetPage {...commonProps} />}
        {route === '/reminders' && <RemindersPage {...commonProps} />}
      </main>
      <MobileNav route={route} navigate={navigate} />
    </div>
  )
}

function Header({ route, navigate }: { route: Route; navigate: (path: Route) => void }) {
  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={() => navigate('/')} aria-label="返回首页">
        <span className="brand-mark">
          <Leaf size={24} strokeWidth={2.1} />
        </span>
        <span>
          <strong>MateriaCare</strong>
          <small>Trusted herb companion</small>
        </span>
      </button>
      <nav className="desktop-nav" aria-label="主导航">
        {navItems.map((item) => (
          <button
            key={item.path}
            type="button"
            className={route === item.path ? 'active' : ''}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button type="button" className="ghost-button" onClick={() => navigate('/cabinet')}>
        <Archive size={17} />
        药材柜
      </button>
    </header>
  )
}

function MobileNav({ route, navigate }: { route: Route; navigate: (path: Route) => void }) {
  return (
    <nav className="mobile-nav" aria-label="移动端导航">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = route === item.path
        return (
          <button
            key={item.path}
            type="button"
            className={active ? 'active' : ''}
            onClick={() => navigate(item.path)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={19} strokeWidth={2.1} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

interface PageProps {
  query: string
  setQuery: (query: string) => void
  selectedHerb: Herb
  setSelectedHerbId: (id: string) => void
  navigate: (path: Route) => void
  addToCabinet: (herbId: string) => void
  addReminder: (herbId: string, title?: string) => void
  cabinet: CabinetItem[]
  setCabinet: React.Dispatch<React.SetStateAction<CabinetItem[]>>
  reminders: Reminder[]
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>
}

function HomePage(props: PageProps) {
  const { query, setQuery, selectedHerb, setSelectedHerbId, navigate, addToCabinet, addReminder, cabinet, reminders } =
    props
  const featuredHerbs = herbs.slice(0, 6)
  const cabinetCount = cabinet.length
  const pendingReminders = reminders.filter((reminder) => !reminder.done).length

  return (
    <section className="page-grid home-grid">
      <div className="hero-copy">
        <h1>拍照识药，安心查用</h1>
        <p>识别中药材，查询可信来源，管理家中药材与短期提醒。内容仅供科普参考，不替代医生或药师建议。</p>
        <SearchBox query={query} setQuery={setQuery} onSubmit={() => navigate('/herbs')} />
        <div className="hero-actions">
          <button type="button" className="primary-button" onClick={() => navigate('/identify')}>
            <Upload size={18} />
            上传药材照片
          </button>
          <button type="button" className="secondary-button" onClick={() => navigate('/herbs')}>
            <Search size={18} />
            搜索药材
          </button>
        </div>
        <SafetyNote />
      </div>

      <aside className="recognition-panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">识别结果预览</span>
            <h2>{selectedHerb.name}</h2>
          </div>
          <span className="confidence">置信度 92%</span>
        </div>
        <HerbMedia herb={selectedHerb} size="large" />
        <div className="result-summary">
          <p>{selectedHerb.sourceSummary}</p>
          <div className="tag-row">
            <span>药典来源</span>
            <span>风险提示</span>
          </div>
        </div>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => navigate('/herbs')}>
            查看详情
          </button>
          <button type="button" className="primary-button slim" onClick={() => addToCabinet(selectedHerb.id)}>
            加入药材柜
          </button>
        </div>
      </aside>

      <section className="content-band wide">
        <div className="section-title-row">
          <div>
            <span className="section-label">常用药材知识</span>
            <h2>先从高频家庭药材开始</h2>
          </div>
          <button type="button" className="link-button" onClick={() => navigate('/herbs')}>
            查看全部 <ChevronRight size={16} />
          </button>
        </div>
        <div className="herb-card-grid">
          {featuredHerbs.map((herb) => (
            <button
              type="button"
              className={`herb-card ${herb.id === selectedHerb.id ? 'selected' : ''}`}
              key={herb.id}
              onClick={() => {
                setSelectedHerbId(herb.id)
                navigate('/herbs')
              }}
            >
              <HerbMedia herb={herb} />
              <strong>{herb.name}</strong>
              <p>{herb.useSummary}</p>
              <div className="tag-row">
                <span>药典来源</span>
                <span>风险提示</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="side-stack">
        <StatusCard
          icon={Archive}
          title="药材柜"
          value={`已保存 ${cabinetCount} 味药材`}
          action="进入药材柜"
          onClick={() => navigate('/cabinet')}
        />
        <StatusCard
          icon={Bell}
          title="今日提醒"
          value={`${pendingReminders} 条提醒待完成`}
          action="查看提醒"
          onClick={() => navigate('/reminders')}
        />
        <StatusCard
          icon={Soup}
          title="药膳建议"
          value={`今日推荐：${dietSuggestions[0].title}`}
          action="查看详情"
          onClick={() => {
            addReminder(selectedHerb.id, `检查 ${selectedHerb.name} 是否适合今日食养`)
            navigate('/diet')
          }}
        />
      </section>

      <SourceBand />
    </section>
  )
}

function IdentifyPage({ selectedHerb, setSelectedHerbId, addToCabinet, addReminder }: PageProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const candidates = [selectedHerb, herbs[2], herbs[5]].filter(Boolean)

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    setSelectedHerbId('huangqi')
  }

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  return (
    <section className="page-stack">
      <PageIntro
        icon={Camera}
        title="上传照片，查看模拟识别结果"
        text="第一版先完成网页端识别流程和风险提示。真实模型/OCR 会在后续接入同域名 API。"
      />
      <div className="split-layout">
        <label className="upload-zone">
          <input type="file" accept="image/*" onChange={onFileChange} />
          {preview ? (
            <img src={preview} alt="已上传药材预览" />
          ) : (
            <>
              <Upload size={42} />
              <strong>上传药材照片</strong>
              <span>支持手机拍照或相册图片，当前为本地预览演示。</span>
            </>
          )}
        </label>
        <div className="result-list">
          <div className="section-title-row compact">
            <div>
              <span className="section-label">识别候选</span>
              <h2>结果需人工复核</h2>
            </div>
            <span className="confidence amber">演示模式</span>
          </div>
          {candidates.map((herb, index) => (
            <button
              type="button"
              className={`candidate-row ${index === 0 ? 'selected' : ''}`}
              key={herb.id}
              onClick={() => setSelectedHerbId(herb.id)}
            >
              <HerbMedia herb={herb} />
              <span>
                <strong>{herb.name}</strong>
                <small>可能性 {index === 0 ? '92%' : index === 1 ? '41%' : '28%'}</small>
              </span>
              {index === 0 && <CheckCircle2 size={19} />}
            </button>
          ))}
          <SafetyNote />
          <div className="button-row">
            <button type="button" className="primary-button" onClick={() => addToCabinet(selectedHerb.id)}>
              <PackagePlus size={18} />
              加入药材柜
            </button>
            <button type="button" className="secondary-button" onClick={() => addReminder(selectedHerb.id)}>
              <Clock size={18} />
              设置提醒
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function HerbsPage({ query, setQuery, selectedHerb, setSelectedHerbId, addToCabinet, addReminder }: PageProps) {
  const [category, setCategory] = useState<HerbCategory | '全部'>('全部')
  const normalizedQuery = query.trim()
  const filteredHerbs = useMemo(
    () =>
      herbs.filter((herb) => {
        const matchesCategory = category === '全部' || herb.category === category
        const matchesQuery =
          !normalizedQuery ||
          herb.name.includes(normalizedQuery) ||
          herb.aliases.some((alias) => alias.includes(normalizedQuery))
        return matchesCategory && matchesQuery
      }),
    [category, normalizedQuery],
  )

  useEffect(() => {
    if (filteredHerbs.length > 0 && !filteredHerbs.some((herb) => herb.id === selectedHerb.id)) {
      setSelectedHerbId(filteredHerbs[0].id)
    }
  }, [filteredHerbs, selectedHerb.id, setSelectedHerbId])

  return (
    <section className="page-grid library-grid">
      <div className="library-list">
        <PageIntro icon={BookOpen} title="药材库" text="首批内置高频药材，所有卡片保留来源入口和风险提示。" />
        <SearchBox query={query} setQuery={setQuery} />
        <div className="filter-row" aria-label="药材分类筛选">
          {(['全部', ...categories] as const).map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? 'active' : ''}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="library-results">
          {filteredHerbs.map((herb) => (
            <button
              type="button"
              key={herb.id}
              className={`library-row ${selectedHerb.id === herb.id ? 'selected' : ''}`}
              onClick={() => setSelectedHerbId(herb.id)}
            >
              <HerbMedia herb={herb} />
              <span>
                <strong>{herb.name}</strong>
                <small>{herb.category} · {herb.aliases.slice(0, 2).join('、') || '标准名'}</small>
                <em>{herb.useSummary}</em>
              </span>
            </button>
          ))}
        </div>
      </div>
      <HerbDetail herb={selectedHerb} addToCabinet={addToCabinet} addReminder={addReminder} />
    </section>
  )
}

function DietPage({ selectedHerb, setSelectedHerbId, addReminder }: PageProps) {
  const relevantSuggestions = dietSuggestions.filter((suggestion) => suggestion.herbIds.includes(selectedHerb.id))
  const suggestions = relevantSuggestions.length ? relevantSuggestions : dietSuggestions

  return (
    <section className="page-stack">
      <PageIntro
        icon={Soup}
        title="药膳建议"
        text="根据已选药材给出日常食养灵感。这里不输出诊断、处方、疗效承诺或治疗剂量。"
      />
      <div className="diet-layout">
        <aside className="selection-rail">
          <span className="section-label">选择家中药材</span>
          {herbs.slice(0, 10).map((herb) => (
            <button
              type="button"
              key={herb.id}
              className={herb.id === selectedHerb.id ? 'active' : ''}
              onClick={() => setSelectedHerbId(herb.id)}
            >
              <HerbMedia herb={herb} />
              <span>{herb.name}</span>
            </button>
          ))}
        </aside>
        <div className="diet-cards">
          {suggestions.map((suggestion) => (
            <article className="diet-card" key={suggestion.id}>
              <div className="diet-card-top">
                <span className="section-label">{suggestion.scene}</span>
                <h2>{suggestion.title}</h2>
              </div>
              <div className="mini-list">
                <strong>材料</strong>
                <p>{suggestion.ingredients.join('、')}</p>
              </div>
              <ol>
                {suggestion.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <div className="warning-line">
                <AlertTriangle size={17} />
                {suggestion.caution}
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => addReminder(suggestion.herbIds[0], `准备 ${suggestion.title}`)}
              >
                <Clock size={18} />
                加入提醒
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function CabinetPage({ cabinet, setCabinet, navigate }: PageProps) {
  return (
    <section className="page-stack">
      <PageIntro icon={Archive} title="药材柜" text="记录家庭药材库存、日期和储存备注。数据仅保存在当前浏览器。" />
      {cabinet.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="药材柜还是空的"
          text="从首页、识别页或药材库把常用药材加入进来。"
          action="去药材库"
          onClick={() => navigate('/herbs')}
        />
      ) : (
        <div className="inventory-grid">
          {cabinet.map((item) => {
            const herb = getHerbById(item.herbId)
            if (!herb) return null
            return (
              <article className="inventory-card" key={item.id}>
                <HerbMedia herb={herb} size="large" />
                <div>
                  <span className="section-label">{herb.category}</span>
                  <h2>{herb.name}</h2>
                  <p>{item.note}</p>
                  <dl>
                    <div>
                      <dt>数量</dt>
                      <dd>{item.amount}</dd>
                    </div>
                    <div>
                      <dt>购买日期</dt>
                      <dd>{item.purchaseDate}</dd>
                    </div>
                    <div>
                      <dt>保质提醒</dt>
                      <dd>{item.expiresAt}</dd>
                    </div>
                  </dl>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`移除 ${herb.name}`}
                  onClick={() => setCabinet((items) => items.filter((entry) => entry.id !== item.id))}
                >
                  <Trash2 size={18} />
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function RemindersPage({ reminders, setReminders, selectedHerb, addReminder, navigate }: PageProps) {
  return (
    <section className="page-stack">
      <PageIntro icon={Bell} title="提醒" text="管理短期用药、煎煮、检查保质期等提醒。第一版不接系统推送。" />
      <div className="button-row">
        <button type="button" className="primary-button" onClick={() => addReminder(selectedHerb.id)}>
          <Clock size={18} />
          新增默认提醒
        </button>
        <button type="button" className="secondary-button" onClick={() => navigate('/herbs')}>
          <Search size={18} />
          选择药材
        </button>
      </div>
      {reminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="暂无提醒"
          text="可以从识别结果、药膳建议或药材详情中创建提醒。"
          action="添加一个提醒"
          onClick={() => addReminder(selectedHerb.id)}
        />
      ) : (
        <div className="reminder-list">
          {reminders.map((reminder) => {
            const herb = getHerbById(reminder.herbId)
            return (
              <article className={`reminder-row ${reminder.done ? 'done' : ''}`} key={reminder.id}>
                <div className="time-block">
                  <strong>{reminder.time}</strong>
                  <span>{reminder.cycle}</span>
                </div>
                <div>
                  <h2>{reminder.title}</h2>
                  <p>{herb?.name ?? '未知药材'} · {reminder.startDate} 至 {reminder.endDate}</p>
                </div>
                <div className="reminder-actions">
                  <button
                    type="button"
                    className="secondary-button slim"
                    onClick={() =>
                      setReminders((items) =>
                        items.map((item) => (item.id === reminder.id ? { ...item, done: !item.done } : item)),
                      )
                    }
                  >
                    {reminder.done ? '恢复' : '完成'}
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="删除提醒"
                    onClick={() => setReminders((items) => items.filter((item) => item.id !== reminder.id))}
                  >
                    <X size={18} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function HerbDetail({
  herb,
  addToCabinet,
  addReminder,
}: {
  herb: Herb
  addToCabinet: (herbId: string) => void
  addReminder: (herbId: string, title?: string) => void
}) {
  const sources = getSources(herb.sourceIds)

  return (
    <aside className="detail-panel">
      <HerbMedia herb={herb} size="hero" />
      <div className="detail-title">
        <span className="section-label">{herb.category}</span>
        <h1>{herb.name}</h1>
        <p>{herb.aliases.join('、')}</p>
      </div>
      <div className="detail-actions">
        <button type="button" className="primary-button slim" onClick={() => addToCabinet(herb.id)}>
          <PackagePlus size={17} />
          加入药材柜
        </button>
        <button type="button" className="secondary-button slim" onClick={() => addReminder(herb.id)}>
          <Bell size={17} />
          设置提醒
        </button>
      </div>
      <InfoBlock title="来源摘要" text={herb.sourceSummary} />
      <InfoBlock title="性味摘要" text={herb.natureSummary} />
      <InfoBlock title="常见用途" text={herb.useSummary} />
      <div className="warning-box">
        <AlertTriangle size={18} />
        <div>
          <strong>风险提示</strong>
          <ul>
            {herb.cautions.map((caution) => (
              <li key={caution}>{caution}</li>
            ))}
          </ul>
        </div>
      </div>
      <InfoBlock title="储存建议" text={herb.storage} />
      <div className="mini-list">
        <strong>相似药材</strong>
        <p>{herb.similarHerbs.join('、')}</p>
      </div>
      <div className="mini-list">
        <strong>常见搭配</strong>
        <p>{herb.commonPairings.join('、')}</p>
      </div>
      <div className="source-list">
        <strong>数据来源</strong>
        {sources.map((source) => (
          <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
            <ShieldCheck size={16} />
            {source.name}
          </a>
        ))}
      </div>
    </aside>
  )
}

function PageIntro({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  title: string
  text: string
}) {
  return (
    <div className="page-intro">
      <span className="intro-icon">
        <Icon size={22} />
      </span>
      <div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  )
}

function SearchBox({
  query,
  setQuery,
  onSubmit,
}: {
  query: string
  setQuery: (query: string) => void
  onSubmit?: () => void
}) {
  return (
    <form
      className="search-box"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}
    >
      <Search size={19} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="输入药材名，如 黄芪、当归、陈皮"
        aria-label="搜索药材"
      />
      <button type="submit">搜索</button>
    </form>
  )
}

function HerbMedia({ herb, size = 'default' }: { herb: Herb; size?: 'default' | 'large' | 'hero' }) {
  return (
    <div className={`herb-media ${size}`} aria-hidden="true">
      <img src={assetImage} alt="" style={{ objectPosition: herb.imageFocus }} />
    </div>
  )
}

function SafetyNote() {
  return (
    <div className="safety-note">
      <ShieldCheck size={17} />
      内容仅供科普与识别参考，不提供诊断、处方或治疗建议；不适请及时就医。
    </div>
  )
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="info-block">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  )
}

function StatusCard({
  icon: Icon,
  title,
  value,
  action,
  onClick,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  title: string
  value: string
  action: string
  onClick: () => void
}) {
  return (
    <article className="status-card">
      <span className="status-icon">
        <Icon size={22} />
      </span>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <button type="button" className="link-button" onClick={onClick}>
        {action} <ChevronRight size={16} />
      </button>
    </article>
  )
}

function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  onClick,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  title: string
  text: string
  action: string
  onClick: () => void
}) {
  return (
    <div className="empty-state">
      <span className="intro-icon">
        <Icon size={24} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      <button type="button" className="primary-button" onClick={onClick}>
        {action}
      </button>
    </div>
  )
}

function SourceBand() {
  return (
    <section className="source-band wide">
      <div>
        <span className="section-label">权威来源</span>
        <h2>来源可追溯，摘要不替代原文</h2>
      </div>
      <div className="source-band-links">
        {sourceRefs.slice(0, 3).map((source) => (
          <a href={source.url} target="_blank" rel="noreferrer" key={source.id}>
            <ShieldCheck size={18} />
            <span>
              <strong>{source.name}</strong>
              <small>{source.trustLevel}</small>
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

export default App
