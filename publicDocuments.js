/**
 * Blobのユーティリティクラス
 */
class BlobUtil {

  /**
   * Blobを取得（文字列ベース）
   * @param {Uint8Array} u8 元データ
   * @param {string} filename ファイル名
   * @param {string} charset 文字コード
   * @return {Blob}
   */
  static getBlobForString(u8, filename, charset='UTF8') {
    let s = Array.from(u8, e => String.fromCharCode(e)).join("")

    // 文字コード判定
    let enc = encodingjs.Encoding.detect(u8)

    if (enc == charset) {
      // 文字コード指定あり
      s = decodeURIComponent(escape(encodingjs.Encoding.convert(s, charset)))
      return Utilities.newBlob('', null, filename).setDataFromString(s).setContentTypeFromExtension()
    } else {
      // 文字コード指定なし
      s = decodeURIComponent(escape(encodingjs.Encoding.convert(s)))
      return Utilities.newBlob('', null, filename).setDataFromString(s).setContentTypeFromExtension()
    }
  }

  /**
   * Blobを取得（バイナリベース）
   * @param {Uint8Array} u8 元データ
   * @param {string} filename ファイル名
   * @return {Blob}
   */
  static getBlobForBinary(u8, filename) {
    let ba = []
    for (const value of u8.values()) {
      ba.push(value)
    }
    return Utilities.newBlob(ba, null, filename).setContentTypeFromExtension()
  }
}

/**
 * Cookieのユーティリティクラス
 */
class CookieUtil {
  /**
   * 値を抽出
   * @param {string} cookie Cookieデータ（"name=value;")
   * @return {string} value
   */
  static getValue(cookie) {
    const fromIndex = cookie.indexOf('=')
    const toIndex = cookie.indexOf(';')
    return cookie.substring(fromIndex+1, toIndex)
  }
}

/**
 * 配列のユーティリティクラス
 */
class ArrayUtil {
  /**
   * 第一引数の二次元配列を第二引数のインデックスの値の一次元配列に変換して取得
   * @param {array} twoDs 2次元配列
   * @param {number} targetIndex 列番号(0始まりであることに注意)
   * @return {array} 一次元配列
   */
  static getColumnValues(twoDs, targetIndex) {
    let oneDs = []
    twoDs.forEach((value) =>
      oneDs.push(value[targetIndex])
    )
    return oneDs
  }
}

/**
 * SmartHRのクライアント情報を扱うクラス
 */
class SmartHrClient {
  /**
   * コンストラクタ
   * @param {array} rowData クライアントリストの行データ
   * @param {LoginInfo} loginInfo SmartHRのログイン情報
   */
  constructor(rowData, loginInfo) {
    this.rowData = rowData
    this.loginInfo = loginInfo
  }

  /**
   * 会社名のgetter
   * @return {string} 会社名
   */
  get companyName() {
    return this.rowData[0]
  }

  /**
   * SmartHRのURLのgetter
   * @return {string} URL
   */
  get smartHrUrl() {
    return this.rowData[1]
  }

  /**
   * Google Drive保管先のURLのgetter
   * @return {string} URL
   */
  get driveUrl() {
    return this.rowData[2]
  }

  /**
   * ドライブ保管場所のIDを取得
   * @return {string} ID
   */
  getDriveFolderId() {
    return this.driveUrl.replace('https://drive.google.com/drive/folders/', '')
  }

  /**
   * SmartHRのログイン画面URLを取得
   * @return {string} URL
   */
  getSmartHrLoginUrl() {
    return this.makeUrlForSmartHr('/login')
  }

