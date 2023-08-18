import { PageContainer } from '@ant-design/pro-components';
import { Tabs, Affix, Space, Input, Button, Modal, Card } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useModel } from '@umijs/max';
import Cookies from 'js-cookie';

const { TabPane } = Tabs;

import Selection from './Selection/index';
import History from './History/index';
import Sale from './Sale/index';
import Profit from './Profit/index';
import SteamHistory from './SteamHistory/index';

import styles from './index.less';

const beforeunload = (e): void => {
  e.preventDefault();
  e.returnValue = '确定要离开当前页面吗？';
};

const Index: React.FC<unknown> = () => {
  const [session, setSession] = useState(localStorage.getItem('session') || '');
  const [csrfSession, setCsrfSession] = useState(
    localStorage.getItem('csrf_token') || '',
  );

  const { getBuffUserIdList, getCurrentBuffUserId, setCurrentBuffUserId } =
    useModel('commonModel');
  const [currentUserId, setCurrentUserId] = useState(getCurrentBuffUserId());

  const userIdList = getBuffUserIdList();

  const [open, setOpen] = useState(true);

  const changeBuffUserId = (value) => {
    setCurrentUserId(value);
    setCurrentBuffUserId(value);
    setOpen(false);
  };

  useEffect(() => {
    window.addEventListener('beforeunload', beforeunload);
    return () => {
      window.removeEventListener('beforeunload', beforeunload);
    };
  }, []);
  return (
    <div className={styles.pageIndexWrapper}>
      <Affix style={{ position: 'absolute', top: 5, right: 100 }}>
        <Button
          type="primary"
          icon={<UserOutlined />}
          onClick={() => setOpen(true)}
        >{`账户${
          userIdList.indexOf(currentUserId) + 1
        }：${currentUserId}`}</Button>
      </Affix>
      <Space style={{ marginBottom: '12px' }}>
        <Space.Compact>
          <Input
            placeholder="buff session"
            style={{ width: '450px' }}
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
              localStorage.setItem('session', session);
              localStorage.setItem('csrf_token', csrfSession);
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
      <Modal
        title="请选择Buff用户"
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
      >
        <Space style={{ margin: '18px 0px' }}>
          {userIdList.map((item, index) => {
            return (
              <Card
                key={item}
                className={
                  currentUserId === item
                    ? 'card-item-checked'
                    : 'card-item-normal'
                }
                title={`账户${index + 1}`}
                onClick={() => changeBuffUserId(item)}
              >
                {item}
              </Card>
            );
          })}
        </Space>
      </Modal>
    </div>
  );
};

export default Index;
