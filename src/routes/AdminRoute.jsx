import { Navigate, useLocation } from "react-router-dom";
import { getToken, isAdmin, isAuthenticated } from "../utils/auth";

export default function AdminRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!getToken()) {
    return children;
  }

  if (!isAdmin()) {
    return <Navigate to="/products" replace />;
  }

  return children;
}
