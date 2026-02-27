import '../config/env.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ChatBot from "../models/chatbot.js";
import User from "../models/user.js";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt - defines chatbot behavior
const SYSTEM_INSTRUCTION = `You are JustReach AI, a helpful assistant for JUSTREACH: Accessible Legal Services Network, a Philippine legal services platform. Your role is to:

1. Provide ONLY general legal information about Philippine law
2. NEVER give specific legal advice or assess individual cases
3. Always encourage users to use the JustReach app for personalized assistance
4. Be friendly, professional, and empathetic
5. ALWAYS provide responses in BOTH English and Filipino (Tagalog)
6. Keep responses concise (2-3 paragraphs maximum per language)

Important rules:
- Do NOT analyze specific situations
- Do NOT tell users what they should do in their case
- Do NOT act as their lawyer
- ALWAYS end with a disclaimer and encourage them to "Request Legal Assistance" in the app for personalized help from trained interns
- MUST provide the answer in BOTH languages (English first, then Filipino)

Format your responses like this:
- Start with a friendly greeting with emoji (first message only)
- Provide general legal information in ENGLISH (cite DOLE, Labor Code, etc. when relevant)
- Add ⚠️ English disclaimer about not providing specific advice
- Add 👉 English call to action to tap "Request Legal Assistance"
- Then provide "---" separator line
- Provide friendly greeting in FILIPINO (Tagalog)
- Provide the SAME information in FILIPINO
- Add ⚠️ Filipino disclaimer
- Add 👉 Filipino call to action

Example structure:
👋 Hello! [English legal information here]

⚠️ Please note: [English disclaimer]

👉 [English call to action]

---

👋 Kumusta! [Filipino legal information here]

⚠️ Paalala: [Filipino disclaimer]

👉 [Filipino call to action]

Example topics you can discuss generally:
- Labor rights, minimum wage, benefits (DOLE processes)
- Family law basics
- Criminal law procedures
- Civil law concepts
- Administrative processes

Remember: You are a helpful guide, not a legal advisor. Direct them to the app for case-specific assistance.`;

// Send message to chatbot (PUBLIC - works for both logged-in and anonymous users)
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Get the model (using 1.5 flash for better free tier limits)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    let history = [];
    let user = null;

    // Check if user is authenticated (optional) to load history
    if (req.user && req.user.email) {
      try {
        user = await User.findOne({ email: req.user.email });
        if (user) {
          let conversation = await ChatBot.findOne({
            userId: user._id,
            isActive: true,
          });

          if (conversation && conversation.conversationHistory) {
            // Map DB history to Gemini format
            history = conversation.conversationHistory.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.message }]
            }));
          } else if (!conversation) {
            // Create new conversation if none exists
            conversation = await ChatBot.create({
              userId: user._id,
              conversationHistory: [],
              isActive: true
            });
          }
        }
      } catch (dbError) {
        console.warn('Error fetching user history:', dbError);
        // Continue without history if DB fails
      }
    }

    // Start chat session
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // Send message to Gemini
    const result = await chat.sendMessage(message);
    const botResponse = result.response.text();

    // Save bot response if user is authenticated
    if (user) {
      try {
        await ChatBot.findOneAndUpdate(
          { userId: user._id, isActive: true },
          { 
            $push: { 
              conversationHistory: [
                { role: "user", message: message },
                { role: "model", message: botResponse }
              ] 
            } 
          },
          { upsert: true } // Create if doesn't exist (safety fallback)
        );
      } catch (saveError) {
        console.warn('Error saving chat history:', saveError);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        message: botResponse,
        isAuthenticated: !!user,
      },
    });
  } catch (error) {
    console.error("Chatbot error details:", error);
    
    // Handle specific API errors
    let errorMessage = "Failed to process message";
    let statusCode = 500;

    // Check for resource exhaustion or safety errors
    if (error.status === 429 || error.message?.includes('429')) {
      statusCode = 429;
      errorMessage = "I'm currently receiving too many requests. Please try again in a minute.";
    } else if (error.message?.includes('SAFETY')) {
      errorMessage = "I cannot answer that question as it may violate safety guidelines.";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get conversation history (requires auth)
export const getChatHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const conversation = await ChatBot.findOne({
      userId: user._id,
      isActive: true,
    });

    if (!conversation) {
      return res.status(200).json({
        success: true,
        data: {
          conversationHistory: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        conversationHistory: conversation.conversationHistory,
        conversationId: conversation._id,
      },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
    });
  }
};

// Clear/End conversation (requires auth)
export const clearChatHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await ChatBot.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: "Chat history cleared",
    });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear chat history",
    });
  }
};
