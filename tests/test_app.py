import requests


def test_get_status():
    url = 'http://127.0.0.1:8000/status'
    resp = requests.get(url=url)
    print(resp.json())


def test_get_uid_status():
    url = 'http://127.0.0.1:8000/uid_status'
    form_data = {"uid": "a"}
    resp = requests.post(url=url, data=form_data)
    print(resp.json())
    assert resp.json()['status'] == "no uid"


def test_upload_images():
    headers = {
        'cache-control': "no-cache",
    }
    cookies = {
        'ASP.NET_SessionId': 'dbyn3xdli5iugqtn1oulkyik',
        'BPOFLogin': '047FD1144C497526E9',
    }
    data = {
        'uid': 'a15585',
    }
    files = [('files', open('../images_for_test/37.JPG', 'rb')), ('files', open('../images_for_test/48.JPG', 'rb'))]

    url = 'http://127.0.0.1:8000/upload_images'

    r = requests.post(url, headers=headers, cookies=cookies, data=data, files=files)
    r_json = r.json()

    assert r_json['Uploaded Filenames'][0] == '37.JPG'
    assert r_json['Uploaded Filenames'][1] == '48.JPG'

