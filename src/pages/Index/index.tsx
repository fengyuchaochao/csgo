import { PageContainer } from '@ant-design/pro-components';
import { Tabs, Radio, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from '@umijs/max';

const { TabPane } = Tabs;

import Selection from './Selection/index';
import History from './History/index';
import Sale from './Sale/index';
import Profit from './Profit/index';

const beforeunload = (e): void => {
  e.preventDefault();
  e.returnValue = '确定要离开当前页面吗？';
};

const Index: React.FC<unknown> = () => {
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
      <Tabs
        type="card"
        tabBarExtraContent={
          <Space>
            <span>Buff账户：</span>
            <Radio.Group
              options={userIdList.map((item) => ({ label: item, value: item }))}
              value={currentUserId}
              onChange={changeBuffUserId}
              optionType="button"
              buttonStyle="solid"
            ></Radio.Group>
          </Space>
        }
      >
        <TabPane tab="选品" key="1">
          <Selection />
        </TabPane>
        <TabPane tab="本地库存" key="2">
          <History />
        </TabPane>
        <TabPane tab="上架" key="3">
          <Sale />
        </TabPane>
        {/* <TabPane tab="出售记录" key="4">
        <Profit />
      </TabPane> */}
      </Tabs>
    </>
  );
};

export default Index;
