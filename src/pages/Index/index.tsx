import {
    PageContainer,
  } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import React, { useEffect, useState } from 'react';

const { TabPane } = Tabs;

import Selection from './Selection/index';
import History from './History/index';
  

  
  const beforeunload = (e): void => {
      e.preventDefault();
      e.returnValue = '确定要离开当前页面吗？';
  }
  
  const Index: React.FC<unknown> = () => {
    
    useEffect(() => {
      window.addEventListener('beforeunload', beforeunload);
      return () => {
        window.removeEventListener('beforeunload', beforeunload)
      }
    }, [])
    return (
      <Tabs>
        <TabPane tab="选品" key="1">
          <Selection />
        </TabPane>
        <TabPane tab="库存" key="2">
          <History/>
        </TabPane>
      </Tabs>
    );
  };
  
  export default Index;
  