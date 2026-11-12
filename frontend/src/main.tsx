import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { App } from '@/app/App';
import { ToastProvider } from '@/components/ui/toast';
import { LocaleProvider } from '@/i18n';
import '@/styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <LocaleProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </LocaleProvider>
    </Provider>
  </React.StrictMode>,
);
