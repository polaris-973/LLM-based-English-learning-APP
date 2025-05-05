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
    // 设置超时时间
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API请求超时，请稍后再试')), 100000);
    });
    
    // 使用Vercel Serverless Function作为代理
    const apiPromise = axios.post('/api/generate', {
      type: 'multipleChoice',
      knowledgePoint,
      count
    });
    
    // 使用Promise.race来实现超时控制
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    console.log("API Response:", response.data); // 添加调试日志
    
    const responseContent = response.data.choices[0].message.content;
    console.log("Response Content:", responseContent); // 添加调试日志
    
    const parsedResponse = JSON.parse(responseContent);
    console.log("Parsed Response:", parsedResponse); // 添加调试日志
    
    let questions = [];
    
    if (Array.isArray(parsedResponse.questions)) {
      questions = parsedResponse.questions;
    } else if (parsedResponse.questions) {
      console.warn("API返回的questions不是数组格式:", parsedResponse.questions);
      if (typeof parsedResponse.questions === 'object') {
        questions = [parsedResponse.questions];
      }
    } else {
      console.warn("API返回的数据中没有questions字段:", parsedResponse);
      // 尝试从返回的数据中找到可能的问题数组
      const possibleArrays = Object.values(parsedResponse).filter(val => Array.isArray(val));
      if (possibleArrays.length > 0) {
        questions = possibleArrays[0];
      }
    }
    
    if (questions.length === 0) {
      throw new Error('API返回的数据格式不正确，未能生成有效的选择题');
    }
    
    // 处理每个问题的选项和正确答案
    const processedQuestions = questions.map(question => {
      // 提取选项
      let options = [];
      
      if (Array.isArray(question.options)) {
        options = question.options;
      } else if (typeof question.options === 'object') {
        // 如果options是对象，尝试从对象中提取选项
        options = Object.values(question.options);
      } else if (typeof question.options === 'string') {
        // 如果options是字符串，尝试分割成数组
        options = question.options.split(/[,;]/).map(opt => opt.trim());
      }
      
      // 确保有足够的选项
      while (options.length < 4) {
        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
      }
      
      // 限制选项数量为4个
      options = options.slice(0, 4);
      
      // 处理正确答案
      let correctAnswer = question.correctAnswer;
      
      if (typeof correctAnswer !== 'number') {
        if (typeof correctAnswer === 'string') {
          // 尝试将字符串转换为数字
          const num = parseInt(correctAnswer, 10);
          if (!isNaN(num) && num >= 0 && num < options.length) {
            correctAnswer = num;
          } else {
            // 尝试将A/B/C/D转换为索引
            const letter = correctAnswer.trim().toUpperCase();
            if (letter >= 'A' && letter <= 'D') {
              correctAnswer = letter.charCodeAt(0) - 'A'.charCodeAt(0);
            } else {
              correctAnswer = 0; // 默认第一个选项
            }
          }
        } else {
          correctAnswer = 0; // 默认第一个选项
        }
      }
      
      // 确保correctAnswer在有效范围内
      correctAnswer = Math.max(0, Math.min(correctAnswer, options.length - 1));
      
      return {
        ...question,
        options,
        correctAnswer
      };
    });
    
    return processedQuestions;
  } catch (error) {
    console.error('Error calling API:', error);
    throw new Error(`生成选择题失败: ${error.message || '服务器响应超时或异常，请稍后再试'}`);
  }
};

/**
 * Generate a gap fill exercise based on a knowledge point
 * @param {string} knowledgePoint - The English knowledge point provided by the user
 * @returns {Promise<Object>} - Object containing the exercise text, gaps, and explanation
 */
export const generateGapFillExercise = async (knowledgePoint) => {
  try {
    // 设置超时时间
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API请求超时，请稍后再试')), 100000);
    });
    
    // 使用Vercel Serverless Function作为代理
    const apiPromise = axios.post('/api/generate', {
      type: 'gapFill',
      knowledgePoint
    });
    
    // 使用Promise.race来实现超时控制
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    const responseContent = response.data.choices[0].message.content;
    const parsedResponse = JSON.parse(responseContent);
    const processedExercise = processGapFillExercise(parsedResponse);
    
    if (!processedExercise.text || !processedExercise.gaps || processedExercise.gaps.length === 0) {
      throw new Error('API返回的数据格式不正确，未能生成有效的填空题');
    }
    
    return processedExercise;
  } catch (error) {
    console.error('Error calling API:', error);
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
