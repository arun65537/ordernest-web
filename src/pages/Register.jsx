import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { clearToken, isAuthenticated } from "../utils/auth";

function validate(form) {
  const errors = {};

  if (!form.firstName.trim()) errors.firstName = "First name is required.";
  if (!form.lastName.trim()) errors.lastName = "Last name is required.";
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = "Enter a valid email.";
  }

  if (!form.password) {
    errors.password = "Password is required.";
  } else {
    const hasLetter = /[A-Za-z]/.test(form.password);
    const hasNumber = /\d/.test(form.password);
    const hasSpecial = /[^A-Za-z0-9]/.test(form.password);

    if (form.password.length < 8 || !hasLetter || !hasNumber || !hasSpecial) {
      errors.password = "Password must be at least 8 characters and include a letter, number, and special character.";
    }
  }

  return errors;
}

export default function Register() {
  const navigate = useNavigate();
  const showLogout = isAuthenticated();
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/register", form);
      const successMessage =
        data?.message || "Registration successful. Check your email for the verification link.";
      navigate("/login", { replace: true, state: { successMessage } });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to register. Please check your details and try again.";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    navigate("/", { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-8 shadow-xl shadow-primary-100/60">
        {showLogout && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        )}
        <h1 className="text-2xl font-semibold text-primary-700">Register</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="firstName">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              required
              value={form.firstName}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none ring-primary-500 transition focus:ring-2"
            />
            {errors.firstName && <p className="mt-1 text-sm text-rose-700">{errors.firstName}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="lastName">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              required
              value={form.lastName}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none ring-primary-500 transition focus:ring-2"
            />
            {errors.lastName && <p className="mt-1 text-sm text-rose-700">{errors.lastName}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none ring-primary-500 transition focus:ring-2"
            />
            {errors.email && <p className="mt-1 text-sm text-rose-700">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none ring-primary-500 transition focus:ring-2"
            />
            <p className="mt-1 text-xs text-slate-500">
              Use at least 8 characters with a letter, number, and special character.
            </p>
            {errors.password && <p className="mt-1 text-sm text-rose-700">{errors.password}</p>}
          </div>

          {serverError && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{serverError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Submit"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-primary-700 hover:underline">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}


