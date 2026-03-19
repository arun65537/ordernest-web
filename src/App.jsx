import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import AdminLogin from "./pages/AdminLogin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ChangePassword from "./pages/ChangePassword";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import OrderDetails from "./pages/OrderDetails";
import MyOrders from "./pages/MyOrders";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import { getPostLoginPath, isAdmin, isAuthenticated } from "./utils/auth";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated() ? <Navigate to={getPostLoginPath()} replace /> : <Landing />}
      />
      <Route
        path="/login"
        element={isAuthenticated() ? <Navigate to={getPostLoginPath()} replace /> : <Login />}
      />
      <Route
        path="/admin/login"
        element={isAdmin() ? <Navigate to="/admin" replace /> : isAuthenticated() ? <Navigate to="/products" replace /> : <AdminLogin />}
      />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/reset-password" element={<ChangePassword />} />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <ProductDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <MyOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:orderId"
        element={
          <ProtectedRoute>
            <OrderDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
