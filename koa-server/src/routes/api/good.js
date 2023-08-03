const Router = require('koa-router');
const Good = require('../../models/good');
const escapeStringRegexp = require('escape-string-regexp');

const router = new Router();

router.post('/add', async (ctx) => {
  const {
    goodName,
    goodId,
    steamBuyPrice,
    steamBuyCount,
    cardRate,
    buffUserId,
    rawData,
  } = ctx.request.body;
  const newGood = new Good({
    goodName,
    goodId,
    steamBuyPrice,
    steamBuyCount,
    cardRate,
    buffUserId,
    rawData,
    createTime: Date.now(),
    updateTime: Date.now(),
  });
  await newGood
    .save()
    .then((good) => {
      ctx.body = good;
    })
    .catch((err) => {
      console.log(err);
    });

  ctx.status = 200;
});

router.get('/list', async (ctx) => {
  const { goodName = '', page, pageSize = 100 } = ctx.request.query;
  const _filter = {
    $or: [
      // 多字段同时匹配
      { goodName: { $regex: escapeStringRegexp(goodName) } },
    ],
  };
  const result = await Good.find(_filter)
    .sort({ createTime: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  const total = await Good.find(_filter).count();

  ctx.status = 200;
  ctx.body = {
    list: result,
    total: total,
  };
});

router.post('/update', async (ctx) => {
  const { id, steamBuyPrice, steamBuyCount } = ctx.request.body;

  await Good.updateOne(
    {
      _id: id,
    },
    {
      steamBuyPrice,
      steamBuyCount,
      updateTime: Date.now(),
    },
  )
    .then((good) => {
      ctx.body = good;
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get('/delete', async (ctx) => {
  const { id } = ctx.request.query;
  await Good.findOneAndRemove({
    _id: id,
  });

  ctx.status = 200;
  ctx.body = {
    id,
  };
});

router.get('/detail', async (ctx) => {
  const { goodId } = ctx.request.query;
  const data = await Good.findOne({
    goodId,
  });

  ctx.status = 200;
  ctx.body = {
    data,
  };
});

module.exports = router.routes();
