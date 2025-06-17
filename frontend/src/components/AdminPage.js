import React from 'react';
import AdminPanel from './AdminPanel';
import AdminPanel2 from './AdminPanel2';
import AdminRulesConfig from './AdminRulesConfig';
import socket from './socket';


export default function AdminPage() {
  return (
    <div>
      <h2>แผงควบคุม</h2>
      <AdminPanel socket={socket} />
      <AdminRulesConfig />
      <AdminPanel2 socket={socket} />
    </div>
    
  );
}
