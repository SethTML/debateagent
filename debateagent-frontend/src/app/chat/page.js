"use client";

import { useState } from 'react';
import './chat.css'

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "I'm here to assist you, let's chat." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e) => {
    if (e.key !== 'Enter' || !input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newHistory = [...messages, userMessage];
    
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/debate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newHistory }),
      });

      if (!response.ok) throw new Error('Backend failed');

      const data = await response.json();

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Error: Could not connect to the debate engine." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='chat'>
      <div className='chat-sidebar'>
        <div className='chat-sidebar-menu'>
          <div className='chat-sidebar-menu-search'>
            <input className='chat-sidebar-menu-search-input' placeholder='Search.....' />
          </div>

          <div className='chat-sidebar-menu-clear' onClick={() => setMessages([{ role: 'assistant', content: "Chat cleared. How can I help?" }])}>
            <span className='chat-sidebar-menu-clear-icon'>⟳</span>
            <span className='chat-sidebar-menu-clear-text'>Clear all chats</span>
          </div>

          <span className='chat-sidebar-menu-label'>HISTORY</span>
          <div className='chat-sidebar-menu-item'><span>💡</span><span>Is it better for AI startups to be acquired early by tech giants or stay independent to innovate freely?</span></div>
          <div className='chat-sidebar-menu-item'><span>🤖</span><span>Should companies be allowed to sell access to users’ emotions (via neural data)?</span></div>
          <div className='chat-sidebar-menu-item'><span>🧠</span><span>Are AI startups driving human progress or accelerating societal inequality?</span></div>
          <div className='chat-sidebar-menu-add'>+</div>
        </div>
      </div>

      <div className='chat-content'>
        <div className='chat-content-text'>
          <div className='chat-content-text-messages' style={{ overflowY: 'auto' }}>
            {messages.map((msg, index) => (
              <span 
                key={index} 
                className={msg.role === 'user' ? 'chat-content-text-message-textitem3' : 'chat-content-text-message-textitem'}
              >
                {msg.content}
              </span>
            ))}
            {isLoading && <span className='chat-content-text-message-textitem'>Agent is thinking...</span>}
          </div>

          <input 
            className='chat-content-text-input' 
            type="text" 
            placeholder={isLoading ? "Waiting for response..." : "Type your message here..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleSendMessage}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}