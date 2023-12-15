import logo from './logo.svg';
import './App.css';
import Map from './components/Map';
import { useEffect } from 'react';

function App() {
  useEffect(()=>console.log("loaded"),[])
  return (
    <Map />
  );
}

export default App;
