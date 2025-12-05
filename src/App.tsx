import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import GLIFPrototype from './GLIFPrototype';
import InvoiceApproval from './InvoiceApproval';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/audit-oversight" element={<GLIFPrototype />} />
        <Route path="/invoice-approval" element={<InvoiceApproval />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

