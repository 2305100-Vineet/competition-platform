import Header from './Header';
import Footer from './Footer';
import ToastContainer from './ToastContainer';

export default function Layout({ children }) {
  return (
    <div className="site-shell">
      <Header />
      <main className="site-main">{children}</main>
      <Footer />
      <ToastContainer />
    </div>
  );
}