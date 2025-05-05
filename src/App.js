import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import AppHeader from './components/AppHeader';
import HomePage from './pages/HomePage';
import MultipleChoicePage from './pages/MultipleChoicePage';
import GapFillPage from './pages/GapFillPage';
import './styles/App.css';

const { Content, Footer } = Layout;

function App() {
  return (
    <Layout className="app-layout">
      <AppHeader />
      <Content className="app-content">
        <div className="content-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/multiple-choice" element={<MultipleChoicePage />} />
            <Route path="/gap-fill" element={<GapFillPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Content>
      <Footer className="app-footer">
        English Learning App ©{new Date().getFullYear()} - Powered by Alibaba LLM
      </Footer>
    </Layout>
  );
}

export default App;
