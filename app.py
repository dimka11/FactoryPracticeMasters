import os
import uvicorn
from typing import List
from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks
from fastapi.staticfiles import StaticFiles

from model import init_model, predict

app = FastAPI(debug=True)


class PredictionModelStore(object):
    model = None


class Status:
    system_status = "loading"
    system_prediction_status = {}


results_store = {}
results_crops_names = {}


def save_file(uid, filename, data):
    if not os.path.isdir('uploaded_files'):
        os.mkdir("uploaded_files")
    if not os.path.isdir(f'uploaded_files/{uid}'):
        os.mkdir(f'uploaded_files/{uid}')

    with open(f'uploaded_files/{uid}/'+filename, 'wb') as f:
        f.write(data)


def prepare_predict(uid):
    Status.system_status = "prediction"
    Status.system_prediction_status[uid] = "prediction"

    if not os.path.isdir('./predicted_crops'):
        os.mkdir("./predicted_crops")
    if not os.path.isdir(f'./predicted_crops/{uid}'):
        os.mkdir(f'./predicted_crops/{uid}')

    file_names = [f'./uploaded_files/{uid}/{name}' for name in os.listdir(f"./uploaded_files/{uid}")]
    results = predict(PredictionModelStore.model, file_names, uid)
    results_store[uid] = results
    results_crops_names[uid] = os.listdir(f'./predicted_crops/{uid}/crops/human')

    Status.system_status = "ok"
    Status.system_prediction_status[uid] = "Done"


@app.on_event('startup')
def init_data():
    print("init call")


@app.get("/status")
async def get_status():
    if PredictionModelStore.model is None:
        PredictionModelStore.model = init_model()
        Status.system_status = "ok"
    return {"status": Status.system_status}


@app.post("/uid_status")
async def get_uid_status(uid: str = Form(...)):
    status = Status.system_prediction_status.get(uid)
    if status is None:
        status = "no uid"
    return {"status": status}


@app.post("/upload_images")
async def upload_images(bg_t: BackgroundTasks, uid: str = Form(...), files: List[UploadFile] = File(...)):
    for idx, file in enumerate(files):
        contents = await file.read()
        save_file(uid, file.filename, contents)
    Status.system_prediction_status[uid] = "files_uploaded"
    bg_t.add_task(prepare_predict, uid)
    return {"Uploaded Filenames": [file.filename for file in files]}


@app.post("/get_detection_results_crops")
async def get_detection_results_crops(uid: str = Form(...)):
    return results_crops_names[uid]


@app.post("/get_detection_results_text")
async def predict_text(uid: str = Form(...)):
    r = results_store[uid]
    r_list = []
    for item in r:
        item = item[['xmin', 'ymin', 'xmax', 'ymax', 'confidence']]
        item.at[:, ['xmin', 'ymin', 'xmax', 'ymax']] = item[['xmin', 'ymin', 'xmax', 'ymax']].astype(int)
        r_list.append(item.values.tolist())
    return {"results": r_list}


app.mount("/predicted_crops", StaticFiles(directory="predicted_crops"), name="images")
app.mount("/", StaticFiles(directory="static", html=True), name="static")


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=80, reload=True)