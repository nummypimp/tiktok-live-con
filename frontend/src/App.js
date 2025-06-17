import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import GamePage from './components/GamePage';
import AdminPage from './components/AdminPage';
import SlidePage from './components/SlidePage';
import ChatViewer from './components/ChatViewer';
import Connect from "./components/Connect";
import Game3Screen from "./components/Game3Screen";
import IndexPage from "./components/IndexPage";
import SlotGameWrapper from './components/SlotPage';
import SlotPageShow from './components/SlotPageShow';
import RealSlotGame from './components/RealSlotGame';
import ChatViewSeller from './components/ChatViewSeller';
import KeywordSettings from './components/KeywordSettings';
import Room from "./components/Room";
import SlotMachine2 from './components/Slot';
import LoginPage from './components/LoginPage';
import Dashboard from  './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import ObsEventController from "./components/ObsEventController";
import EmojiAnimation from './components/EmojiAnimation';
import LiveList from "./components/LiveList"; // ปรับ path ตามจริง

// import Log from "./pages/Log"; // (ถ้ามีหน้า log เพิ่มในอนาคต)
const players = [
  { id: 1, nickname: "A", avatarUrl: "https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/48c06786e04ef66b5b5f2769311c4a35~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=c2915a35&x-expires=1748286000&x-signature=%2BWJQXA3o9FTb7ptTetYceAOcst4%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my" },
  { id: 2, nickname: "B", avatarUrl: "https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/76346e9fd463c5475bd222083af55050~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=af7ab518&x-expires=1748286000&x-signature=urFbpsuKNWbCLesY%2B11sqQXXwtY%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my" },
 { id: 3, nickname: "B", avatarUrl: "https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/aadb1deacafb2e68826711298a896081~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=065db042&x-expires=1748286000&x-signature=rktQZ2piyR5D7R9%2BPCQWGlEorDg%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my" },
 { id: 4, nickname: "B", avatarUrl: "https://p16-sign-useast2a.tiktokcdn.com/tos-useast2a-avt-0068-giso/7140580515022635035~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=d6ef0611&x-expires=1748286000&x-signature=JjL98zd90WtdQoyc5dmsHSXDIQc%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my" },
 { id: 5, nickname: "B", avatarUrl: "https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/473a384311731c21d9528b649c6f108e~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=04909cc1&x-expires=1748286000&x-signature=dGIYtAx1VrCz%2Bwhno28GtjE2El0%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my" },

];
function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
         <Route path="/" element={<IndexPage />} />
          <Route path="/emoji" element={<EmojiAnimation />} />
         <Route path="/obs" element={<ObsEventController />} />
           <Route  path="/chat"  element={ <PrivateRoute> <ChatViewer /> </PrivateRoute>  }  />
             <Route  path="/control"  element={ <PrivateRoute> <AdminPage /> </PrivateRoute>  }  />
               <Route  path="/game"  element={ <PrivateRoute> <RealSlotGame /> </PrivateRoute>  }  />
                 <Route  path="/game3"  element={ <PrivateRoute> <Game3Screen /> </PrivateRoute>  }  />
                  
      <Route path="/chat/live-now" element={<PrivateRoute><LiveList /></PrivateRoute>} />   
      
         <Route path="/slot" element={<SlotGameWrapper />} />
          <Route path="/chat2" element={<ChatViewSeller />} />
          <Route path="/key" element={<KeywordSettings />} />
          <Route path="/room" element={<Room />} />
            <Route path="/slot2" element={<SlotMachine2 />} />
            <Route path="/login" element={<LoginPage />} />
            <Route  path="/dashboard"  element={ <PrivateRoute> <Dashboard /> </PrivateRoute>  }  />
            <Route  path="/chat/connect"  element={ <PrivateRoute> <Connect /> </PrivateRoute>  }  />
      
          {/* <Route path="/slot2" element={<Slot3D players={players} winnerCount={3}  />} />*/}
        {/* <Route path="/log" element={<Log />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
