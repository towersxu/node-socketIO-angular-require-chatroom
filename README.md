nodeJS聊天室
需要安装redis-server

redis-server
npm start


##说明

###目录结构
chatNodeJS
  |--bin
  |  |--chatroomServer
  |  |  |--access.js(从redis中获取相应的权限)
  |  |  |--auth.js(连接webserver端,对客户端进行认证)
  |  |  |--chatroomServer.js(聊天室)
  |  |--dbConnection
  |  |  |--mysqlConn.js(弃用)
  |  sticky-session.js(用于在多进程时将客户端连接到同一个server)
  |  worker.js(启动入口)

*注意 sticky-session只能在nodejs v4版本使用，v6无法使用*
