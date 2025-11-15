import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Register = () => {
  const [form, setForm] = useState({ username:'', Address:'', phoneNumber:'', password:'', confirmPassword:'' });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { register } = useAuth();
  const { add: addToast } = useToast();
  const navigate = useNavigate();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return addToast('كلمتا المرور لا تتطابقان', { type: 'danger' });
    setLoading(true);
    setFieldErrors({});
    try {
      await register(form);
      addToast('تم إنشاء الحساب', { type: 'success' });
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.error;
      if (msg) {
        const m = msg.match(/"([^"]+)"/);
        if (m) {
          setFieldErrors({ [m[1]]: msg });
        } else addToast(msg, { type: 'danger' });
      } else addToast('فشل التسجيل', { type: 'danger' });
    } finally { setLoading(false); }
  };

  return (
    <main className="container py-4">
      <div className="mx-auto" style={{maxWidth:520}}>
        <div className="auth-card">
          <div className="card-header text-center">إنشاء حساب جديد</div>
          <div className="card-body">
            <form onSubmit={submit}>
              <div className="row g-2">
                <div className="col-12 col-md-6">
                    <label className="form-label">اسم المستخدم</label>
                    <input className={`form-control ${fieldErrors.username ? 'is-invalid' : ''}`} value={form.username} onChange={e=>update('username', e.target.value)} required />
                    {fieldErrors.username && <div className="invalid-feedback">{fieldErrors.username}</div>}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">الهاتف (10 أرقام)</label>
                  <input className={`form-control ${fieldErrors.phoneNumber ? 'is-invalid' : ''}`} value={form.phoneNumber} onChange={e=>update('phoneNumber', e.target.value)} required />
                  {fieldErrors.phoneNumber && <div className="invalid-feedback">{fieldErrors.phoneNumber}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label">العنوان</label>
                  <input className={`form-control ${fieldErrors.Address ? 'is-invalid' : ''}`} value={form.Address} onChange={e=>update('Address', e.target.value)} required />
                  {fieldErrors.Address && <div className="invalid-feedback">{fieldErrors.Address}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label">كلمة المرور</label>
                  <input type="password" className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`} value={form.password} onChange={e=>update('password', e.target.value)} required />
                  {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label">تأكيد كلمة المرور</label>
                  <input type="password" className={`form-control ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`} value={form.confirmPassword} onChange={e=>update('confirmPassword', e.target.value)} required />
                  {fieldErrors.confirmPassword && <div className="invalid-feedback">{fieldErrors.confirmPassword}</div>}
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-brand w-100" disabled={loading}>{loading? 'جارٍ...' : 'إنشاء الحساب'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Register;
