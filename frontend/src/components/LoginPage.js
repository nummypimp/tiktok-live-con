import React from 'react';
import { auth, googleProvider, signInWithPopup, db, doc, setDoc } from './firebase';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Save user data in sessionStorage
      sessionStorage.setItem("user", JSON.stringify({
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid
      }));

      // Save user in Firestore
      await setDoc(doc(db, "users", user.uid), {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid,
        lastLogin: new Date()
      });

      console.log("✅ User saved to Firestore");
      navigate("/dashboard");  // redirect to dashboard
    } catch (error) {
      console.error("❌ Login failed:", error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md text-center">
        <h1 className="text-2xl mb-4">Login with Google</h1>
        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
