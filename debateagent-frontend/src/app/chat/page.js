"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import './chat.css'

export default function Home() {
  const defaultMessage = { role: 'assistant', content: "Enter a topic or question, and watch GPT and Gemini debate." };
  
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const savedSessions = localStorage.getItem('airgue_sessions');
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      setSessions(parsedSessions);
      if (parsedSessions.length > 0) {
        setCurrentSessionId(parsedSessions[0].id);
        setMessages(parsedSessions[0].messages);
      } else {
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return;

    setSessions((prevSessions) => {
      const existingSessionIndex = prevSessions.findIndex(s => s.id === currentSessionId);
      const updatedSessions = [...prevSessions];

      const userMsg = messages.find(m => m.role === 'user');
      const title = userMsg 
        ? userMsg.content.replace('Topic: ', '').substring(0, 35) + '...' 
        : 'New Debate';

      const currentSessionData = { id: currentSessionId, title, messages };

      if (existingSessionIndex >= 0) {
        updatedSessions[existingSessionIndex] = currentSessionData;
      } else {
        updatedSessions.unshift(currentSessionData);
      }

      localStorage.setItem('airgue_sessions', JSON.stringify(updatedSessions));
      return updatedSessions;
    });
  }, [messages, currentSessionId]);

  const createNewChat = () => {
    const newId = Date.now().toString(); 
    setCurrentSessionId(newId);
    setMessages([defaultMessage]);
  };

  const loadChat = (id) => {
    const sessionToLoad = sessions.find(s => s.id === id);
    if (sessionToLoad && !isLoading) {
      setCurrentSessionId(sessionToLoad.id);
      setMessages(sessionToLoad.messages);
    }
  };

  const clearAllChats = () => {
    if (confirm('Are you sure you want to delete all debate history?')) {
      localStorage.removeItem('airgue_sessions');
      setSessions([]);
      createNewChat();
    }
  };

  const handleVote = (winner) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastMsg = newMessages[newMessages.length - 1];
      if (lastMsg.isVotePrompt) {
        lastMsg.isVotePrompt = false; 
      }

      return [
        ...newMessages,
        { role: 'user', content: `I vote for ${winner}` },
        { role: 'assistant', content: `🏆 You voted for: ${winner}! Enter a new topic to start the next battle.` }
      ];
    });
  };

  const handleSendMessage = async (e) => {
    if (e.key !== 'Enter' || !input.trim() || isLoading) return;

    const topic = input;
    setMessages((prev) => [...prev, { role: 'user', content: `Topic: ${topic}` }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://debateagent-production.up.railway.app/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) throw new Error('Backend failed');

      const data = await response.json();

      const debateMessages = data.history.map((msg, index) => {
        const roundNum = Math.floor(index / 2) + 1;
        return {
          role: msg.role,
          round: roundNum,
          content: msg.content 
        };
      });

      setMessages((prev) => [
        ...prev, 
        ...debateMessages,
        { role: 'assistant', content: "The debate is over. Who do you think won?", isVotePrompt: true }
      ]);
      
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Error: Could not connect to the debate arena." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMobile) {
    return (
      <div className="mobile-lockout">
        <div className="mobile-lockout-content">
          <h1>🖥️ Desktop Required</h1>
          <p>Please switch to a desktop or laptop to use Airgue.</p>
          <div className="mobile-lockout-url">debateagent-production.up.railway.app</div>
        </div>
      </div>
    );
  }

  const isVotingTime = messages.length > 0 && messages[messages.length - 1].isVotePrompt;

  return (
    <div className='chat'>
      <div className='chat-sidebar'>
        <div className='chat-sidebar-menu'>
          <Link href="/" className='chat-sidebar-menu-title'>AIRGUE</Link>
          <div className='chat-sidebar-menu-search'>
            <input className='chat-sidebar-menu-search-input' placeholder='Search.....' />
          </div>

          <div className='chat-sidebar-menu-clear' onClick={clearAllChats} style={{ cursor: 'pointer' }}>
            <span className='chat-sidebar-menu-clear-icon'>⟳</span>
            <span className='chat-sidebar-menu-clear-text'>Clear all chats</span>
          </div>

          <span className='chat-sidebar-menu-label'>HISTORY</span>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {sessions.map((session) => (
              <div 
                key={session.id} 
                className='chat-sidebar-menu-item' 
                onClick={() => loadChat(session.id)}
                style={{ 
                  cursor: 'pointer',
                  backgroundColor: session.id === currentSessionId ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderRadius: '4px'
                }}
              >
                <span>💬</span>
                <span>{session.title}</span>
              </div>
            ))}
          </div>

          <div className='chat-sidebar-menu-add' onClick={createNewChat} style={{ cursor: 'pointer' }}>+</div>
        </div>
      </div>

      <div className='chat-content'>
        <div className='chat-content-text'>
          <div className='chat-content-text-messages'>
            {messages.map((msg, index) => {
              let bubbleClass = 'chat-content-text-message-textitem'; 
              if (msg.role === 'user') bubbleClass = 'chat-content-text-message-textitem3';
              if (msg.role === 'gemini') bubbleClass = 'chat-content-text-message-textitem2'; 

              return (
                <div 
                  key={index} 
                  className={bubbleClass} 
                  style={{ display: 'flex', flexDirection: 'column' }} 
                >
                  {(msg.role === 'gpt' || msg.role === 'gemini') && msg.round && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold' }}>
                      {msg.role === 'gpt' && <img src="/GPTLogo.png" alt="GPT Logo" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />}
                      {msg.role === 'gemini' && <img src="/GeminiLogo.png" alt="Gemini Logo" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />}
                      <span>{msg.role === 'gpt' ? 'GPT' : 'Gemini'} - Round {msg.round}:</span>
                    </div>
                  )}

                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>

                  {msg.isVotePrompt && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button 
                        onClick={() => handleVote('GPT')}
                        style={{ padding: '8px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#10a37f', color: 'white', fontWeight: 'bold' }}
                      >
                        GPT
                      </button>
                      <button 
                        onClick={() => handleVote('Gemini')}
                        style={{ padding: '8px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#4285F4', color: 'white', fontWeight: 'bold' }}
                      >
                        Gemini
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && <div className='chat-content-text-message-textitem'>The AI models are Discussing (This takes a few seconds)...</div>}
          </div>

          <input 
            className='chat-content-text-input' 
            type="text" 
            placeholder={
              isLoading ? "Waiting for the debate to finish..." : 
              isVotingTime ? "👆 Please cast your vote using the buttons above." : 
              "Type a debate topic here..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleSendMessage}
            disabled={isLoading || isVotingTime}
          />
        </div>
      </div>
    </div>
  );
}