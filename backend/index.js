const [{ Server: h1 }, x] = [require('http'), require('express')];
const socketIO = require('socket.io');

//-----
const mg = require('mongoose');

mg.Promise = global.Promise;
const conn = mg.createConnection('mongodb+srv://messageuser:messagepassword@gossjs-8jzrf.mongodb.net/messagestore', {
  useNewUrlParser: true,
});

const MessageSchema = new mg.Schema({
  text: {
    type: 'String',
  },
});
const Message = conn.model('Message', MessageSchema);

//----

let s;
const PORT = 1234;
const { log } = console;
const hu = { 'Content-Type': 'text/html; charset=utf-8' };
const app = x();
app
  .use(x.static('./frontend/build/'))
  // здесь отсчёт идёт от той папки, где запускается yarn start
  // если бы мы писали node . в этой папке (где index.js)
  // то надо было бы брать путь '../frontend/build

  .use(({ res: r }) => r.status(404).end('Пока нет!'))
  .use((e, r, rs, n) => rs.status(500).end(`Ошибка: ${e}`))
  /* .set('view engine', 'pug') */
  .set('x-powered-by', false);
module.exports = s = h1(app)
  .listen(process.env.PORT || PORT, () => log(process.pid));

const ws = socketIO(s);
const cb = (d) => log(d);


ws.on('connection', (wsock) => {
  log('Новый пользователь!');
  wsock.emit('serv', 'Добро пожаловать!', cb);
  wsock.on('disconnect', () => log('Пользователь отвалился!'));
});

ws.on('connect', async (wsock) => {
  wsock.on('getMessages', async () => {
    const recentMessages = await Message.find();
    wsock.emit('messages', recentMessages);
  });

  wsock.on('typing', async () => {
    wsock.broadcast.emit('typing');
  });

  wsock.on('messages', async (text) => {
    const nm = new Message({ text });
    await nm.save();
    wsock.emit('messages', [nm]);
    wsock.broadcast.emit('messages', [nm]);
  });
});
