import React from 'react';
import { Layout, Menu } from 'antd';
import { BookOutlined, FormOutlined, HomeOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';

const { Header } = Layout;

const AppHeader = () => {
  const location = useLocation();
  
  // Determine which menu item should be active based on current path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return ['home'];
    if (path === '/multiple-choice') return ['multiple-choice'];
    if (path === '/gap-fill') return ['gap-fill'];
    return ['home'];
  };

  return (
    <Header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <BookOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '16px' }} />
        <span style={{ fontSize: '18px', fontWeight: 'bold', marginRight: '24px' }}>
          English Learning App
        </span>
        <Menu
          mode="horizontal"
          selectedKeys={getSelectedKey()}
          className="app-menu"
        >
          <Menu.Item key="home" icon={<HomeOutlined />}>
            <Link to="/">Home</Link>
          </Menu.Item>
          <Menu.Item key="multiple-choice" icon={<FormOutlined />}>
            <Link to="/multiple-choice">Multiple Choice</Link>
          </Menu.Item>
          <Menu.Item key="gap-fill" icon={<FormOutlined />}>
            <Link to="/gap-fill">Gap Fill</Link>
          </Menu.Item>
        </Menu>
      </div>
    </Header>
  );
};

export default AppHeader;
