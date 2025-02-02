import { useState, useEffect } from "react";
import { Input } from "../src/components/ui/input";
import { Button } from "../src/components/ui/button";
import { Card } from "../src/components/ui/card";
import "./homePage.css";

export default function HomePage() {
  const [apiKey, setApiKey] = useState("");
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [assignment, setAssignment] = useState("");

  useEffect(() => {
    const storedKey = localStorage.getItem("apiKey");
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleApiKeyChange = (e) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem("apiKey", newKey);
  };

  const clearApiKey = () => {
    setApiKey("");
    localStorage.removeItem("apiKey");
  };

  const startSession = () => {
    if (!apiKey) {
      alert("Please enter your API key first!");
      return;
    }
    setIsSessionActive(true);
    setMessages([{
      role: "assistant",
      content: "Welcome to your Python learning session! 🎉 What would you like to learn today?"
    }]);
  };

  const generateAssignment = async () => {
    if (messages.length < 2) {
      setAssignment("Not enough discussion to generate an assignment. Please ask more questions first!");
      setShowAssignment(true);
      return;
    }

    const prompt = `Based on our discussion about Python, here's a practice assignment for you to work on. The assignment should test your understanding of the concepts we discussed.`;
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt + "\n\nOur discussion:\n" + messages.map(m => `${m.role}: ${m.content}`).join("\n")
            }]
          }]
        }),
      });
      
      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        setAssignment(data.candidates[0].content.parts[0].text);
      } else {
        setAssignment("Sorry, I couldn't generate an assignment at this time. Please try again.");
      }
    } catch (error) {
      console.error("Error generating assignment:", error);
      setAssignment("Error generating assignment. Please try again.");
    }
  };

  const endSession = async () => {
    await generateAssignment();
    setIsSessionActive(false);
    setShowAssignment(true);
  };

  const startNewSession = () => {
    setMessages([]);
    setShowAssignment(false);
    setAssignment("");
    setIsSessionActive(false);
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !apiKey) return;
    
    const newMessage = { role: "user", content: userInput };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setUserInput("");
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: userInput
            }]
          }]
        }),
      });
      
      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const aiMessage = { 
          role: "assistant", 
          content: data.candidates[0].content.parts[0].text 
        };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
      } else {
        const errorMessage = { 
          role: "assistant", 
          content: "I couldn't generate a response. Please make sure your API key is valid." 
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
        console.error("Unexpected API response format:", data);
      }
    } catch (error) {
      const errorMessage = { 
        role: "assistant", 
        content: "An error occurred while fetching the response. Please check your API key and try again." 
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      console.error("Error fetching AI response:", error);
    }
  };

  const formatMessage = (content) => {
    if (content.includes('```')) {
      const parts = content.split(/(```[^`]*```)/g);
      return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3);
          return <pre key={index}><code>{code}</code></pre>;
        }
        return <p key={index}>{part}</p>;
      });
    }
    return content.split('\n').map((line, index) => (
      <p key={index}>{line}</p>
    ));
  };

  return (
    <div className="container">
      <h1>🐍 Python Buddy - Your Friendly Coding Teacher! 🌟</h1>
      <p className="text-center text-gray-600 text-lg mb-6">
        Hello young coder! 👋 Ask me anything about Python and let's learn together! 
      </p>
      
      <div className="flex space-x-2 mb-6">
        <Input
          type="text"
          placeholder="🔑 Enter your magic API key here..."
          value={apiKey}
          onChange={handleApiKeyChange}
        />
        <Button 
          onClick={clearApiKey} 
          className="bg-red-500 hover:bg-red-600"
        >
          Clear 🗑️
        </Button>
      </div>

      {!isSessionActive && !showAssignment && (
        <div className="text-center mb-6">
          <Button 
            onClick={startSession}
            className="bg-green-500 hover:bg-green-600 text-xl py-4 px-8"
          >
            Start Learning Session 🚀
          </Button>
        </div>
      )}

      {isSessionActive && (
        <>
          <Card className="card">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <strong>
                  {msg.role === "user" ? "You 👤" : "Tutor 🤖"}
                </strong>
                <div className="message-content">
                  {formatMessage(msg.content)}
                </div>
              </div>
            ))}
          </Card>

          <div className="flex space-x-2 mt-4">
            <Input
              type="text"
              placeholder="✨ Type your Python question here..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button 
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Ask! 🚀
            </Button>
          </div>

          <div className="text-center mt-6">
            <Button 
              onClick={endSession}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              End Session & Get Assignment 📝
            </Button>
          </div>
        </>
      )}

      {showAssignment && (
        <div className="assignment-section mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">🎯 Your Practice Assignment</h2>
            <div className="assignment-content">
              {formatMessage(assignment)}
            </div>
            <div className="text-center mt-6">
              <Button 
                onClick={startNewSession}
                className="bg-green-500 hover:bg-green-600"
              >
                Start New Session 🔄
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
