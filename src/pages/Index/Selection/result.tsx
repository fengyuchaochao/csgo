import React, { useRef, useState, useEffect} from 'react';
import { Form, Space, Table, Button, message, Modal, InputNumber } from 'antd';
import { CopyOutlined, CloseCircleFilled, CheckCircleFilled} from '@ant-design/icons'
import moment from 'moment';
import copy from 'copy-to-clipboard';

const Result: React.FC<{
    searchParams: any,
    resultList: any,
    setResultList: any,
    resultTotalCount: number,
}> = (props) => {
    const { searchParams, resultList, setResultList, resultTotalCount } = props;
    resultList.forEach((item, index) => {
        item.index = index;
    })

    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const initSteamBuyForm = {
        steamBuyPrice: undefined,
        steamBuyCount: undefined,
    }

    // 根据饰品名获取饰品的基本信息（主要是饰品ID）
    const getGoodInfo = async (name) => {
        message.loading('获取饰品ID中...');
        const game = 'csgo';
        const csrf_token = searchParams.csrf_token;
        const session = searchParams.session;
        document.cookie = `session=${session};csrf_token=${csrf_token};`;
        const { data } = await fetch(`/api/market/search/suggest?text=${name}&game=${game}`).then(response => response.json());
        const { suggestions = [] } = data;
        message.destroy();
        return suggestions.find(item => item.option === name)
    }
    
    // 根据成交记录获取订单列表
    const getOrderListByGoodId = async (goodId, sortBy) => {
        message.loading('获取饰品的Buff订单列表...');
        const game = 'csgo';
        const pageNum = 1;
        const url = sortBy ? `/api/market/goods/sell_order?game=${game}&goods_id=${goodId}&sort_by=${sortBy}&page_num=${pageNum}`
            : `/api/market/goods/bill_order?game=${game}&goods_id=${goodId}`;
        const { data } = await fetch(url)
            .then(response => response.json());
        message.destroy();
        return data;
    }
    
    const getSteamData = async (record) => { 
        message.loading('获取steam实时数据...');
        const steamGoodId = await getSteamGoodId(record);
        if (!steamGoodId) {
            alert('获取steamGoodId失败');
            return;
        }
        await getSteamGoodSaleData(steamGoodId, record);
        message.destroy();
    }
    
    // 获取steam 商品id
    const getSteamGoodId = async (record) => {
        const steamUrl = `/market/listings/${record?.goodInfo?.appid}/${record?.goodInfo?.market_hash_name}`;
        const res = await fetch(steamUrl).then(response => {
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
              }
            });
          })
          .then(stream => new Response(stream))
          .then(response => response.text())
        let arr = res.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\)/) || [];
        const steamGoodId = arr[1];
        return steamGoodId;
    }
   
    // 获取steam指定商品的销售数据
    const getSteamGoodSaleData = async (steamGoodId, record) => {
        const url = `/market/itemordershistogram?country=HK&language=schinese&currency=1&two_factor=0&item_nameid=${steamGoodId}`
        const res = await fetch(url).then(response => response.json());
        if (!res) { 
            alert('获取steam销售数据失败');
            return;
        }
        const { sell_order_graph, buy_order_graph } = res;        
        
        record.steamLowestSellPrice = sell_order_graph[0][0];
        record.steamHighestBuyPrice = buy_order_graph[0][0];

        setResultList([...resultList]);
    }

    const getLatestBuffData = async (record) => {
        const goodInfo = await getGoodInfo(record.name);
        // 根据成交记录判断是否符合购买条件
        const data = await getOrderListByGoodId(goodInfo.goods_ids);
        if (!data) return;
        const { items: orderList = [] } = data;
        const filterOrderList = orderList.filter((order, index) => {
            const currentDay = moment().add(1, 'days').format('YYYY-MM-DD 00:00:00');
            const preDay = moment(currentDay).subtract(3, 'days').format('YYYY-MM-DD 00:00:00'); // 3天前
            console.log(index, preDay, moment(new Date(order.created_at * 1000)).format('YYYY-MM-DD '));
            if (new Date(order.updated_at * 1000) >= new Date(preDay)) {
                return order;
            }
        })
        record.valid = filterOrderList.length >= 5;

        // 获取buff订单的当前最低价格
        const data2 = await getOrderListByGoodId(goodInfo.goods_ids, 'default');
        const { items: orderList2 = [], total_count, goods_infos } = data2;
        record.goodId = goodInfo.goods_ids;
        record.goodInfo = goods_infos[goodInfo.goods_ids];
        record.lowestPriceBuffOrder = orderList2[0];
        record.orderTotalCount = total_count;

        setResultList([...resultList]);
    }

    const copyName = (text) => { 
        copy(text);
        message.success('复制成功');
    }

    // 保存当前饰品到本地
    const hideModal = () => {
        setOpen(false);
        setCurrentGood(null);
    }
    let [currentGood, setCurrentGood] = useState(null);
    const toSaveGood = (record) => {
        setCurrentGood(record);
        form.resetFields();
        setOpen(true);
    }
    const saveGood = async () => {
        const params = form.getFieldValue();

        const body = {
            steamBuyPrice: params.steamBuyPrice,
            steamBuyCount: params.steamBuyCount,
            goodName: currentGood.name,
            goodId: currentGood.goodId,
            rawData: currentGood
        };

        await fetch('/local/api/good/add', {
            method: 'post',
            body: JSON.stringify(body),
            headers: {
                'Content-Type':'application/json',
            }
        }).then(response => response.json()).then(data => {
            message.success('保存成功');
            setOpen(false);
        });
    }
    const columns = [
        {
            title: '索引',
            width: 50,
            align: 'center',
            render: (_, record, index) => {
                return index + 1;
            }
        },
        {
            title: '饰品名',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (_, record) => {
                return <span style={{cursor: 'pointer'}} onClick={() => copyName(record.name)}>{record.name} <CopyOutlined style={{color: '#1776FF'}} /></span>;
            }
        },
        {
            title: 'buff在售数量',
            dataIndex: 'orderTotalCount',
            key: 'orderTotalCount',
            width: 120,
        },
        {
            title: 'buff在售价格（最低）',
            dataIndex: 'lowestPriceBuffOrder',
            key: 'lowestPriceBuffOrder',
            width: 150,
            render: (_, record) => { 
                const price = record?.lowestPriceBuffOrder?.price;
                return price ? `${price}（${(price / 6.9).toFixed(2)}$）` : '';
            }
        },
        {
            title: 'steam求购价（最高）',
            dataIndex: 'steamHighestBuyPrice',
            key: 'steamHighestBuyPrice',
            width: 150,
        },
        {
            title: 'steam在售价格(最低)',
            dataIndex: 'steamLowestSellPrice',
            key: 'steamLowestSellPrice',
            width: 150,
        },
        // {
        //     title: '时间',
        //     dataIndex: 'time',
        //     key: 'time',
        //     width: 120,
        //     render: (_, record) => {
        //         return moment(record.time).format('YYYY-MM-DD h:mm:ss')
        //     }
        // },
        {
            title: '是否符合条件',
            dataIndex: '',
            key: '',
            width: 250,
            render: (_, record) => {
                if (!record.lowestPriceBuffOrder || !record.steamLowestSellPrice) return;
                const buffLowestPriceCN = record?.lowestPriceBuffOrder?.price; //buff在售最低价格
                const steamHighestBuyPrice = record?.steamHighestBuyPrice;
                const steamCostPriceCN = steamHighestBuyPrice * searchParams.cardPrice / 100;
                const ratePrice = Number((buffLowestPriceCN - steamCostPriceCN).toFixed(2));
                const rate = Number((ratePrice / steamCostPriceCN).toFixed(4));
                return (<Space> 
                    <span>
                        交易记录：
                        {(record.valid === true ?
                            <CheckCircleFilled style={{ color: 'green'}} /> :
                            <CloseCircleFilled style={{ color: 'red'}} />)}
                    </span>
                    <span>
                        利润：{ratePrice}¥ ({(rate * 100).toFixed(2)}%）
                        {(rate >= 0.15 ?
                            <CheckCircleFilled style={{ color: 'green' }} /> :
                            <CloseCircleFilled style={{ color: 'red'}} />)}
                    </span>
                </Space>)
            }
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            render: (_, record) => {
                const buffUrl = `https://buff.163.com/goods/${record.goodId}?from=market#tab=selling`;
                const steamUrl = `https://steamcommunity.com/market/listings/${record?.goodInfo?.appid}/${record?.goodInfo?.market_hash_name}`;
                return (
                    <Space size="middle">
                        <Button size="small" type="primary" onClick={() => getLatestBuffData(record)}>Buff实时</Button>
                        <Button size="small" type="primary" disabled={!record.goodId} onClick={() => getSteamData(record)}>Steam实时</Button>
                        <Button size="small" type="link" target="_blank" disabled={!record.goodId} href={buffUrl}>Buff</Button>
                        <Button size="small" type="link" target="_blank" disabled={!record.goodId} href={steamUrl}>Steam</Button>
                        <Button size="small" type="primary" disabled={!record.goodId} onClick={() => toSaveGood(record)}>保存</Button>
                    </Space>
                )
            }
        }
    ]    
    return (<div>
        <Button type="primary">批量获取buff和steam实时数据</Button>
        <Modal title="购买当前饰品" open={open} onOk={saveGood} onCancel={() => hideModal()}>
            <Form form={form} initialValues={initSteamBuyForm }>
                <Form.Item label="购买单价" name="steamBuyPrice">
                    <InputNumber addonBefore="$"/>
                </Form.Item>
                <Form.Item label="购买数量" name="steamBuyCount">
                    <InputNumber/>
                </Form.Item>
            </Form>
        </Modal>
        <Table size="small"
            columns={columns}
            dataSource={resultList}
            rowKey="index"
            pagination={{ defaultPageSize: 100, total: resultTotalCount, showTotal: (total) => `总共${total}条`}} />
    </div>);
}

export default Result;