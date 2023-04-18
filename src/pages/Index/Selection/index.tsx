import {
  PageContainer,
} from '@ant-design/pro-components';
import { Button, Divider, Drawer, message } from 'antd';
import React, { useEffect, useState } from 'react';

import Search from './search';
import Result from './result';


const HomeIndex: React.FC<unknown> = () => {
  const [searchParams, setSearchParams] = useState({});
  const [resultList, setResultList] = useState([]);
  const onSearch = (data) => {
    const { searchParams, resultList } = data;
    setResultList(resultList);
    setSearchParams(searchParams);
  }
  
  return (
    <>
      <div>
        <Search onSearch={onSearch} />
        <Result searchParams={searchParams} resultList={resultList} setResultList={setResultList} />
      </div>
    </>
    
  );
};

export default HomeIndex;
