
import {BrowserRouter,Routes,Route, Router} from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import ProtectedRoute from './utils/ProtectedRoute';
import PublicRoute from './utils/PublicRoute';
import SelectRole from './pages/SelectRole';
import Navbar from './components/Navbar';
import Account from './pages/Account';
import { useAppData } from './context/AppContext';
import Restaurant from './pages/Restaurant';
import RestaurantPage from './pages/RestaurantPage';
import Cart from './pages/Cart';
import Address from './pages/Address';
import CheckOut from './pages/CheckOut';
import PaymentSuccess from './pages/PaymentSuccess';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OrderPage from './pages/OrderPage';
import RiderDashboard from './pages/RiderDashboard';

const App = () => {
  const { user ,loading } = useAppData();

  if(loading) {
    return <div className="text-center my-80 font-bold text-gray-500">Loading...</div>;
  }

  if(user && user.role === "seller"){
    return <Restaurant />
  }
  if(user && user.role === "rider"){
    return <RiderDashboard />
  }
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route element={<PublicRoute/>}>
            <Route path='/login' element={<Login/>}/>
          </Route>
          <Route element={<ProtectedRoute/>}>
            <Route path='/' element={<Home/>}/>
            <Route path='/address' element={<Address/>}/>
            <Route path='/select-role' element={<SelectRole/>}/>
            <Route path='/account' element={<Account/>}/>
            <Route path='/restaurant/:id' element={<RestaurantPage/>}/>
            <Route path='/cart' element={<Cart/>}/>
            <Route path='/checkout' element={<CheckOut/>}/>
            <Route path='/orders' element={<Orders/>}/>
            <Route path='/order/:id' element={<OrderPage/>}/>
            <Route path='/paymentsuccess/:paymentId' element={<PaymentSuccess/>}/>
            <Route path='/order-success' element={<OrderSuccess/>}/>

          </Route>
        </Routes>
        
      </BrowserRouter>
    </>
  );
};

export default App;