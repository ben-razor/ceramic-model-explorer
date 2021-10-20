import '../style/index.css'
import { ToastProvider, useToasts } from 'react-toast-notifications';

export default function MyApp({ Component, pageProps }) {
  return <ToastProvider>
    <Component {...pageProps} />
  </ToastProvider>
}
