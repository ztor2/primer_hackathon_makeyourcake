function loadContent(pageName) {
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        document.getElementById("content").innerHTML = this.responseText;
    }
    xhttp.open("GET", pageName + ".html", true);
    xhttp.send();
}

function selectTemplate(templateId) {
    // 템플릿 선택 시 행동
    console.log("템플릿 " + templateId + " 선택됨");
}

function resetDesign() {
    // 디자인 초기화
    document.getElementById("cakeDescription").value = "";
    document.getElementById("resultImage").src = "img/design_pre.jpg";
}

let selectedImageId = '1';

function selectDesign() {
    // 디자인 선택
    console.log("선택된 디자인 확정");
}

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

function generateDesign() {
    const description = document.getElementById('cakeDescription').value;

    if (!selectedImageId || !description) {
        alert("케이크 템플릿을 선택하고 설명을 입력하세요.");
        return;
    }

    const formData = new FormData(); // FormData 객체를 생성합니다.

    // FormData에 데이터 추가
    formData.append('imageId', selectedImageId); // 이미지 ID 추가
    formData.append('description', description); // 설명 추가

    fetch('http://localhost:3000/api/generate-image', {
        method: 'POST',
        body: formData, // JSON 대신 FormData 사용
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('resultImage').src = data.imageUrl;
        console.log('Image updated to:', data.imageUrl);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('이미지 생성에 실패했습니다.');
    });
}
