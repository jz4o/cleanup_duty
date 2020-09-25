// slack定義
var slack = {
  incomingUrl: PropertiesService.getScriptProperties().getProperty('SLACK_INCOMING_URL')
}

//メンバー・役割のデータをスプレッドシートから取得
var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
var sheet = spreadSheet.getSheetByName('担当者');
var lastrow = sheet.getLastRow();
var fixedDutiesSheet = spreadSheet.getSheetByName('固定担当者');

//先頭行はタイトルのため除外
var members = sheet.getSheetValues(2, 1, lastrow-1, 1);
var roles = sheet.getSheetValues(2, 2, lastrow-1, 1);

//配列をシャッフル
function randomize(array){
  var randomized = [];
  var len;
  while(len = array.length){
    var elm = array.splice(Math.floor(Math.random() * len),1)[0];
    randomized.push(elm);
  }
  return randomized;
}

//配列の順番を回す
function turnOver(array){
  array.unshift(array[array.length-1])
  array.pop();
  return array;
}

//メンバーに掃除当番を割当て、Slackで通知
function assignCleaningUpTasks() {
  var msg = "";

  var currentYear = new Date().getYear();
  var prevYear    = currentYear - 1;
  var nextYear    = currentYear + 1;

  // 毎年 8/13～8/15 は夏季休業のためBotを実行しない
  if (todayIsBetweenTo(currentYear + '/08/13', currentYear + '/08/15')) {
    return;
  }

  // 毎年 12/28～1/3 は年末年始休業のためBotを実行しない
  var isHolidayForEndOfYear   = todayIsBetweenTo(currentYear + '/12/28', nextYear + '/01/03');
  var isHolidayForStartOfYear = todayIsBetweenTo(prevYear + '/12/28', currentYear + '/01/03');
  if (isHolidayForEndOfYear || isHolidayForStartOfYear) {
    return;
  }

  //平日のみ実行（祝日も除く）
  var currentDate = new Date();
  var today = Utilities.formatDate(currentDate, 'JST', 'M/d');
  var weekday = currentDate.getDay();
  if (weekday == 0 || weekday == 6) {
    return;
  }
  var calendar = CalendarApp.getCalendarById('ja.japanese#holiday@group.v.calendar.google.com');
  if (calendar.getEventsForDay(currentDate, {max: 1}).length > 0) {
    return;
  }
  var todayDuties = turnOver(roles);  //順番で回す
  //var todayDuties = randomize(roles);   //ランダムで割当

  for(var i = 0; i < todayDuties.length; i++){
    msg = msg + ">" + (members[i]+ "　　　　　").slice(0,4) + "： " + todayDuties[i] + "\n";
    //順番を回す場合はスプレッドシート上書き
    sheet.getRange(i+2, 2).setValue(todayDuties[i]);
  }
  //Browser.msgBox(msg); //テスト用

  // 担当箇所固定の担当者
  fixedDuties = fixedDutiesSheet.getDataRange().getValues();
  // タイトル行を飛ばすため 1 からスタート
  for (var i = 1; i < fixedDuties.length; i++) {
    var fixedDuty = fixedDuties[i];
    msg = msg  + ">" + (fixedDuty[0] + "　　　　　").slice(0,4) + "： " + fixedDuty[1] + "\n";
  }

  //Slackにメッセージを送る
  test_message = "<!channel>" + " 本日（" + today + "）の掃除当番です:dusty_stick:\n\n \n" + msg + "";
  postMessage(test_message);
}

//メンバー役割に変更があったときなどに利用
function sheetAdjust(){
  packColumn(1);       //1列目(Member列)から空白を削除(余分だけど、休みも削除するようになってる)
  packColumn(2);       //2列目(Role列)から空白と休みを削除
  restAdjust();        //Role列に良い感じに休みを追加
  randomizeMembers();  //メンバの順番をシャッフル
}

//指定された列の余分な行を削除する
function packColumn(column){
  switch(column){
    case 1:
      array = members;
      break;
    case 2:
      array = roles;
      break;
    default:
      return
  }

  REST = '不在者フォロー';
  SPACE = '';

  //arrayから休みや空白行を削除する
  for(var i = array.length-1; i >= 0 ; i--){
    if(array[i] == REST || array[i] == SPACE){
      array.splice(i,1);
    }
  }
  //列の内容を削除する
  sheet.getRange(2, column, lastrow-1, 1).clear();

  //シートを上書きする
  for(var i = 0; i < array.length; i++){
    sheet.getRange(i+2, column).setValue(array[i]);
  }
}

//Role列に良い感じに休みを追加する
function restAdjust(){
  array = roles;

  restsize = members.length - array.length;     //休みの数
  restspan = (members.length / restsize) - 1;        //休みの間隔

  //休みを良い感じの間隔で挿入する
  for(var i = 0; i < restsize; i++){
    array.splice(Math.round((restspan+1)*i), 0, REST);
  }

  //シートを上書きする
  for(var i = 0; i < array.length; i++){
    sheet.getRange(i+2, 2).setValue(array[i]);
  }
}

//メンバーの順番をシャッフル
//※メンバー・役割に変更があったときなどに利用
function randomizeMembers(){
  var newOrder = randomize(members);   //ランダムで割当
  for(var i = 0; i < newOrder.length; i++){
    sheet.getRange(i+2, 1).setValue(newOrder[i]);
  }
}

// 当日が指定範囲に含まれているか判定する
// 含まれている場合 `true`
function todayIsBetweenTo(fromDateString, toDateString){
  var today = new Date();

  var fromDate = new Date(fromDateString);
  var toDate   = new Date(toDateString);
  toDate.setHours(23, 59, 59, 999);

  return fromDate <= today && today <= toDate;
}

function postMessage(message){
  var options = {
    'method'     : 'post',
    'contentType': 'application/json',
    'payload'    : JSON.stringify({ 'text': message })
  };

  UrlFetchApp.fetch(slack.incomingUrl, options);
}

