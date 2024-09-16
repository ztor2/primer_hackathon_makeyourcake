function loadContent(page) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', page + '.html', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            document.getElementById('content').innerHTML = xhr.responseText;
            if (page === 'myorder') {
                loadOrders(); // 콘텐츠 로드 후에 loadOrders 호출
                loadAcceptances();
            }
            if (page === 'payment') {
                loadPaymentPage();
            }
        }
    };
    xhr.send();
}

function selectTemplate(templateId) {
    // 템플릿 선택 시 행동
    console.log("템플릿 " + templateId + " 선택됨");
}

function resetDesign() {
    // 디자인 초기화
    document.getElementById("cakeDescription").value = "";
    document.getElementById("resultImage").src = "img/result_sample.jpg";
}

let selectedImageId = '1';

function selectImage(selectedImg) {
    const images = document.querySelectorAll('.template-section img');
    images.forEach(img => {
        img.classList.remove('selected'); // 모든 이미지의 선택 테두리 제거
    });
    selectedImg.classList.add('selected'); // 클릭한 이미지에 테두리 추가

    // 선택된 이미지의 data-id 속성 값을 가져옴
    selectedImageId = selectedImg.getAttribute('data-id');
    console.log('Selected Image ID:', selectedImageId);
}

async function generateDesign(event) {
    if (event) event.preventDefault();
    const description = document.getElementById('cakeDescription').value;

    if (!selectedImageId || !description) {
        alert("케이크 템플릿을 선택하고 설명을 입력하세요.");
        return;
    }

    resultImage.src = 'img/loading_spinner.gif';
    resultImage.classList.remove('result-image')
    resultImage.classList.add('spinner-image');

    let translatedDescription;

    // 번역 작업
    try {
        const response = await fetch('http://localhost:3000/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Translation failed');
        }

        translatedDescription = data.translatedText;
    } catch (error) {
        console.error("Error translating text:", error);
        alert("번역 작업 중 오류가 발생했습니다.");
        return;  // 오류 발생 시 작업을 중단
    }

    // selectedImageId 값에 따라 텍스트 추가
    let prefix = '';
    switch (selectedImageId) {
        case '1':
            prefix = 'Round-shaped cake, ';
            break;
        case '2':
            prefix = 'Square-shaped cake, ';
            break;
        case '3':
            prefix = 'Two round-shaped cakes glued together at the top and bottom, ';
            break;
        default:
            break;
    }

    // 최종 번역된 설명에 prefix를 추가
    translatedDescription = prefix + translatedDescription;

    console.log('prompt:', translatedDescription)

    const formData = new FormData(); // FormData 객체를 생성합니다.

    // FormData에 데이터 추가
    formData.append('imageId', selectedImageId); // 이미지 ID 추가
    formData.append('description', translatedDescription); // 설명 추가

    fetch('http://localhost:3000/api/generate-image', {
        method: 'POST',
        body: formData, // JSON 대신 FormData 사용
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.imageUrl) {
            const imageUrl = data.imageUrl;
            // resultImage.src = imageUrl;
            document.getElementById('resultImage').src = imageUrl;
            resultImage.classList.remove('spinner-image')
            resultImage.classList.add('result-image');

            // 이미지 로드 성공 여부 확인을 위해 onload 이벤트 사용
            resultImage.onload = function() {
                console.log('이미지 로드 성공:', imageUrl);
            };

            resultImage.onerror = function() {
                console.error('이미지 로드 실패:', imageUrl);
                alert('이미지를 불러오는 데 실패했습니다.');
                resultImage.src = 'img/result_sample.jpg'; // 기본 이미지로 복원
            };
        } else {
            throw new Error('유효한 이미지 URL을 받지 못했습니다.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('이미지 생성에 실패했습니다.');
    });
}

function execDaumPostcode() {
    new daum.Postcode({
        oncomplete: function(data) {
            // 팝업에서 검색결과 항목을 클릭했을 때 실행할 코드를 작성하는 부분.

            // 주소 변수
            var addr = '';

            // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
            if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
                addr = data.roadAddress;
            } else { // 사용자가 지번 주소를 선택했을 경우(J)
                addr = data.jibunAddress;
            }

            // 우편번호와 주소 정보를 해당 필드에 넣는다.
            document.getElementById('postcode').value = data.zonecode;
            document.getElementById("address").value = addr;
        }
    }).open();
}


var db = new Dexie("OrderDatabase");
// DB 스키마를 정의합니다.
db.version(1).stores({
    orders: '++id, postcode, address, date, extradetail',
    acceptances: 'id, companyname, price, contact, message'
});
db.open().catch(function (err) {
    console.error("IndexedDB 오픈 에러: ", err.stack || err);
});

function registerOrder() {
    var postcode = document.getElementById('postcode').value;
    var address = document.getElementById('address').value;
    var date = document.getElementById('needDate').value;
    var extradetail = document.getElementById('extradetail').value;

    if (postcode && address && date && extradetail) {
        db.orders.add({
            postcode: postcode,
            address: address,
            date: date,
            extradetail: extradetail
        }).then(function(orderId) {
            // orderId는 자동으로 생성된 id 값입니다.
            console.log("주문이 성공적으로 등록되었습니다. 주문 ID:", orderId);

            // 주문 수락 데이터 생성 및 acceptances 테이블에 저장
            db.acceptances.add({
                id: orderId, // 자동 생성된 orderId를 사용
                companyname: '승희네케이크',
                price: '45000',
                contact: '010-3162-3434',
                message: '매장 연락 부탁드립니다.'
            }).then(function() {
                console.log("주문 수락 데이터가 성공적으로 저장되었습니다.");
            }).catch(function (error) {
                console.error("주문 수락 데이터 저장 중 에러가 발생했습니다: ", error);
            });
            loadContent('registersuccess');

        }).catch(function (error) {
            console.error("주문 등록 중 에러가 발생했습니다: ", error);
        });

    } else {
        alert("우편번호, 주소, 날짜를 모두 입력해주세요.");
    }
}

