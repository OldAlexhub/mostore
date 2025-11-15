import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState(null);
  const { login } = useAuth();
  const { add: addToast } = useToast();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFieldError(null);
    try {
      await login(username, password);
      addToast('تم تسجيل الدخول', { type: 'success' });
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.error;
      if (msg) {
        const m = msg.match(/"([^"]+)"/);
        if (m) setFieldError({ field: m[1], message: msg });
        else addToast(msg, { type: 'danger' });
      } else addToast('فشل تسجيل الدخول', { type: 'danger' });
    } finally { setLoading(false); }
  };

  return (
    <main className="container py-4">
      <div className="mx-auto" style={{maxWidth:420}}>
        <div className="auth-card">
          <div className="card-header text-center">تسجيل الدخول إلى M&O Store</div>
          <div className="card-body">
            <form onSubmit={submit}>
              <div className="mb-2">
                <label className="form-label">اسم المستخدم</label>
                <input className={`form-control ${fieldError && fieldError.field === 'username' ? 'is-invalid' : ''}`} value={username} onChange={e=>setUsername(e.target.value)} required />
                {fieldError && fieldError.field === 'username' && <div className="invalid-feedback">{fieldError.message}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">كلمة المرور</label>
                <input type="password" className={`form-control ${fieldError && fieldError.field === 'password' ? 'is-invalid' : ''}`} value={password} onChange={e=>setPassword(e.target.value)} required />
                {fieldError && fieldError.field === 'password' && <div className="invalid-feedback">{fieldError.message}</div>}
              </div>
              <button className="btn btn-brand w-100" disabled={loading}>{loading? 'جارٍ...' : 'دخول'}</button>
            </form>
            <div className="text-center mt-3">
              <small className="text-muted">هل لا تملك حساباً؟ <a href="/register">أنشئ حساباً</a></small>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
