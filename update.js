//// configuration

var protect_list = [ "update.js"
                    ,"update.cmd"
                    ,"wget.exe"
                    ,"libeay32.dll"
                    ,"ssleay32.dll"
                    ];

var admin_list = [ "L_Ne"
                   ,"^-^"
                   ,"^-^|^-^"
                   ];

var admin_ip_list = [ "w130166.ppp.asahi-net.or.jp"
                   ,"gw.lis-net.co.jp"
                   ,"127.0.0.1"
                   ];

//// utilities

Array.prototype.include = function(x, proc) {
  var i;

  for (i = 0; i < this.length; i++) {
    if (proc(this[i], x))
      return true;
  }
  return false;
};

function textcmp(a, b)
{
  return a.toLowerCase() == b.toLowerCase();
}

function event::onChannelText(prefix, channel, text)
{
  if (!text.match(/^script_bot更新/))
    return;

  var f = text.match(/(\w+\.(js|cmd|txt))/);
  if (!f) {
    send(channel, "対象外のファイルは更新できません：" + f[1]);
    return;
  }

  // 保護リストに入っていたら
  if (protect_list.include(f[1], textcmp)) {
    send(channel, "保護対象ファイルは更新できません：" + f[1]);
    return;
  }

  // 管理者リスト、管理者アドレスのユーザーでないなら
  if (!admin_list.include(prefix.nick, textcmp) || !admin_ip_list.include(prefix.address, textcmp)) {
    send(channel, "管理者以外は更新できません．");
    return;
  }


  var l = userScriptPath;
  var c = 'cmd.exe';
  var p = '/c \"' + l + '\\update.cmd\" ' + f[1] + ' ' + l;
  shellOpen(c , p);
//  send(channel, "対象ファイルを更新しました：" + userScriptPath + "\\" + f[1]);
  send(channel, "対象ファイルを更新しました：" + f[1]);
}