  /**
   * ドメイン名までのURLを取得
   */
  getSmartHrBaseUrl() {
    const url = this.smartHrUrl
    const domain = url.match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/)[1];
    return 'https://' + domain
  }

  makeUrlForSmartHr(appendUrl) {
    if (appendUrl.substring(0, 1) !== '/') {
      appendUrl = '/' + appendUrl
    }

    return this.getSmartHrBaseUrl() + appendUrl
  }

  /**
   * SmartHRへのリクエストに必要なリクエストヘッダーを取得
   * @return {Object} リクエストヘッダー
   */
  getBaseHeaders() {
    return {
      'Cookie': 'utm_campaign=; utm_content=; utm_medium=; utm_source=organic; utm_term=;'
      + '_smarthr_session_id=' + this.sessionId + '; utm_campaign=; utm_content=; utm_medium=; utm_source=organic; utm_term=;'
      + ' _smarthr_x_session_key=' + this.sessionXKey + '; ',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.5 Safari/605.1.15',
      'Accept-Language': 'ja-jp',
      'Connection': 'keep-alive'
    }
  }

  /**
   * ログイン処理
   */
  login() {

    let response, content, parser, payload, options, headers, cookies, token, tokenTag, sessionId, sessionXKey

    // ----------
    // ログイン画面(GET)
    // console.log(this.getSmartHrLoginUrl())
    response = UrlFetchApp.fetch(this.getSmartHrLoginUrl())
    cookies = response.getHeaders()["Set-Cookie"];
    content = response.getContentText("UTF-8")
    parser = Parser.data(content)
    tokenTag = parser
    .from('<input type="hidden" name="authenticity_token"')
    .to('/>')
    .build()
    token = tokenTag.match(/value="(.*)"/)[1]
    // console.log(token)


    cookies = response.getHeaders()["Set-Cookie"];
    // console.log(cookies)
    sessionId = CookieUtil.getValue(cookies)
    // console.log(sessionId)

    // ----------
    // ログインフォーム送信(POST)
    headers = {
      'Cookie': 'utm_campaign=; utm_content=; utm_medium=; utm_source=organic; utm_term=;'
      + ' _smarthr_session_id=' + sessionId + '; utm_campaign=; utm_content=; utm_medium=; utm_source=organic; utm_term=;',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.5 Safari/605.1.15',
      'Accept-Language': 'ja-jp',
      'Connection': 'keep-alive'
    }
    payload = {
      'authenticity_token': token,
      'utf8': '✓',
      'user[login]': this.loginInfo.loginId,
      'user[password]': this.loginInfo.password,
      'user[redirect_subdomain]': '',
      'user[redirect_path]': ''
    }

    options = {
      'method': 'post',
      'headers': headers,
      'payload': payload,
      'followRedirects': false
    }
    response = UrlFetchApp.fetch(this.getSmartHrLoginUrl(), options)
    content = response.getContentText("UTF-8")
    cookies = response.getAllHeaders()['Set-Cookie'][0]
    //console.log(cookies)
    sessionXKey = CookieUtil.getValue(cookies)
    // console.log(sessionXKey)
    //console.log(content)

    cookies = response.getHeaders()["Set-Cookie"];
    // console.log(cookies)
    sessionId = CookieUtil.getValue(cookies)
    // console.log(sessionId)

    this.sessionId = sessionId
    this.sessionXKey = sessionXKey
  }

  /**
   * 電子申請の処理
   */
  requests() {

    let options, response, content, parser

    // ----------
    // クライアントの申請一覧画面(GET)
    options = {
      'method': 'get',
      'headers': this.getBaseHeaders(),
      'followRedirects': false,
      'muteHttpExceptions': true
    }

    console.log(this.smartHrUrl)
    response = UrlFetchApp.fetch(this.smartHrUrl, options)
    if (response.getResponseCode() != 200) {
      console.log('処理が実行できませんでした')
      return
    }

    content = response.getContentText("UTF-8")
    // console.log(content)

    const tableHtml = "<table class='table valign-middle js-egov-requests-table'>"
    if (content.indexOf(tableHtml) < 0) {
      console.log('tableがありません.');
      return
    }
    content = content.split('\n').join()
    parser = Parser.data(content)

    let tableTag = parser.from(tableHtml).to('</table>').build()

    const TARGET_STATUS = '審査終了'

    if (tableTag.indexOf(TARGET_STATUS) < 0) {
      console.log('対象のレコードがありません')
      return
    }

    parser = Parser.data(tableTag)
    let tbodyTag = parser.from('<tbody>').to('</tbody>').build()
    parser = Parser.data(tbodyTag)
    let trTags = parser.from('<tr').to('</tr>').iterate()

    for (const i in trTags) {
      let trTag = trTags[i]
      parser = Parser.data(trTag)
      let tdTags = parser.from('<td').to('</td>').iterate()

      let hasTarget = false

      for (const j in tdTags) {
        let tdTag = tdTags[j]
        parser = Parser.data(tdTag)

        if (j == 1) {
          let spanTag = parser.from('<span').to('/span>').build()
          parser = Parser.data(spanTag)
          let status = parser.from('>').to('<').build()
          if (status === TARGET_STATUS) {
            hasTarget = true
          }
        }

        // 申請詳細のURLを取得
        if (j == 3 && hasTarget) {
          let aTag = parser.from('<a').to('</a>').build()
          let detailUrl = parser.from('href="').to('"').build()

          console.log(detailUrl)

          // 添付ファイルをアップロード
          this.uploadFilesToDrive(detailUrl)
        }
      }
    }

    // アーカイブ
//    options = {
//      'method': 'get',
//      'headers': this.getBaseHeaders(),
//      'followRedirects': false,
//      'muteHttpExceptions': true
//    }
//    response = UrlFetchApp.fetch(detailUrl + '/archive?archive=true', options)

  }

  /**
   * ダウンロード→Driveにアップロードの処理
   */
  uploadFilesToDrive(detailUrl) {

    let options, response, content, parser

    // ----------
    // クライアントの申請詳細画面(GET)
    options = {
      'method': 'get',
      'headers': this.getBaseHeaders(),
      'followRedirects': false
    }
    response = UrlFetchApp.fetch(this.makeUrlForSmartHr(detailUrl), options)
    content = response.getContentText("UTF-8")
    if (content.indexOf('到達番号:') < 0) {
      console.log('到達番号が見つかりません')
      return
    }

    parser = Parser.data(content)
    let totatsuBango = parser.from('到達番号:').to('<').build()
    totatsuBango = totatsuBango.substring(1, totatsuBango.length-1)

    let parentFolder = DriveApp.getFolderById(this.getDriveFolderId())

    console.log('到達番号='+totatsuBango)

    const uploadFolder = parentFolder.createFolder(totatsuBango)

    let aTags

    // 公文書
    const documentsHtml = "<div class='documents'>"
    if (content.indexOf(documentsHtml) >= 0) {
      const documentsTag = parser.from(documentsHtml).to('</div>').build()
      parser = Parser.data(documentsTag)
      aTags = parser.from('<a').to('</a>').iterate()
      for (const i in aTags) {
        const aTag = aTags[i]
        parser = Parser.data(aTag)
        const downloadUrl = parser.from('href="').to('"').build()
        console.log(downloadUrl)

        this.upload(downloadUrl, uploadFolder)
      }
    } else {
      console.log('公文書なし')
    }

    // コメント通知
    const commentsHtml = "<div class='comments'>"
    if (content.indexOf(commentsHtml) >= 0) {
      parser = Parser.data(content)
      const commentsTag = parser.from(commentsHtml).to('</div>').build()
      parser = Parser.data(commentsTag)
      aTags = parser.from('<a').to('</a>').iterate()
      for (const i in aTags) {
        const aTag = aTags[i]
        parser = Parser.data(aTag)
        const downloadUrl = parser.from('href="').to('"').build()
        console.log(downloadUrl)

        this.upload(downloadUrl, uploadFolder)
      }
    } else {
      console.log('コメント通知なし')
    }
  }

  /**
   * アップロード処理の本体
   * @param {string} downloadUrl ダウンロード対象のURL
   * @param {Folder} uploadFolder アップロード先のフォルダ
   */
  upload(downloadUrl, uploadFolder) {
    let options, response, content, parser

    options = {
      'method': 'get',
      'headers': this.getBaseHeaders()
    }
    response = UrlFetchApp.fetch(this.makeUrlForSmartHr(downloadUrl), options)

    let byteary = Utilities.newBlob(response.getContent(), 'application/zip', 'tmp.zip').setContentTypeFromExtension().getBytes()

    let a = new Uint8Array(byteary)

    let unzip = new unzipjs.Zlib.Unzip(a)

    let filenames = unzip.getFilenames()

    for (const i in filenames) {
      const filename = filenames[i]

      let u8 = unzip.decompress(filename)

      let convertedFilename = encodingjs.Encoding.convert(filename)

      let enc = encodingjs.Encoding.detect(u8)

      let blob

      if (enc == 'UTF8') {
        blob = BlobUtil.getBlobForString(u8, convertedFilename, enc)
      } else if (enc == 'BINARY' || enc == 'UTF32') {
        blob = BlobUtil.getBlobForBinary(u8, convertedFilename)
      } else {
        blob = false
      }

      if (blob) {
        uploadFolder.createFile(blob)
      } else {
        console.log('unzipエラー: ' + convertedFilename)
      }
    }
  }
}

