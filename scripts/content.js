var titleToContentId = {};
var data_course_id = 0, data_user_login = 0, data_user_id = 0;

var check = 0;

function sleep(ms) {
  const wakeUpTime = Date.now() + ms;
  while (Date.now() < wakeUpTime) { }
}

// name에 해당하는 쿠키 값을 리턴하는 함수
function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (var i = 0; i < cookies.length; ++i) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

// background.js에 다운로드 메시지 보내기
function sendDownloadMessage(myUrl, myFilename) {
  chrome.runtime.sendMessage({
    action: "download",
    url: myUrl,
    filename: myFilename
  });
}

// addDownloadButton에서 button의 click event에서 
// pdf에 해당하는 content id가 있을 경우 호출됨
function downloadPDF(title) {
  pdfname = title + '.pdf';
  pdflink = 'https://hycms.hanyang.ac.kr/contents14/hanyang101/' + titleToContentId[pdfname] + '/contents/web_files/original.pdf';
  sendDownloadMessage(pdflink, pdfname);
}

// window.onload에서 호출됨 (file type이 pdf인 경우만 호출함, 후에 file 확장 가능성 있음)
// allcomponents_db request 보내고 title과 content id를 전역변수에 저장하기
function sendRequestOfLists(type) {
  const token = getCookie('xn_api_token');
  console.log(token);

  const request = new XMLHttpRequest();
  const url = 'https://learning.hanyang.ac.kr/learningx/api/v1/courses/' + data_course_id + '/allcomponents_db?user_id=' + data_user_id + '&user_login=' + data_user_login + '&role=1';
  request.open('GET', url, true);
  request.setRequestHeader('Accept', 'application/json');
  request.setRequestHeader('Authorization', 'Bearer ' + token);
  request.onload = function () {
    content_list = JSON.parse(request.response);
    console.log(content_list);
    for (var i = 0; i < content_list.length; ++i) {
      if (content_list[i].commons_content) {
        if (content_list[i].commons_content.content_type == type) {
          console.log(content_list[i].commons_content.view_url);
          titleToContentId[content_list[i].commons_content.file_name] = content_list[i].commons_content.content_id;
        }
      }
    }
  };
  request.send();
}

// init함수에서 component-wrapper 노드가 추가될 때 호출됨
function addDownloadButton(element, title) {

  // 버튼이 이미 있는지 확인
  if (element.querySelector("button")) return;

  // 버튼 엘리먼트 생성
  var but = document.createElement("button");
  but.innerHTML = "Download";

  if (titleToContentId[title + '.pdf']) element.appendChild(but);

  but.addEventListener("click", function (event) {
    but.style.backgroundColor = 'darkGray';
    event.stopPropagation();
    // pdf에 해당하는 content id가 있을 경우 downloadPDF 함수 호출
    if (titleToContentId[title + '.pdf']) downloadPDF(title);
  });
  
}

function init() {
  // iframe의 id가 root인 div 가져오기
  const iframe = document.getElementById("tool_content");
  const root = iframe.contentWindow.document.getElementById("root");

  // 전역변수 초기화하기
  data_course_id = root.getAttribute('data-course_id');
  data_user_login = root.getAttribute('data-user_login');
  data_user_id = root.getAttribute('data-user_id');
  console.log(data_course_id, data_user_login, data_user_id);
  // root 엘리먼트에 새로운 component-wrapper 노드가 추가되면 다운로드 버튼 추가 함수 호출하기
  root.addEventListener('DOMNodeInserted', function () {
    const components_type1 = root.getElementsByClassName("xncb-component-wrapper  ");
    for (var i = 0; i < components_type1.length; ++i) {
      addDownloadButton(components_type1[i], components_type1[i].getElementsByClassName("xncb-component-title")[0].innerHTML);
    }
    const components_type2 = root.getElementsByClassName("xnci-description pdf");
    for (var i = 0; i < components_type2.length; ++i) {
      console.log(components_type2[i]);
      console.log(components_type2[i].getElementsByClassName("xnci-component-title")[0].innerHTML);
      addDownloadButton(components_type2[i].getElementsByClassName("xnci-component-description-row-right")[0], components_type2[i].getElementsByClassName("xnci-component-title")[0].innerHTML);
    }
  });
}

window.onload = function () {
  init();
  sendRequestOfLists('pdf');
}