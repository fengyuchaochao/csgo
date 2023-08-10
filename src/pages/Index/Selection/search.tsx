import React, { useRef, useState, setState } from 'react';
import {
  Form,
  Button,
  Divider,
  InputNumber,
  Input,
  Space,
  message,
  Drawer,
  FloatButton,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const Search: React.FC<{
  onSearch: any;
}> = (props) => {
  const { onSearch } = props;
  const cardRate = localStorage.getItem('cardRate');
  const initSearchBasicForm = {
    // 基本信息
    page: 1,
    page_size: 10000,
    cardPrice: cardRate ? +cardRate * 100 : 600,
    buffMinSellNum: 50,
    buffMaxSellNum: 400,
    steamBuyPriceMin: 10,
    steamBuyPriceMax: 100,
    itemNameInclude: '',
    itemNameExclude: '',
    profitRateMin: 0,
    profitRateMax: 99999.99,
    // buff登录需要信息
    // session: '1-UAWON4BusRZyKLVdCA7Ex9cpGF0qz6P_BydrPGIASh-32033426027',
    // csrf_token:
    //   'IjE0N2VmMWFjMzViNmI4MGZjOGJjZjQzODdiZjQ0ZmUwNjNhZDBlNjgi.F3meEA.fFESV0EaamFhhvcMZ1dVY9dvsko',
  };
  const [openStatus, setOpenStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const handleSearch = async () => {
    const params = form.getFieldValue();

    // 更新本地token和csrf_token
    // const csrf_token = params.csrf_token;
    // const session = params.session;
    // document.cookie = `session=${session}`;
    // document.cookie = `csrf_token=${csrf_token};`;

    let formData = new FormData();
    Object.keys(params).forEach((key) => {
      formData.append(key, params[key]);
    });
    setLoading(true);
    await fetch('/api/steamInfo/selectItem', {
      method: 'post',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        onSearch({
          searchParams: params,
          resultList: data.itemList || [],
          resultTotalCount: data.itemCount || 0,
        });
      });
    setLoading(false);
  };
  return (
    <div>
      <FloatButton
        shape="circle"
        type="primary"
        icon={<SearchOutlined />}
        style={{ right: 24, top: 60 }}
        onClick={() => setOpenStatus(true)}
      />
      <Drawer
        title="筛选条件"
        placement="right"
        mask={false}
        contentWrapperStyle={{ width: 600 }}
        open={openStatus}
        onClose={() => setOpenStatus(false)}
        extra={
          <Space>
            <Button
              style={{ marginRight: '18px' }}
              onClick={() => form.resetFields()}
            >
              重置
            </Button>
            <Button
              type="primary"
              onClick={() => handleSearch()}
              loading={loading}
            >
              搜索
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          initialValues={initSearchBasicForm}
        >
          <Divider orientation="left" orientationMargin="10px">
            基本饰品信息
          </Divider>
          <Form.Item label="卡价" name="cardPrice">
            <InputNumber
              addonBefore="¥"
              onChange={(value) => {
                if (value) {
                  localStorage.setItem('cardRate', (value / 100).toFixed(2));
                }
              }}
            />
          </Form.Item>
          <Divider />
          <Form.Item label="buff在售数量大于" name="buffMinSellNum">
            <InputNumber
              placeholder="最小值"
              min="0"
              style={{ width: '150px' }}
            />
          </Form.Item>
          <Form.Item label="buff在售数量小于" name="buffMaxSellNum">
            <InputNumber
              placeholder="最大值"
              min="0"
              style={{ width: '150px' }}
            />
          </Form.Item>
          <Divider />
          <Form.Item label="steam求购价格大于" name="steamBuyPriceMin">
            <InputNumber
              placeholder="最小值"
              min="0"
              style={{ width: '150px' }}
              addonBefore="$"
            />
          </Form.Item>
          <Form.Item label="steam求购价格小于" name="steamBuyPriceMax">
            <InputNumber
              placeholder="最大值"
              min="0"
              style={{ width: '150px' }}
              addonBefore="$"
            />
          </Form.Item>
          <Divider />
          <Form.Item label="饰品名称包含" name="itemNameInclude">
            <Input placeholder="请输入饰品名称" allowClear />
          </Form.Item>
          <Form.Item label="饰品名称不包含" name="itemNameExclude">
            <Input placeholder="请输入饰品名称" allowClear />
          </Form.Item>
          <Divider />
          <Form.Item label="利润率" name="profitRateMin">
            <InputNumber
              placeholder="最小值"
              style={{ width: '150px' }}
              addonAfter="%"
            />
          </Form.Item>
          <Form.Item label="利润率" name="profitRateMax">
            <InputNumber
              placeholder="最大值"
              style={{ width: '150px' }}
              addonAfter="%"
            />
          </Form.Item>
          {/* <Divider orientation="left" orientationMargin="10px">
            Buff筛选条件
          </Divider>
          <Form.Item label="session" name="session">
            <Input
              placeholder="登录buff之后，从控制台获取，然后粘贴到这里"
              allowClear
            />
          </Form.Item>
          <Form.Item label="csrf_token" name="csrf_token">
            <Input
              placeholder="登录buff之后，从控制台获取，然后粘贴到这里"
              allowClear
            />
          </Form.Item>
          <Form.Item label=""></Form.Item>
          <Divider orientation="left" orientationMargin="10px">
            steam筛选条件
          </Divider> */}

          <Divider />
        </Form>
      </Drawer>
    </div>
  );
};

export default Search;
