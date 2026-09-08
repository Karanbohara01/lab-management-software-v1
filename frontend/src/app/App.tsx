import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { bootstrapAuth, sessionExpired } from '@/features/auth/authSlice';
import { registerSessionExpiredHandler } from '@/api/client';
import { router } from '@/routes/router';

export function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      dispatch(sessionExpired());
      router.navigate('/login');
    });
    void dispatch(bootstrapAuth());
  }, [dispatch]);

  return <RouterProvider router={router} />;
}
