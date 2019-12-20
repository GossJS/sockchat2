import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import moment from 'moment';

const App = () => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);

  const socket = useRef();
  const typstyle = useRef();
  typstyle.current = { display: 'none', position: 'fixed', left: 0, bottom: 0, zIndex: 222};

  const onSubmit = e => {
    e.preventDefault();

    const message = text.trim();
    if (!message) {
      return;
    }

    socket.current.emit('messages', message);
    setText('');
    document.querySelector('form').scrollIntoView(false);
  }

  useEffect(() => {
    socket.current = io(window.location.host, { transports: ['websocket'] });

    socket.current.on('messages', messages => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
      
      setMessages(prevMessage => prevMessage.concat(messages));
      document.querySelector('form').scrollIntoView(false);
    });
    socket.current.on('typing', () => {
      document.querySelector('#typ').style.display = 'inline';
      setTimeout(() => {document.querySelector('#typ').style.display = 'none';}, 100)
    });

  }, []);

  useEffect(() => {
    const listener = () => {
      const messageId = messages.length ? messages[messages.length - 1].id : null;

      socket.current.emit('getMessages', messageId);
    }

    socket.current.on('connect', listener);

    return () => socket.current.removeListener('connect', listener);
  }, [messages]);

  return (
    <form onSubmit={onSubmit}>
      {messages.map(({ id, text, createdAt }) => (
        <div className="message" key={id}>
          <div>
            {text}
            <span className="timestamp">{moment(createdAt).format('hh:mm')}</span>
          </div>
        </div>
      ))}
      <span id="typ" style={typstyle.current}>Кто-то печатает!..</span>
      <input onKeyDown={() => socket.current.emit('typing')} value={text} placeholder="Напечатайте и Enter"  onChange={e => setText(e.target.value)} />
    </form>
  )
}

export default App;
