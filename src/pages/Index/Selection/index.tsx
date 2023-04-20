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
  const [resultTotalCount, setResultTotalCount] = useState(0);
  const onSearch = (data) => {
    const { searchParams, resultList, resultTotalCount } = data;
    setResultList(resultList);
    setSearchParams(searchParams);
    setResultTotalCount(resultTotalCount);
  }
  
  return (
    <>
      <div>
        <Search onSearch={onSearch} />
        <Result searchParams={searchParams} resultList={resultList} setResultList={setResultList} resultTotalCount={resultTotalCount} />
      </div>
    </>
    
  );
};

export default HomeIndex;
