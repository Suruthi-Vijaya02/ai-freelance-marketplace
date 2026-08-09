import { generateText } from "../services/geminiService.js";

export const testGemini = async (req, res) => {
  try {
    const result = await generateText(
      "Say hello to Suruthi in one short sentence."
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.status(200).json({
      success: true,
      message: "Gemini is working successfully.",
      response: result.data.text,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to connect to Gemini.",
    });
  }
};