/**
 * SmartHRのクライアントリストを扱うクラス
 */
class SmartHrClients {
  /**
   * コンストラクタ
   * @param {Sheet} sheet クライアントリストシート
   */
  constructor(sheet, loginInfo) {
    this.sheet = sheet
    const lastDataRow = sheet.getRange(sheet.getLastRow(), 2).getNextDataCell(SpreadsheetApp.Direction.UP).getRow()
    this.values = sheet.getRange(2, 1, lastDataRow-1, 3).getValues()

    // クライアントオブジェクトを作成
    this.clients = []
    for (const i in this.values) {
      const rowData = this.values[i]
      this.clients.push(new SmartHrClient(rowData, loginInfo))
    }
  }

  /**
   * URL一覧を取得
   * @return {array} URL一覧
   */
  getUrls() {
    return ArrayUtil.getColumnValues(this.values, 1)
  }

  /**
   * 全てのクライアントオブジェクトを取得
   * @return {array} クライアントオブジェクトリスト
   */
  getClients() {
    return this.clients
  }
}

/**
 * SmartHRのログイン情報を扱うクラス
 */
class SmartHrLoginInfo {
  /**
   * コンストラクタ
   * @param {Sheet} sheet ログイン情報を記載したシート
   */
  constructor(sheet) {
    this.sheet = sheet
    this.loginId = sheet.getRange(2, 2).getValue()
    this.password = sheet.getRange(3, 2).getValue()
  }
}

