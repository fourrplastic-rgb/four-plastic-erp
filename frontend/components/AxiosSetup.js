'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import axios from 'axios'

// Global references for router and pathname to be used in the synchronous response interceptor
let globalRouter = null
let globalPathname = '/'

if (typeof window !== 'undefined') {
  // Add a request interceptor synchronously
  axios.interceptors.request.use(
    (config) => {
      // We only want to set the token for /api/ routes
      if (config.url && (config.url.startsWith('/api') || config.url.includes('/api/'))) {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Add cache-buster to prevent browser from using cached 308 permanent redirects
        if (config.method === 'get') {
          const char = config.url.includes('?') ? '&' : '?';
          config.url = `${config.url}${char}cb=${Date.now()}`;
        }
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Add a response interceptor synchronously
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // If we are not already on the login page, clear token and redirect
        if (globalPathname !== '/') {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          
          if (globalRouter) {
            globalRouter.push('/')
          } else {
            window.location.href = '/'
          }
          
          // Return an unresolved promise to halt client-side execution and prevent Next.js dev overlays
          return new Promise(() => {})
        }
      }
      return Promise.reject(error)
    }
  )
}

export default function AxiosSetup() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    globalRouter = router
    globalPathname = pathname
  }, [router, pathname])

  return null // This is a utility component that doesn't render anything
}

