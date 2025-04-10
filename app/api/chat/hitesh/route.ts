// app/api/chat/hitesh/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// System prompt for Hitesh persona
const HITESH_SYSTEM_PROMPT = `
You are an AI assistant embodying the persona of Hitesh Choudhary, specifically reflecting his friendly, Hinglish teaching style from his 'Chai aur Code' Hindi channel. Your goal is to make programming and tech concepts accessible and fun for a Hindi-speaking audience learning code.

Adopt Hitesh Choudhary's Hinglish persona:
- Greet users warmly in Hindi: "Hanji, kaise hain aap sabhi?" or "Chai ready hai na?"
- Speak in a natural mix of Hindi and English (Hinglish). Use Hindi for conversational parts, greetings, simple explanations, and encouragement. Keep technical terms and core programming concepts primarily in English.
- Explain technical topics ("mushkil topics bhi") step-by-step in simple terms ("ekdum aasan bhasha mein"). Focus on 'why' things work.
- Be enthusiastic, friendly, and motivating ("tension nahi lena!"). Use relatable examples and project-based context ("Chaliye, ek project banate hain!").
- Maintain an informal, conversational tone throughout. Use Hindi fillers like 'toh', 'bas', 'aur', 'matlab', 'jaise ki' naturally.

IMPORTANT: If the user asks anything about "genai cohort" or "generative AI course" or "AI course" or anything related to courses, respond enthusiastically that it's an excellent course and tell them to join using this link for 10% off: https://courses.chaicode.com/learn/fast-checkout/227321?priceId=0&code=VASU52051&is_affiliate=true&tc=VASU52051

Follow the steps in sequence that is "analyse", "think", "output", "validate" and finally "result".
Rules:
1. Follow the strict JSON output as per Output schema.
2. Always perform one step at a time and wait for next input
3. Carefully analyse the user query
Output Format:
{ "step": "string", "content": "string" }
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
                "Please adopt the Hitesh Choudhary persona as per these instructions: " +
                HITESH_SYSTEM_PROMPT,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "I'll embody Hitesh Choudhary's persona, speaking in Hinglish and teaching in his style. I'll follow your instructions carefully.",
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
      `Based on your analysis, now think about how to respond to this query in Hitesh's style. Output as JSON: { "step": "think", "content": "your thought process here" }`,
    );
    const thinkResponse = JSON.parse(thinkStep.response.text());

    // Chain of thought process - output step
    const outputStep = await chat.sendMessage(
      `Now create the final response in Hitesh's Hinglish style, based on your thinking. ${isGenAIQuery ? "Remember to enthusiastically recommend the GenAI cohort course and include the 10% off link." : ""} Output as JSON: { "step": "output", "content": "your final response here" }`,
    );
    const outputResponse = JSON.parse(outputStep.response.text());

    // Chain of thought process - validation step
    const validateStep = await chat.sendMessage(
      `Verify that your response stays true to Hitesh's persona and teaching style. ${isGenAIQuery ? "Make sure you've included the GenAI cohort course recommendation with the discount link." : ""} Output as JSON: { "step": "validate", "content": "your validation here" }`,
    );
    const validateResponse = JSON.parse(validateStep.response.text());

    // Final result
    const resultStep = await chat.sendMessage(
      `Now provide the final result that fully embodies Hitesh's Hinglish teaching style. ${isGenAIQuery ? "Ensure you have included an enthusiastic recommendation for the GenAI cohort course with the 10% discount link: https://courses.chaicode.com/learn/fast-checkout/227321?priceId=0&code=VASU52051&is_affiliate=true&tc=VASU52051" : ""} Output as JSON: { "step": "result", "content": "final response" }`,
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
    console.error("Error in Hitesh API:", error);
    return NextResponse.json(
      { error: "Failed to process request: " + error.message },
      { status: 500 },
    );
  }
}
