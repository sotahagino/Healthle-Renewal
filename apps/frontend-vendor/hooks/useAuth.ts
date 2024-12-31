'use client';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'

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
      // シンプルなクエリで実行
      const { data, error } = await supabase
        .from('vendor_users')
        .select('vendor_id')
        .eq('user_id', userId)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('No vendor user found')
      }

      console.log('Vendor user found:', data)
      return data.vendor_id
    } catch (error) {
      console.error('Error in fetchVendorId:', error)
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const MAX_RETRIES = 3

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

    return () => {
      mounted = false
    }
  }, [supabase])

  return {
    isAuthenticated,
    vendorId,
    user,
    loading,
    logout,
  }
} 