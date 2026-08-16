'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // IMPORTANT: Must use relative URL `/api/login` so that mobile devices and remote connections work!
      // If we use 'http://localhost:5000', mobile phones will try to look for the backend on the phone itself.
      const response = await axios.post('/api/login', {
        username,
        password
      })

      if (response.status === 200) {
        toast.success('Login successful!')

        // Save the secure token and user data
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        // Configure axios defaults for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`

        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)

      if (error.response && error.response.status === 401) {
        toast.error('Invalid username or password')
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please ensure backend is running on port 5001')
      } else {
        toast.error(error.response?.data?.error || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Background with glass effect */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      <div className="relative flex items-center justify-center min-h-screen">
        {/* Glass Card */}
        <div className="w-full max-w-md p-8 space-y-8  bg-white/10 backdrop-blur-xl  border border-white/20 rounded-2xl shadow-2xl">

          {/* Logo */}
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-2">
              FOUR
            </h1>
            <p className="text-white/70 text-lg">PLASTIC</p>
            <p className="text-white/50 text-sm mt-2">Manufacturing ERP</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20  rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>



          {/* Footer */}
          <p className="text-center text-white/40 text-sm">
            Version 1.0.0 | FOUR (R) PLASTIC
          </p>
        </div>
      </div>
    </div>
  )
}