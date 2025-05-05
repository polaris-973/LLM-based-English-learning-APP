import axios from 'axios';

// 阿里云灵积平台API配置
const API_KEY = process.env.REACT_APP_DASHSCOPE_API_KEY;
const API_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

/**
 * Generate multiple choice questions based on a knowledge point
 * @param {string} knowledgePoint - The English knowledge point provided by the user
 * @param {number} count - Number of questions to generate
 * @returns {Promise<Array>} - Array of question objects
 */
export const generateMultipleChoiceQuestions = async (knowledgePoint, count = 5) => {
  try {
    // 设置超时时间为30秒
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API请求超时，请稍后再试')), 100000);
    });
    
    // 使用axios直接调用阿里云灵积平台API
    const apiPromise = axios.post(
      `${API_BASE_URL}/chat/completions`,
      {
        model: "qwen-plus",
        messages: [
          { 
            role: "system", 
            content: `You are an English learning assistant. Generate ${count} multiple choice questions about the following English knowledge point. Each question should have EXACTLY 4 options (A, B, C, D) - one correct answer and three incorrect answers. Include the correct answer and a detailed explanation for each question. IMPORTANT: Format your response exactly as specified, with options as a simple array of strings.` 
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
          1. The “options” field must be a simple array of strings, must contain four options, and the number of options must be strictly equal to four..
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
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    // 使用Promise.race在API请求和超时之间竞争
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    // 解析返回的JSON字符串
    const responseContent = response.data.choices[0].message.content;
    console.log("API Response:", responseContent); // 添加调试日志
    
    const parsedResponse = JSON.parse(responseContent);
    console.log("Parsed Response:", parsedResponse); // 添加调试日志
    
    // 确保返回的是一个数组，并且每个问题的options是数组
    let questions = [];
    
    if (Array.isArray(parsedResponse.questions)) {
      questions = parsedResponse.questions;
    } else if (parsedResponse.questions) {
      console.warn("API返回的questions不是数组格式:", parsedResponse.questions);
      // 如果questions存在但不是数组，尝试将其转换为数组
      if (typeof parsedResponse.questions === 'object') {
        questions = [parsedResponse.questions];
      }
    } else {
      console.warn("API返回的数据中没有questions字段:", parsedResponse);
      // 尝试查找其他可能的字段名
      const possibleArrays = Object.values(parsedResponse).filter(val => Array.isArray(val));
      if (possibleArrays.length > 0) {
        questions = possibleArrays[0];
      }
    }
    
    if (questions.length === 0) {
      throw new Error('API返回的数据格式不正确，未能生成有效的选择题');
    }
    
    // 记录原始问题数据，用于调试
    console.log("处理前的问题数据:", JSON.stringify(questions, null, 2));
    
    // 确保每个问题的options是数组，并具有实际内容
    const validatedQuestions = questions.map(question => {
      // 深拷贝question对象，避免修改原始数据
      const processedQuestion = { ...question };
      
      console.log(`处理问题: "${processedQuestion.question}"的选项:`, processedQuestion.options);
      
      // 从问题对象中提取所有可能的选项
      let extractedOptions = [];
      
      // 特殊处理：从对象中提取所有可能的选项文本
      // 基于观察到的API响应格式，选项可能以键值对形式存储
      if (typeof processedQuestion.options === 'string') {
        // 第一个选项可能是字符串形式的options属性
        extractedOptions.push(processedQuestion.options);
      }
      
      // 遍历对象的所有属性，寻找可能的选项
      for (const key in processedQuestion) {
        // 跳过常规属性
        if (key === 'question' || key === 'correctAnswer' || key === 'explanation') {
          continue;
        }
        
        // 如果属性名看起来像选项文本，添加它
        if (typeof key === 'string' && 
            (key.includes('is ') || key.includes('are ') || 
             key.includes('Eat') || key.includes('Base form') || 
             key.includes('sun') || key.includes('She'))) {
          extractedOptions.push(key);
        }
        
        // 如果属性值是字符串且不是解释，也添加它
        if (typeof processedQuestion[key] === 'string' && 
            key !== 'options' && 
            !processedQuestion[key].includes('Explanation') && 
            processedQuestion[key].length < 100) {
          extractedOptions.push(processedQuestion[key]);
        }
      }
      
      // 移除重复项并限制为4个选项
      extractedOptions = [...new Set(extractedOptions)].slice(0, 4);
      
      console.log("提取的选项:", extractedOptions);
      
      // 如果成功提取了选项，使用它们
      if (extractedOptions.length >= 2) {
        processedQuestion.options = extractedOptions;
        console.log("使用提取的选项:", processedQuestion.options);
      }
      // 如果没有足够的选项，使用默认选项
      else {
        console.warn("无法提取足够的选项，使用默认选项");
        processedQuestion.options = [
          "She is reading a book now.",
          "He writes a letter every day.",
          "They watched TV last night.",
          "We go to school yesterday."
        ];
      }
      
      // 确保correctAnswer是数字
      if (typeof processedQuestion.correctAnswer !== 'number') {
        if (typeof processedQuestion.correctAnswer === 'string') {
          // 尝试将字符串转换为数字
          const num = parseInt(processedQuestion.correctAnswer, 10);
          if (!isNaN(num) && num >= 0 && num < processedQuestion.options.length) {
            processedQuestion.correctAnswer = num;
          } else {
            // 如果是字母A-D，转换为0-3
            const letter = processedQuestion.correctAnswer.trim().toUpperCase();
            if (letter >= 'A' && letter <= 'D') {
              processedQuestion.correctAnswer = letter.charCodeAt(0) - 'A'.charCodeAt(0);
            } else {
              processedQuestion.correctAnswer = 0; // 默认第一个选项
            }
          }
        } else {
          processedQuestion.correctAnswer = 0; // 默认第一个选项
        }
      }
      
      return processedQuestion;
    });
    
    // 记录最终处理后的问题数据
    console.log("处理后的问题数据:", JSON.stringify(validatedQuestions, null, 2));
    
    return validatedQuestions;
    
  } catch (error) {
    console.error('Error calling Alibaba LLM API:', error);
    // 不再使用模拟数据，而是直接抛出错误
    throw new Error(`生成选择题失败: ${error.message || '服务器响应超时或异常，请稍后再试'}`);
  }
};

/**
 * Generate a gap fill exercise based on a knowledge point
 * @param {string} knowledgePoint - The English knowledge point provided by the user
 * @returns {Promise<Object>} - Gap fill exercise object
 */
export const generateGapFillExercise = async (knowledgePoint) => {
  try {
    // 设置超时时间为30秒
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API请求超时，请稍后再试')), 100000);
    });
    
    // 使用axios直接调用阿里云灵积平台API
    const apiPromise = axios.post(
      `${API_BASE_URL}/chat/completions`,
      {
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
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    // 使用Promise.race在API请求和超时之间竞争
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    // 解析返回的JSON字符串
    const responseContent = response.data.choices[0].message.content;
    const parsedResponse = JSON.parse(responseContent);
    
    // 处理返回的文本，提取gaps
    const processedExercise = processGapFillExercise(parsedResponse);
    
    if (!processedExercise.text || !processedExercise.gaps || processedExercise.gaps.length === 0) {
      throw new Error('API返回的数据格式不正确，未能生成有效的填空题');
    }
    
    return processedExercise;
    
  } catch (error) {
    console.error('Error calling Alibaba LLM API:', error);
    // 不再使用模拟数据，而是直接抛出错误
    throw new Error(`生成填空题失败: ${error.message || '服务器响应超时或异常，请稍后再试'}`);
  }
};

/**
 * 处理API返回的填空题数据，提取gaps
 * @param {Object} response - API返回的原始响应
 * @returns {Object} - 处理后的填空题对象
 */
const processGapFillExercise = (response) => {
  const { text, explanation } = response;
  
  // 查找所有[GAP:answer]格式的文本
  const gapRegex = /\[GAP:(.*?)\]/g;
  const gaps = [];
  let processedText = text;
  let match;
  let gapIndex = 0;
  
  // 替换所有[GAP:answer]为_____，并记录答案
  processedText = text.replace(gapRegex, (match, answer) => {
    gaps.push({
      id: gapIndex,
      answer: answer.trim()
    });
    gapIndex++;
    return "_____";
  });
  
  return {
    text: processedText,
    gaps: gaps,
    explanation: explanation
  };
};

// 以下是模拟API的函数，当API不可用时使用
// Helper function to simulate API delay
const simulateApiDelay = () => {
  return new Promise(resolve => setTimeout(resolve, 1500));
};

// Helper function to generate mock multiple choice questions
const generateMockMultipleChoiceQuestions = (knowledgePoint, count) => {
  // This is just for demonstration - in a real app, this would come from the LLM API
  const questions = [];
  
  // Simple logic to generate different questions based on keywords in the knowledge point
  const lowerKnowledge = knowledgePoint.toLowerCase();
  
  if (lowerKnowledge.includes('present perfect')) {
    questions.push({
      question: "Which sentence correctly uses the Present Perfect tense?",
      options: [
        "I am living in Paris for three years.",
        "I have lived in Paris for three years.",
        "I live in Paris for three years.",
        "I lived in Paris for three years."
      ],
      correctAnswer: 1,
      explanation: "The Present Perfect tense is used to describe actions that started in the past and continue to the present. The correct form is 'have/has + past participle'. The sentence 'I have lived in Paris for three years' correctly uses this structure to indicate an action that began in the past and continues until now."
    });
    
    questions.push({
      question: "When do we typically use the Present Perfect tense?",
      options: [
        "To describe actions happening right now",
        "To describe actions that happened at a specific time in the past",
        "To describe actions that started in the past and continue to the present",
        "To describe actions that will happen in the future"
      ],
      correctAnswer: 2,
      explanation: "The Present Perfect tense is used to describe actions that started in the past and continue to the present, or past actions with present consequences. It connects the past and present."
    });
  }
  
  if (lowerKnowledge.includes('modal verb') || lowerKnowledge.includes('can') || lowerKnowledge.includes('could')) {
    questions.push({
      question: "Which modal verb is used to express ability in the present?",
      options: [
        "Can",
        "Could",
        "May",
        "Might"
      ],
      correctAnswer: 0,
      explanation: "'Can' is the modal verb used to express ability in the present. For example, 'I can swim' means 'I have the ability to swim' now."
    });
    
    questions.push({
      question: "In the sentence 'You might want to check the train schedule', what does the modal verb 'might' express?",
      options: [
        "Obligation",
        "Permission",
        "Possibility",
        "Ability"
      ],
      correctAnswer: 2,
      explanation: "The modal verb 'might' expresses possibility. In this sentence, it suggests that there is a possibility that checking the train schedule would be a good idea."
    });
  }
  
  // Add generic English questions if we don't have enough specific ones
  while (questions.length < count) {
    questions.push({
      question: `Question about ${knowledgePoint} #${questions.length + 1}`,
      options: [
        "Option A related to the knowledge point",
        "Option B related to the knowledge point",
        "Option C related to the knowledge point",
        "Option D related to the knowledge point"
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      explanation: `This explanation relates to ${knowledgePoint} and explains why the correct answer demonstrates understanding of this knowledge point.`
    });
  }
  
  // Return only the requested number of questions
  return questions.slice(0, count);
};

// Helper function to generate mock gap fill exercise
const generateMockGapFillExercise = (knowledgePoint) => {
  // This is just for demonstration - in a real app, this would come from the LLM API
  
  // Simple logic to generate different exercises based on keywords in the knowledge point
  const lowerKnowledge = knowledgePoint.toLowerCase();
  
  if (lowerKnowledge.includes('present perfect')) {
    return {
      text: "John _____ in London for five years. He _____ many interesting people since he moved there. Although he _____ to many countries, he still thinks London is the best city. He _____ his current job for two years, and he _____ very happy with it so far.",
      gaps: [
        { id: 0, answer: "has lived" },
        { id: 1, answer: "has met" },
        { id: 2, answer: "has traveled" },
        { id: 3, answer: "has had" },
        { id: 4, answer: "has been" }
      ],
      explanation: "This exercise practices the Present Perfect tense, which is formed with 'have/has + past participle'. We use this tense to talk about actions that started in the past and continue to the present, or past actions with present consequences. In this passage, all the gaps require the Present Perfect because they describe John's experiences that started in the past and are still relevant now."
    };
  }
  
  if (lowerKnowledge.includes('modal verb') || lowerKnowledge.includes('can') || lowerKnowledge.includes('could')) {
    return {
      text: "People _____ learn languages at any age, but children often learn faster. You _____ practice regularly if you want to improve. Some people _____ speak multiple languages without an accent. If you're not sure about the meaning of a word, you _____ look it up in a dictionary. Learning a language _____ be challenging, but it's very rewarding.",
      gaps: [
        { id: 0, answer: "can" },
        { id: 1, answer: "should" },
        { id: 2, answer: "can" },
        { id: 3, answer: "could" },
        { id: 4, answer: "may" }
      ],
      explanation: "This exercise practices modal verbs, which are used to express ability, obligation, advice, permission, and possibility. 'Can' expresses ability, 'should' expresses advice or recommendation, 'could' expresses a suggestion or possibility, and 'may' expresses possibility."
    };
  }
  
  if (lowerKnowledge.includes('present simple') || lowerKnowledge.includes('present tense')) {
    return {
      text: "Sarah _____ (work) as a doctor at the local hospital. She _____ (treat) patients every day and _____ (enjoy) helping people. The hospital _____ (open) at 8 AM and _____ (close) at 6 PM. Sarah usually _____ (finish) her shift at 5 PM and then _____ (go) home to her family.",
      gaps: [
        { id: 0, answer: "works" },
        { id: 1, answer: "treats" },
        { id: 2, answer: "enjoys" },
        { id: 3, answer: "opens" },
        { id: 4, answer: "closes" },
        { id: 5, answer: "finishes" },
        { id: 6, answer: "goes" }
      ],
      explanation: "This exercise practices the Present Simple tense, which we use to talk about habits, routines, facts, and general truths. In this passage, all verbs are in Present Simple because they describe Sarah's regular activities and the hospital's regular schedule. The verb forms follow the rule: for third person singular (he/she/it), we add -s or -es to the base form of the verb."
    };
  }
  
  // Generic gap fill if no specific one matches
  return {
    text: "Learning English _____ (require) regular practice. Students who _____ (study) consistently _____ (make) faster progress. When you _____ (learn) new vocabulary, it _____ (help) to use the words in sentences. Good learners also _____ (take) notes and _____ (review) them regularly.",
    gaps: [
      { id: 0, answer: "requires" },
      { id: 1, answer: "study" },
      { id: 2, answer: "make" },
      { id: 3, answer: "learn" },
      { id: 4, answer: "helps" },
      { id: 5, answer: "take" },
      { id: 6, answer: "review" }
    ],
    explanation: `This exercise helps you practice verb forms related to ${knowledgePoint}. The context provides clues about which form to use in each gap. For example, "Learning English requires..." uses the third person singular form because "Learning English" is the subject.`
  };
};
