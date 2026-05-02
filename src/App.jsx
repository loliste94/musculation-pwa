import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SessionProvider } from './context/SessionContext'
import BottomNav from './components/BottomNav'
import TodayScreen from './screens/TodayScreen'
import GeneratorScreen from './screens/GeneratorScreen'
import ChargesScreen from './screens/ChargesScreen'
import HistoryScreen from './screens/HistoryScreen'
import ProgramScreen from './screens/ProgramScreen'

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <Routes>
              <Route path="/"           element={<TodayScreen />} />
              <Route path="/generer"    element={<GeneratorScreen />} />
              <Route path="/charges"    element={<ChargesScreen />} />
              <Route path="/historique" element={<HistoryScreen />} />
              <Route path="/programme"  element={<ProgramScreen />} />
            </Routes>
          </div>
          <BottomNav />
        </div>
      </BrowserRouter>
    </SessionProvider>
  )
}
