"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Trash,
  Loader2,
  Sparkles,
  Brain,
  Check,
  Search,
  PenTool,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// GitHub usernames
const HITESH_USERNAME = "hiteshchoudhary";
const PIYUSH_USERNAME = "piyushgarg-dev";

// Define valid thinking step types
type ThinkingStepType = "analyze" | "think" | "output" | "validate" | "result";

// Emoji map for thinking steps
const STEP_EMOJIS: Record<ThinkingStepType, string> = {
  analyze: "🔍",
  think: "🧠",
  output: "✏️",
  validate: "✅",
  result: "🎯",
};

// Icons for thinking steps
const STEP_ICONS: Record<ThinkingStepType, React.ElementType> = {
  analyze: Search,
  think: Brain,
  output: PenTool,
  validate: Check,
  result: Sparkles,
};

// Step descriptions
const STEP_DESCRIPTIONS: Record<ThinkingStepType, string> = {
  analyze: "Analyzing your question...",
  think: "Thinking through a solution...",
  output: "Crafting a detailed response...",
  validate: "Double-checking accuracy...",
  result: "Finalizing the perfect answer...",
};

// Types
interface Message {
  role: string;
  content: string;
  persona?: string;
  timestamp?: number;
}

interface ThinkingStep {
  step: ThinkingStepType;
  content: string;
}

interface ProfileData {
  [key: string]: {
    name: string;
    avatar: string;
  };
}

