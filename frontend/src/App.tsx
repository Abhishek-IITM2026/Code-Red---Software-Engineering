import { useState } from 'react'
import './App.css'
import Header from './components/Header/Header'
import { Outlet, Link } from 'react-router-dom'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <Header/>
        <h1>This is App.</h1>
        <ul>
          <li>
            <Link to="/auth">Auth</Link>
          </li>
          <li>
            <Link to="/student/dashboard">Student Dashboard</Link>
          </li>
        </ul>
        <Outlet />
      </div>
    </>
  )
}

export default App
