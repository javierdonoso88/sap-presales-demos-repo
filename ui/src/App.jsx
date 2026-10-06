import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import DemosList from './pages/DemosList'
import DemoDetail from './pages/DemoDetail'
import DemoWizard from './pages/DemoWizard'
import MasterData from './pages/MasterData'
import Timeline from './pages/Timeline'
import Kanban from './pages/Kanban'
import ShareView from './pages/ShareView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/share/:token" element={<ShareView />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/demos" element={<DemosList />} />
          <Route path="/demos/new" element={<DemoWizard />} />
          <Route path="/demos/:id" element={<DemoDetail />} />
          <Route path="/demos/:id/edit" element={<DemoWizard />} />
          <Route path="/master-data" element={<MasterData />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