/**
 * SmartHRダウンロード対象を扱うクラス
 */
class SmartHrDownloadList {

  /**
   * コンストラクタ
   * @param {Spreadsheet} ss SmartHRダウンロードリストのSpreadsheet
   */
  constructor(ss) {
    this.smhrLoginInfo = new SmartHrLoginInfo(ss.getSheetByName('ID'))

    const date = new Date()
    const ymd = Utilities.formatDate(date, 'Asia/Tokyo', 'yyyyMMdd')
    const urlSheetName = 'URL' + '_' + ymd

    let urlSheet = ss.getSheetByName(urlSheetName)
    if (!urlSheet) {
      urlSheet = ss.getSheetByName('URL').copyTo(ss).setName(urlSheetName)
    }

    this.smhrClients = new SmartHrClients(urlSheet, this.smhrLoginInfo)
  }

  /**
   * 全てのクライアントオブジェクトを取得
   * @return {array} クライアントオブジェクトリスト
   */
  getClients() {
    return this.smhrClients.getClients()
  }
}




/**
 * 公文書自動化のmain関数
 */
function mainPublicDocuments () {

  // const startTime = new Date().getTime()

  let listSs = SpreadsheetApp.openById('スプレッドシートのID')

  const dl = new SmartHrDownloadList(listSs)

  const clients = dl.getClients()

  let rowNum = 2

  for (const i in clients) {
    // const nowTime = new Date().getTime()
    // if ((nowTime - startTime) > 300000) {
    //   break
    // }

    const stateCell = dl.smhrClients.sheet.getRange(rowNum, 4)
    if (stateCell.getValue() !== '済') {
      const client = clients[i]

      // 認証
      client.login()

      // 申請の処理
      client.requests()

      dl.smhrClients.sheet.getRange(rowNum, 4).setValue('済')
    }

    rowNum += 1
  }
}
