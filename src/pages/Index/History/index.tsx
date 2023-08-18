import { Badge, Tag } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import {
  Modal,
  Form,
  Space,
  Table,
  Button,
  InputNumber,
  message,
  Input,
  Image,
  Popconfirm,
  Typography,
} from 'antd';
import React, { useEffect, useState, computed } from 'react';
import {
  CopyOutlined,
  CloseCircleFilled,
  CheckCircleFilled,
} from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import moment from 'moment';
import { useModel } from '@umijs/max';

const copyName = (text) => {
  copy(text);
  message.success('复制成功');
};
const History: React.FC<unknown> = () => {
  const { getCardRate, getCurrentBuffUserId, getBuffUserIdList } =
    useModel('commonModel');
  const [keyword, setKeyword] = useState('');
  const [goodList, setGoodList] = useState([]);
  const [currentGood, setCurrentGood] = useState(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const initSteamBuyForm = {
    steamBuyPrice: undefined,
    steamBuyCount: undefined,
  };

  // 根据成交记录获取订单列表
  const getOrderListByGoodId = async (goodId, sortBy) => {
    message.loading('获取饰品的Buff订单列表...');
    const game = 'csgo';
    const pageNum = 1;
    const url = sortBy
      ? `/api/market/goods/sell_order?game=${game}&goods_id=${goodId}&sort_by=${sortBy}&page_num=${pageNum}`
      : `/api/market/goods/bill_order?game=${game}&goods_id=${goodId}&page_num=${pageNum}`;
    const { data } = await fetch(url).then((response) => response.json());
    message.destroy();
    return data;
  };
  // 获取饰品最近一个月的buff最低价
  const getLowestDataByLatestMonth = async (goodId) => {
    const url = `/api/market/goods/price_history/buff?game=csgo&goods_id=${goodId}&currency=CNY&days=30&buff_price_type=2&with_sell_num=false`;
    const res = await fetch(url).then((response) => response.json());
    if (!res) {
      message.warning('获取饰品最近一个月的buff最低价 失败');
      return;
    }
    let priceList = res?.data?.price_history || [];
    priceList = priceList.sort((a, b) => {
      if (a[1] >= b[1]) {
        return 1;
      }
      return -1;
    });
    const lowestPrice = priceList?.[0]?.[1];
    if (!lowestPrice) {
      message.warning('获取饰品最近一个月的buff最低价 失败');
    }
    return lowestPrice;
  };

  // 获取指定价格对应的手续费
  const getOrderFeeByGoodId = async (goodId, price) => {
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
    return fee;
  };

  const getLatestBuffData = async (record) => {
    // 根据成交记录
    const res = await getOrderListByGoodId(record.goodId);
    const { items: orderList = [] } = res;
    record.orderList = orderList;
    // 获取buff订单的当前最低价格
    const data = await getOrderListByGoodId(record.goodId, 'default');
    const orderList2 = data?.items || [];
    record.lowestPriceBuffOrder = orderList2[0];

    // 获取buff订单的当前最低价格对应的手续费
    const lowestPriceBuffOrder = record?.lowestPriceBuffOrder?.price;
    const fee = await getOrderFeeByGoodId(record.goodId, lowestPriceBuffOrder);
    record.fee = fee;

    // 获取当前成本价格对应的手续费
    const cardRate = record.cardRate || getCardRate();
    const myFee = await getOrderFeeByGoodId(
      record.goodId,
      record.steamBuyPrice * cardRate,
    );
    record.myFee = myFee;

    // 获取buff订单，最近一个月的最低价格
    const data3 = await getLowestDataByLatestMonth(record.goodId);
    if (data3) {
      record.lowestPriceByLatestMonth = data3;
    }

    // 获取steam目前的最高价格
    await getSteamData(record);

    setGoodList([...goodList]);
  };

  // 获取steam实时数据
  const getSteamData = async (record) => {
    message.loading('获取steam实时数据...');
    const steamGoodId = await getSteamGoodId(record);
    if (!steamGoodId) {
      alert('获取steamGoodId失败');
      return;
    }
    await getSteamGoodSaleData(steamGoodId, record);
    message.destroy();
  };

  // 获取steam 商品id
  const getSteamGoodId = async (record) => {
    const goodId = record?.rawData?.goodInfo?.appid;
    const goodName = record?.rawData?.goodInfo?.market_hash_name;
    const steamUrl = `/market/listings/${goodId}/${goodName}`;
    const res = await fetch(steamUrl)
      .then((response) => {
        const reader = response.body.getReader();
        return new ReadableStream({
          async start(controller) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }
              controller.enqueue(value);
            }
          },
        });
      })
      .then((stream) => new Response(stream))
      .then((response) => response.text());
    let arr = res.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\)/) || [];
    const steamGoodId = arr[1];
    return steamGoodId;
  };
  const getSteamGoodSaleData = async (steamGoodId, record) => {
    const url = `/market/itemordershistogram?country=HK&language=schinese&currency=1&two_factor=0&item_nameid=${steamGoodId}`;
    const res = await fetch(url).then((response) => response.json());
    if (!res) {
      message.warning('获取steam销售数据失败');
      return;
    }
    const { sell_order_graph, buy_order_graph } = res;

    record.steamLowestSellPrice = sell_order_graph?.[0]?.[0];
    record.steamHighestBuyPrice = buy_order_graph?.[0]?.[0];

    record.isHighestPriceOfSteam =
      record.steamBuyPrice >= record.steamHighestBuyPrice;
  };

  const toUpdateGood = async (record) => {
    setCurrentGood(record);
    form.setFieldsValue({
      steamBuyPrice: record.steamBuyPrice,
      steamBuyCount: record.steamBuyCount,
    });
    setOpen(true);
  };
  useEffect(() => {
    changeRate();
  }, [currentGood]);

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
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        message.success('更新成功');
        setOpen(false);
        getHistoryList(keyword);
      });
  };
  const deleteGood = async (record) => {
    const url = `/local/api/good/delete?id=${record._id}`;
    await fetch(url);
    getHistoryList(keyword);
  };
  const hideModal = () => {
    setOpen(false);
    form.resetFields();
  };

  const getRecommendCount = (record) => {
    const filterOrderList = (record.orderList || []).filter((item, index) => {
      const currentDay = moment().add(1, 'days').format('YYYY-MM-DD 00:00:00');
      const preDay = moment(currentDay)
        .subtract(3, 'days')
        .format('YYYY-MM-DD 00:00:00'); // 3天前
      if (new Date(item.updated_at * 1000) >= new Date(preDay)) {
        return true;
      }
      return false;
    });
    // 判断是否都是当天的
    const filterOrderList2 = (record.orderList || []).filter((order, index) => {
      const currentDay = moment().add(1, 'days').format('YYYY-MM-DD 00:00:00');
      const preDay = moment(currentDay)
        .subtract(1, 'days')
        .format('YYYY-MM-DD 00:00:00'); // 3天前
      if (new Date(order.updated_at * 1000) >= new Date(preDay)) {
        return order;
      }
    });
    // 判断是否都是最近7天的
    const filterOrderList3 = (record.orderList || []).filter((order, index) => {
      const currentDay = moment().add(1, 'days').format('YYYY-MM-DD 00:00:00');
      const preDay = moment(currentDay)
        .subtract(7, 'days')
        .format('YYYY-MM-DD 00:00:00'); // 7天前
      if (new Date(order.updated_at * 1000) >= new Date(preDay)) {
        return order;
      }
    });
    /**
     * 1. 如果交易记录最近10条，有8条以上都是当天的，则建议购买5个
     * 2. 如果有8条以上都是最近3天的，则建议购买3个
     * 3. 如果有5条以上都是最近3天的，则建议购买1个
     */
    if (filterOrderList2.length >= 8) {
      record.recommendCount = 5;
    } else {
      if (filterOrderList.length >= 8) {
        record.recommendCount = 3;
      } else if (filterOrderList.length >= 5) {
        record.recommendCount = 1;
      } else if (filterOrderList3.length >= 8) {
        record.recommendCount = 1;
      } else {
        record.recommendCount = undefined;
      }
    }
    return record.recommendCount;
  };

  const columns: any[] = [
    {
      title: '索引',
      width: 50,
      align: 'center',
      fixed: 'left',
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
      width: 80,
      fixed: 'left',
      render: (_, record) => {
        return <Image width={60} src={record?.rawData?.goodInfo?.icon_url} />;
      },
    },
    {
      title: '饰品名',
      dataIndex: 'goodName',
      key: 'goodName',
      fixed: 'left',
      width: 200,
      render: (_, record) => {
        return (
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => copyName(record.goodName)}
          >
            {record.goodName} <CopyOutlined style={{ color: '#1776FF' }} />
          </span>
        );
      },
    },
    {
      title: '单件成本及利润',
      width: 250,
      render: (_, record) => {
        // 利润
        if (!record?.lowestPriceBuffOrder) return;
        const cardRate = record.cardRate || getCardRate();
        const steamBuyPrice = (record.steamBuyPrice * cardRate).toFixed(2);
        const lowestPriceBuffOrder = record?.lowestPriceBuffOrder?.price;
        const rateValue = (
          lowestPriceBuffOrder -
          +steamBuyPrice -
          record?.myFee
        ).toFixed(2);
        const rate = (+rateValue / +steamBuyPrice).toFixed(2);

        return (
          <Space direction="vertical">
            <span>
              单件成本：
              <b>{(record.steamBuyPrice * cardRate).toFixed(2)}</b>
              <span>（{record.steamBuyPrice}$）</span>
              <Tag color="processing">{cardRate}</Tag>
            </span>
            <span>手续费：{record?.myFee}</span>
            <span>
              单件利润：
              <b>
                <Typography.Text type={+rate > 0.15 ? 'success' : 'default'}>
                  {rateValue}（{(+rate * 100).toFixed(2)}%）
                </Typography.Text>
              </b>
            </span>
            <span>购买数量：{record?.steamBuyCount}</span>
          </Space>
        );
      },
    },
    {
      title: 'buff在售价格（最低）',
      key: 'lowestPriceBuffOrder',
      width: 250,
      render: (_, record) => {
        const lowestPriceByLatestMonth = record?.lowestPriceByLatestMonth;
        const price = record?.lowestPriceBuffOrder?.price;

        // 当前steam最高价，转为人名币
        const steamHighestBuyPrice = record?.steamHighestBuyPrice;
        const cardRate = record.cardRate || getCardRate();
        const steamHighestBuyPriceCN = (
          steamHighestBuyPrice * cardRate
        ).toFixed(2);

        // 最近一个月的buff最低价，如果比steam当前最高价还高，则建议购买，标绿
        const flag = +lowestPriceByLatestMonth > +steamHighestBuyPriceCN;

        return price ? (
          <Space direction="vertical">
            <span>
              当前最低价：
              <b>
                {price}（{(price / 6.9).toFixed(2)}$）
              </b>
            </span>
            <span style={{ color: flag ? '#52c41a' : '' }}>
              最近一个月最低价：
              <b>{lowestPriceByLatestMonth}</b>
            </span>
          </Space>
        ) : (
          ''
        );
      },
    },
    {
      title: 'steam求购价（最高）',
      dataIndex: 'steamHighestBuyPrice',
      key: 'steamHighestBuyPrice',
      width: 150,
      render: (_, record) => {
        const steamHighestBuyPrice = record?.steamHighestBuyPrice;

        const cardRate = record.cardRate || getCardRate();
        const steamHighestBuyPriceCN = (
          steamHighestBuyPrice * cardRate
        ).toFixed(2);
        return steamHighestBuyPrice
          ? `${steamHighestBuyPriceCN}(${steamHighestBuyPrice}$)`
          : '';
      },
    },
    {
      title: '是否符合条件',
      width: 220,
      render: (_, record) => {
        if (!record.lowestPriceBuffOrder || !record.steamLowestSellPrice)
          return;
        const cardRate = record.cardRate || getCardRate();
        const buffLowestPriceCN = record?.lowestPriceBuffOrder?.price; //buff在售最低价格
        const steamHighestBuyPrice = record?.steamHighestBuyPrice;
        const steamCostPriceCN = steamHighestBuyPrice * cardRate;
        const ratePrice = Number(
          (buffLowestPriceCN - steamCostPriceCN - record?.fee).toFixed(2),
        );
        const rate = Number((ratePrice / steamCostPriceCN).toFixed(4));
        return (
          <Space direction="vertical">
            <span>
              交易记录：
              {record.lowestPriceBuffOrder &&
                (getRecommendCount(record) ? (
                  <Space>
                    <CheckCircleFilled style={{ color: '#52c41a' }} />
                    <b>{record.recommendCount}</b>
                  </Space>
                ) : (
                  <CloseCircleFilled style={{ color: 'red' }} />
                ))}
            </span>
            <span>
              利润：
              <b>
                {ratePrice}¥ ({(rate * 100).toFixed(2)}%）
              </b>
              {rate >= 0.15 ? (
                <CheckCircleFilled style={{ color: '#52c41a' }} />
              ) : (
                <CloseCircleFilled style={{ color: 'red' }} />
              )}
            </span>
            <span>
              是否是Steam第一位：
              {record.isHighestPriceOfSteam ? (
                <CheckCircleFilled style={{ color: '#52c41a' }} />
              ) : (
                <CloseCircleFilled style={{ color: 'red' }} />
              )}
            </span>
          </Space>
        );
      },
    },
    // {
    //   title: '推荐卖出价格',
    //   width: 180,
    //   render: (_, record) => {
    //     const price = Number((record.steamBuyPrice * cardRate).toFixed(2));

    //     return (
    //       <p>
    //         <span>
    //           5%涨幅：{(price * 1.05).toFixed(2)}
    //           <br />
    //         </span>
    //         <span>
    //           10%涨幅：{(price * 1.1).toFixed(2)}
    //           <br />
    //         </span>
    //         <span>
    //           20%涨幅：{(price * 1.2).toFixed(2)}
    //           <br />
    //         </span>
    //         <span>
    //           30%涨幅：{(price * 1.3).toFixed(2)}
    //           <br />
    //         </span>
    //         <span>
    //           40%涨幅：{(price * 1.4).toFixed(2)}
    //           <br />
    //         </span>
    //         <span>
    //           50%涨幅：{(price * 1.5).toFixed(2)}
    //           <br />
    //         </span>
    //         <span>
    //           70%涨幅：{(price * 1.7).toFixed(2)}
    //           <br />
    //         </span>
    //         <span>
    //           100%涨幅：{(price * 2).toFixed(2)}
    //           <br />
    //         </span>
    //       </p>
    //     );
    //   },
    // },
    {
      title: '创建时间',
      key: 'createTime',
      dataIndex: 'createTime',
      width: 100,
      render: (_, record) => {
        return moment(+record.createTime).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      title: '更新时间',
      key: 'updateTime',
      dataIndex: 'updateTime',
      width: 100,
      render: (_, record) => {
        return moment(+record.updateTime).format('YYYY-MM-DD HH:mm:ss');
      },
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
          <Space size="middle" direction="vertical">
            <Button
              size="small"
              type="primary"
              onClick={() => {
                getLatestBuffData(record);
              }}
            >
              实时数据
            </Button>
            <Button
              size="small"
              type="link"
              target="_blank"
              disabled={!record.goodId}
              href={buffUrl}
            >
              Buff详情
            </Button>
            <Button
              size="small"
              type="link"
              target="_blank"
              disabled={!record.goodId}
              href={steamUrl}
            >
              Steam详情
            </Button>
            <Button
              size="small"
              type="primary"
              disabled={!record.goodId}
              onClick={() => toUpdateGood(record)}
            >
              更新成本价格
            </Button>
            <Popconfirm
              title="提示"
              description="确定要删除吗？"
              onConfirm={() => deleteGood(record)}
            >
              <Button size="small" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const [rate, setRate] = useState('');
  const [ratePercent, setRatePercent] = useState('');

  const changeRate = () => {
    const formData = form.getFieldValue();
    if (!currentGood?.lowestPriceBuffOrder) return;
    const cardRate = currentGood.cardRate || getCardRate();
    const steamBuyPrice = (formData.steamBuyPrice * cardRate).toFixed(2);
    const lowestPriceBuffOrder = currentGood?.lowestPriceBuffOrder?.price;
    const rateValue = (lowestPriceBuffOrder - +steamBuyPrice).toFixed(2);
    const ratePercent = (+rateValue / +steamBuyPrice).toFixed(2);
    setRate(rateValue);
    setRatePercent(`${(ratePercent * 100).toFixed(2)}%`);
  };

  const getHistoryList = async (keyword) => {
    const userId = getCurrentBuffUserId();
    const userIdList = getBuffUserIdList();
    let url = `/local/api/good/list?userId=${userId}`;
    if (keyword) {
      url = url + `&goodName=${keyword}`;
    }
    await fetch(url, {
      method: 'get',
    })
      .then((response) => response.json())
      .then((data) => {
        const { list = [] } = data;
        // setGoodList(list);
        setGoodList(
          list.filter((item) => {
            return item.buffUserId === userId || !item.buffUserId;
          }),
        );
      });
  };
  const search = async (e) => {
    const keyword = e.target.value;
    setKeyword(keyword);
    getHistoryList(keyword);
  };

  useEffect(() => {
    getHistoryList();
  }, []);

  return (
    <>
      <Modal
        title="购买当前饰品"
        open={open}
        onOk={updateGood}
        onCancel={() => hideModal()}
      >
        <Form form={form} initialValues={initSteamBuyForm}>
          <Form.Item label="购买单价" name="steamBuyPrice">
            <InputNumber addonBefore="$" onChange={changeRate} />
          </Form.Item>
          <Form.Item label="利润">
            {rate}（{ratePercent}）
          </Form.Item>
          <Form.Item label="购买数量" name="steamBuyCount">
            <InputNumber />
          </Form.Item>
        </Form>
      </Modal>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="输入饰品名"
          allowClear
          size="large"
          style={{ width: 700 }}
          onChange={search}
        />
        <Button
          size="large"
          type="primary"
          onClick={() => getHistoryList(keyword)}
        >
          搜索
        </Button>
      </Space>
      <Table
        size="small"
        rowKey="_id"
        columns={columns}
        dataSource={goodList}
        scroll={{ x: 1300 }}
      />
    </>
  );
};

export default History;
