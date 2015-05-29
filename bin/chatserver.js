/**
 * Created by taox on 15-5-20.
 */

var socketIO = require('socket.io'),
  io,
  /**
   * @description
   * @example
   * chatSystemObject = {
   *    "roomId1":{
   *      id:roomId,
   *      name:roomName,
   *      roomUsers:[
   *        "userId1":{
   *          userId:"userId",
   *          userName:"userName",
   *          sockets:[
   *            "socketId1","socketId",
   *            "socketId2","socketId"
   *            ...
   *          ]
   *        }
   *        "userId2":{},
   *        "userId2":{}
   *        ...
   *      ],
   *      sockets:[
   *        "socketId",
   *        "socketId2",
   *        "socketId3"
   *        ...
   *      ]
   *    }
   *    "roomId2":{},
   *    "roomId3":{}
   *    ...
   * }
   * @type {object}
   */
  chatSystemObject = {},
  /**
   * @example
   * roomInfo = {
   *    "roomId1":{
   *      id:"roomId",
   *      name:"roomName",
   *      onlineUser:number
   *    },
   *    "roomId2":{},
   *    "roomId2":{}
   * }
   * @type {{}}
   */
  roomInfo = {},
  /**
   * the prototype of roomInfo
   * @type {{id: string, onlineUser: number, name: string}}
   */
  room = {
    id: '',
    onlineUser: 0,
    name: ''
  },
  /**
   * @example
   * users = {
   *  "userId1":{
   *    userId:UserId,
   *    userName:userName,
   *    sockets:[
   *      socketId,
   *      socketId2,
   *      ...
   *    ]
   *  }
   *  "userId2":{},
   *  "userId3":{},
   *  "userId4":{}
   * }
   * @type {{}}
   */
  users = {},
  /**
   * @example
   * socket = {
   *  "socketId":{
   *    socket:"socketObject",
   *    userId:"userId",
   *    roomId:[
   *      "roomId1",
   *      "roomId2",
   *      "roomId3",
   *      ...
   *    ]
   *  }
   * }
   * @type {{}}
   */
  sockets = {};

exports.setChatRoom = function (roomArr, server) {
  for (var i = 0; i < roomArr.length; i++) {
    var obj = Object.create(room);
    obj.id = roomArr[i].id;
    obj.name = roomArr[i].name;
    obj.onlineUser = 0;
    roomInfo[roomArr[i].id] = obj;  //将roomArr对象克隆一份给roomInfo单独的统计每个在线人数。

    chatSystemObject[roomArr[i].id] = roomArr[i];//将roomArr对象作为chatSystemObject的一个子对象。
    chatSystemObject[roomArr[i].id].roomUsers = [];
    chatSystemObject[roomArr[i].id].sockets = [];
  }

  initServer(server);
};

/**
 * @description 更新房间在线用户数
 * @param roomId
 * @param userId
 */
function updateRoomUsers(roomId,userId){
  var roomUsers = chatSystemObject[roomId].roomUsers;
  var roomUser = findUserInRoom(roomUsers,userId);
  //如果用户在其他地方没有加入这个房间，那么该房间的在线用户数加一，
  if (!roomUser || roomUser.sockets.length === 0) {
    roomInfo[roomId].onlineUser++;
  }
  updataRoomInfo();
}
function sendUserRoomList(socketId){
  console.log("send roomlist user:");
  console.log(sockets[socketId].roomId);
  sockets[socketId].socket.emit("roomlist user",sockets[socketId].roomId);
}
function updataRoomInfo(){
  io.emit('room info', roomInfo);
}
/**
 * @description
 * @param socket
 */
function initGetRoomList(socket){
  socket.on("room list",function(){
    socket.emit('room info',roomInfo);
  });
}
/**
 * @param roomId
 * @param userId
 * @param socketId
 */
