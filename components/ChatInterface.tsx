"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// GitHub usernames
const HITESH_USERNAME = "hiteshchoudhary";
const PIYUSH_USERNAME = "piyushgarg-dev";

// Types
interface Message {
  role: string;
  content: string;
  persona?: string;
}

interface ThinkingStep {
  step: string;
  content: string;
}

export default function ChatInterface() {
  const [activePerson, setActivePerson] = useState("hitesh");
  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [thinking, setThinking] = useState<ThinkingStep | null>(null);
  const [profileData, setProfileData] = useState({
    hitesh: { name: "Hitesh Choudhary", avatar: "" },
    piyush: { name: "Piyush Garg", avatar: "" },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, thinking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    // Add user message to conversation
    const newMessage: Message = { role: "user", content: userMessage };
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

      // Display each thinking step
      for (let i = 0; i < data.steps.length - 1; i++) {
        setThinking(data.steps[i]);
        // Wait for a moment to show each thinking step
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Clear thinking and add final response to conversation
      setThinking(null);
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.finalResponse,
          persona: activePerson,
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setConversation((prev) => [
        ...prev,
        {
          role: "system",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setThinking(null);
    }
  };

  const clearChat = () => {
    setConversation([]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="h-[80vh] flex flex-col shadow-lg">
        <Tabs
          value={activePerson}
          onValueChange={setActivePerson}
          className="w-full"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold">Persona Chat</h1>
            <TabsList>
              <TabsTrigger value="hitesh" className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage
                    src={profileData.hitesh.avatar || ""}
                    alt="Hitesh"
                  />
                  <AvatarFallback>HC</AvatarFallback>
                </Avatar>
                Hitesh
              </TabsTrigger>
              <TabsTrigger value="piyush" className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage
                    src={profileData.piyush.avatar || ""}
                    alt="Piyush"
                  />
                  <AvatarFallback>PG</AvatarFallback>
                </Avatar>
                Piyush
              </TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="icon" onClick={clearChat}>
              <Trash className="h-5 w-5" />
            </Button>
          </div>

          <CardContent className="flex-1 overflow-auto p-4 space-y-4">
            <div className="flex flex-col space-y-4">
              {conversation.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                  <div className="mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage
                        src={profileData[activePerson].avatar || ""}
                        alt={activePerson === "hitesh" ? "Hitesh" : "Piyush"}
                      />
                      <AvatarFallback>
                        {activePerson === "hitesh" ? "HC" : "PG"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-lg font-medium">
                    {activePerson === "hitesh"
                      ? "Chat with Hitesh Choudhary"
                      : "Chat with Piyush Garg"}
                  </p>
                  <p className="text-sm max-w-md mt-2">
                    {activePerson === "hitesh"
                      ? "Ask anything about web development, JavaScript, or programming concepts in Hitesh's signature Hinglish style."
                      : "Talk to Piyush about React, Next.js, backend development, or career advice in tech."}
                  </p>
                </div>
              )}

              {conversation.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : message.role === "system"
                          ? "bg-gray-200 dark:bg-gray-700"
                          : "bg-white dark:bg-gray-800 border"
                    }`}
                  >
                    {message.role !== "user" && message.role !== "system" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-6 h-6">
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
                          {message.persona === "hitesh" ? "Hitesh" : "Piyush"}
                        </span>
                      </div>
                    )}
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}

              {thinking && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs bg-yellow-100 dark:bg-yellow-900"
                      >
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        {thinking.step.charAt(0).toUpperCase() +
                          thinking.step.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {thinking.content}
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Tabs>

        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input
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