function loadOrders() {
    var orderCardsContainer = document.getElementById('orderCardsContainer');
    // orderCardsContainer.innerHTML = ''; // 기존 내용 지우기

    db.orders.toArray().then(function(orders) {
        if (orders.length === 0) {
            console.log("저장된 주문 내역이 없습니다.");
            return;
        }

        orders.forEach(function(order) {
            console.log("로드된 주문 데이터: ", order); // 콘솔에 로드된 데이터 확인

            var card = document.createElement('div');
            card.className = 'order-card';

            var img = document.createElement('img');
            img.src = 'output/result_generated.jpeg'; 
            img.alt = 'Order Image';

            var orderInfo = document.createElement('div');
            orderInfo.className = 'order-info';

            var orderId = document.createElement('p');
            orderId.textContent = '주문ID: ' + order.id;

            var orderAddress = document.createElement('p');
            orderAddress.textContent = '지역: ' + order.address;

            var orderDate = document.createElement('p');
            orderDate.textContent = '픽업날짜: ' + order.date;

            var extraDetail = document.createElement('p');
            extraDetail.textContent = '추가요청사항: ' + order.extradetail;

            orderInfo.appendChild(orderId);
            orderInfo.appendChild(orderAddress);
            orderInfo.appendChild(orderDate);
            orderInfo.appendChild(extraDetail);

            card.appendChild(img);
            card.appendChild(orderInfo);

            orderCardsContainer.appendChild(card);
        });
    }).catch(function (error) {
        console.error("주문 데이터를 불러오는 중 오류가 발생했습니다: ", error);
    });
}

// 업체 수락 내역 테이블 생성
function loadAcceptances() {
    // acceptance 테이블에서 모든 데이터를 가져옵니다.
    db.acceptances.toArray().then(function(acceptances) {
        // 테이블의 tbody 요소를 선택합니다.
        var tbody = document.querySelector('#acceptance-table tbody');
        // tbody의 내용을 초기화합니다.
        tbody.innerHTML = '';

        // 가져온 데이터를 순회하며 테이블에 행을 추가합니다.
        acceptances.forEach(function(acceptance) {
            // 새로운 행을 생성합니다.
            var tr = document.createElement('tr');

            // 각 컬럼에 해당하는 데이터를 생성합니다.
            var idCell = document.createElement('td');
            idCell.textContent = acceptance.id;
            tr.appendChild(idCell);

            var companyNameCell = document.createElement('td');
            companyNameCell.textContent = acceptance.companyname;
            tr.appendChild(companyNameCell);

            var priceCell = document.createElement('td');
            priceCell.textContent = acceptance.price;
            tr.appendChild(priceCell);

            var contactCell = document.createElement('td');
            contactCell.textContent = acceptance.contact;
            tr.appendChild(contactCell);

            var messageCell = document.createElement('td');
            messageCell.textContent = acceptance.message;
            tr.appendChild(messageCell);

            tr.addEventListener('click', function() {
                selectRow(tr, acceptance); // 행 선택 함수 호출
            });

            // 완성된 행을 테이블에 추가합니다.
            tbody.appendChild(tr);

            // 첫 번째 행을 자동으로 선택
            var firstRow = tbody.querySelector('tr');
            if (firstRow) {
            var firstAcceptance = acceptances[0]; // 첫 번째 데이터 사용
            selectRow(firstRow, firstAcceptance);
            }

        });
    }).catch(function(error) {
        console.error("주문 수락 데이터를 가져오는 중 에러가 발생했습니다: ", error);
    });
}

var selectedAcceptance = null;

function selectRow(row, acceptance) {
    // 모든 행의 선택 스타일 초기화
    var rows = document.querySelectorAll('#acceptance-table tbody tr');
   rows.forEach(function(r) {
       r.style.border = '';
       r.classList.remove('selected');
   });

   // 선택된 행에 테두리 스타일 추가
   row.style.border = '2px solid #a00c36';
   row.classList.add('selected');

    // 선택된 데이터를 저장
    selectedAcceptance = acceptance;

    // 결제 버튼 보이기
    document.getElementById('payment-button').style.display = 'block';
}

function proceedToPayment() {
    if (selectedAcceptance) {
        // 로컬 스토리지에 선택된 데이터를 저장
        localStorage.setItem('selectedAcceptance', JSON.stringify(selectedAcceptance));

        // 결제 페이지로 이동 (payment.html 예시)
        loadContent('payment');
    } else {
        alert("결제할 주문을 선택해주세요.");
    }
}

function loadPaymentPage() {
    var selectedAcceptance = JSON.parse(localStorage.getItem('selectedAcceptance'));
    if (selectedAcceptance) {
        document.getElementById('order-id').textContent = selectedAcceptance.id;
        document.getElementById('company-name').textContent = selectedAcceptance.companyname;
        document.getElementById('price').textContent = selectedAcceptance.price;
        document.getElementById('contact').textContent = selectedAcceptance.contact;
        document.getElementById('message').textContent = selectedAcceptance.message;
    } else {
        alert("결제 정보가 없습니다.");
        loadContent('myorder'); // 결제 정보가 없을 경우 이전 페이지로 돌아가기
    }
}

function submitPayment() {

    // 결제 완료 후 로직 (예: 주문 완료 페이지로 이동)
    loadContent('paymentsuccess'); 
}
