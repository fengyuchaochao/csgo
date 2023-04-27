import {
    PageContainer,
  } from '@ant-design/pro-components';
import { Modal, Form, Space, Table, Button, InputNumber, message, Input, Image, Popconfirm } from 'antd';
import React, { useEffect, useState, computed } from 'react';
import { CopyOutlined, CloseCircleFilled, CheckCircleFilled} from '@ant-design/icons'
import copy from 'copy-to-clipboard';
import moment from 'moment';


const copyName = (text) => { 
  copy(text);
  message.success('复制成功');
}
const History: React.FC<unknown> = () => {

  const [keyword, setKeyword] = useState('');
  const [goodList, setGoodList] = useState([]);
  const [currentGood, setCurrentGood] = useState(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const initSteamBuyForm = {
      steamBuyPrice: undefined,
      steamBuyCount: undefined,
  }

  // 根据成交记录获取订单列表
  const getOrderListByGoodId = async (goodId, sortBy) => {
    message.loading('获取饰品的Buff订单列表...');
    const game = 'csgo';
    const pageNum = 1;
    const url = sortBy ? `/api/market/goods/sell_order?game=${game}&goods_id=${goodId}&sort_by=${sortBy}&page_num=${pageNum}`
        : `/api/market/goods/sell_order?game=${game}&goods_id=${goodId}&page_num=${pageNum}`;
    const { data } = await fetch(url)
        .then(response => response.json());
    message.destroy();
    return data;
  }
  
  const getLatestBuffData = async (record) => {
    // 根据成交记录
    const { items: orderList } = await getOrderListByGoodId(record.goodId);
    record.orderList = orderList;
    // 获取buff订单的当前最低价格
    const { items: orderList2 } = await getOrderListByGoodId(record.goodId, 'default');
    record.lowestPriceBuffOrder = orderList2[0];

    setGoodList([...goodList]);
  }

  const toUpdateGood = (record) => {
    setCurrentGood(record);
    form.setFieldsValue({
      steamBuyPrice: record.steamBuyPrice,
      steamBuyCount: record.steamBuyCount,
    });
    setOpen(true);
  }

  const updateGood = async () => {
    const formData = form.getFieldValue();
    const params = {
      id: currentGood._id,
      steamBuyPrice: formData.steamBuyPrice,
      steamBuyCount: formData.steamBuyCount,
    };
    await fetch('/local/api/good/update', {
      method: 'post',
      body: JSON.stringify(params),
      headers: {
          'Content-Type':'application/json',
      }
  }).then(response => response.json()).then(data => {
      message.success('更新成功');
      setOpen(false);
      getHistoryList(keyword);
    
  });
  } 
  const deleteGood = async (record) => {
    const url = `/local/api/good/delete?id=${record._id}`;
    await fetch(url)
    getHistoryList(keyword);
  }
  const hideModal = () => {
    setOpen(false);
    form.resetFields();
  }

  const columns:any[] = [
    {
      title: '索引',
      width: 50,
      align: 'center',
      fixed: 'left',
      render: (_, record, index) => {
          return index + 1;
      }
    },
    // {
    //   title: '饰品ID',
    //   dataIndex: 'goodId',
    //   key: 'goodId',
    //   width: 80,
    // },
    {
      title: '图像',
      width: 80,
      fixed: 'left',
      render: (_, record) => {
        return <Image width={60} src={record?.rawData?.goodInfo?.icon_url} />
      }
    },
    {
      title: '饰品名',
      dataIndex: 'goodName',
      key: 'goodName',
      fixed: 'left',
      width: 200,
      render: (_, record) => {
          return <span style={{cursor: 'pointer'}} onClick={() => copyName(record.goodName)}>{record.goodName} <CopyOutlined style={{color: '#1776FF'}} /></span>;
      }
    },
    {
      title: '单件成本',
      width: 100,
      render: (_, record) => {
        return <p>
          <span>{ (record.steamBuyPrice * 6).toFixed(2) }</span>
          <span>（{ record.steamBuyPrice}$）</span>
        </p>
      }
    },
    {
      title: '单件利润',
      dataIndex: '',
      key: '',
      width: 100,
      render: (_, record) => {
        if (!record?.lowestPriceBuffOrder) return;
        const steamBuyPrice = (record.steamBuyPrice * 6).toFixed(2);
        const lowestPriceBuffOrder = record?.lowestPriceBuffOrder?.price;
        const rateValue = (lowestPriceBuffOrder - +steamBuyPrice).toFixed(2);
        const rate = (+rateValue / +steamBuyPrice).toFixed(2);
        return <p>{rateValue}（{(+rate * 100).toFixed(2)}%）</p>
      }
    },
    {
      title: '购买数量',
      dataIndex: 'steamBuyCount',
      key: 'steamBuyCount',
      width: 100,
    },
    {
      title: 'buff在售价格（最低）',
      key: 'lowestPriceBuffOrder',
      width: 180,
      render: (_, record) => { 
        const price = record?.lowestPriceBuffOrder?.price;
        return price ? `${price}（${(price / 6.9).toFixed(2)}$）` : '';
      }
    },
    {
      title: 'buff交易记录',
      width: 180,
      render: (_, record) => {
        return <p>
          {(record.orderList || []).map((item, index) => {
            return <span key={index}>{moment(item.updated_at * 1000).format('YYYY-MM-DD 00:00:00')}<br/></span>
          }) }
        </p>
      }
    },
    {
      title: '推荐卖出价格',
      width: 180,
      render: (_, record) => {
        const price = Number((record.steamBuyPrice * 6).toFixed(2));

        return <p>
          <span>5%涨幅：{ (price * 1.05).toFixed(2) }<br/></span>
          <span>10%涨幅：{ (price * 1.1).toFixed(2) }<br/></span>
          <span>20%涨幅：{ (price * 1.2).toFixed(2)  }<br/></span>
          <span>30%涨幅：{ (price * 1.3).toFixed(2) }<br/></span>
          <span>40%涨幅：{ (price * 1.4).toFixed(2) }<br/></span>
          <span>50%涨幅：{ (price * 1.5).toFixed(2) }<br/></span>
          <span>70%涨幅：{ (price * 1.7).toFixed(2) }<br/></span>
          <span>100%涨幅：{ (price * 2).toFixed(2) }<br/></span>
        </p>
      }
    },
    {
      title: '创建时间',
      key: 'createTime',
      dataIndex: 'createTime',
      width: 100,
      render: (_, record) => {
        return moment(+record.createTime).format('YYYY-MM-DD HH:mm:ss');
      }
    },
    {
      title: '更新时间',
      key: 'updateTime',
      dataIndex: 'updateTime',
      width: 100,
      render: (_, record) => {
        return moment(+record.updateTime).format('YYYY-MM-DD HH:mm:ss')
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
          const buffUrl = `https://buff.163.com/goods/${record.goodId}?from=market#tab=selling`;
          const steamUrl = `https://steamcommunity.com/market/listings/${record?.rawData?.goodInfo?.appid}/${record?.rawData?.goodInfo?.market_hash_name}`;
                
          return (
            <Space size="middle" block={ true} direction="vertical">
                <Button size="small" type="primary" onClick={() => getLatestBuffData(record)}>Buff实时数据</Button>
                <Button size="small" type="link" target="_blank" disabled={!record.goodId} href={buffUrl}>Buff详情</Button>
                <Button size="small" type="link" target="_blank" disabled={!record.goodId} href={steamUrl}>Steam详情</Button>
                <Button size="small" type="primary" disabled={!record.goodId} onClick={() => toUpdateGood(record)}>更新成本价格</Button>
                <Popconfirm title="提示" description="确定要删除吗？" onConfirm={() => deleteGood(record) }>
                  <Button size="small" danger>删除</Button>
                </Popconfirm>
              </Space>
          )
      }
    },

  ]

  const [rate, setRate] = useState('');
  const [ratePercent, setRatePercent] = useState('');

  const changeRate = () => {
    const formData = form.getFieldValue();
    if (!currentGood?.lowestPriceBuffOrder) return;
    const steamBuyPrice = (formData.steamBuyPrice * 6).toFixed(2);
    console.log(123123, steamBuyPrice);
    const lowestPriceBuffOrder = currentGood?.lowestPriceBuffOrder?.price;
    const rateValue = (lowestPriceBuffOrder - +steamBuyPrice).toFixed(2);
    const ratePercent = (+rateValue / +steamBuyPrice).toFixed(2);
    setRate(rateValue);
    setRatePercent(`${(ratePercent * 100).toFixed(2)}%`);
  }
  
  const getHistoryList = async (keyword) => {
    let url = `/local/api/good/list`;
    if (keyword) {
      url = url + `?goodName=${keyword}`;
    }
    await fetch(url, {
      method: 'get',
    }).then(response => response.json()).then(data => {
      const { list = [] } = data;
      setGoodList(list)
    });
  }
  const search = async (e) => {
    const keyword = e.target.value;
    setKeyword(keyword);
    getHistoryList(keyword);
  }

  useEffect(() => {
    getHistoryList();
  }, []);

  

  return <>
    <Modal title="购买当前饰品" open={open} onOk={updateGood} onCancel={() => hideModal()}>
      <Form form={form} initialValues={initSteamBuyForm }>
          <Form.Item label="购买单价" name="steamBuyPrice">
          <InputNumber addonBefore="$" onChange={changeRate} />
        </Form.Item>
        <Form.Item label="利润">
          {rate}（{ratePercent}）
        </Form.Item>
          <Form.Item label="购买数量" name="steamBuyCount">
              <InputNumber/>
          </Form.Item>
      </Form>
    </Modal>
    <Space>
      <Input placeholder="输入饰品名" allowClear style={{ width: 700, marginBottom: 16 }} size="large" onChange={search} />
    </Space>
    <Table size="small" rowKey="_id" columns={columns} dataSource={goodList} scroll={{ x: 1300 }}/>
  </>
};



export default History;