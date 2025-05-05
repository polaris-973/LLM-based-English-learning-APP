import React, { useState } from 'react';
import { Card, Input, Button, Typography, Form, InputNumber, Radio, Space, Spin, Alert } from 'antd';
import { SendOutlined, ReloadOutlined } from '@ant-design/icons';
import { generateMultipleChoiceQuestions } from '../services/alibabaLLM';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const MultipleChoicePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // 生成问题
  const handleGenerate = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setQuestions([]);
      setUserAnswers({});
      setSubmitted(false);

      const { knowledgePoint, questionCount } = values;
      const generatedQuestions = await generateMultipleChoiceQuestions(knowledgePoint, questionCount);
      
      // 打印接收到的问题数据，用于调试
      console.log("接收到的问题数据:", generatedQuestions);
      
      setQuestions(generatedQuestions);
    } catch (err) {
      console.error('Error generating questions:', err);
      setError(err.message || 'Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 记录用户答案
  const handleAnswerChange = (questionId, value) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: value
    });
  };

  // 提交答案
  const handleSubmit = () => {
    setSubmitted(true);
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setQuestions([]);
    setUserAnswers({});
    setSubmitted(false);
    setError(null);
  };

  // 渲染问题
  const renderQuestions = () => {
    if (!questions || questions.length === 0) return null;

    return (
      <div className="exercise-container">
        <Title level={4}>Multiple Choice Questions</Title>
        
        {questions.map((question, index) => (
          <Card key={index} className="question-card" style={{ marginBottom: '20px' }}>
            {/* 问题文本 */}
            <div>
              <Text strong>{index + 1}. {question.question}</Text>
            </div>
            
            {/* 选项 */}
            <div style={{ marginTop: '12px' }}>
              <Radio.Group 
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                value={userAnswers[index]}
                disabled={submitted}
              >
                <Space direction="vertical">
                  {Array.isArray(question.options) && question.options.map((option, optIndex) => (
                    <Radio key={optIndex} value={optIndex}>
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
            
            {/* 提交后显示正确答案和解释 */}
            {submitted && (
              <div style={{ marginTop: '16px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                <div>
                  <Text strong>
                    Correct Answer: {String.fromCharCode(65 + question.correctAnswer)}
                  </Text>
                  {userAnswers[index] !== undefined && (
                    <Text 
                      style={{ 
                        marginLeft: '16px',
                        color: userAnswers[index] === question.correctAnswer ? '#52c41a' : '#f5222d'
                      }}
                    >
                      {userAnswers[index] === question.correctAnswer ? 'Correct!' : 'Incorrect'}
                    </Text>
                  )}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Explanation:</Text>
                  <Paragraph>{question.explanation}</Paragraph>
                </div>
              </div>
            )}
          </Card>
        ))}

        {/* 提交按钮 */}
        {questions.length > 0 && !submitted && (
          <Button 
            type="primary" 
            onClick={handleSubmit}
            disabled={Object.keys(userAnswers).length !== questions.length}
          >
            Submit Answers
          </Button>
        )}
      </div>
    );
  };

  return (
    <div>
      <Title level={3}>Multiple Choice Questions</Title>
      <Paragraph>
        Enter your English knowledge point and generate customized multiple-choice questions.
      </Paragraph>

      {/* 输入表单 */}
      <Card style={{ marginBottom: '24px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerate}
          initialValues={{ questionCount: 5 }}
        >
          <Form.Item
            name="knowledgePoint"
            label="Knowledge Point"
            rules={[{ required: true, message: 'Please enter your knowledge point' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Enter the English knowledge point you've learned (e.g., 'Present Perfect Tense is used to describe past actions with present consequences')"
            />
          </Form.Item>

          <Form.Item
            name="questionCount"
            label="Number of Questions"
            rules={[{ required: true, message: 'Please specify the number of questions' }]}
          >
            <InputNumber min={1} max={10} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SendOutlined />}
                loading={loading}
              >
                Generate Questions
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
              >
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 错误信息 */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 加载状态 */}
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: '12px' }}>Generating questions based on your knowledge point...</Paragraph>
        </div>
      ) : (
        renderQuestions()
      )}
    </div>
  );
};

export default MultipleChoicePage;
