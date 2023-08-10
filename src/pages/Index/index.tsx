import { PageContainer } from '@ant-design/pro-components';
import { Tabs, Radio, Space, Input, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from '@umijs/max';
import Cookies from 'js-cookie';

const { TabPane } = Tabs;

import Selection from './Selection/index';
import History from './History/index';
import Sale from './Sale/index';
import Profit from './Profit/index';
import SteamHistory from './SteamHistory/index';

const beforeunload = (e): void => {
  e.preventDefault();
  e.returnValue = '确定要离开当前页面吗？';
};

const Index: React.FC<unknown> = () => {
  const [session, setSession] = useState(Cookies.get('session'));
  const [csrfSession, setCsrfSession] = useState(Cookies.get('csrf_token'));

  const { getBuffUserIdList, getCurrentBuffUserId, setCurrentBuffUserId } =
    useModel('commonModel');
  const [currentUserId, setCurrentUserId] = useState(getCurrentBuffUserId());

  const userIdList = getBuffUserIdList();

  const changeBuffUserId = (e) => {
    const id = e.target.value;
    setCurrentUserId(id);
    setCurrentBuffUserId(id);
  };

  useEffect(() => {
    window.addEventListener('beforeunload', beforeunload);
    return () => {
      window.removeEventListener('beforeunload', beforeunload);
    };
  }, []);
  return (
    <>
      <Space style={{ marginBottom: '12px' }}>
        <Radio.Group
          options={userIdList.map((item) => ({ label: item, value: item }))}
          value={currentUserId}
          onChange={changeBuffUserId}
          optionType="button"
          buttonStyle="solid"
        ></Radio.Group>
        <Space.Compact>
          <Input
            placeholder="buff session"
            style={{ width: '350px' }}
            value={session}
            onChange={(e) => {
              setSession(e.target.value);
            }}
          />
          <Input
            placeholder="buff csrf_token"
            style={{ width: '400px' }}
            value={csrfSession}
            onChange={(e) => {
              setCsrfSession(e.target.value);
            }}
          />
          <Button
            type="primary"
            onClick={() => {
              Cookies.set('session', session);
              Cookies.set('csrf_token', csrfSession);
            }}
          >
            更新Cookie
          </Button>
        </Space.Compact>
      </Space>
      <Tabs type="card" style={{ background: '#fff', padding: '12px' }}>
        <TabPane tab="选品" key="1">
          <Selection />
        </TabPane>
        <TabPane tab="本地库存" key="2">
          <History />
        </TabPane>
        <TabPane tab="上架" key="3">
          <Sale />
        </TabPane>
        {/* <TabPane tab="steam库存历史">
          <SteamHistory />
        </TabPane> */}
        {/* <TabPane tab="出售记录" key="4">
        <Profit />
      </TabPane> */}
      </Tabs>
    </>
  );
};

export default Index;
