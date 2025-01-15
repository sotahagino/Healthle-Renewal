'use client';

import { useState, useEffect } from 'react'
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

const MAX_RETRIES = 3

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const logout = async () => {
    try {
      console.log('Logging out...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setIsAuthenticated(false)
      setVendorId(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const fetchVendorId = async (userId: string) => {
    console.log('Starting vendor_id fetch for user:', userId)
    try {
      const { data, error } = await supabase
        .from('vendor_staff_roles')
        .select('vendor_id, role, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('No vendor staff found')
      }

      if (data.status !== 'active') {
        throw new Error('This account is currently inactive')
      }

      console.log('Vendor staff found:', data)
      return data.vendor_id
    } catch (error) {
      console.error('Error in fetchVendorId:', error)
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    let retryCount = 0

    const checkAuth = async () => {
      try {
        console.log('Checking auth status...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          throw sessionError
        }

        if (!session) {
          console.log('No session found')
          if (mounted) {
            setIsAuthenticated(false)
            setUser(null)
            setVendorId(null)
            setLoading(false)
          }
          return
        }

        console.log('Session found:', session)
        const userId = session.user.id
        console.log('User ID:', userId)

        const vendorUserId = await fetchVendorId(userId)
        
        if (!vendorUserId && retryCount < MAX_RETRIES) {
          console.log(`Retry attempt ${retryCount + 1}`)
          retryCount++
          setTimeout(checkAuth, 1000) // 1秒後に再試行
          return
        }

        if (!vendorUserId) {
          console.log('No valid vendor_id found after retries')
          if (mounted) {
            setIsAuthenticated(false)
            setUser(null)
            setVendorId(null)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setUser(session.user)
          setIsAuthenticated(true)
          setVendorId(vendorUserId)
          console.log('Auth state updated successfully')
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (mounted && retryCount < MAX_RETRIES) {
          retryCount++
          setTimeout(checkAuth, 1000)
          return
        }
        if (mounted) {
          setIsAuthenticated(false)
          setUser(null)
          setVendorId(null)
          setLoading(false)
        }
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAuth()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return {
    isAuthenticated,
    vendorId,
    user,
    loading,
    logout,
  }
} 