import React from 'react';
import { Row, Col, Card, Button, Typography } from 'antd';
import { FormOutlined, FileTextOutlined, BulbOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="text-center mb-3">
        <Title level={2}>Welcome to English Learning App</Title>
        <Paragraph>
          Enhance your English learning experience with AI-powered exercises based on your knowledge points
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card 
            className="feature-card" 
            hoverable
            onClick={() => navigate('/multiple-choice')}
          >
            <div className="text-center">
              <FormOutlined className="feature-icon" style={{ color: '#1890ff' }} />
              <Title level={4}>Multiple Choice Questions</Title>
              <Paragraph>
                Generate customized multiple-choice questions based on your knowledge points.
                Practice in natural contexts that reinforce your understanding.
              </Paragraph>
              <Button type="primary" onClick={() => navigate('/multiple-choice')}>
                Start Practice
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            className="feature-card" 
            hoverable
            onClick={() => navigate('/gap-fill')}
          >
            <div className="text-center">
              <FileTextOutlined className="feature-icon" style={{ color: '#52c41a' }} />
              <Title level={4}>Gap Fill Exercises</Title>
              <Paragraph>
                Practice with contextual gap-fill exercises that are tailored to your learning needs.
                Fill in the blanks with appropriate words or phrases.
              </Paragraph>
              <Button type="primary" onClick={() => navigate('/gap-fill')}>
                Start Practice
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="app-card mt-3">
        <div className="text-center">
          <BulbOutlined className="feature-icon" style={{ color: '#faad14' }} />
          <Title level={4}>How It Works</Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card className="p-2">
                <Title level={5}>1. Input Knowledge</Title>
                <Paragraph>
                  Enter the English knowledge points you've learned using natural language
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="p-2">
                <Title level={5}>2. Generate Exercises</Title>
                <Paragraph>
                  Our AI will create customized exercises based on your input
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="p-2">
                <Title level={5}>3. Practice & Learn</Title>
                <Paragraph>
                  Complete the exercises and review detailed explanations
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
};

export default HomePage;
