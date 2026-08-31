import { BrowserRouter, Routes, Route } from 'react-router-dom'

import JoinMeeting from './pages/JoinMeeting'
import CreateMeeting from './pages/CreateMeeting'
import Home from './pages/Home'
import Meeting from './pages/Meeting'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/join" element={<JoinMeeting />} />
                <Route path="/create" element={<CreateMeeting />} />
                 <Route path="/meeting/:meetingId" element={<Meeting />}/>
            </Routes>
        </BrowserRouter>
    )
}

export default App