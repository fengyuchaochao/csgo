const Koa = require('koa');
const app = new Koa();
const mongoose = require('mongoose');
const Router = require("koa-router");
const bodyParser=require('koa-bodyparser');
const good =require('./routes/api/good');

const router= new Router();



// 链接数据库
mongoose.connect('mongodb://127.0.0.1:27017/csgo', {useNewUrlParser:true})
.then(()=>{
    console.info('Mongodb Connect Success!');
}).catch(err=>{
    console.error(err);
});


router.use('/local/api/good', good);


app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 5000;

app.listen(port,()=>{
    console.log(`server started on ${port}`)
})