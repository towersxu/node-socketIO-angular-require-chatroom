/**
 * Created by taox on 15-5-19.
 */

window.onload = (function(){
  var socket = io(),
    msgBox = document.getElementById('msgBox'),
    msgBox1 = document.getElementById('msgBox1');
  //msgBox.addEventListener('keyup',function(e){
  //  if(e.keyCode == 13){
  //    socket.emit('chat message',msgBox.value);
  //    msgBox.value = '';
  //  }
  //},false);
  //
  //msgBox1.addEventListener('keyup',function(e){
  //  if(e.keyCode == 13){
  //    socket.emit('new message',msgBox1.value);
  //    msgBox1.value = '';
  //  }
  //},false);

  socket.on('room info',function(msg){
    console.log(msg)
  });
});