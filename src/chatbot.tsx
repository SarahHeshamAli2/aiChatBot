'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Recycle, Lightbulb, Trash2, Leaf } from 'lucide-react';
import axios from 'axios';
const apiKey = import.meta.env.VITE_API_KEY_FIRE_WORKS;

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  title?: string;
  tips?: string[];
  icon?: string;
  timestamp: Date;
}

interface ChatThread {
  id: number;
  title: string;
  messages: Message[];
}

const RecyclingChatInterface = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const placeholders = [
    "What should I do with old electronics?",
    "How to recycle plastic bottles?",
    "Can I recycle pizza boxes?",
    "Where to donate old clothes?",
    "How to dispose of batteries safely?",
    "What to do with expired medications?",
    "Can broken glass be recycled?",
    "How to recycle old furniture?"
  ];
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  const quickActions = [
    { icon: <Recycle className="w-4 h-4" />, text: "Electronics", query: "How to recycle old electronics?" },
    { icon: <Trash2 className="w-4 h-4" />, text: "Household", query: "What to do with household items?" },
    { icon: <Leaf className="w-4 h-4" />, text: "Organic", query: "How to compost organic waste?" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('chatThreads');
    if (saved) setThreads(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('chatThreads', JSON.stringify(threads));
  }, [threads]);

  function parseResponse(responseText: string) {
    const cleanedText = responseText
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}/g, '')
      .replace(/`{3}/g, '')
      .replace(/`/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1');

    const sections = cleanedText.split(/\d+\.\s+/).filter(Boolean);

    return sections.map(section => {
      const [titleLine, ...rest] = section.split("\n").filter(Boolean);
      const items = rest
        .filter(line => line.trim().startsWith("-") || line.trim().startsWith("•"))
        .map(line => line.replace(/^[-•]\s*/, "").trim());

      return {
        title: titleLine?.trim() || '',
        tips: items,
      };
    });
  }

