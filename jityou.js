//// configuration
var DEBUG_MODE = false;

var friend_list = [ "script_bot"
                   ,"logbird"
                   ,"AT6"
                   ,"^-^"
                   ];

var alias_list = { "リア充": [/nya$/, /^n_/, /^tori/, /^t_[^s]/, /^t[^_aors]/,/^rui/]
                  ,"t": [ /^tori/, /^t_[^s]/, /^t[^_aors]/]
                  ,"三ッ星": [/stars/]
                  ,"性☆覇": [/seiha/]
                  ,"エロゲ": [/hama/]
                  ,"えろげ": [/hama/]
                  ,"下らんネタ": [/Fami/]
                  ,"下らないネタ": [/Fami/]
                  ,"fam": [/Fami/]
                  ,"f": [/Fami/]
                  ,"s": [/kuri/, /S_S_O/]
                  ,"部長": [/maed/]
                  ,"さんぷる": ["sample", /ok_to_use_regexp/]
                  };

var registance_probability = 30; //jityouでの反逆確率. 0-100

var door_man_nick = "AT6"; //ドアマンする人のnick
var door_man_notifier = "door2"; //ドアマンにお知らせする人のnick
var door_man_notify_channel = "#tucc"; //ドアマンがお知らせするためのchannel
var door_man_warning_message = "Door opened"; //ドアマンがしゃべるお言葉

//// utilities

Array.prototype.include = function(x, proc) {
  var i;
  var p = proc || function(x,y){return x == y;};

  for (i = 0; i < this.length; i++) {
    if (p(this[i], x))
      return true;
  }

  return false;
};

Array.prototype.filter = function(proc) {
  var i;
  var r = [];

  for (i = 0; i < this.length; i++) {
    if (proc(this[i])) {
      r.push(this[i]);
    }
  }

  return r;
};

Array.prototype.sub = function(x, proc) {
  return this.filter(function(i){return !x.include(i, proc);});
};

Array.prototype.map = function(proc) {
  var i;
  var r = [];

  for (i = 0; i < this.length; i++) {
    r.push(proc(this[i]));
  }

  return r;
};

Array.prototype.each = function(proc) {
  var i;
  for (i = 0; i < this.length; i++) {
    proc(this[i]);
  }
  return this;
};

Array.prototype.random_element = function() {
  if (this.length == 0) {
    return;
  } else {
    return this[Math.floor(Math.random()*this.length)];
  }
};

//http://parentnode.org/javascript/default-arguments-in-javascript-functions
Function.prototype.defaults = function()
{
  var _f = this;
  var _a = Array(_f.length-arguments.length).concat(
    Array.prototype.slice.apply(arguments));
  return function()
  {
    return _f.apply(_f, Array.prototype.slice.apply(arguments).concat(
      _a.slice(arguments.length, _a.length)));
  }
}

function array(obj)
{
  var ary = [];
  var i;
  for (i = 0; i < obj.length; i++) {
    ary[i] = obj[i];
  }
  return ary;
}

function nickcmp(a, b)
{
  return a.toLowerCase() == b.toLowerCase();
}

function z2h(src)
{
  return src.replace(/([Ａ-Ｚａ-ｚ０-９＾－＿])/g,
    function (x) {
      return String.fromCharCode(x.charCodeAt(0) - 65248);
    });
}

function findTarget(channel, target)
{
  return findTargets(channel, target).random_element();
}

//targetが指すニックネームを配列で返す．
//無い場合は空の配列を返す．
function findTargets(channel, target)
{
  if (channel.findMember(target))
    return [target];

  var alias = alias_list[target];
  if (!alias) return [];

  var nya = [];
  var list = array(channel.members());

  alias.each(function(pattern) {
    list.each(function(member) {
      if (member.nick.match(pattern)) {
        nya.push(member.nick);
        // throw $break; // ← $break で大域脱出は未実装
      }
    });
  });

  return nya;
}


//// application

// send a message to twitter
function saytwitter(text)
{
  if (!DEBUG_MODE) {
    var user = 'tuccnotifier'; // username
    var pass = 'tucc1234567'; // password

    var req = new ActiveXObject("Microsoft.XMLHTTP");
    if (req) {
      req.onreadystatechange = function() {
        if (req.readyState == 4) {
          log('POST OK: ' + req.responseText);
        }
      }
      req.open('POST', 'http://twitter.com/statuses/update.json', true, user, pass);
      req.send('status=' + encodeURI(text));
    }
  }
}

// 呼ばれて欲しい関数を入れる器
var procs = new Object;
var procs2 = []; //set_proc用

