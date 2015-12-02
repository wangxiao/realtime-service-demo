var startBtns = getEle('start-btns');
var openCustomerBtn = getEle('open-customer-btn');
var openServiceBtn = getEle('open-service-btn');
var customerOpenBtn = getEle('customer-open-btn');
var serviceOpenBtn = getEle('service-open-btn');
var sendBtn = getEle('send-btn');
var inputName = getEle('input-name');
var inputQuestion = getEle('input-question');
var inputSend = getEle('input-send');
var customerInput = getEle('customer-input');
var serviceInput = getEle('service-input');
var printWall = getEle('print-wall');
var realtimeUi = getEle('realtime-ui');
var tips = getEle('tips');
var roleTipCustomer = getEle('role-tip-customer');
var roleTipService = getEle('role-tip-service');
var showWall = getEle('show-wall');

function getEle(id) {
  return document.getElementById(id);
}

function sendMsg(val) {

  // 如果没有连接过服务器
  if (firstFlag) {
    alert('请先连接服务器！');
    return;
  }
  val = inputSend.value || val;

  // 不让发送空字符
  if (!String(val).replace(/^\s+/, '').replace(/\s+$/, '')) {
    alert('请输入点文字！');
  }

  // 向这个房间发送消息，这段代码是兼容多终端格式的，包括 iOS、Android、Window Phone
  room.send({
    text: val
  }, {
    type: 'text'
  }, function(data) {

    // 发送成功之后的回调
    inputSend.value = '';
    showLog('（' + formatTime(data.t) + '）  自己： ', val);
    printWall.scrollTop = printWall.scrollHeight;
  });
}

// 显示接收到的信息
function showMsg(data, isBefore) {
  var text = '';
  var from = data.fromPeerId;
  if (data.msg.type) {
    text = data.msg.text;
  } else {
    text = data.msg;
  }
  if (data.fromPeerId === clientId) {
    from = '自己';
  }
  if (String(text).replace(/^\s+/, '').replace(/\s+$/, '')) {
    showLog('（' + formatTime(data.timestamp) + '）  ' + encodeHTML(from) + '： ', text, isBefore);
  }
}

// 获取消息历史
function getLog(callback) {
  var height = printWall.scrollHeight;
  if (logFlag) {
    return;
  } else {
    // 标记正在拉取
    logFlag = true;
  }
  room.log({
    t: msgTime
  }, function(data) {
    logFlag = false;
    // 存储下最早一条的消息时间戳
    var l = data.length;
    if (l) {
      msgTime = data[0].timestamp;
    }
    for (var i = l - 1; i >= 0; i--) {
      showMsg(data[i], true);
    }
    if (l) {
      printWall.scrollTop = printWall.scrollHeight - height;
    }
    if (callback) {
      callback();
    }
  });
}

// demo 中输出代码
function showLog(msg, data, isBefore) {
  if (data) {
    // console.log(msg, data);
    msg = msg + '<span class="strong">' + encodeHTML(JSON.stringify(data)) + '</span>';
  }
  var p = document.createElement('p');
  p.innerHTML = msg;
  if (isBefore) {
    printWall.insertBefore(p, printWall.childNodes[0]);
  } else {
    printWall.appendChild(p);
  }
}

function encodeHTML(source) {
  return String(source)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // .replace(/\\/g,'&#92;')
  // .replace(/"/g,'&quot;')
  // .replace(/'/g,'&#39;');
}

function formatTime(time) {
  var date = new Date(time);
  var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
  var currentDate = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  var hh = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  var mm = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  var ss = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  return date.getFullYear() + '-' + month + '-' + currentDate + ' ' + hh + ':' + mm + ':' + ss;
}

// 绑定事件方法
function bindEvent(dom, eventName, fun) {
  if (window.addEventListener) {
    dom.addEventListener(eventName, fun);
  } else {
    dom.attachEvent('on' + eventName, fun);
  }
}

function ajax(options, callback) {
  if (typeof options === 'string') {
    options = {
      url: options
    };
  }
  var url = options.url;
  var method = options.method || 'get';
  var XMLHttpRequest = require('./xmlhttprequest').XMLHttpRequest;
  var xhr = new XMLHttpRequest();

  // 浏览器兼容，IE8+
  if (global.XDomainRequest) {
    xhr = new global.XDomainRequest();
  }

  xhr.open(method, url);

  xhr.onload = function(data) {
    if ((xhr.status >= 200 && xhr.status < 300) || (global.XDomainRequest && !xhr.status)) {
      callback(null, JSON.parse(xhr.responseText));
    } else {
      callback(JSON.parse(xhr.responseText));
    }
  };

  xhr.onerror = function(data) {
    callback(data || {});
    throw new Error('Network error.');
  };

  // IE9 中需要设置所有的 xhr 事件回调，不然可能会无法执行后续操作
  xhr.onprogress = function() {};
  xhr.ontimeout = function() {};
  xhr.timeout = 0;

  var body = JSON.stringify(options.data);

  xhr.send(body);
}



