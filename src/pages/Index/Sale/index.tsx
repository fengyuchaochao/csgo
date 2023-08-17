import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Space,
  Table,
  Button,
  Input,
  Image,
  message,
  Tag,
  Typography,
  Select,
  InputNumber,
  Badge,
  Statistic,
  Divider,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useModel } from '@umijs/max';
import copy from 'copy-to-clipboard';
import pLimit from 'p-limit';
const limit = pLimit(3);

const copyName = (text) => {
  copy(text);
  message.success('复制成功');
};
const getCookie = (name) => {
  var cookies = document.cookie.split(';');
  cookies = cookies.map((item) => item.split('='));
  const cookie = cookies.find((item) => item[0].trim() === name);
  return cookie[1];
};

const priceRateList = [0.01, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3];

const stateList = [
  {
    label: '全部',
    value: '',
  },
  {
    label: '可交易',
    value: 'tradable',
  },
  {
    label: '可出售',
    value: 'cansell',
  },
];

// 根据利润率显示不同的颜色
const getSummaryColor = (rate) => {
  if (!rate) return '';
  if (rate >= 15) {
    return '#52c41a';
  } else if (rate < 15 && rate >= 0) {
    return '';
  } else if (rate < 0) {
    return '#cf1322';
  }
};

const Sale: React.FC<unknown> = () => {
  const columns: any[] = [
    {
      title: '索引',
      width: 50,
      align: 'center',
      render: (_, record, index) => {
        return index + 1;
      },
    },
    // {
    //   title: '饰品ID',
    //   dataIndex: 'goodId',
    //   key: 'goodId',
    //   width: 80,
    // },
    {
      title: '图像',
      width: 120,
      render: (_, record) => {
        return <Image width={80} src={record?.icon_url} />;
      },
    },
    {
      title: '饰品名',
      dataIndex: 'goodName',
      key: 'goodName',
      render: (_, record) => {
        return (
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => copyName(record.name)}
          >
            {record.name} <CopyOutlined style={{ color: '#1776FF' }} />
          </span>
        );
      },
    },
    {
      title: '单价成本',
      width: 150,
      render: (_, record) => {
        return (
          record.steamBuyPrice && (
            <Space direction="vertical" size="small">
              <span>美元：{record.steamBuyPrice}</span>
              <span>
                人民币：
                <b>{(record.steamBuyPrice * record?.cardRate).toFixed(2)} </b>
              </span>
              <span>卡价：{record?.cardRate}</span>
            </Space>
          )
        );
      },
    },
    {
      title: 'buff在售最低价格',
      width: 150,
      render: (_, record) => {
        const lowestBuffPrice = record?.lowestPriceBuffOrder?.price;
        const price = record.steamBuyPrice * record?.cardRate; // 成本
        const fee = record.fee; //手续费

        const ratePrice = (lowestBuffPrice - price - fee).toFixed(2);
        const ratePercent = ((+ratePrice / price) * 100).toFixed(2);
        if (!lowestBuffPrice) return;
        return (
          <Space direction="vertical" size="small">
            <span>
              buff最低价：<b>{lowestBuffPrice}</b>
            </span>
            <span>手续费：{fee}</span>
            <span>
              利润：<b>{ratePrice}</b>
            </span>
            <Typography.Text style={{ color: getSummaryColor(ratePercent) }}>
              利润率：<b>{ratePercent} %</b>
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: '自己当前在售价格',
      width: 150,
      render: (_, record) => {
        const castPrice = record?.steamBuyPrice * record?.cardRate;
        const curPrice = record?.myOrder?.price;
        const curFee = record?.myOrderFee;

        const ratePrice = (curPrice - castPrice - curFee).toFixed(2);
        const ratePercent = (
          ((curPrice - castPrice - curFee) / castPrice) *
          100
        ).toFixed(2);
        if (!curPrice) return;
        return (
          <Space direction="vertical" size="small">
            <span>
              我的价格：<b>{curPrice}</b>
            </span>
            <span>手续费：{curFee}</span>
            <span>
              利润：<b>{ratePrice}</b>
            </span>
            <Typography.Text style={{ color: getSummaryColor(ratePercent) }}>
              利润率：<b>{ratePercent}%</b>
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: '状态',
      render: (_, record) => {
        return (
          <Space>
            <Badge color="geekblue" text={record.state_toast} />
            <span>
              {dayjs(record?.tradable_time * 1000).format(
                'YYYY-MM-DD HH:mm:ss',
              )}
            </span>
          </Space>
        );
      },
    },
    {
      title: '排名',
      render: (_, record) => {
        return (
          <Tag
            color={record.myOrderIndex <= 5 ? 'success' : 'default'}
            style={{ fontSize: '16px', fontWeight: 'bold' }}
          >
            {record.myOrderIndex}/{record.orderTotalCount}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record, index) => {
        const buffUrl = `https://buff.163.com/goods/${record.goods_id}?from=market#tab=selling`;
        return (
          <Space size="middle">
            <Button
              size="small"
              type="link"
              target="_blank"
              disabled={!record.goods_id}
              href={buffUrl}
            >
              Buff详情
            </Button>
            <Button size="small" type="primary" onClick={() => refresh(record)}>
              获取实时排名
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => updatePrice(record)}
            >
              修改价格
            </Button>
          </Space>
        );
      },
    },
  ];

  const { getCurrentBuffUserId } = useModel('commonModel');
  const [goodList, setGoodList] = useState([]);
  const goodListRef = useRef();
  const requestPool = [];

  // 搜索
  const [searchFormData, setSearchFormData] = useState({
    game: 'csgo',
    page_num: 1,
    page_size: 1000,
    search: '',
    state: '',
    force: 0,
    userId: getCurrentBuffUserId(),
    rate: 0.05,
  });

  // 总结数据
  const [showSummaryData, setShowSummaryData] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryStartIndex, setSummaryStartIndex] = useState(1);
  const [summaryEndIndex, setSummaryEndIndex] = useState(1);

  const [batchStartIndex, setBatchStartIndex] = useState(1);
  const [batchEndIndex, setBatchEndIndex] = useState(1);

  // 获取最终统计数据
  const getSummaryData = () => {
    const filterGoodList = goodList.slice(
      summaryStartIndex - 1,
      summaryEndIndex,
    );
    // 总成本
    const totalPrice = filterGoodList.reduce((total, current) => {
      const price = +(current.steamBuyPrice * current.cardRate).toFixed(2);
      return total + price;
    }, 0);

    // buff总价格
    const totalBuffPrice = filterGoodList.reduce((total, current) => {
      const lowestBuffPrice = current?.lowestPriceBuffOrder?.price;
      return total + +lowestBuffPrice;
    }, 0);

    // buff总利润
    const totalBuffProfit = filterGoodList.reduce((total, current) => {
      const lowestBuffPrice = current?.lowestPriceBuffOrder?.price;
      const price = current.steamBuyPrice * current.cardRate;
      const ratePrice = (lowestBuffPrice - price).toFixed(2);

      return total + +ratePrice;
    }, 0);

    // buff总利润率
    const totalBuffProfitRate = (totalBuffProfit / totalPrice) * 100;

    // 在售总价格
    const totalMyPrice = filterGoodList.reduce((total, current) => {
      const curPrice = current?.myOrder?.price;
      return total + +curPrice;
    }, 0);

    // 在售总利润
    const totalMyProfit = totalMyPrice - totalPrice;

    // 在售总利润率
    const totalMyProfitRate = (totalMyProfit / totalPrice) * 100;

    setShowSummaryData(true);
    setSummaryData({
      totalPrice,
      totalBuffPrice,
      totalBuffProfit,
      totalBuffProfitRate,
      totalMyPrice,
      totalMyProfit,
      totalMyProfitRate,
    });
  };

  // 获取单价饰品的成本
  const getCostPriceByGoodId = async (goodId, item) => {
    const url = `/local/api/good/detail?goodId=${goodId}`;
    const { data } = await fetch(url).then((response) => response.json());
    item.steamBuyPrice = data?.steamBuyPrice;
    item.cardRate = data?.cardRate || 6;

    setGoodList([...goodListRef.current]);
  };

  // 获取在售最低价格，排名等信息
  const getBuffRank = async (goodId, item) => {
    const game = 'csgo';
    const pageNum = 1;
    const pageSize = 500; // 目前最多获取500
    const sortBy = 'default';
    const url = `/api/market/goods/sell_order?game=${game}&goods_id=${goodId}&sort_by=${sortBy}&page_num=${pageNum}&page_size=${pageSize}`;
    const { data } = await fetch(url).then((response) => response.json());
    message.destroy();
    const orderList = data?.items || [];

    const lowestPriceBuffOrder = orderList[0];
    item.lowestPriceBuffOrder = lowestPriceBuffOrder;

    const myOrderIndex = orderList.findIndex(
      (order) => order.user_id === searchFormData.userId,
      //&& order.id === item.sell_order_id,
    );

    item.myOrderList = [...orderList];
    item.myOrderIndex = myOrderIndex + 1;
    item.myOrder = orderList[myOrderIndex];
    item.orderTotalCount = orderList.length;

    setGoodList([...goodListRef.current]);
  };

  // 获取上架的饰品列表
  const getGoodListBySale = async () => {
    message.loading('获取buff库存列表...');
    const { game, page_num, page_size, search, state, force } = searchFormData;
    const url = `/api/market/steam_inventory?game=${game}&page_num=${page_num}&page_size=${page_size}&search=${search}&state=${state}&force=${force}`;
    const { data } = await fetch(url).then((response) => response.json());
    message.destroy();
    const goodList = (data?.items || []).map((item, index) => {
      item.index = index;
      return item;
    });
    setGoodList(goodList);
    setSummaryEndIndex(goodList.length);
    setBatchEndIndex(goodList.length);
  };

  const getBatchBuffRank = async () => {
    // 控制并发数量，每隔5秒，发送4个请求
    goodList.slice(batchStartIndex - 1, batchEndIndex).forEach((item) => {
      requestPool.push(
        limit(() => {
          return new Promise(async (resolve) => {
            await getCostPriceByGoodId(item.goods_id, item);
            await getBuffRank(item.goods_id, item);
            setTimeout(() => {
              resolve();
            }, 5000);
          });
        }),
      );
    });
    await Promise.all(requestPool);
  };

  const updatePrice = async (record) => {
    // 1. 如果当前已经排在了第一位，那就不需要再更新价格了。如果不是第一位，并且前面几位都是自己的话，也不需要更新价格
    // 2. 如果不是排在第一位，这时，就按当前最低价格-0.01去计算利润，
    // 只要利润大于5%，我们就更新价格至当前最低价格再减0.01.
    // 如果利润小于5%，我们就按照成本，以及5%的利润去计算一个最新的价格，挂在上面。
    if (!record?.steamBuyPrice) {
      message.warning('没有成本价，无法直接更新价格，您可以手动计算，手动更改');
      return;
    }
    // 如果当前已经排在了第一位，那就不需要再更新价格了。
    if (record.myOrderIndex <= 1) {
      message.warning('目前已经是排名第一位啦，无需再改价格');
      return;
    }
    // 如果不是第一位，并且前面几位都是自己的话，也不需要更新价格
    const flag = (record?.myOrderList || [])
      .slice(0, record.myOrderIndex)
      .every((item) => item.user_id === searchFormData.userId);
    if (flag) {
      message.warning('排在前面的都是自己的，无需再改价格');
      return;
    }

    const castPrice = record?.steamBuyPrice * record?.cardRate;
    const lowestPrice = record?.lowestPriceBuffOrder?.price;

    const rate = Number(lowestPrice - castPrice) / castPrice;

    let newPrice;
    if (rate >= Number(searchFormData.rate)) {
      newPrice = Math.floor((lowestPrice - 0.01) * 100) / 100;
    } else {
      newPrice =
        Math.floor(castPrice * (1 + Number(searchFormData.rate)) * 100) / 100;
    }

    // 获取手续费
    message.loading('获取手续中...');
    const params = {
      game: 'csgo',
      goods_ids: record.goods_id,
      is_change: 1,
      check_price: 1,
      prices: newPrice,
    };
    const { game, goods_ids, is_change, check_price, prices } = params;
    const url = `/api/market/batch/fee?game=${game}&goods_ids=${goods_ids}&is_change=${is_change}&check_price=${check_price}&prices=${prices}`;
    const data = await fetch(url).then((response) => response.json());

    const fee = data?.data?.total_fee || 0;
    message.destroy();

    message.loading('更新价格中...');
    const params2 = {
      game: 'csgo',
      sell_orders: [
        {
          goods_id: goods_ids,
          origin_price: record?.myOrder?.price,
          price: prices,
          income: prices - fee,
          sell_order_id: record?.sell_order_id,
          has_market_min_price: false,
          cdkey_id: '',
          desc: '',
        },
      ],
    };
    const url2 = `/api/market/sell_order/change`;

    const res2 = await fetch(url2, {
      method: 'post',
      body: JSON.stringify(params2),
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrf_token'),
      },
    }).then((response) => response.json());
    const msg = res2?.data[record?.sell_order_id];
    if (msg !== 'OK') {
      message.warning(msg);
    } else {
      message.destroy();
    }
  };

  // 获取手续费（buff最低价格对应的手续费）
  const getFeeByGoodId = async (goodId, item) => {
    const lowestBuffPrice = item?.lowestPriceBuffOrder?.price;
    message.loading('获取手续中...');
    const params = {
      game: 'csgo',
      goods_ids: goodId,
      is_change: 1,
      check_price: 1,
      prices: lowestBuffPrice,
    };
    const { game, goods_ids, is_change, check_price, prices } = params;
    const url = `/api/market/batch/fee?game=${game}&goods_ids=${goods_ids}&is_change=${is_change}&check_price=${check_price}&prices=${prices}`;
    const data = await fetch(url).then((response) => response.json());

    const fee = data?.data?.total_fee || 0;

    item.fee = fee;
    setGoodList([...goodListRef.current]);
  };

  // 获取手续费（自己价格对应的手续费）
  const getMyOrderFeeByGoodId = async (goodId, item) => {
    const price = item?.myOrder?.price;
    message.loading('获取手续中...');
    const params = {
      game: 'csgo',
      goods_ids: goodId,
      is_change: 1,
      check_price: 1,
      prices: price,
    };
    const { game, goods_ids, is_change, check_price, prices } = params;
    const url = `/api/market/batch/fee?game=${game}&goods_ids=${goods_ids}&is_change=${is_change}&check_price=${check_price}&prices=${prices}`;
    const data = await fetch(url).then((response) => response.json());

    const fee = data?.data?.total_fee || 0;

    item.myOrderFee = fee;
    setGoodList([...goodListRef.current]);
  };

  const refresh = async (record) => {
    message.loading('获取价格排名中...');
    await getCostPriceByGoodId(record.goods_id, record);
    await getBuffRank(record.goods_id, record);
    await getFeeByGoodId(record.goods_id, record);
    if (record?.myOrder) {
      await getMyOrderFeeByGoodId(record.goods_id, record);
    }

    message.destroy();
  };

  const changeState = (value) => {
    setSearchFormData({
      ...searchFormData,
      state: value,
    });
  };
  const changeKeyword = (e) => {
    setSearchFormData({
      ...searchFormData,
      search: e.target.value,
    });
  };
  const changePriceRate = (value) => {
    setSearchFormData({
      ...searchFormData,
      rate: value,
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      getGoodListBySale();
    }, 1000 * 60 * 10);
    return () => {
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    getGoodListBySale();
  }, []);

  useEffect(() => {
    goodListRef.current = goodList;
  }, [goodList]);

  return (
    <>
      <Space style={{ marginBottom: '12px' }}>
        <Space.Compact size="large">
          <Input
            value={searchFormData.search}
            placeholder="输入饰品名"
            allowClear
            style={{ width: 600 }}
            size="large"
            onChange={changeKeyword}
          />
          <Select
            size="large"
            style={{ width: '100px' }}
            defaultValue={searchFormData.state}
            options={stateList}
            onChange={changeState}
          ></Select>
          <Select
            size="large"
            style={{ width: '100px' }}
            defaultValue={searchFormData.rate}
            options={priceRateList.map((item) => ({
              value: item,
              label: item,
            }))}
            onChange={changePriceRate}
          ></Select>
          <Button type="primary" size="large" onClick={getGoodListBySale}>
            搜索
          </Button>
        </Space.Compact>
      </Space>

      <div style={{ marginBottom: '12px' }}>
        <Space>
          <Space.Compact>
            <InputNumber
              value={batchStartIndex}
              onChange={(value) => {
                setBatchStartIndex(value);
              }}
            />
            <InputNumber
              value={batchEndIndex}
              onChange={(value) => {
                setBatchEndIndex(value);
              }}
            />
            <Button type="primary" onClick={getBatchBuffRank}>
              批量获取实时排名
            </Button>
          </Space.Compact>

          <Space.Compact>
            <InputNumber
              value={summaryStartIndex}
              onChange={(value) => {
                setSummaryStartIndex(value);
              }}
            />
            <InputNumber
              value={summaryEndIndex}
              onChange={(value) => {
                setSummaryEndIndex(value);
              }}
            />
            <Button type="primary" size="large" onClick={getSummaryData}>
              统计
            </Button>
            <Button size="large" onClick={() => setShowSummaryData(false)}>
              隐藏
            </Button>
          </Space.Compact>
        </Space>
      </div>
      <div>
        {showSummaryData && (
          <Space size={32} style={{ marginBottom: '12px' }}>
            <Statistic
              title="总件数"
              value={summaryEndIndex - summaryStartIndex + 1}
            />
            <Statistic
              title="总成本"
              value={summaryData?.totalPrice || undefined}
              precision={2}
            />
            <Divider />
            <Statistic
              title="Buff总价格"
              value={summaryData?.totalBuffPrice || undefined}
              precision={2}
            />
            <Statistic
              title="Buff总利润"
              value={summaryData?.totalBuffProfit || undefined}
              precision={2}
              valueStyle={{
                color: getSummaryColor(summaryData?.totalBuffProfitRate),
              }}
            />
            <Statistic
              title="Buff总利润率"
              value={summaryData?.totalBuffProfitRate || undefined}
              precision={2}
              suffix="%"
              valueStyle={{
                color: getSummaryColor(summaryData?.totalBuffProfitRate),
              }}
            />
            <Divider />
            <Statistic
              title="在售总价格"
              value={summaryData?.totalMyPrice || undefined}
              precision={2}
            />
            <Statistic
              title="在售总利润"
              value={summaryData?.totalMyProfit || undefined}
              precision={2}
              valueStyle={{
                color: getSummaryColor(summaryData?.totalMyProfitRate),
              }}
            />
            <Statistic
              title="在售总利润率"
              value={summaryData?.totalMyProfitRate || undefined}
              precision={2}
              suffix="%"
              valueStyle={{
                color: getSummaryColor(summaryData?.totalMyProfitRate),
              }}
            />
          </Space>
        )}
      </div>
      <Table
        size="small"
        rowKey="index"
        columns={columns}
        dataSource={goodList}
        scroll={{ x: 1300 }}
        pagination={{
          pageSize: 1000,
          showTotal: (total) => {
            return `共 ${total} 条`;
          },
        }}
      />
    </>
  );
};

export default Sale;
