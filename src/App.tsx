import { OSProvider } from './os/OSContext';
import { Desktop } from './os/Desktop';
import { GlassFilters } from './os/GlassFilters';

function App() {
  return (
    <OSProvider>
      <GlassFilters />
      <div className="h-screen w-screen overflow-hidden">
        <Desktop />
      </div>
    </OSProvider>
  );
}

export default App;
