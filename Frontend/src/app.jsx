import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Mail, Inbox, Send, FileWarning, ShieldAlert, Activity, Users, Lock } from 'lucide-react'

export default function App() {
  const [view, setView] = useState('login')
  const [currentUser, setCurrentUser] = useState(null)
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Dashboard States
  const [adminData, setAdminData] = useState({ users: {}, logs: [], graph: [] })
  const [employeeStatus, setEmployeeStatus] = useState('active')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    try {
      const res = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      
      setCurrentUser(data)
      setEmployeeStatus(data.status)
      setView(data.role === 'admin' ? 'admin' : 'employee')
    } catch (err) {
      setLoginError(err.message)
    }
  }

  const triggerMaliciousDownload = async () => {
    await fetch("http://localhost:8000/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: currentUser.username, action: "download_confidential" })
    })
    setEmployeeStatus('suspended') // Instantly lock the screen locally
  }

  const handleAdminAction = async (targetUser, action) => {
    await fetch("http://localhost:8000/api/admin/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_user: targetUser, action: action })
    })
    fetchAdminData()
  }

  const fetchAdminData = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/admin/data")
      const data = await res.json()
      setAdminData(data)
    } catch (err) {
      console.error("Backend offline")
    }
  }

  // Polling for real-time updates
  useEffect(() => {
    let interval;
    if (view === 'admin') {
      fetchAdminData()
      interval = setInterval(fetchAdminData, 2000)
    } else if (view === 'employee' && currentUser) {
      // Employee polls to see if they were unblocked by admin
      interval = setInterval(async () => {
        const res = await fetch(`http://localhost:8000/api/user/status/${currentUser.username}`)
        const data = await res.json()
        setEmployeeStatus(data.status)
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [view, currentUser])

  const logout = () => {
    setCurrentUser(null)
    setView('login')
    setUsername('')
    setPassword('')
  }

  // --- VIEWS ---

  if (view === 'login') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#eef2f6', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleLogin} style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '320px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <ShieldAlert size={40} color="#0f172a" />
            <h2 style={{ color: '#0f172a', margin: '10px 0 0 0' }}>Killswitch.io</h2>
          </div>
          {loginError && <p style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>{loginError}</p>}
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} required />
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold' }}>Sign In</button>
        </form>
      </div>
    )
  }

  if (view === 'employee') {
    if (employeeStatus === 'suspended') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#7f1d1d', color: 'white', fontFamily: 'sans-serif' }}>
          <Lock size={80} style={{ marginBottom: '20px' }} />
          <h1>ACCOUNT SUSPENDED</h1>
          <p>Suspicious activity detected. Your access has been revoked.</p>
          <p>Please contact the SOC Administrator immediately.</p>
          <button onClick={logout} style={{ marginTop: '20px', padding: '10px 20px', background: 'white', color: '#7f1d1d', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Return to Login</button>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
        {/* Gmail Sidebar Clone */}
        <div style={{ width: '250px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}><Mail /> WebMail</h2>
          <button style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', margin: '20px 0', cursor: 'pointer' }}>Compose</button>
          <ul style={{ listStyle: 'none', padding: 0, color: '#475569' }}>
            <li style={{ padding: '10px', background: '#e0f2fe', borderRadius: '6px', display: 'flex', gap: '10px', fontWeight: 'bold', color: '#0369a1' }}><Inbox size={20}/> Inbox (3)</li>
            <li style={{ padding: '10px', display: 'flex', gap: '10px' }}><Send size={20}/> Sent</li>
          </ul>
          <button onClick={logout} style={{ position: 'absolute', bottom: '20px', padding: '10px', border: 'none', background: '#f1f5f9', cursor: 'pointer', borderRadius: '6px' }}>Logout {currentUser.username}</button>
        </div>

        {/* Email List */}
        <div style={{ flex: 1, padding: '30px' }}>
          <h2 style={{ color: '#0f172a' }}>Inbox</h2>
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <div><strong>HR Department</strong> - Weekly Newsletter</div>
              <span style={{ color: '#94a3b8' }}>10:42 AM</span>
            </div>
            
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', background: '#fef2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>CEO Office</strong> - Q4 Financial Projections & Layoff List
                <div style={{ marginTop: '10px' }}>
                  <button onClick={triggerMaliciousDownload} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FileWarning size={16}/> Download Attachments.zip
                  </button>
                </div>
              </div>
              <span style={{ color: '#94a3b8' }}>09:15 AM</span>
            </div>

            <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between' }}>
              <div><strong>IT Support</strong> - Update your passwords</div>
              <span style={{ color: '#94a3b8' }}>Yesterday</span>
            </div>

          </div>
        </div>
      </div>
    )
  }

  if (view === 'admin') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}><ShieldAlert color="#ef4444"/> Killswitch.io SOC Dashboard</h1>
          <button onClick={logout} style={{ padding: '8px 16px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Exit Console</button>
        </div>

        {/* Top KPI Cards */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div style={{ flex: 1, background: '#1e293b', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8' }}><Users size={20}/> Total Endpoints</div>
            <h2 style={{ margin: '10px 0 0 0' }}>{Object.keys(adminData.users).length}</h2>
          </div>
          <div style={{ flex: 1, background: '#1e293b', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8' }}><Activity size={20}/> Active Threats</div>
            <h2 style={{ margin: '10px 0 0 0' }}>{adminData.logs.filter(l => l.severity === 'CRITICAL').length}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Main Chart Area */}
          <div style={{ flex: 2, background: '#1e293b', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>Live Network Telemetry & Threat Spikes</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={adminData.graph}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', color: 'white' }} />
                  <Legend />
                  <Line type="monotone" dataKey="normal_traffic" stroke="#3b82f6" strokeWidth={2} dot={false} name="Normal Traffic" />
                  <Line type="stepAfter" dataKey="threats" stroke="#ef4444" strokeWidth={3} name="Threat Events" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Incident Feed & Control Panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* User Controls */}
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0, borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Endpoint Control</h3>
              {Object.entries(adminData.users).filter(([_, data]) => data.role !== 'admin').map(([username, data]) => (
                <div key={username} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                  <div>
                    <strong>{username}</strong>
                    <div style={{ fontSize: '12px', color: data.status === 'suspended' ? '#ef4444' : '#22c55e', marginTop: '4px' }}>
                      {data.status.toUpperCase()}
                    </div>
                  </div>
                  {data.status === 'suspended' && (
                    <button onClick={() => handleAdminAction(username, 'unblock')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                      Restore Access
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Logs */}
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', flex: 1, overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0, borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Incident Logs</h3>
              {adminData.logs.slice().reverse().map((log, index) => (
                <div key={index} style={{ marginBottom: '15px', borderLeft: `3px solid ${log.severity === 'CRITICAL' ? '#ef4444' : '#22c55e'}`, paddingLeft: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{log.time}</div>
                  <div style={{ fontSize: '14px', color: '#e2e8f0', marginTop: '4px' }}>{log.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    )
  }
}