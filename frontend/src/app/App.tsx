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

  // Opts into React Router v7's behavior now — silences the "Future Flag Warning" console
  // noise and avoids a breaking change on the next major upgrade.
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
