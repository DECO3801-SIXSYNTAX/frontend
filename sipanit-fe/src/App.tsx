import { Routes, Route } from "react-router-dom"
import { MarketingLayout } from "./components/layouts/MarketingLayout"
import { LandingPage } from "./pages/LandingPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingLayout />}>
        <Route index element={<LandingPage />} />
      </Route>
    </Routes>
  )
}

export default App
