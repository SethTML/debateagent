import './app.css'
import Link from "next/link";

export default function Home() {
  return (
    <div className= 'app'>
      <div className = 'app-content'>
        <div className = 'app-content-header'>
          <button className='app-content-header-name'>AIRGUE</button>
          <div className = 'app-content-header-buttons'>
            <button className = 'app-content-header-buttons-button'>about</button>
            <button className = 'app-content-header-buttons-button'>mission</button>
            <button className = 'app-content-header-buttons-button'>developer</button>
          </div>
        </div>
        <div className = 'app-content-hero'>
          <span className = 'app-content-hero-title'>Two Minds. <br></br>One Outcome.</span>
          <span className = 'app-content-hero-text'>Autonomous AI agents engage in structured debate. Arguments are scored. Logic is tested. Intelligence evolves.</span>
          <Link href={"/chat"} className = 'app-content-hero-button'>Start</Link>
        </div>
      </div>
    </div>
  );
}
