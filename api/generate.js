const axios = require('axios');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const API_KEY = process.env.REACT_APP_DASHSCOPE_API_KEY;
    const API_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    
    // 从请求体中获取参数
    const { type, knowledgePoint, count } = req.body;
    
    let payload;
    if (type === 'multipleChoice') {
      payload = {
        model: "qwen-plus",
        messages: [
          { 
            role: "system", 
            content: `You are an English learning assistant. Generate ${count || 5} multiple choice questions about the following English knowledge point. Each question should have EXACTLY 4 options (A, B, C, D) - one correct answer and three incorrect answers. Include the correct answer and a detailed explanation for each question. IMPORTANT: Format your response exactly as specified, with options as a simple array of strings.` 
          },
          { 
            role: "user", 
            content: `Knowledge point: "${knowledgePoint}"

          Please format your response as a JSON object with the following structure:
          {
            "questions": [
              {
                "question": "Question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0,
                "explanation": "Explanation text here"
              },
              ...more questions
            ]
          }

          IMPORTANT REQUIREMENTS:
          1. The "options" field must be a simple array of strings, must contain four options, and the number of options must be strictly equal to four.
          2. You MUST provide 3 incorrect answers and 1 correct answer for each question.
          3. Each option should be short and concise, without embedded explanations.
          4. The correctAnswer should be the index (0-3) of the correct option.
          5. Include exactly ${count} questions.
          6. Do not include option labels (A, B, C, D) in the option text itself.
          7. Make sure the options are distinct and meaningful alternatives.
          8. Provide the specific and detailed explanation for every question.` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      };
    } else if (type === 'gapFill') {
      payload = {
        model: "qwen-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are an English learning assistant specialized in creating contextual gap fill exercises that provide clear context clues." 
          },
          { 
            role: "user", 
            content: `Knowledge point: "${knowledgePoint}"

Create a meaningful gap fill exercise with 5-7 gaps specifically related to this knowledge point. 

IMPORTANT REQUIREMENTS:
1. The text must be a coherent paragraph or dialogue that clearly demonstrates the knowledge point.
2. Each gap should have sufficient context clues so students can reasonably determine the answer.
3. Use the format "[GAP:answer]" to indicate each gap, where "answer" is the correct word or phrase.
4. CRITICAL: Each gap must contain ONLY ONE WORD.
5. Choose gaps that directly relate to the knowledge point (grammar structures, vocabulary, etc.).
6. The exercise should be challenging but solvable based on the surrounding context.
7. For grammar-related knowledge points:
   - For tenses: Include the base form of the verb in parentheses after the gap, e.g., "He [GAP:went] (go) to school yesterday."
   - For plurals: Include the singular form in parentheses, e.g., "There are many [GAP:children] (child) in the park."
   - For other grammar points: Include appropriate hints in parentheses when needed.

Example for "present continuous tense":
"Right now, John [GAP:is] (be) studying for his exam while his sister [GAP:is] (be) watching TV. Their parents [GAP:are] (be) preparing dinner in the kitchen. Outside, children [GAP:are] (be) playing in the park, and the sun [GAP:is] (be) shining brightly."

Please format your response as a JSON object with the following properties:
- text: the text with [GAP:answer] placeholders and hints in parentheses
- explanation: a detailed explanation of the exercise and why each answer is correct` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      };
    }
    
    // 调用阿里云API
    const response = await axios.post(
      `${API_BASE_URL}/chat/completions`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 100000 // 100秒超时
      }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error.response ? error.response.data : null
    });
  }
};
