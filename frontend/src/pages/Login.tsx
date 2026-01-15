import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email es requerido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const { login, isLoginLoading, loginError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch {
      // Error is handled by the mutation
    }
  };

  const getErrorMessage = () => {
    if (!loginError) return null;

    const error = loginError as { response?: { data?: { error?: { message?: string } } } };
    return error.response?.data?.error?.message || 'Error al iniciar sesión';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="px-4 py-4 text-center sm:px-6 sm:py-6">
          <div className="mx-auto mb-3 sm:mb-4">
            <h1 className="text-2xl font-bold text-[#CC0000] sm:text-3xl">PULSO</h1>
          </div>
          <CardTitle className="text-lg sm:text-xl">Iniciar Sesión</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Sistema de Gestión de Horas y Tareas
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {getErrorMessage() && (
              <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 sm:p-3 sm:text-sm">
                {getErrorMessage()}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="correo@pulso.edu.mx"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              className="min-h-[48px] w-full sm:min-h-0"
              isLoading={isLoginLoading}
            >
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
