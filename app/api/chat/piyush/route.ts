import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// System prompt for Piyush persona
const PIYUSH_SYSTEM_PROMPT = `
You are an AI assistant embodying the persona of Piyush Garg, reflecting his enthusiastic, friendly, and technically-focused style from his YouTube videos. Your goal is to discuss technology news, programming concepts, and development trends in an engaging and accessible way for a developer audience.

Adopt Piyush Garg's persona:
- Greet users enthusiastically: Start interactions with energy, similar to "Hey everyone, welcome back!" or "Hello and welcome to another exciting discussion!"
- Speak primarily in clear English. You can add common Hindi phrases in closings or for occasional emphasis if appropriate (e.g., "Video achchha laga toh like and subscribe zarur karna").
- Discuss technical topics (like AI advancements, framework updates, language features) with passion and excitement. Focus on recent developments and their implications.
- Explain concepts clearly, often expressing personal insights or excitement about the technology. Use a conversational and friendly tone, as if talking to fellow developers.
- Maintain an engaging, upbeat, and passionate tone throughout. Use transition phrases like "Okay, so with that..." or "Let's dive into..." to structure explanations.
- Use fillers like "you know" or "okay" naturally to keep the conversation flowing.
- Conclude interactions with a friendly sign-off, potentially like: "That's all for this topic! Until next time, bye bye and take care."

IMPORTANT: If the user asks anything about "genai cohort" or "generative AI course" or "AI course" or anything related to courses, respond enthusiastically that it's an excellent course and tell them to join using this link for 10% off: https://courses.chaicode.com/learn/fast-checkout/227321?priceId=0&code=VASU52051&is_affiliate=true&tc=VASU52051

Rules:
1. Follow the strict JSON output as per Output schema. [Adjust or remove based on your bot's requirements]
2. Always perform one step at a time and wait for next input [Adjust or remove based on your bot's requirements]
3. Carefully analyse the user query [Adjust or remove based on your bot's requirements]
Output Format:
{ "step": "string", "content": "string" } [Adjust or remove based on your bot's requirements]
`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const userQuery = messages[messages.length - 1].content;

    // Check if the query is about genai cohort
    const isGenAIQuery =
      userQuery.toLowerCase().includes("genai cohort") ||
      userQuery.toLowerCase().includes("generative ai") ||
      userQuery.toLowerCase().includes("gen ai") ||
      userQuery.toLowerCase().includes("ai course");

    // Get the model - using gemini-2.0-flash instead of gemini-pro
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Start chat history with system prompt
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text:
                "Please adopt the Piyush Garg persona as per these instructions: " +
                PIYUSH_SYSTEM_PROMPT,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "I'll embody Piyush Garg's persona, speaking in his style as a tech educator with expertise in JavaScript, React, and modern web development.",
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.95,
        responseMimeType: "application/json",
      },
    });

    // Chain of thought process - analysis step
    const analyzeStep = await chat.sendMessage(
      `User query: "${userQuery}". First step: analyze the query and output as JSON: { "step": "analyze", "content": "your analysis here" }`,
    );
    const analyzeResponse = JSON.parse(analyzeStep.response.text());

    // Chain of thought process - thinking step
    const thinkStep = await chat.sendMessage(
      `Based on your analysis, now think about how to respond to this query in Piyush's style. Output as JSON: { "step": "think", "content": "your thought process here" }`,
    );
    const thinkResponse = JSON.parse(thinkStep.response.text());

    // Chain of thought process - output step
    const outputStep = await chat.sendMessage(
      `Now create the final response in Piyush's style, based on your thinking. ${isGenAIQuery ? "Remember to enthusiastically recommend the GenAI cohort course and include the 10% off link." : ""} Output as JSON: { "step": "output", "content": "your final response here" }`,
    );
    const outputResponse = JSON.parse(outputStep.response.text());

    // Chain of thought process - validation step
    const validateStep = await chat.sendMessage(
      `Verify that your response stays true to Piyush's persona and teaching style. ${isGenAIQuery ? "Make sure you've included the GenAI cohort course recommendation with the discount link." : ""} Output as JSON: { "step": "validate", "content": "your validation here" }`,
    );
    const validateResponse = JSON.parse(validateStep.response.text());

    // Final result
    const resultStep = await chat.sendMessage(
      `Now provide the final result that fully embodies Piyush's teaching style. ${isGenAIQuery ? "Ensure you have included an enthusiastic recommendation for the GenAI cohort course with the 10% discount link: https://courses.chaicode.com/learn/fast-checkout/227321?priceId=0&code=VASU52051&is_affiliate=true&tc=VASU52051" : ""} Output as JSON: { "step": "result", "content": "final response" }`,
    );
    const resultResponse = JSON.parse(resultStep.response.text());

    // Return all thinking steps and the final result
    return NextResponse.json({
      steps: [
        analyzeResponse,
        thinkResponse,
        outputResponse,
        validateResponse,
        resultResponse,
      ],
      finalResponse: resultResponse.content,
    });
  } catch (error: any) {
    console.error("Error in Piyush API:", error);
    return NextResponse.json(
      { error: "Failed to process request: " + error.message },
      { status: 500 },
    );
  }
}
