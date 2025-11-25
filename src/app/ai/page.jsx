'use client';
import React, { useRef, useState, useEffect } from 'react';
import { HfInference } from "@huggingface/inference";

const Page = () => {
  const [inputText, setInputText] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const inference = new HfInference("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");

  const fetchLLMResponse = async (input) => {
    let response = '';
    try {
      for await (const chunk of inference.chatCompletionStream({
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [{ role: "user", content: input }],
        max_tokens: 1000,
      })) {
        response += chunk.choices[0]?.delta?.content || "";
      }
    } catch (error) {
      console.error('Error fetching response:', error);
    }
    return response;
  };

  const handleOutput = async () => {
    if (!inputText.trim()) return; // If input is empty, do nothing

    // Add user's input to the conversation
    setConversation((prev) => [...prev, { sender: 'user', text: inputText }]);
    
    setLoading(true); // Set loading to true while fetching

    const llmResponse = await fetchLLMResponse(inputText);
    
    setLoading(false); // Set loading to false after fetching
    setDisplayedText(''); // Reset displayed text
    setInputText(''); // Clear input text

    displayTextWordByWord(llmResponse); // Display the text word by word
  };

  const displayTextWordByWord = (text) => {
    const words = text.split(' ');
    let currentText = '';
    let index = 0;

    const interval = setInterval(() => {
      if (index < words.length) {
        currentText += `${words[index]} `;
        setDisplayedText(currentText.trim());
        index++;
      } else {
        clearInterval(interval);
        setConversation((prev) => [...prev, { sender: 'bot', text }]);
      }
    }, 20); // Adjust the timing (200ms) for each word display speed
  };

  return (
    <div>
      <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
        {conversation.map((message, index) => (
          <div key={index} style={{ textAlign: message.sender === 'user' ? 'right' : 'left', margin: '10px 0' }}>
            <strong>{message.sender === 'user' ? 'You' : 'Bot'}: </strong>
            {message.text}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '20px', fontStyle: 'italic', color: '#555' }}>
        {displayedText}
      </div>
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Type your message..."
        style={{ width: '80%', padding: '10px', margin: '10px 0',marginLeft:'30px',position: 'fixed', bottom: '0', left: '0', width: '80%', border: '1px solid #ccc' }}
        disabled={loading}
      />
      <button onClick={handleOutput} style={{ padding: '10px',margin:'10px 0',position: 'fixed', bottom: '0', right: '0', width: '10%', border: '1px solid #ccc'}} disabled={loading}>
        Send
      </button>
      
    </div>
  );
}

export default Page;
