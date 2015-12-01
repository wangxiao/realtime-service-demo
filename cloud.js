var AV = require('leanengine');
var request = require('request-promise');
var uuid = require('uuid');

AV.Cloud.define('start-conv', function (req, res) {
  // 为当前客户生成 UUID
  var customId = uuid.v4();
  // 找到最闲的客服
  var query = new AV.Query('Staff').ascending('concurrent');
  query.first().then(function (staff) {
    var staffId = staff.get('clientId');
    console.log('custom [' + customId + '] assigned to staff [' + staffId + ']');
    // 客服同时处理客户数 +1
    staff.increment('concurrent', 1).save();
    // 创建一个包含当前客户与选中客服的会话
    return createConversation([customId, staffId]);
  }).then(function(conv) {
    console.log('new conversation [' + conv.objectId + '] created');
    // 在创建好的会话中代替客户发送问题
    return sendQuestion(req.params.question, conv.objectId, customId).then(function() {
      // 返回客户端需要的数据：会话 ID 与顾客 ID
      return res.success({
        convId: conv.objectId,
        customId: customId
      });
    });
  }).catch(function (e) {
    console.log(e);
    res.error(e.message);
  });
});

module.exports = AV.Cloud;

// 使用 REST API 创建会话
// https://leancloud.cn/docs/realtime_rest_api.html#创建一个对话
function createConversation(members) {
  return request({
    method: 'POST',
    uri: 'https://api.leancloud.cn/1.1/classes/_Conversation',
    body: {
      m: members
    },
    headers: {
      'X-LC-Id': process.env.LC_APP_ID,
      'X-LC-Key': process.env.LC_APP_KEY
    },
    json: true
  });
}

// 使用 REST API 发送消息
// https://leancloud.cn/docs/realtime_rest_api.html#通过_REST_API_发消息
function sendQuestion(text, convId, fromPeer) {
  return request({
    method: 'POST',
    uri: 'https://leancloud.cn/1.1/rtm/messages',
    body: {
      message: text || '',
      conv_id: convId,
      from_peer: fromPeer
    },
    headers: {
      'X-LC-Id': process.env.LC_APP_ID,
      // 该操作需要使用 master key
      'X-LC-Key': process.env.LC_APP_MASTER_KEY + ',master'
    },
    json: true
  });
}