const callApi = async (query: string) => {
  const now = Date.now();
  const userMessage: Message = {
    id: now,
    type: 'user',
    content: query,
    timestamp: new Date()
  };

  let updatedThreads = [...threads];
  let threadIndex = updatedThreads.findIndex(t => t.id === activeThreadId);

  if (threadIndex === -1) {
    const newThread: ChatThread = {
      id: now,
      title: query.slice(0, 30),
      messages: [userMessage]
    };
    updatedThreads = [newThread, ...updatedThreads];
    setThreads(updatedThreads);
    setActiveThreadId(now);
    threadIndex = 0;
  } else {
    updatedThreads[threadIndex].messages.push(userMessage);
  }

  setThreads([...updatedThreads]);
  setIsTyping(true);
  setInputValue('');

  try {
    // Prepare conversation history for the API
    const conversationHistory = updatedThreads[threadIndex].messages.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const response = await axios.post(
      'https://api.fireworks.ai/inference/v1/chat/completions',
      {
        model: "accounts/fireworks/models/llama4-maverick-instruct-basic",
        messages: conversationHistory // Send entire conversation history
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || 'Sorry, I couldn’t find an answer.';
    const cleanReply = reply.replace(/\*\*/g, '').replace(/\*/g, '');
    const sections = parseResponse(cleanReply);

    const aiMessage: Message = {
      id: now + 1,
      type: 'ai',
      content: cleanReply,
      timestamp: new Date(),
      title: sections[0]?.title,
      tips: sections[0]?.tips
    };

    updatedThreads[threadIndex].messages.push(aiMessage);
    setThreads([...updatedThreads]);
  } catch (err) {
    console.error(err);
    updatedThreads[threadIndex].messages.push({
      id: now + 1,
      type: 'ai',
      content: 'Sorry, there was an error processing your request.',
      timestamp: new Date()
    });
    setThreads([...updatedThreads]);
  } finally {
    setIsTyping(false);
  }
};

  const handleSend = () => {
    if (!inputValue.trim()) return;
    callApi(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);
  const messages = activeThread?.messages || [];
const generateImage = async () => {
  if (!inputValue.trim()) return;

  const now = Date.now();
  const prompt = inputValue;

  const userMessage: Message = {
    id: now,
    type: 'user',
    content: prompt,
    timestamp: new Date()
  };

  let updatedThreads = [...threads];
  let threadIndex = updatedThreads.findIndex(t => t.id === activeThreadId);

  if (threadIndex === -1) {
    const newThread: ChatThread = {
      id: now,
      title: prompt.slice(0, 30),
      messages: [userMessage]
    };
    updatedThreads = [newThread, ...updatedThreads];
    setThreads(updatedThreads);
    setActiveThreadId(now);
    threadIndex = 0;
  } else {
    updatedThreads[threadIndex].messages.push(userMessage);
  }

  setThreads([...updatedThreads]);
  setInputValue('');
  setIsTyping(true);

  try {
    const response = await axios.post(
      `https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-1-schnell-fp8/text_to_image`,
      { prompt },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "image/jpeg"
        },
        responseType: "blob"
      }
    );

    const imageBlob = response.data;
    const imageUrl = URL.createObjectURL(imageBlob);

    const imageMessage: Message = {
      id: now + 1,
      type: 'image',
      content: prompt,
      imageUrl,
      timestamp: new Date()
    };

    updatedThreads[threadIndex].messages.push(imageMessage);
    setThreads([...updatedThreads]);
  } catch (error) {
    console.error(error);
    updatedThreads[threadIndex].messages.push({
      id: now + 2,
      type: 'ai',
      content: 'Failed to generate image. Please try again.',
      timestamp: new Date()
    });
    setThreads([...updatedThreads]);
  } finally {
    setIsTyping(false);
  }
};

  return (
  <div className="min-h-screen bg-gray-50 flex">
  {/* Sidebar */}
{/* Sidebar */}
<div className="w-64 bg-white border-r p-4 flex flex-col">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-bold">Conversations</h2>
    <button
      onClick={() => {
        const newId = Date.now();
        const newThread: ChatThread = {
          id: newId,
          title: 'New Chat',
          messages: []
        };
        setThreads([newThread, ...threads]);
        setActiveThreadId(newId);
      }}
      className="text-blue-600 hover:text-blue-800 text-sm"
      title="Start new chat"
    >
      + New
    </button>
  </div>

  <div className="space-y-2 overflow-y-auto flex-1">
    {threads.map(thread => (
      <button
        key={thread.id}
        onClick={() => setActiveThreadId(thread.id)}
        className={`w-full text-left px-3 py-2 rounded-md ${
          thread.id === activeThreadId ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'
        }`}
      >
        {thread.title}
      </button>
    ))}
  </div>
</div>

  {/* Main Chat UI */}
  <div className="flex-1 max-w-4xl mx-auto px-6 py-8">
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {!messages.length && (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">How can I assist you today?</h2>
          <p className="text-gray-500 mb-6">Ask me anything—I'll do my best to help.</p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {placeholders.slice(0, 4).map((placeholder, index) => (
              <button
                key={index}
                onClick={() => setInputValue(placeholder)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-full"
              >
                {placeholder}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="max-h-[500px] overflow-y-auto p-6 space-y-4">
     {messages.map((msg) => (
  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`px-4 py-3 rounded-lg max-w-md ${
        msg.type === 'user'
          ? 'bg-blue-600 text-white rounded-br-none'
          : 'bg-gray-100 text-gray-800 rounded-bl-none'
      }`}
    >
      {msg.type === 'image' ? (
        <div>
          <div className="text-sm mb-2 text-gray-600 italic">{msg.content}</div>
          <img
            src={msg.imageUrl}
            alt="Generated"
            className="rounded-md shadow max-w-full h-auto"
          />
        </div>
      ) : (
        <div className="whitespace-pre-line">{msg.content}</div>
      )}

      {msg.tips?.length > 0 && (
        <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
          {msg.tips.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  </div>
))}


        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg animate-pulse">
              AI is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholders[currentPlaceholder]}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
            rows={1}
          />
          <div className="flex gap-3">
          <button
            onClick={generateImage}
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            generate image            
          </button>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Send className="w-5 h-5" />
            
          </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</div>

  );
};

export default RecyclingChatInterface;