function addUserToRoomUsers(roomId,userId,userName,socketId){
  var roomUsers = chatSystemObject[roomId].roomUsers,
    roomSockets = chatSystemObject[roomId].sockets, //Array
    roomUser = findUserInRoom(roomUsers,userId);
  if(roomSockets.indexOf(socketId) === -1){
    roomSockets.push(socketId);
  }
  //如果用户还不在这个房间
  if(!roomUser){
    roomUser = {};
    roomUser.userId = userId;
    roomUser.userName = userName;
    roomUser.sockets = [];  //主要是用于判断该用户退出房间的时候，是否所有的连接都已经退出了。
    roomUsers.push(roomUser);
  }
  //将socket连接加入用户在该房间的连接。
  if(roomUser.sockets.indexOf(socketId) === -1){
    roomUser.sockets.push(socketId);
    //向该房间的所有用户通知该用户加入房间。
    responseToJoinUser(roomSockets,userId,userName,true,roomInfo[roomId].name);
  }
}
function removeUserInRoom(roomUsers,userId){
  for(var i=0;i<roomUsers.length;i++){
    if(roomUsers[i].userId == userId){
      roomUsers.splice(i,1);
    }
  }
}
/**
 *
 * @param roomUsers
 * @param userId
 * @returns {*}
 */
function findUserInRoom(roomUsers,userId){

  for(var i=0;i<roomUsers.length;i++){
    if(roomUsers[i].userId == userId){
      return roomUsers[i];
    }
  }
  return null;
}

/**
 *
 * @param roomIds  Array
 * @param userId
 * @param socketId
 */
function removeSocketFromRoomUsers(roomIds,userId,socketId){
  for(var i =0;i<roomIds.length;i++){
    var room = chatSystemObject[roomIds[i]],
      roomUsers = room.roomUsers, //Array
      roomSockets = room.sockets, //Array
      roomUser = findUserInRoom(roomUsers,userId) || {},
      roomUserSockets = roomUser.sockets || []; //Array
    //删除room sockets
    roomSockets.splice(roomSockets.indexOf(socketId),1);
    //删除user sockets
    roomUserSockets.splice(roomUserSockets.indexOf(socketId),1);
    //修改roomInfo下在线人数。
    if(roomUserSockets.length === 0){
      roomInfo[roomIds[i]].onlineUser--;
      //如果用户没有连接在sockets上了，删除该房间的用户
      removeUserInRoom(roomUsers,userId);
      responseToRoomUsers(roomIds[i]);
      //向该房间用户通知，该用户退出房间。
      responseToJoinUser(roomSockets,userId,roomUser.userName,false,roomInfo[roomIds[i]].name);
      updataRoomInfo();
    }
  }
}
/**
 *
 * @param userId
 * @param socketId
 */
function removeSocketFromUsers(userId,socketId){
  users[userId].sockets.splice(users[userId].sockets.indexOf(socketId),1);
}
/**
 * delete socket in sockets
 * @param socketId
 */
function removeSocketFromSockets(socketId){
  try{
    delete sockets[socketId];
  }catch (e){

  }

}
function removeRoomFromSockets(socketId,roomId){
  var socketObject = sockets[socketId] || {},
    socketRoom = socketObject.roomId || [];
  socketRoom.splice(socketRoom.indexOf(roomId+''),1);
}
/**
 * 加入room操作
 * @param socket
 */
function joinRoom(socket){

  socket.on("join room",function(msg){
    //用users中或取当前进入房间用户。
    var userId = msg.userId,
      roomId = msg.roomId,
      userName = msg.userName,
      user = users[userId] || {};

    //如果该用户不存在users中,创建该用户。
    if (!user.userId) {
      user.userName = userName;
      user.userId = userId;
      user.sockets = []; //存放该用户的所有sockets连接的Id。
    }
    if(user.sockets.indexOf(socket.id) === -1){ //同一个页面连接多个房间时，只保存该socketId一次。
      user.sockets.push(socket.id);
    }
    //更新用户集合对象users
    users[userId] = user;
    //将socket加入sockets集合中。
    addSocketToSockets(socket,msg);
    //更新房间在线人数列表
    updateRoomUsers(roomId,userId);
    //将用户加入房间在线用户数组和用户连接socket数组中，并向该房间的所有用户通知该用户加入房间。
    addUserToRoomUsers(roomId,userId,userName,socket.id);
    //显示房间在线用户
    responseToRoomUsers(roomId);
    //发送用户当前socket所连接的所有房间。
    sendUserRoomList(socket.id);
  })
}

/**
 *
 * @param socket
 * @param msg
 */
