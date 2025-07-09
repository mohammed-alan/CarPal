
import { useState, useEffect } from 'react' // React hooks for state and side effects
import { FaCarSide } from 'react-icons/fa' // React icon for branding
import { motion } from 'framer-motion' // Framer Motion for smooth background animation


// Main landing/login/signup page
export default function MainPage() {
  // Tracks whether we're showing login or signup form
  const [isLogin, setIsLogin] = useState(true)

  // Email and password inputs
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Featured car data fetched from the backend
  const [featuredCar, setFeaturedCar] = useState(null)

  // Toggles between login and signup forms
  function toggleForm() {
    setIsLogin(!isLogin)
    setEmail('')
    setPassword('')
  }

  // Handle form submit for login/signup
  async function handleSubmit(e) {
    e.preventDefault()

    try {
      const endpoint = isLogin ? 'login' : 'signup'

      // Make request to backend API
      const response = await fetch(`http://localhost:3000/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      // Handle API errors
      if (!response.ok) {
        alert(data?.error || 'Something went wrong')
        return
      }

      // If login successful, store token and redirect to dashboard
      if (isLogin) {
        localStorage.setItem('token', data.token)
        window.location.href = '/dashboard'
      } else {
        // If signup successful, show message and switch to login
        alert('Signup successful! You can now log in.')
        toggleForm()
      }
    } catch (err) {
      // Handle network/server errors
      alert('Unable to reach server.')
      console.error(err)
    }
  }

  // On mount: fetch a featured car randomly selected by backend
  useEffect(() => {
    fetch('http://localhost:3000/featured-car')
      .then(res => res.json())
      .then(data => setFeaturedCar(data))
      .catch(err => console.error('Failed to load featured car:', err))
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden px-4 bg-black text-white">
      
      {/* Animated glowing background orb using Framer Motion */}
      <motion.div
        className="absolute w-[500px] h-[500px] bg-blue-500 rounded-full blur-3xl opacity-20 z-10"
        animate={{
          x: ['0%', '50%', '0%', '-30%', '0%'],
          y: ['0%', '-20%', '20%', '10%', '0%']
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Dark overlay to tint and unify background */}
      <div className="absolute inset-0 bg-gray-900/80 z-0" />

      {/* CarPal Logo Header */}
      <div className="flex items-center gap-2 mb-6 z-30">
        <FaCarSide className="text-blue-400 text-4xl drop-shadow-lg" />
        <h1 className="text-5xl font-black text-blue-500 tracking-wide drop-shadow-xl select-none">
          CarPal
        </h1>
      </div>

      {/* Featured Car Display Box */}
      {featuredCar && (
        <div className="mb-8 z-30 bg-gray-800 p-6 rounded-3xl shadow-2xl max-w-md w-full border border-gray-700">
          <h3 className="text-xl font-semibold text-blue-400 mb-4 text-center">
            Featured Car
          </h3>

          {/* Featured car image */}
          <img
            src={`http://localhost:3000${featuredCar.url}`}
            alt={featuredCar.filename}
            className="w-full h-48 object-cover rounded-xl shadow-md"
          />

          {/* Featured car info (make, model, year) */}
          {featuredCar.car_info && (() => {
            let info;
            try {
              // Parse car_info (can be stringified JSON)
              info = typeof featuredCar.car_info === 'string'
                ? JSON.parse(featuredCar.car_info)
                : featuredCar.car_info;
            } catch {
              info = null;
            }

            // Display parsed info if available
            return info ? (
              <div className="mt-4 text-gray-300 text-sm space-y-1">
                <p><span className="text-blue-300">Make:</span> {info.make}</p>
                <p><span className="text-blue-300">Model:</span> {info.model}</p>
                <p><span className="text-blue-300">Year:</span> {info.year}</p>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Login or Signup Form Box */}
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-3xl shadow-2xl relative border border-gray-700 group overflow-hidden z-30">
        
        {/* Glowing border animation on hover */}
        <div className="absolute inset-0 rounded-3xl border-2 border-blue-600 opacity-20 group-hover:opacity-40 blur-lg animate-glow -z-10" />

        {/* Form Title */}
        <h2 className="text-2xl font-bold mb-6 text-white text-center tracking-tight">
          {isLogin ? 'Login to Your Account' : 'Create an Account'}
        </h2>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email input */}
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />

          {/* Password input */}
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />

          {/* Submit button */}
          <button
            type="submit"
            className="bg-blue-600 py-3 rounded-lg text-white font-semibold hover:bg-blue-700 transition hover:shadow-lg"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        {/* Switch between login/signup */}
        <p className="mt-6 text-center text-gray-400">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={toggleForm}
            className="text-blue-400 hover:underline focus:outline-none"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  )
}
