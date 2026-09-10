import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useRegisterMutation } from '@/api/authApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { registerSchema, type RegisterValues } from '@/features/auth/schemas'
import { toUserMessage } from '@/lib/errors'

export function RegisterPage() {
  const navigate = useNavigate()
  const [registerUser, { isLoading }] = useRegisterMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values: RegisterValues) => {
    try {
      // Registering also signs you in — the backend sets the cookie on the response.
      await registerUser(values).unwrap()
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start planning with your travel assistant"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Name"
          autoComplete="name"
          placeholder="Your name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" isLoading={isLoading} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
