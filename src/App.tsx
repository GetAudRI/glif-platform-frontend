import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import GLIFPrototype from './GLIFPrototype';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/audit-oversight" element={<GLIFPrototype />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