//第二引数procは関数である必要がある．
//以下に関数procが取る引数の仕様を示す．
//
//1. String  speaker - 発話者
//2. Channel c       - 発話されたチャンネルを表すオブジェクト
//3. Array   m       - text.match(pattern)の結果
//
//function(Prefix prefix, String channel, String text) {...}として
//順次格納するため主にonChannel系のイベントに用いる.
var set_proc = (function(pattern, proc, hasop) {
  procs2.push(function(prefix, channel, text) {
    var m;
    
    if ((m = text.match(pattern))) {
      var speaker = prefix.nick;
      var c = findChannel(channel);

      if (hasop) {
        var myself = c.findMember(myNick);
        if (!myself.op)
          return;
      }
      
      proc(speaker, c, m);
    }
  });
}).defaults(true);

procs.jityou = function(prefix, channel, text) {
  var m;

  if ((m = (text.match(/(\S+)\s*(自重(して|しろ|しる|汁)?|[死氏市誌紙](ね|んで|んでよ?)|[をも]攻撃)\s*[!！1１]*/)))) {
    var orig_target = z2h(m[1]);
    var speaker = prefix.nick;
    var c = findChannel(channel);
    var myself = c.findMember(myNick);

    // 自分がオペレータじゃなければ何もしない
    if (!myself.op)
      return;

    var target = findTarget(c, orig_target);

    // ターゲットが存在しなければ何もしない
    if (!target) {
      return;
    }

    // 自己保護
    if (nickcmp(target, myNick)) {
      kick(channel, speaker, "保護機能作動");
      saytwitter(speaker+"は粛正されました。");
      return;
    }

    //logbird保護
    if (nickcmp(target, "logbird")) {
      kick(channel, speaker, "logbird保護機能作動");
      saytwitter(speaker+"は粛正されました。");
      return;
    }

    // 保護リストに入っていたら
    if (friend_list.include(target, nickcmp)) {
      return;
    }

    //保護以外
    if (Math.random()*100 < registance_probability) { //反逆
      kick(channel, speaker, "反逆を受けた");
      if (orig_target == target) {
        saytwitter(speaker+"は"+target+"より反逆を受け，自重しました。");
      } else {
        saytwitter(speaker+"は"+orig_target+"("+target+")より反逆を受け，自重しました。");
      }
    } else {
      kick(channel, target, "自重");
      if (orig_target == target) {
        saytwitter(target+"は自重しました。");
      } else {
        saytwitter(orig_target+"("+target+")は自重しました。");
      }
    }
  }
};

procs.po = function(prefix, channel, text) {
  var m;

  if ((m = text.match(/^po>(.*)$/i))) {
    var targets = m[1].split(/\s/);
    var speaker = prefix.nick;
    var c = findChannel(channel);
    var myself = c.findMember(myNick);

    // ターゲットが存在しなければ発言者をセット
    if (targets.length == 0) {
      targets = [speaker];
    } else {
      targets = targets.map(z2h);
    }

    // 自分がオペレータじゃなければ何もしない
    if (!myself.op)
      return;

    targets = targets.sub([myNick, "logbird"], nickcmp);
    targets = targets.sub(friend_list, nickcmp);

    // 保護以外
    for (var i = 0; i < targets.length; i++) {
      var target = findTarget(c, targets[i]);
      // 存在する相手にのみ発行
      if (target)
        mode(channel, '-o ' + target);
    }
  }
};

set_proc(/(\S+)\s*(お[手て])/,
         function(speaker, c, m) {
           var orig_target = z2h(m[1]);
           var target = findTarget(c, orig_target);
           if (!target)
             return;

           if (nickcmp(target, myNick)) {
             send(c.name, 'わん');
           }
         },
         false);

// entry point
function event::onChannelText(prefix, channel, text)
{
  for (var f in procs) {
    if (procs.hasOwnProperty(f)) {
      procs[f](prefix, channel, text);
    }
  }
  procs2.each(function(proc) {
    proc(prefix, channel, text);
  });
}

function event::onTalkText(prefix, targetNick, text)
{
  var speaker = prefix.nick;

  //侵入検知用
  if (myNick == door_man_nick && speaker == door_man_notifier) {
    send(door_man_notify_channel, door_man_warning_message);
  }
}

function event::onPart(prefix, channel, comment)
{
  procs.jityo(prefix, channel, comment);
}

function event::onQuit(prefix, comment)
{
  //暫定的に #tucc 内にいる人を対象
  procs.jityo(prefix, "#tucc", comment);
}