export default function ChatInterface() {
  const [activePerson, setActivePerson] = useState("hitesh");
  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [thinking, setThinking] = useState<ThinkingStep | null>(null);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [profileData, setProfileData] = useState<ProfileData>({
    hitesh: { name: "Hitesh Choudhary", avatar: "" },
    piyush: { name: "Piyush Garg", avatar: "" },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch GitHub profile data
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const hiteshRes = await fetch(
          `https://api.github.com/users/${HITESH_USERNAME}`,
        );
        const piyushRes = await fetch(
          `https://api.github.com/users/${PIYUSH_USERNAME}`,
        );

        if (hiteshRes.ok && piyushRes.ok) {
          const hiteshData = await hiteshRes.json();
          const piyushData = await piyushRes.json();

          setProfileData({
            hitesh: {
              name: hiteshData.name || "Hitesh Choudhary",
              avatar: hiteshData.avatar_url,
            },
            piyush: {
              name: piyushData.name || "Piyush Garg",
              avatar: piyushData.avatar_url,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching GitHub profiles:", error);
      }
    };

    fetchProfiles();
  }, []);

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, thinking]);

  // Handle persona change
  const handlePersonaChange = (value: string) => {
    setActivePerson(value);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    // Add user message to conversation
    const newMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };
    setConversation((prev) => [...prev, newMessage]);
    const messageToSend = userMessage;
    setUserMessage("");
    setIsLoading(true);

    try {
      // Call the appropriate API endpoint based on active persona
      const endpoint = `/api/chat/${activePerson}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...conversation, newMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Display each thinking step with growing token count simulation
      for (let i = 0; i < data.steps.length - 1; i++) {
        setThinking(data.steps[i]);
        // Simulate token generation with increasing counts
        const contentLength = data.steps[i].content.length;
        const baseTokens = 20 + i * 30; // Increasing base tokens per step

        // Simulate tokens being generated
        for (let j = 0; j < 10; j++) {
          const increment = Math.floor(contentLength / 10);
          setTokenCount(baseTokens + j * increment);
          // Small delay for visual effect
          await new Promise((r) => setTimeout(r, 100));
        }

        // Wait before moving to next step
        await new Promise((r) => setTimeout(r, 800));
      }

      // Clear thinking and add final response to conversation
      setThinking(null);
      setTokenCount(0);
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.finalResponse,
          persona: activePerson,
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setConversation((prev) => [
        ...prev,
        {
          role: "system",
          content:
            "Sorry, there was an error processing your request. Please try again later.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setThinking(null);
      setTokenCount(0);
    }
  };

  const clearChat = () => {
    setConversation([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="h-[85vh] sm:h-[80vh] flex flex-col shadow-xl rounded-xl overflow-hidden border-2">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Persona Chat
          </h1>
          <Tabs
            value={activePerson}
            onValueChange={handlePersonaChange}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-2 h-9">
              <TabsTrigger
                value="hitesh"
                className="flex items-center gap-2 px-3"
              >
                <Avatar className="w-6 h-6 border border-blue-200">
                  <AvatarImage
                    src={profileData.hitesh.avatar || ""}
                    alt="Hitesh"
                  />
                  <AvatarFallback>HC</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">Hitesh</span>
              </TabsTrigger>
              <TabsTrigger
                value="piyush"
                className="flex items-center gap-2 px-3"
              >
                <Avatar className="w-6 h-6 border border-blue-200">
                  <AvatarImage
                    src={profileData.piyush.avatar || ""}
                    alt="Piyush"
                  />
                  <AvatarFallback>PG</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">Piyush</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  className="rounded-full"
                >
                  <Trash className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <CardContent className="flex-1 overflow-auto p-4 space-y-4">
          <div className="flex flex-col space-y-4">
            {conversation.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                <div className="mb-4 relative">
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1 rounded-full">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <Avatar className="w-20 h-20 border-2 border-blue-200 p-1">
                    <AvatarImage
                      src={profileData[activePerson].avatar || ""}
                      alt={activePerson === "hitesh" ? "Hitesh" : "Piyush"}
                    />
                    <AvatarFallback className="text-lg">
                      {activePerson === "hitesh" ? "HC" : "PG"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <p className="text-lg font-medium">
                  {activePerson === "hitesh"
                    ? "Chat with Hitesh Choudhary 🚀"
                    : "Chat with Piyush Garg 💻"}
                </p>
                <p className="text-sm max-w-md mt-2">
                  {activePerson === "hitesh"
                    ? "Ask anything about web development, JavaScript, or programming concepts in Hitesh's signature Hinglish style."
                    : "Talk to Piyush about React, Next.js, backend development, or career advice in tech."}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {[
                    "Tell me about JavaScript",
                    "Explain React hooks",
                    "How to start coding?",
                    "GenAI cohort details",
                  ].map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 px-3 py-1"
                      onClick={() => setUserMessage(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                    message.role === "user"
                      ? "bg-blue-500 text-white rounded-tr-none"
                      : message.role === "system"
                        ? "bg-gray-200 dark:bg-gray-700 rounded-tl-none"
                        : "bg-white dark:bg-gray-800 border rounded-tl-none"
                  }`}
                >
                  {message.role !== "user" && message.role !== "system" && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                      <Avatar className="w-7 h-7 border border-blue-200">
                        <AvatarImage
                          src={
                            profileData[message.persona || activePerson]
                              .avatar || ""
                          }
                          alt={
                            message.persona === "hitesh" ? "Hitesh" : "Piyush"
                          }
                        />
                        <AvatarFallback>
                          {message.persona === "hitesh" ? "HC" : "PG"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {message.persona === "hitesh"
                          ? "Hitesh Choudhary"
                          : "Piyush Garg"}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`prose prose-sm dark:prose-invert max-w-none ${message.role === "user" ? "text-white" : ""}`}
                  >
                    {message.content}
                    {message.role === "user" && (
                      <div className="text-xs text-blue-200 text-right mt-1">
                        {formatTime(message.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 border rounded-tl-none shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <Avatar className="w-7 h-7 border border-blue-200">
                      <AvatarImage
                        src={profileData[activePerson].avatar || ""}
                        alt={activePerson === "hitesh" ? "Hitesh" : "Piyush"}
                      />
                      <AvatarFallback>
                        {activePerson === "hitesh" ? "HC" : "PG"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium flex items-center gap-1">
                      {activePerson === "hitesh" ? "Hitesh" : "Piyush"}
                      <Badge
                        variant="outline"
                        className="bg-amber-100 dark:bg-amber-900 border-amber-200 text-amber-800 dark:text-amber-200 ml-2 animate-pulse"
                      >
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Thinking...
                      </Badge>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900">
                      {thinking.step && STEP_ICONS[thinking.step] ? (
                        React.createElement(STEP_ICONS[thinking.step], {
                          className: "h-4 w-4 text-blue-600 dark:text-blue-400",
                        })
                      ) : (
                        <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="font-medium text-sm">
                      {STEP_EMOJIS[thinking.step] || "🤔"}{" "}
                      {thinking.step.charAt(0).toUpperCase() +
                        thinking.step.slice(1)}
                    </div>
                    <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                      {tokenCount} tokens
                    </div>
                  </div>

                  <div className="pl-7 mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {STEP_DESCRIPTIONS[thinking.step] || "Processing..."}
                    </p>
                  </div>

                  <div className="pl-7 text-sm text-gray-700 dark:text-gray-300 border-l-2 border-blue-200 dark:border-blue-800">
                    {thinking.content}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        <form
          onSubmit={handleSubmit}
          className="p-4 border-t flex gap-2 bg-white dark:bg-gray-900"
        >
          <Input
            ref={inputRef}
            placeholder={`Message ${activePerson === "hitesh" ? "Hitesh" : "Piyush"}...`}
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !userMessage.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
