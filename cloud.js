var AV = require('leanengine');
var request = require('request-promise');
var uuid = require('uuid');

AV.Cloud.define('start-conv', function (req, res) {
  var customId = uuid.v4();
  var query = new AV.Query('Staff').ascending('concurrent');
  query.first().then(function (staff) {
    var staffId = staff.get('clientId');
    console.log('custom [' + customId + '] assigned to staff [' + staffId + ']');
    return createConversation([customId, staffId]);
  }).then(function(conv) {
    console.log('new conversation [' + conv.objectId + '] created');
    return sendQuestion(req.params.question, conv.objectId, customId).then(function() {
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
      'X-LC-Key': process.env.LC_APP_MASTER_KEY + ',master'
    },
    json: true
  });
}
