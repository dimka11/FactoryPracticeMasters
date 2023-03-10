document.addEventListener("DOMContentLoaded", function (event) {
    get_status();
    setUI("waiting-results", "none")
});

var FilesDragDrop = []
var uid_global = ""
var refreshIntervalId
var uploadedFileNames

function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    FilesDragDrop = event.dataTransfer.files

    if (event.dataTransfer.files.length > 0) {
        var output = document.getElementById('output-image');
        output.src = URL.createObjectURL(event.dataTransfer.files[0]);
        output.onload = function () {
            URL.revokeObjectURL(output.src)
        }
    }
    if (event.dataTransfer.files.length > 1) {
        var output = document.getElementById('output-image-1');
        output.src = URL.createObjectURL(event.dataTransfer.files[1]);
        output.onload = function () {
            URL.revokeObjectURL(output.src)
        }
    }
    if (event.dataTransfer.files.length > 2) {
        var output = document.getElementById('output-image-2');
        output.src = URL.createObjectURL(event.dataTransfer.files[2]);
        output.onload = function () {
            URL.revokeObjectURL(output.src)
        }
    }
}

function get_status() {
    const myHeaders = new Headers();

    const statusRequest = new Request('status', {
        method: 'GET',
        headers: myHeaders,
        mode: 'cors',
        cache: 'default',
    });

    fetch(statusRequest)
        .then((response) => response.json())
        .then((resp) => {
            console.log(resp)
        })
        .catch((error) => {
            console.log(error)
        });
}

var loadFile = function (event) {
    var output = document.getElementById('output-image');
    var output_1 = document.getElementById('output-image-1');
    var output_2 = document.getElementById('output-image-2');

    if (event.target.files.length > 0) {
        output.src = URL.createObjectURL(event.target.files[0]);
        output.onload = function () {
            URL.revokeObjectURL(output.src)
        }

        if (event.target.files.length > 1) {
            output_1.src = URL.createObjectURL(event.target.files[1]);
            output.onload = function () {
                URL.revokeObjectURL(output.src)
            }
        }

        if (event.target.files.length > 2) {
            output_2.src = URL.createObjectURL(event.target.files[2]);
            output.onload = function () {
                URL.revokeObjectURL(output.src)
            }
        }

    }
    else {
        output.src = ""
        output_1.src = ""
        output_2.src = ""
    }
};

function checkFilesCount() {
    const files = document.getElementById("formFileMultiple");
    if (files.files.length == 0) {
        return false
    }
    return true
}

function get_predict_status(uid) {
    const formData = new FormData();
    formData.append("uid", uid_global);

    fetch("../uid_status", {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(json => {
            if (json['status'] == 'Done') {
                clearInterval(refreshIntervalId);
                download_predict_text(uid)
                download_predict_crops_names(uid)
            }
        })
        .catch((err) => ("Error occurred", err));
}

function download_predict_text(uid) {
    const formData = new FormData();
    formData.append("uid", uid_global);

    fetch("./get_detection_results_text", {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(json => {
            render_predict_text(json)
        })
        .catch((err) => ("Error occurred", err));
}

function render_predict_text(json) {
    container = document.getElementById("predicted-text")
    setUI("waiting-results", "none")

    for (const [idx, item] of json['results'].entries()) {
        var content = document.createTextNode(uploadedFileNames[idx] + " : 'xmin', 'ymin', 'xmax', 'ymax', 'confidence' \n");
        var paragraph = document.createElement('p')
        paragraph.appendChild(content)
        container.appendChild(paragraph)

        for (box of item) {
            var content = document.createTextNode(`${box[0]} ${box[1]} ${box[2]} ${box[3]} ${Number(box[4]).toFixed(2)}`);
            var paragraph = document.createElement('p')
            paragraph.style.marginBottom = '0.1rem'
            paragraph.appendChild(content)
            container.appendChild(paragraph)
        }
    }
}

function hide_detection_results() {
    el = document.getElementById('predicted-text')

    el.style.display = el.style.display != "none" ? "none" : "block";
}

function download_predict_crops_names(uid) {
    const formData = new FormData();
    formData.append("uid", uid_global);

    fetch("./get_detection_results_crops", {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(json => {
            console.log(json)
            download_crops_images(json, uid)
        })
        .catch((err) => ("Error occurred", err));
}

function download_crops_images(json, uid) {
    images = []
    for (item of json) {
        link = `./predicted_crops/${uid}/crops/human/${item}`
        fetch(link, {
            method: 'GET'
        }).then(response => response.blob())
            .then(blob => {
                console.log(blob);
                render_predict_crops(blob)
            });
    }
}

function render_predict_crops(blob) {
    var container = document.getElementById('predicted-crops')
    var img_div = document.createElement('div')
    img_div.classList.add('img-box')
    var img = document.createElement("img");
    img.classList.add('img-image')

    img.src = URL.createObjectURL(blob);

    img_div.appendChild(img)
    container.appendChild(img_div)
}

var uploadImages = function () {

    document.getElementById("predicted-text").innerHTML = "";
    document.getElementById("predicted-crops").innerHTML = "";

    if (checkFilesCount()) {
        setUI("waiting-results", "block")
        FilesDragDrop = []
        uploadedFileNames = null

        uid = uuidv4()
        console.log(uid)
        uid_global = uid
        const files = document.getElementById("formFileMultiple");

        const formData = new FormData();
        formData.append("uid", uid);

        for (let i = 0; i < files.files.length; i++) {
            formData.append("files", files.files[i]);
        }

        fetch("../upload_images", {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(json => {
                console.log(json)
                uploadedFileNames = json['Uploaded Filenames']
                refreshIntervalId = setInterval(get_predict_status, 5000, uid);
            })
            .catch((err) => ("Error occurred", err));
    }

    else {
        if (FilesDragDrop.length > 0) {
            setUI("waiting-results", "block")

            uid = uuidv4()
            const files = FilesDragDrop

            const formData = new FormData();
            formData.append("uid", uid);

            for (let i = 0; i < files.length; i++) {
                formData.append("files", files[i]);
            }

            fetch("../upload_images", {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(json => {
                    console.log(json)
                    var refreshIntervalId = setInterval(get_status, 5000); // REPLACE
                    clearInterval(refreshIntervalId);
                })
                .catch((err) => ("Error occurred", err));
        }
    }
}

function setUI(id, param) {
    document.getElementById(id).style.display = param;
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}