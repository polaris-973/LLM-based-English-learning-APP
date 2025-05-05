import React, { useState } from 'react';
import { Card, Input, Button, Typography, Form, Space, Spin, Divider, Alert, Tag } from 'antd';
import { SendOutlined, ReloadOutlined, CheckOutlined } from '@ant-design/icons';
import { generateGapFillExercise } from '../services/alibabaLLM';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const GapFillPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [exercise, setExercise] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setExercise(null);
      setUserAnswers({});
      setSubmitted(false);

      const { knowledgePoint } = values;
      
      // Call the LLM service to generate gap fill exercise
      const generatedExercise = await generateGapFillExercise(knowledgePoint);
      
      setExercise(generatedExercise);
      
      // Initialize user answers with empty strings
      const initialAnswers = {};
      generatedExercise.gaps.forEach((_, index) => {
        initialAnswers[index] = '';
      });
      setUserAnswers(initialAnswers);
      
    } catch (err) {
      console.error('Error generating gap fill exercise:', err);
      setError(err.message || 'Failed to generate exercise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (gapIndex, value) => {
    setUserAnswers({
      ...userAnswers,
      [gapIndex]: value
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    form.resetFields();
    setExercise(null);
    setUserAnswers({});
    setSubmitted(false);
    setError(null);
  };

  const renderGapFillExercise = () => {
    if (!exercise) return null;

    // 渲染带有空格的文本
    const renderText = () => {
      // 将文本按照空格分割成段落
      const textParts = exercise.text.split('_____');
      const elements = [];

      // 遍历所有部分，在每个部分之间插入输入框
      textParts.forEach((part, index) => {
        // 添加文本部分
        elements.push(<span key={`text-${index}`}>{part}</span>);
        
        // 如果不是最后一个部分，添加输入框
        if (index < textParts.length - 1) {
          const gapIndex = index;
          elements.push(
            <span key={`gap-${gapIndex}`} className="gap-container">
              <Input
                className="gap-input"
                value={userAnswers[gapIndex] || ''}
                onChange={(e) => handleAnswerChange(gapIndex, e.target.value)}
                disabled={submitted}
                size="middle"
                style={{ width: '120px', margin: '0 4px', borderBottom: '2px solid #1890ff' }}
              />
              {submitted && (
                <span className="gap-answer">
                  {userAnswers[gapIndex]?.toLowerCase() === exercise.gaps[gapIndex]?.answer.toLowerCase() ? (
                    <Tag color="success" style={{ marginLeft: '4px' }}>
                      <CheckOutlined /> 正确
                    </Tag>
                  ) : (
                    <Tag color="error" style={{ marginLeft: '4px' }}>
                      正确答案: {exercise.gaps[gapIndex]?.answer}
                    </Tag>
                  )}
                </span>
              )}
            </span>
          );
        }
      });

      return (
        <div className="gap-fill-text" style={{ fontSize: '16px', lineHeight: '2', marginBottom: '20px' }}>
          {elements}
        </div>
      );
    };

    return (
      <div className="exercise-container">
        <Title level={4}>Gap Fill Exercise</Title>
        
        <Card className="app-card">
          <div className="gap-fill-container">
            {renderText()}
          </div>

          {!submitted ? (
            <Button 
              type="primary" 
              onClick={handleSubmit}
              className="mt-3"
            >
              Check Answers
            </Button>
          ) : (
            <div className="explanation-section mt-3">
              <Title level={5}>Explanation</Title>
              <Paragraph>{exercise.explanation}</Paragraph>
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div>
      <Title level={3}>Gap Fill Exercise</Title>
      <Paragraph>
        Enter your English knowledge point and generate a customized gap fill exercise.
      </Paragraph>

      <Card className="app-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerate}
        >
          <Form.Item
            name="knowledgePoint"
            label="Knowledge Point"
            rules={[{ required: true, message: 'Please enter your knowledge point' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Enter the English knowledge point you've learned (e.g., 'Modal verbs like can, could, may, might are used to express possibility, ability, or permission')"
              className="knowledge-input"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SendOutlined />}
                loading={loading}
              >
                Generate Exercise
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

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mt-3"
        />
      )}

      {loading ? (
        <div className="text-center mt-3">
          <Spin size="large" />
          <Paragraph className="mt-2">Generating gap fill exercise based on your knowledge point...</Paragraph>
        </div>
      ) : (
        renderGapFillExercise()
      )}
    </div>
  );
};

export default GapFillPage;
