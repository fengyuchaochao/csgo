const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GoodSchema = new Schema({
  // 饰品名
  goodName: {
    type: String,
    required: true,
  },
  // 饰品Id
  goodId: {
    type: String,
    required: true,
  },
  // steam购买单价，及单价成本
  steamBuyPrice: {
    type: Number,
    required: true,
  },
  // steam购买数量
  steamBuyCount: {
    type: Number,
    required: true,
  },
  buffUserId: {
    type: String,
    required: true,
  },
  // 原始json数据
  rawData: {
    type: Object,
    required: false,
  },
  // 创建时间
  createTime: {
    type: String,
    required: false,
  },
  // 更新时间
  updateTime: {
    type: String,
    required: false,
  },
});
module.exports = User = mongoose.model('good', GoodSchema);
