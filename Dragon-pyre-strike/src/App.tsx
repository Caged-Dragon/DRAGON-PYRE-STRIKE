import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PageLoader from '@/components/PageLoader'
import CloudSync from '@/components/CloudSync'
import ScrollProgress from '@/components/ScrollProgress'
import { RealmBackdrop } from '@/dps'
import InfoPage, { ABOUT_COPY, HELP_COPY, CONTACT_COPY, PRIVACY_COPY, TERMS_COPY } from '@/pages/Info'

const Home = lazy(() => import('@/pages/Home'))
const Games = lazy(() => import('@/pages/Games'))
const GameDetails = lazy(() => import('@/pages/GameDetails'))
const GamePlay = lazy(() => import('@/pages/GamePlay'))
const Category = lazy(() => import('@/pages/Category'))
const Favorites = lazy(() => import('@/pages/Favorites'))
const Search = lazy(() => import('@/pages/Search'))
const Feedback = lazy(() => import('@/pages/Feedback'))
const Leaderboard = lazy(() => import('@/pages/Leaderboard'))
const Profile = lazy(() => import('@/pages/Profile'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export default function App() {
  const location = useLocation()
  const isPlayRoute = /\/play\/?$/.test(location.pathname)

  return (
    <div className="relative flex min-h-screen flex-col">
      {!isPlayRoute && <RealmBackdrop palette="ember" image="/images/lair.webp" imageOpacity={0.4} />}
      <ScrollProgress />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <CloudSync />
      <Header minimal={isPlayRoute} />
      <main id="main" className="relative z-10 flex-1">
        <Suspense fallback={<PageLoader label="Entering the Realm" fullHeight />}>
          <div key={location.pathname} className="route-in">
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<Games mode="all" />} />
            <Route path="/popular" element={<Games mode="popular" />} />
            <Route path="/trending" element={<Games mode="trending" />} />
            <Route path="/new" element={<Games mode="new" />} />
            <Route path="/games/:slug" element={<GameDetails />} />
            <Route path="/games/:slug/play" element={<GamePlay />} />
            <Route path="/category/:category" element={<Category />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/search" element={<Search />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<InfoPage {...ABOUT_COPY} />} />
            <Route path="/help" element={<InfoPage {...HELP_COPY} />} />
            <Route path="/contact" element={<InfoPage {...CONTACT_COPY} />} />
            <Route path="/privacy" element={<InfoPage {...PRIVACY_COPY} />} />
            <Route path="/terms" element={<InfoPage {...TERMS_COPY} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </div>
        </Suspense>
      </main>
      {!isPlayRoute && (
        <div className="relative z-10">
          <Footer />
        </div>
      )}
    </div>
  )
}
