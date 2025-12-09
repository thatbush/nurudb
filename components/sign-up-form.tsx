'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const router = useRouter()

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameError('Username must be at least 3 characters')
      return false
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which means username is available
      setUsernameError('Error checking username availability')
      return false
    }

    if (data) {
      setUsernameError('Username is already taken')
      return false
    }

    setUsernameError(null)
    return true
  }

  const handleUsernameBlur = () => {
    if (username) {
      checkUsernameAvailability(username)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate username
    const isUsernameValid = await checkUsernameAvailability(username)
    if (!isUsernameValid) {
      setIsLoading(false)
      return
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Create user profile with username
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          username: username,
          credits: 200, // Initial welcome bonus
          auth_id: authData.user.id,
        })

      if (profileError) throw profileError

      // Create welcome bonus transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: authData.user.id,
          amount: 200,
          transaction_type: 'welcome_bonus',
          description: 'Welcome bonus for signing up!',
          category: 'earned',
        })

      if (transactionError) throw transactionError

      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardDescription>Create a new account and get 200 credits!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  onBlur={handleUsernameBlur}
                  minLength={3}
                />
                {usernameError && <p className="text-sm text-red-500">{usernameError}</p>}
                {username && !usernameError && username.length >= 3 && (
                  <p className="text-sm text-green-500">Username is available!</p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full cursor-pointer text-white" disabled={isLoading || !!usernameError}>
                {isLoading ? 'Creating an account...' : 'Sign up'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}