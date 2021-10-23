import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
// import App from './app';
import './index.scss';

const App = React.lazy(() => import('./app'));

ReactDOM.render(
  <React.StrictMode>
    <Suspense fallback={'loading...'}>
      <App />
    </Suspense>
  </React.StrictMode>,
  document.getElementById('root')
);
