"use client";

import { useState, useEffect } from 'react';
import './app.css'
import Link from "next/link";
import GsapBackground from './GsapBackground';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isMobile) {
    return (
      <div className="mobile-lockout">
        <div className="mobile-lockout-content">
          <h1>Desktop Required</h1>
          <p>Please switch to a desktop or laptop to use Airgue.</p>
          <div className="mobile-lockout-url">debateagent-production.up.railway.app</div>
        </div>
      </div>
    );
  }

  return (
    <div className='app'>
      <GsapBackground />
      <div className='app-content'>
        <div className='app-content-header'>
          <button className='app-content-header-name'>AIRGUE</button>
          <div className='app-content-header-buttons'>
            <a 
              href="https://github.com/sethtml" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', marginLeft: 'auto' }}
            >
              <button className='app-content-header-buttons-button'>
                developer
              </button>
            </a>
          </div>
        </div>
        <div className='app-content-hero'>
          <span className='app-content-hero-title'>Two Minds. <br></br>One Outcome.</span>
          <span className='app-content-hero-text'>An intellectual sandbox where popular LLMs debate on topics of your choice.</span>
          <Link href={"/chat"} className='app-content-hero-button'>Start</Link>
        </div>
      </div>
    </div>
  );
}