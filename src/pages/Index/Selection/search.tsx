import React, { useRef, useState, setState } from 'react';
import { Form, Button, Divider, InputNumber, Input, Space, message, Drawer, FloatButton } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
  

const Search: React.FC<{
    onSearch: any,
}> = (props) => {
    const { onSearch } = props;
    const initSearchBasicForm = {
        // 基本信息
        page: 1,
        page_size: 10000,
        cardPrice: 600,
        buffMinSellNum: 20,
        buffMaxSellNum: 9999,
        steamBuyPriceMin: 1,
        steamBuyPriceMax: 10,
        itemNameInclude: '',
        itemNameExclude: '',
        profitRateMin: 0,
        profitRateMax: 99999.99,
        // buff登录需要信息
        session: '1-sRPYkPx7u_xfm8DGHrxkOCHaBXmsMjZcsTCEoo4mv92s2033426027',
        csrf_token: 'IjAyNzQ0YjExMWYyNTAxZGY5YTk1MGMwMzM1YTJkNjkxNjc5ODUwNzEi.FxEZ9w.lrIYLIF-79xH4FSYIScZLzMa-9o',
    }
    const [openStatus, setOpenStatus] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const handleSearch = async () => {
        const params = form.getFieldValue();
        let formData = new FormData();
        Object.keys(params).forEach(key => {
            formData.append(key, params[key])
        })
        setLoading(true);
        await fetch('/api/steamInfo/selectItem', {
            method: 'post',
            body: formData
        }).then(response => response.json()).then(data => {
            onSearch({
                searchParams: params,
                resultList: data.itemList || []
            });
        });
        setLoading(false);
    }
    return <div>
        <FloatButton shape="circle"
            type="primary"
            icon={<SearchOutlined />}
            style={{ right: 24, top: 60 }}
            onClick={() => setOpenStatus(true)} />
        <Drawer
            title="筛选条件"
            placement="right"
            mask={false}
            contentWrapperStyle={{ width: 600 }}
            open={openStatus}
            onClose={() => setOpenStatus(false)}
            extra={
                <Space>
                    <Button style={{ "marginRight": '18px' }} onClick={() => form.resetFields()}>重置</Button>
                    <Button type="primary" onClick={() => handleSearch()} loading={loading}>搜索</Button>
                </Space>
            }
            >
            <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} initialValues={initSearchBasicForm}>
                <Divider orientation="left" orientationMargin="10px">基本饰品信息</Divider>
                <Form.Item label="卡价" name="cardPrice">
                    <InputNumber addonBefore="¥"/>
                </Form.Item>
                <Divider/>
                <Form.Item label="buff在售数量大于" name="buffMinSellNum">
                    <InputNumber placeholder="最小值" min="0" style={{width: '150px'}} />
                </Form.Item>
                <Form.Item label="buff在售数量小于" name="buffMaxSellNum">
                    <InputNumber placeholder="最大值" min="0" style={{width: '150px'}} />
                </Form.Item>
                <Divider/>
                <Form.Item label="steam求购价格大于" name="steamBuyPriceMin">
                    <InputNumber placeholder="最小值" min="0" style={{width: '150px'}} addonBefore="$"/>
                </Form.Item>
                <Form.Item label="steam求购价格小于" name="steamBuyPriceMax">
                    <InputNumber placeholder="最大值" min="0" style={{width: '150px'}} addonBefore="$"/>
                </Form.Item>
                <Divider/>
                <Form.Item label="饰品名称包含" name="itemNameInclude">
                    <Input placeholder="请输入饰品名称" allowClear/>
                </Form.Item>
                <Form.Item label="饰品名称不包含">
                    <Input placeholder="请输入饰品名称" allowClear/>
                </Form.Item>
                <Divider/>
                <Form.Item label="利润率" name="profitRateMin">
                    <InputNumber placeholder="最小值" style={{width: '150px'}} addonAfter="%"/>
                </Form.Item>
                <Form.Item label="利润率" name="profitRateMax">
                    <InputNumber placeholder="最大值" style={{width: '150px'}} addonAfter="%"/>
                </Form.Item>
                <Divider orientation="left" orientationMargin="10px">Buff筛选条件</Divider>
                <Form.Item label="session" name="session">
                    <Input placeholder="登录buff之后，从控制台获取，然后粘贴到这里" allowClear/>
                </Form.Item>
                <Form.Item label="csrf_token" name="csrf_token">
                    <Input placeholder="登录buff之后，从控制台获取，然后粘贴到这里" allowClear/>
                </Form.Item>
                <Form.Item label=""></Form.Item>
                <Divider orientation="left" orientationMargin="10px">steam筛选条件</Divider>    

                <Divider />
            </Form>
        </Drawer>
    </div>
}

export default Search;