function addSocketToSockets(socket,msg){
  var socketObject = {};
  socketObject.socket = socket;
  socketObject.userId = msg.userId;
  socketObject.roomId = [];
  if(sockets[socket.id]){
    var roomArr = sockets[socket.id].roomId;
    if(roomArr.indexOf(msg.roomId) === -1){
      roomArr.push(msg.roomId);
    }
  }else{
    socketObject.roomId.push(msg.roomId);
    sockets[socket.id] = socketObject;
  }
}
function responseToRoomUsers(roomId){
  var socketsArr = chatSystemObject[roomId].sockets,
    roomUsers = chatSystemObject[roomId].roomUsers,
    length = socketsArr.length,
    i = 0;
  for(;i<length;i++){
    sockets[socketsArr[i]].socket.emit('room users',roomUsers)
  }
}
/**
 *
 * @param socketsArr
 * @param userId
 * @param userName
 * @param type
 * @param msgHeader
 */
function responseToJoinUser(socketsArr,userId,userName,type,msgHeader){
  var i = 0,
    length =socketsArr.length;
  if(type){
    for(;i<length;i++){
      sockets[socketsArr[i]].socket.emit('user join',{userId:userId,userName:userName,msgHeader:msgHeader});
    }
  }else{
    for(;i<length;i++){
      sockets[socketsArr[i]].socket.emit('user leave',{userId:userId,userName:userName,msgHeader:msgHeader});
    }
  }
}

function initRoomChat(socket){
  socket.on("room chat", function (msg) {
    var roomId = msg.roomId,
      socketsArr = chatSystemObject[roomId].sockets,//所有连接到该房间的socketId
      length = socketsArr.length,
      i = 0;
    msg.msgHeader = roomInfo[roomId].name;
    for(;i<length;i++){
      sockets[socketsArr[i]].socket.emit('room chat',msg);
    }
  });
}

function initPrivateChat(socket){
  socket.on("private message",function(msg){
    var userReceiveId = msg.to.userId,
      receiveUser = users[userReceiveId] || {},
      receiveSockets = receiveUser.sockets || [],//该用户的所有socket连接.
      len = receiveSockets.length,
      i = 0;
    if(len > 0){
      for(;i<len;i++) {
        sockets[receiveSockets[i]].socket.emit("private message", msg);
      }
      //将私聊内容同时发送给发送者一份。
      socket.emit("private message", msg);
    }else{
      msg.content = "发送失败，"+msg.to.userName+"已经离开。";
      sockets.emit("private message", msg);
    }

  });
}

function initDisconnect(socket){
  //用户点击退出房间。在应用层断开连接。
  socket.on('leave room',function(msg){
    console.log('leave room');
    var userId = msg.userId,
      roomId = msg.roomId,
      socketId = socket.id,
      roomUser = findUserInRoom(chatSystemObject[roomId].roomUsers,userId);
    if(roomUser){
      //移除sockets下该用户在该房间的连接。
      removeRoomFromSockets(socketId,roomId);
      //移除roomUsers下该用户的连接
      removeSocketFromRoomUsers([roomId],userId,socketId);
      //显示用户当前socket所连接的房间
      sendUserRoomList(socketId);
    }
  });
  //用户刷新或关闭浏览器。在物理层断开连接。会断开用户连接的所有房间。
  socket.on('disconnect',function(){
    console.log('user disconnected');
    var socketId = socket.id,
      socketObject = sockets[socketId] || {},
      userId = socketObject.userId,
      roomIds = socketObject.roomId; //Array
    if(userId){
      //移除sockets下该用户的连接。
      removeSocketFromSockets(socketId);
      //删除users下该用户的连接。
      removeSocketFromUsers(userId,socketId);
      //删除roomUsers下该用户的连接。
      removeSocketFromRoomUsers(roomIds,userId,socketId);
    }
  });

}
function initPublicChat(socket){
  socket.on("public message",function(msg){
    io.emit("public message",msg);
  });
}
/**
 * 初始化websocket。
 * @param server
 */
function initServer(server) {
  io = socketIO(server);
  io.on('connection', function (socket) {
    //io.emit('room info', roomInfo);
    console.log("user connected");
    console.log(socket.id);
    //启动获取房间列表socket监听。
    initGetRoomList(socket);
    //启动加入房间socket监听。
    joinRoom(socket);
    //启动房间聊天socket监听。
    initRoomChat(socket);
    //启动私聊socket监听。
    initPrivateChat(socket);
    //启动公告socket监听
    initPublicChat(socket);
    //启动断开连接socket监听
    initDisconnect(socket);

  });
  console.log('init chatServer success');
}