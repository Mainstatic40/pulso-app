import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService, type LoginRequest } from '../services/auth.service';
import { useAuthContext } from '../stores/auth.store.tsx';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, setUser, setTokens, clearAuth } = useAuthContext();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      queryClient.invalidateQueries();
      navigate('/');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
    onError: () => {
      // Even if logout fails on server, clear local state
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
  });

  const { refetch: refetchMe } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    enabled: false,
  });

  const login = async (data: LoginRequest) => {
    return loginMutation.mutateAsync(data);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const refreshUser = async () => {
    const result = await refetchMe();
    if (result.data) {
      setUser(result.data);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    updateUser: setUser,
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
  };
}
