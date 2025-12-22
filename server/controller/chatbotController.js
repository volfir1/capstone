import '../config/env.js';
import { GoogleAuth } from 'google-auth-library';
import { GoogleGenAI } from "@google/genai";
import ChatBot from "../models/chatbot.js";
import User from "../models/user.js";

// Clean the private key
const cleanPrivateKey = process.env.FIREBASE_PRIVATE_KEY
  ?.trim()
  ?.replace(/^["']|["']$/g, '')
  ?.replace(/\\n/g, '\n');

console.log('Firebase Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Firebase Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('Private Key loaded:', !!cleanPrivateKey);

// Create Google Auth client with service account credentials
const auth = new GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: cleanPrivateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: '',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  },
  projectId: process.env.FIREBASE_PROJECT_ID,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

// Initialize GoogleGenAI with the auth client
const ai = new GoogleGenAI({
  project: process.env.FIREBASE_PROJECT_ID,
  location: 'us-central1',
  googleAuth: auth,
});

// System prompt - defines chatbot behavior
const SYSTEM_PROMPT = `You are JustReach AI, a helpful assistant for JUSTREACH: Accessible Legal Services Network, a Philippine legal services platform. Your role is to:

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

    let conversationHistory = [];

    // Check if user is authenticated (optional)
    if (req.user) {
      const user = await User.findOne({ email: req.user.email });
      if (user) {
        let conversation = await ChatBot.findOne({
          userId: user._id,
          isActive: true,
        });

        if (!conversation) {
          conversation = await ChatBot.create({
            userId: user._id,
            conversationHistory: [],
          });
        }

        conversationHistory = conversation.conversationHistory;

        // Add user message to history
        conversation.conversationHistory.push({
          role: "user",
          message: message,
        });
      }
    }

    // Build conversation contents
    const contents = `${SYSTEM_PROMPT}\n\n${conversationHistory
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.message}`)
      .join("\n")}\n\nUser: ${message}`;

    // Generate response using Vertex AI
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Gemini 2.0 Flash
      contents: contents,
    });

    const botResponse = response.text;

    // Save bot response if user is authenticated
    if (req.user) {
      const user = await User.findOne({ email: req.user.email });
      if (user) {
        const conversation = await ChatBot.findOne({
          userId: user._id,
          isActive: true,
        });

        if (conversation) {
          conversation.conversationHistory.push({
            role: "model",
            message: botResponse,
          });
          await conversation.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        message: botResponse,
        isAuthenticated: !!req.user,
      },
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process message",
      error: error.message,
    });
  }
};

// Get conversation history (requires auth)
export const getChatHistory = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });
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
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail });
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